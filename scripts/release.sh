#!/usr/bin/env bash
################################################################################
#
#    Licensed to the Apache Software Foundation (ASF) under one or more
#    contributor license agreements.  See the NOTICE file distributed with
#    this work for additional information regarding copyright ownership.
#    The ASF licenses this file to You under the Apache License, Version 2.0
#    (the "License"); you may not use this file except in compliance with
#    the License.  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#
################################################################################
#
# The checks and steps of RELEASE.md, as commands, in this order:
#
#   scripts/release.sh check     X.Y.Z --key <id> [--servers] [--safari]
#       The checks before a release, on this checkout (candidate runs them too).
#   scripts/release.sh candidate X.Y.Z N --key <id> [--servers] [--safari] [--dry-run]
#       Release candidate N: the checks, the source and npm packages built from HEAD, signed and
#       checked as voters will, then the tag vX.Y.Z-rcN on that commit, the files staged in
#       dist/dev, and the vote email. Run again after a failure, it goes on where it stopped.
#   scripts/release.sh verify    X.Y.Z N [--dir <folder>] [--servers]
#       What a voter checks, on the staged candidate (or on the files in <folder>).
#   scripts/release.sh publish   X.Y.Z N --key <id> [--plus <n> --minus <n>] [--dry-run]
#       After the vote: checks it lasted 72 hours and passed (the binding votes, asked), the result
#       email, the tag vX.Y.Z, the move to dist/release, the voted npm package published as it is
#       and compared with what npm serves, and the announcement email.
#   scripts/release.sh finish    X.Y.Z [--dry-run]
#       Once downloads.apache.org has the release, the download page links to it, and JIRA has it
#       released: removes the previous release of the line from dist/release, and what is left.
#   scripts/release.sh abandon   X.Y.Z N [--dry-run]
#       After a failed vote: removes the candidate from dist/dev (its tag stays).
#
# Each step that is seen by others (git push, svn, npm publish) asks first; --dry-run skips them.
# The files go to target/release/X.Y.Z-rcN/.

set -euo pipefail

DIST_DEV=https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker
DIST_RELEASE=https://dist.apache.org/repos/dist/release/unomi/unomi-tracker
# The KEYS voters check signatures with (RELEASE_KEYS_URL gives another, for tests: file:///...)
KEYS_URL=${RELEASE_KEYS_URL:-https://downloads.apache.org/unomi/KEYS}
JIRA=https://issues.apache.org/jira
JIRA_PROJECT_ID=12319220
RAT_VERSION=0.18
NPM_PACKAGE=apache-unomi-tracker
# Files RAT cannot find a license in, and that need none: ignore lists, and the generated lockfile
RAT_EXCLUDES=(yarn.lock .eslintignore .npmignore)

ROOT=$(cd "$(dirname "$0")/.." && pwd)
DRY_RUN=0
KEY=
SERVERS=0
SAFARI=0
DIR=
PLUS=
MINUS=
FAILURES=()
WARNINGS=()
SKIPPED=()
TEMP_DIRS=()

step() { printf '\n== %s\n' "$*"; }
ok() { printf '   ok: %s\n' "$*"; }
fail() { FAILURES+=("$*"); printf '   FAILED: %s\n' "$*"; }
warn() { WARNINGS+=("$*"); printf '   WARNING: %s\n' "$*"; }
skip() { SKIPPED+=("$*"); printf '   not run: %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
need() {
    local tool
    for tool in "$@"; do
        case "$tool" in
            sha512) command -v shasum >/dev/null || command -v sha512sum >/dev/null || die "shasum or sha512sum is needed" ;;
            *) command -v "$tool" >/dev/null || die "$tool is needed" ;;
        esac
    done
}

# SHA-512 with shasum (macOS, and Linux with Perl) or sha512sum (GNU coreutils): same output, same -c
sha512() {
    if command -v shasum >/dev/null; then
        shasum -a 512 "$@"
    else
        sha512sum "$@"
    fi
}

cleanup() {
    for dir in "${TEMP_DIRS[@]+"${TEMP_DIRS[@]}"}"; do
        GNUPGHOME=$dir gpgconf --kill all >/dev/null 2>&1 || true
        rm -rf "$dir"
    done
}
trap cleanup EXIT

temp_dir() {
    local dir
    dir=$(mktemp -d "${TMPDIR:-/tmp}/unomi-tracker-release.XXXXXX")
    TEMP_DIRS+=("$dir")
    echo "$dir"
}

# Asks before a step that others see. Returns 1 (skip the step) on no, and in a dry run.
confirm() {
    if [ "$DRY_RUN" = 1 ]; then
        printf '   dry run, skipped: %s\n' "$*"
        return 1
    fi
    local answer
    read -r -p "   $* [y/N] " answer
    [ "$answer" = y ] || [ "$answer" = Y ]
}

# Prints the failures, warnings and checks not run; exits with an error if anything failed.
summary() {
    printf '\n== Summary\n'
    local item
    for item in "${SKIPPED[@]+"${SKIPPED[@]}"}"; do printf '   not run: %s\n' "$item"; done
    for item in "${WARNINGS[@]+"${WARNINGS[@]}"}"; do printf '   WARNING: %s\n' "$item"; done
    for item in "${FAILURES[@]+"${FAILURES[@]}"}"; do printf '   FAILED: %s\n' "$item"; done
    if [ ${#FAILURES[@]} -gt 0 ]; then
        printf '   %d check(s) failed\n' ${#FAILURES[@]}
        exit 1
    fi
    printf '   all checks passed\n'
}

check_version() {
    [[ $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "the version must be X.Y.Z, not $1"
}

check_rc() {
    [[ $1 =~ ^[1-9][0-9]*$ ]] || die "the release candidate number must be 1, 2..., not $1"
}

json() {
    node -e 'let s = ""; process.stdin.on("data", d => s += d).on("end", () => { const v = new Function("j", "return " + process.argv[1])(JSON.parse(s)); console.log(v === undefined ? "" : v); });' "$1"
}

# A keyring with only the keys of a KEYS file: what a voter's check relies on
keys_keyring() {
    local keys_file=$1 home
    home=$(temp_dir)
    chmod 700 "$home"
    GNUPGHOME=$home gpg --batch --quiet --import "$keys_file" 2>/dev/null || true
    echo "$home"
}

# The signature of a file is good, and made by a key of the keyring
check_signature() {
    local home=$1 file=$2 status fingerprint
    if ! status=$(GNUPGHOME=$home gpg --batch --status-fd 1 --verify "$file.asc" "$file" 2>/dev/null); then
        fail "$(basename "$file"): the signature does not verify with the KEYS"
        return
    fi
    fingerprint=$(printf '%s\n' "$status" | awk '$2 == "VALIDSIG" { print $3 }')
    ok "$(basename "$file"): good signature, key $fingerprint"
}

check_checksum() {
    local file=$1
    if (cd "$(dirname "$file")" && sha512 -c "$(basename "$file").sha512" >/dev/null 2>&1); then
        ok "$(basename "$file"): SHA-512 checksum"
    else
        fail "$(basename "$file"): the SHA-512 checksum does not match"
    fi
}

# The files of the source tree without the ASF license header
check_headers() {
    local dir=$1 missing
    missing=$(cd "$dir" && find . -type f \( -name '*.js' -o -name '*.ts' -o -name '*.md' -o -name '*.html' -o -name '*.yml' -o -name '*.yaml' -o -name '*.sh' \) \
        -not -path './.github/*' -not -path './node_modules/*' -not -path './dist/*' -not -path './target/*' -not -path './test/servers/.cache/*' -not -path './test/servers/test-results/*' \
        -exec grep -L "Licensed to the Apache Software Foundation" {} + || true)
    if [ -n "$missing" ]; then
        fail "files without the ASF license header: $(echo $missing)"
    else
        ok "every source file has the ASF license header"
    fi
}

# Apache RAT, downloaded once from Maven Central, with its signature checked
check_rat() {
    local dir=$1 jar_dir="$ROOT/target/rat" jar report unapproved
    need java
    jar="$jar_dir/apache-rat-$RAT_VERSION.jar"
    if [ ! -f "$jar" ]; then
        mkdir -p "$jar_dir"
        local url="https://repo1.maven.org/maven2/org/apache/rat/apache-rat/$RAT_VERSION/apache-rat-$RAT_VERSION.jar"
        curl -fsSL -o "$jar.part" "$url" || die "could not download $url"
        curl -fsSL -o "$jar.part.asc" "$url.asc" || die "could not download $url.asc"
        # Signed by the Apache Creadur project, whose keys are in its KEYS
        local creadur_keys home
        creadur_keys=$(temp_dir)/KEYS
        curl -fsSL -o "$creadur_keys" https://downloads.apache.org/creadur/KEYS || die "could not download the KEYS of Apache Creadur"
        home=$(keys_keyring "$creadur_keys")
        GNUPGHOME=$home gpg --batch --quiet --verify "$jar.part.asc" "$jar.part" 2>/dev/null || die "the signature of apache-rat-$RAT_VERSION.jar does not verify with the KEYS of Apache Creadur"
        mv "$jar.part" "$jar"
        rm -f "$jar.part.asc"
    fi
    report=$( (cd "$dir" && java -jar "$jar" --input-exclude-parsed-scm GIT --input-exclude "${RAT_EXCLUDES[@]}" -- .) 2>&1 || true)
    unapproved=$(printf '%s\n' "$report" | sed -n 's/^[ !]*Unapproved: *\([0-9]*\).*/\1/p' | head -1)
    if [ "$unapproved" = 0 ]; then
        ok "Apache RAT $RAT_VERSION: no file with an unapproved or unknown license"
    else
        fail "Apache RAT $RAT_VERSION: ${unapproved:-?} unapproved file(s); run it in $dir to see them"
    fi
}

# A source package: what it contains, its licensing, its build and tests, and the npm package it
# builds, compared with the staged one if given
check_source_package() {
    local version=$1 source=$2 npm_package=${3:-} build year
    build=$(temp_dir)
    tar xzf "$source" -C "$build"
    local dir="$build/unomi-tracker-$version"
    [ -d "$dir" ] || { fail "the source package has no unomi-tracker-$version/ folder"; return; }
    ok "the source package unpacks into unomi-tracker-$version/"

    for file in LICENSE NOTICE; do
        [ -f "$dir/$file" ] && ok "$file is there" || fail "the source package has no $file"
    done
    year=$(date +%Y)
    grep -q "Copyright 2015-$year The Apache Software Foundation" "$dir/NOTICE" && ok "NOTICE has the year $year" || fail "NOTICE does not say 2015-$year"
    grep -q "This product includes software developed at" "$dir/NOTICE" && ok "NOTICE has the ASF sentence" || fail "NOTICE lacks \"This product includes software developed at The Apache Software Foundation\""
    [ "$(json j.version < "$dir/package.json")" = "$version" ] && ok "package.json has the version $version" || fail "package.json does not have the version $version"
    [ ! -d "$dir/node_modules" ] || fail "the source package contains node_modules"
    if [ -d "$dir/dist" ]; then
        # 1.x commits its build; from 2.0.0, dist is built from the source
        [ -f "$dir/LICENSE-binary" ] && fail "the source package contains dist, a build" || warn "the source package contains dist, as the 1.x line commits its build"
    fi
    check_headers "$dir"
    check_rat "$dir"

    printf '   building and testing the source package (yarn install, yarn test)...\n'
    if (cd "$dir" && yarn install --frozen-lockfile --silent >"$build/install.log" 2>&1); then
        ok "yarn install --frozen-lockfile"
    else
        fail "yarn install --frozen-lockfile failed, see $build/install.log"
        return
    fi
    if (cd "$dir" && yarn test >"$build/test.log" 2>&1); then
        ok "yarn test"
    else
        fail "yarn test failed:"
        tail -20 "$build/test.log"
        return
    fi
    if [ "$SERVERS" = 1 ]; then
        printf '   tests against the Unomi servers, in Chromium, Firefox and WebKit (Docker)...\n'
        if (cd "$dir" && TRACKER_BROWSERS=chromium,firefox,webkit yarn test:servers >"$build/servers.log" 2>&1); then
            ok "yarn test:servers, in the three browsers"
        else
            fail "yarn test:servers failed, see $build/servers.log"
        fi
    fi

    local packed="$build/packed"
    mkdir -p "$packed"
    if ! (cd "$dir" && npm pack --pack-destination "$packed" >"$build/pack.log" 2>&1); then
        fail "npm pack failed, see $build/pack.log"
        return
    fi
    local built="$packed/$NPM_PACKAGE-$version.tgz"
    check_npm_package "$version" "$built" "$dir"
    if [ -n "$npm_package" ]; then
        if cmp -s "$built" "$npm_package"; then
            ok "npm pack on the source package gives the staged npm package, byte for byte"
        else
            fail "npm pack on the source package does not give the staged npm package: the build is not reproducible, or the npm package is not built from this source"
        fi
    fi
    BUILT_NPM_PACKAGE=$built
}

# What the npm package contains: dist, NOTICE, KEYS, and as LICENSE the source's LICENSE-binary
check_npm_package() {
    local version=$1 tgz=$2 source_dir=$3 content
    content=$(temp_dir)
    tar xzf "$tgz" -C "$content"
    local package="$content/package"
    [ "$(json j.version < "$package/package.json")" = "$version" ] && ok "the npm package has the version $version" || fail "the npm package does not have the version $version"
    for file in LICENSE NOTICE KEYS dist/apache-unomi-tracker.umd.js dist/apache-unomi-tracker.cjs.js dist/apache-unomi-tracker.esm.js; do
        [ -f "$package/$file" ] || fail "the npm package has no $file"
    done
    if [ -f "$source_dir/LICENSE-binary" ]; then
        cmp -s "$package/LICENSE" "$source_dir/LICENSE-binary" && ok "the npm package's LICENSE is LICENSE-binary (the bundled components)" || fail "the npm package's LICENSE is not LICENSE-binary"
    fi
    cmp -s "$package/NOTICE" "$source_dir/NOTICE" && ok "the npm package's NOTICE is the source's" || fail "the npm package's NOTICE differs from the source's"
}

# The signing key: RSA of 2048 bits or more, valid, with an apache.org address, in the KEYS of the
# repository and of the distribution
check_key() {
    local key=$1 pub fingerprint length algo validity
    if ! gpg --batch --list-secret-keys "$key" >/dev/null 2>&1; then
        fail "no secret key $key in your keyring"
        return
    fi
    pub=$(gpg --batch --with-colons --list-keys "$key" | awk -F: '$1 == "pub" { print; exit }')
    fingerprint=$(gpg --batch --with-colons --list-keys "$key" | awk -F: '$1 == "fpr" { print $10; exit }')
    validity=$(echo "$pub" | cut -d: -f2)
    length=$(echo "$pub" | cut -d: -f3)
    algo=$(echo "$pub" | cut -d: -f4)
    [ "$algo" = 1 ] && [ "${length:-0}" -ge 2048 ] && ok "key $fingerprint: RSA $length" || fail "key $key: not an RSA key of 2048 bits or more (algorithm $algo, $length bits)"
    case "$validity" in
        e) fail "key $key has expired" ;;
        r) fail "key $key is revoked" ;;
        *) ok "key $key has not expired and is not revoked" ;;
    esac
    gpg --batch --with-colons --list-keys "$key" | awk -F: '$1 == "uid" && $10 ~ /@apache\.org>/' | grep -q . && ok "key $key has an apache.org address" || fail "key $key has no apache.org address"

    local home keys
    home=$(keys_keyring "$ROOT/KEYS")
    GNUPGHOME=$home gpg --batch --with-colons --list-keys "$fingerprint" >/dev/null 2>&1 && ok "key $key is in the repository's KEYS" || fail "key $key is not in the repository's KEYS"
    keys=$(temp_dir)/KEYS
    if curl -fsSL -o "$keys" "$KEYS_URL"; then
        home=$(keys_keyring "$keys")
        GNUPGHOME=$home gpg --batch --with-colons --list-keys "$fingerprint" >/dev/null 2>&1 && ok "key $key is in $KEYS_URL" || fail "key $key is not in $KEYS_URL, the KEYS voters use: add it to dist/release/unomi/KEYS"
    else
        fail "could not download $KEYS_URL"
    fi
}

# The tickets of the JIRA version are all resolved, and the version is not released yet
check_jira() {
    local version=$1 name="unomi-tracker-$1" open versions id
    open=$(curl -fsSL -G "$JIRA/rest/api/2/search" --data-urlencode "jql=project = UNOMI AND fixVersion = \"$name\" AND resolution is EMPTY" --data-urlencode "fields=key" | json 'j.issues.map(i => i.key).join(" ")') || { warn "could not ask JIRA for the open tickets"; return; }
    [ -z "$open" ] && ok "JIRA: no open ticket with the fix version $name" || fail "JIRA: open tickets with the fix version $name: $open"
    versions=$(curl -fsSL "$JIRA/rest/api/2/project/UNOMI/versions") || { warn "could not read the JIRA versions"; return; }
    id=$(printf '%s' "$versions" | json "(j.find(v => v.name === '$name') || {}).id")
    [ -n "$id" ] && ok "JIRA: the version $name exists (id $id)" || fail "JIRA: there is no version $name"
    JIRA_VERSION_ID=$id
}

# The id of the JIRA version, for the links of the emails
jira_version_id() {
    curl -fsSL "$JIRA/rest/api/2/project/UNOMI/versions" 2>/dev/null | json "(j.find(v => v.name === 'unomi-tracker-$1') || {}).id" 2>/dev/null || true
}

# The required checks of GitHub on a commit
check_ci() {
    local sha=$1 states
    if ! command -v gh >/dev/null; then
        skip "CI on $sha (gh is not installed): check it on GitHub"
        return
    fi
    states=$(gh api "repos/apache/unomi-tracker/commits/$sha/check-runs" -q '[.check_runs[] | select(.name | test("^(lint-tests|build|server-tests)")) | .conclusion // .status] | unique | join(" ")' 2>/dev/null) || { warn "could not read the CI checks of $sha"; return; }
    if [ "$states" = success ]; then
        ok "CI: every check passed on $sha"
    elif [ -z "$states" ]; then
        fail "CI: no check has run on $sha"
    else
        fail "CI on $sha: $states"
    fi
}

# The latest release candidate number of a version, from the tags here and on origin (0 if none)
last_rc() {
    local version=$1
    { git tag -l "v$version-rc*"; git ls-remote --tags origin "refs/tags/v$version-rc*" 2>/dev/null | awk '{ print $2 }'; } |
        sed -n "s#^\(refs/tags/\)\{0,1\}v$version-rc\([0-9]*\)\(\^{}\)\{0,1\}\$#\2#p" | sort -n | tail -1 | grep . || echo 0
}

# The release candidate folders of a version in dist/dev
staged_rcs() {
    svn ls "$DIST_DEV" 2>/dev/null | sed -n "s#^$1-rc\([0-9]*\)/\$#\1#p" | tr '\n' ' '
}

# Hours since a date (ISO 8601), with Node rather than date, which differs between macOS and Linux
hours_since() {
    node -e 'console.log(Math.floor((Date.now() - Date.parse(process.argv[1])) / 3600000))' "$1"
}

clock_in() {
    node -e 'const d = new Date(Date.now() + Number(process.argv[1]) * 60000); console.log(d.toTimeString().slice(0, 5))' "$1"
}

# npm's integrity of a tarball: sha512-<base64>
npm_integrity() {
    node -e 'const c = require("crypto"), f = require("fs"); console.log("sha512-" + c.createHash("sha512").update(f.readFileSync(process.argv[1])).digest("base64"))' "$1"
}

# A tag is signed by a key of the KEYS
check_tag_signature() {
    local home=$1 tag=$2
    if GNUPGHOME=$home git tag -v "$tag" >/dev/null 2>&1; then
        ok "the tag $tag is signed by a key of the KEYS"
    else
        fail "the tag $tag is not signed by a key of the KEYS"
    fi
}

keys_from_url() {
    local keys
    keys=$(temp_dir)/KEYS
    curl -fsSL -o "$keys" "$KEYS_URL" || die "could not download $KEYS_URL"
    keys_keyring "$keys"
}

# The checks before a release, on this checkout; the failures are counted, not reported
run_checks() {
    local version=$1
    step "The checkout"
    local branch sha major
    branch=$(git rev-parse --abbrev-ref HEAD)
    sha=$(git rev-parse HEAD)
    major=${version%%.*}
    [ -z "$(git status --porcelain)" ] && ok "no uncommitted changes" || fail "there are uncommitted changes"
    git fetch --quiet origin
    case "$branch" in
        main | 1_x)
            [ "$sha" = "$(git rev-parse "origin/$branch")" ] && ok "$branch is up to date with origin/$branch" || fail "$branch is not the same as origin/$branch: push it, or pull"
            ;;
        *) fail "releases are made from main or 1_x, not $branch" ;;
    esac
    case "$branch:$major" in
        1_x:1 | main:[2-9] | main:[1-9][0-9]) ok "$version is a release of the $branch line" ;;
        main:* | 1_x:*) fail "$version is not a release of the $branch line (main: 2.x and later, 1_x: 1.x)" ;;
    esac
    [ "$(json j.version < package.json)" = "$version" ] && ok "package.json has the version $version" || fail "package.json does not have the version $version"
    if git rev-parse -q --verify "refs/tags/v$version" >/dev/null || git ls-remote --exit-code --tags origin "v$version" >/dev/null 2>&1; then
        fail "the tag v$version exists already: $version is released"
    fi

    step "Release notes and licensing"
    if [ -f CHANGES.md ]; then
        grep -qx "$version" CHANGES.md && ok "CHANGES.md has a section $version" || fail "CHANGES.md has no section $version"
    else
        fail "there is no CHANGES.md"
    fi
    local year
    year=$(date +%Y)
    grep -q "Copyright 2015-$year The Apache Software Foundation" NOTICE && ok "NOTICE has the year $year" || fail "NOTICE does not say 2015-$year"
    # On what the source package will contain: git archive of HEAD
    local tree
    tree=$(temp_dir)
    git archive HEAD | tar x -C "$tree"
    check_headers "$tree"
    check_rat "$tree"

    step "JIRA"
    check_jira "$version"

    step "Signing key"
    check_key "$KEY"

    step "npm"
    local user
    if user=$(npm whoami 2>/dev/null); then
        npm owner ls "$NPM_PACKAGE" 2>/dev/null | awk '{ print $1 }' | grep -qx "$user" && ok "npm: $user is a maintainer of $NPM_PACKAGE" || warn "npm: $user is not a maintainer of $NPM_PACKAGE (needed to publish after the vote)"
    else
        warn "npm: not logged in (npm login is needed to publish after the vote)"
    fi

    step "CI"
    check_ci "$sha"

    step "Build and tests"
    mkdir -p "$ROOT/target"
    if yarn install --frozen-lockfile --silent >/dev/null 2>&1; then ok "yarn install --frozen-lockfile"; else fail "yarn install --frozen-lockfile"; fi
    if yarn -s lint >/dev/null 2>&1; then ok "yarn lint"; else fail "yarn lint"; fi
    if yarn -s test >/dev/null 2>&1; then ok "yarn test"; else fail "yarn test"; fi
    if [ "$SERVERS" = 1 ]; then
        printf '   tests against every Unomi server, in Chromium, Firefox and WebKit (Docker)...\n'
        if TRACKER_BROWSERS=chromium,firefox,webkit yarn test:servers >"$ROOT/target/servers.log" 2>&1; then ok "yarn test:servers, in the three browsers"; else fail "yarn test:servers, see target/servers.log"; fi
    else
        skip "the tests against every Unomi server in the three browsers (--servers, needs Docker)"
    fi
    if [ "$SAFARI" = 1 ]; then
        if yarn test:safari; then ok "yarn test:safari"; else fail "yarn test:safari"; fi
    else
        skip "the Safari checks (--safari, on a Mac with Safari visible)"
    fi
}

cmd_check() {
    local version=$1
    check_version "$version"
    need git gpg node yarn npm curl sha512 cmp java
    [ -n "$KEY" ] || die "give your signing key: --key <id>"
    cd "$ROOT"
    run_checks "$version"
    summary
}

cmd_candidate() {
    local version=$1 rc=$2
    check_version "$version"
    check_rc "$rc"
    need git gpg node yarn npm curl sha512 cmp svn java
    [ -n "$KEY" ] || die "give your signing key: --key <id>"
    cd "$ROOT"
    local tag="v$version-rc$rc" work="$ROOT/target/release/$version-rc$rc" sha
    sha=$(git rev-parse HEAD)

    step "Release candidate $rc of $version"
    git fetch --quiet origin --tags
    local resume=0 last staged
    if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
        [ "$(git rev-parse "$tag^{commit}")" = "$sha" ] || die "the tag $tag exists, on another commit than HEAD: use the next candidate number, $(( $(last_rc "$version") + 1 ))"
        resume=1
        ok "the tag $tag exists, on HEAD: going on from where the last run stopped"
    else
        last=$(last_rc "$version")
        [ "$rc" = "$((last + 1))" ] || die "the next release candidate of $version is $((last + 1)), not $rc"
        ok "$rc is the next release candidate of $version"
    fi
    staged=$(staged_rcs "$version")
    for other in $staged; do
        if [ "$other" = "$rc" ]; then
            die "release candidate $rc is already staged in $DIST_DEV/$version-rc$rc/: check it with scripts/release.sh verify $version $rc"
        fi
        die "release candidate $other of $version is still in dist/dev: after its vote, run scripts/release.sh abandon $version $other (or publish it)"
    done
    ok "no other release candidate of $version in dist/dev"

    run_checks "$version"
    if [ ${#FAILURES[@]} -gt 0 ]; then
        [ "$DRY_RUN" = 1 ] || summary
        printf '\n   dry run: going on despite the failures above, to show the next steps\n'
    fi

    step "Source package and npm package, from $sha"
    rm -rf "$work"
    mkdir -p "$work/stage"
    local source="$work/stage/unomi-tracker-$version.tar.gz"
    git archive --format=tar.gz --prefix="unomi-tracker-$version/" -o "$source" "$sha"
    ok "unomi-tracker-$version.tar.gz"
    BUILT_NPM_PACKAGE=
    local before=${#FAILURES[@]}
    check_source_package "$version" "$source"
    [ ${#FAILURES[@]} -eq "$before" ] || summary
    cp "$BUILT_NPM_PACKAGE" "$work/stage/"
    ok "$NPM_PACKAGE-$version.tgz, built from the source package"

    step "Signatures and checksums"
    local file home
    for file in "unomi-tracker-$version.tar.gz" "$NPM_PACKAGE-$version.tgz"; do
        (cd "$work/stage" && gpg --batch --yes --armor --detach-sign -u "$KEY" "$file" && sha512 "$file" > "$file.sha512")
    done
    home=$(keys_from_url)
    for file in "unomi-tracker-$version.tar.gz" "$NPM_PACKAGE-$version.tgz"; do
        check_signature "$home" "$work/stage/$file"
        check_checksum "$work/stage/$file"
    done
    [ ${#FAILURES[@]} -eq "$before" ] || summary

    step "Tag $tag"
    if [ "$resume" = 1 ]; then
        ok "$tag exists"
    elif [ "$DRY_RUN" = 1 ]; then
        printf '   dry run, skipped: git tag -s -u %s %s %s\n' "$KEY" "$tag" "$sha"
    else
        # Tagged once the packages pass, on the commit they were built from
        git tag -s -u "$KEY" "$tag" "$sha" -m "Release candidate $rc of $version"
        ok "signed tag $tag on $sha"
    fi
    if [ "$DRY_RUN" = 0 ]; then
        check_tag_signature "$home" "$tag"
        [ ${#FAILURES[@]} -eq 0 ] || summary
    fi
    if git ls-remote --exit-code --tags origin "$tag" >/dev/null 2>&1; then
        ok "$tag is on origin"
    elif confirm "Push the tag $tag to origin?"; then
        git push origin "$tag"
        ok "pushed $tag"
    fi

    step "Stage in dist/dev"
    if confirm "Upload the six files to $DIST_DEV/$version-rc$rc/?"; then
        svn import --no-auth-cache "$work/stage" "$DIST_DEV/$version-rc$rc" -m "Apache Unomi tracker $version, release candidate $rc (for the PMC vote)"
        ok "staged in $DIST_DEV/$version-rc$rc/"
    fi

    step "Vote email"
    local jira_id
    jira_id=$(jira_version_id "$version")
    write_vote_email "$version" "$rc" "$sha" "${jira_id:-<version id>}" > "$work/vote-email.txt"
    ok "$work/vote-email.txt: add what the release brings, from CHANGES.md, and send it from your apache.org address"
    printf '   the vote is open until at least %s (72 hours)\n' "$(node -e 'console.log(new Date(Date.now() + 72 * 3600000).toString().slice(0, 21))')"
    summary
}

write_vote_email() {
    local version=$1 rc=$2 sha=$3 jira_id=$4
    cat <<EOF
To: dev@unomi.apache.org
Subject: [VOTE] Release Apache Unomi tracker $version (release candidate $rc)

Hi all,

I would like to release Apache Unomi tracker $version, the JavaScript tracker for Apache Unomi.
<One or two sentences on what the release brings, from CHANGES.md.>

Release notes:
https://github.com/apache/unomi-tracker/blob/v$version-rc$rc/CHANGES.md
JIRA: $JIRA/secure/ReleaseNote.jspa?projectId=$JIRA_PROJECT_ID&version=$jira_id

Source package and npm package, with their signatures and checksums:
$DIST_DEV/$version-rc$rc/

Tag: https://github.com/apache/unomi-tracker/releases/tag/v$version-rc$rc (commit $sha)

Signing keys: $KEYS_URL

To check the packages, on your own machine, from a checkout of the tag:
  scripts/release.sh verify $version $rc
It checks the signatures and checksums with the KEYS above, that the source package is the tag's
content and the tag is signed, the licensing (LICENSE, NOTICE, headers, Apache RAT), builds and
tests the source package, and checks that npm pack on it gives the npm package above, byte for
byte. Add --servers for the tests against Unomi servers (Docker).
Or by hand:
  gpg --import KEYS
  gpg --verify unomi-tracker-$version.tar.gz.asc unomi-tracker-$version.tar.gz
  gpg --verify $NPM_PACKAGE-$version.tgz.asc $NPM_PACKAGE-$version.tgz
  shasum -a 512 -c unomi-tracker-$version.tar.gz.sha512 $NPM_PACKAGE-$version.tgz.sha512
(or sha512sum -c, on Linux without shasum)
then untar the source package, check LICENSE and NOTICE, and run yarn install --frozen-lockfile,
yarn test and npm pack: the npm package it builds has the same checksum as the one above.

The npm package is the one published to npm after the vote.

The vote is open for at least 72 hours, and passes with at least three binding +1 votes and more
binding +1 than -1 votes.

[ ] +1 Release these packages as Apache Unomi tracker $version
[ ] +0 No opinion
[ ] -1 Do not release these packages because...

Thanks,
<name>
EOF
}

cmd_verify() {
    local version=$1 rc=$2
    check_version "$version"
    check_rc "$rc"
    need gpg node yarn npm curl sha512 cmp tar java
    local files
    if [ -n "$DIR" ]; then
        files=$(cd "$DIR" && pwd)
    else
        files=$(temp_dir)
        step "Download $DIST_DEV/$version-rc$rc/"
        local file
        for file in "unomi-tracker-$version.tar.gz" "$NPM_PACKAGE-$version.tgz"; do
            for suffix in "" .asc .sha512; do
                curl -fsSL -o "$files/$file$suffix" "$DIST_DEV/$version-rc$rc/$file$suffix" || die "could not download $DIST_DEV/$version-rc$rc/$file$suffix"
            done
        done
        ok "the six files"
    fi

    step "Signatures and checksums, with $KEYS_URL"
    local home
    home=$(keys_from_url)
    for file in "unomi-tracker-$version.tar.gz" "$NPM_PACKAGE-$version.tgz"; do
        check_signature "$home" "$files/$file"
        check_checksum "$files/$file"
    done

    step "The tag v$version-rc$rc"
    local tag="v$version-rc$rc"
    if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
        git -C "$ROOT" fetch --quiet origin tag "$tag" 2>/dev/null || true
    fi
    if git -C "$ROOT" rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
        (cd "$ROOT" && check_tag_signature "$home" "$tag")
        local from_tag from_package
        from_tag=$(temp_dir)
        from_package=$(temp_dir)
        git -C "$ROOT" archive "$tag" | tar x -C "$from_tag"
        tar xzf "$files/unomi-tracker-$version.tar.gz" -C "$from_package"
        if diff -r -q "$from_tag" "$from_package/unomi-tracker-$version" >/dev/null; then
            ok "the source package is the content of $tag"
        else
            fail "the source package is not the content of $tag:"
            diff -r -q "$from_tag" "$from_package/unomi-tracker-$version" | head -10
        fi
    else
        skip "the source package against the tag $tag (run this from a checkout of apache/unomi-tracker)"
    fi

    step "Source package"
    check_source_package "$version" "$files/unomi-tracker-$version.tar.gz" "$files/$NPM_PACKAGE-$version.tgz"
    [ "$SERVERS" = 1 ] || skip "the tests against Unomi servers (--servers, needs Docker)"
    summary
}

# Asks for a number, or takes it from an option
ask_number() {
    local question=$1 value=$2 answer
    if [ -n "$value" ]; then
        echo "$value"
        return
    fi
    read -r -p "   $question " answer
    [[ $answer =~ ^[0-9]+$ ]] || die "a number is needed, not \"$answer\""
    echo "$answer"
}

cmd_publish() {
    local version=$1 rc=$2
    check_version "$version"
    check_rc "$rc"
    need git gpg node npm curl sha512 cmp svn
    [ -n "$KEY" ] || die "give your signing key: --key <id>"
    cd "$ROOT"
    local rc_tag="v$version-rc$rc" tag="v$version" work="$ROOT/target/release/$version"
    git fetch --quiet origin --tags
    git rev-parse -q --verify "refs/tags/$rc_tag" >/dev/null || die "there is no tag $rc_tag"
    local sha home
    sha=$(git rev-parse "$rc_tag^{commit}")
    home=$(keys_from_url)
    mkdir -p "$work"

    step "The vote on release candidate $rc"
    check_tag_signature "$home" "$rc_tag"
    local released=0
    svn info "$DIST_RELEASE/$version" >/dev/null 2>&1 && released=1
    if [ "$released" = 1 ]; then
        ok "$version is in dist/release already: going on from where the last run stopped"
    else
        local staged_at hours plus minus
        staged_at=$(svn info --show-item last-changed-date "$DIST_DEV/$version-rc$rc" 2>/dev/null) || die "release candidate $rc of $version is not in dist/dev"
        hours=$(hours_since "$staged_at")
        # The vote email goes out once the candidate is staged: 72 hours after the staging at least
        [ "$hours" -ge 72 ] && ok "staged $hours hours ago (the vote lasts 72 hours at least)" || fail "staged $hours hours ago: the vote lasts at least 72 hours"
        plus=$(ask_number "Binding +1 votes (PMC members, yours included)?" "$PLUS")
        minus=$(ask_number "Binding -1 votes?" "$MINUS")
        if [ "$plus" -ge 3 ] && [ "$plus" -gt "$minus" ]; then
            ok "the vote passes: $plus binding +1, $minus binding -1"
        else
            fail "the vote does not pass: $plus binding +1, $minus binding -1 (at least three binding +1 and more +1 than -1 are needed); run scripts/release.sh abandon $version $rc"
        fi
        [ ${#FAILURES[@]} -eq 0 ] || summary
        write_result_email "$version" "$rc" "$plus" "$minus" > "$work/result-email.txt"
        ok "$work/result-email.txt: add the voters' names and the other votes, and send it in the vote thread"
        if [ "$DRY_RUN" = 0 ]; then
            local answer
            read -r -p "   Is the result email sent? [y/N] " answer
            [ "$answer" = y ] || [ "$answer" = Y ] || die "send the result email first, then run this again"
        fi
    fi

    step "Tag $tag on the commit of $rc_tag ($sha)"
    if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
        [ "$(git rev-parse "$tag^{commit}")" = "$sha" ] && ok "$tag exists, on $sha" || die "$tag exists, on another commit than $rc_tag"
    elif [ "$DRY_RUN" = 0 ]; then
        git tag -s -u "$KEY" "$tag" "$sha" -m "Release $version"
        ok "signed tag $tag"
    else
        printf '   dry run, skipped: git tag -s -u %s %s %s\n' "$KEY" "$tag" "$sha"
    fi
    if git ls-remote --exit-code --tags origin "$tag" >/dev/null 2>&1; then
        ok "$tag is on origin"
    elif confirm "Push the tag $tag to origin?"; then
        git push origin "$tag"
        ok "pushed $tag"
    fi

    step "Move the candidate to dist/release (a PMC member does it)"
    if [ "$released" = 1 ]; then
        ok "$DIST_RELEASE/$version/ exists"
    elif confirm "svn mv $DIST_DEV/$version-rc$rc $DIST_RELEASE/$version?"; then
        svn mv "$DIST_DEV/$version-rc$rc" "$DIST_RELEASE/$version" -m "Apache Unomi tracker $version release"
        ok "moved to $DIST_RELEASE/$version/"
    fi

    step "Publish the voted npm package"
    local from=$DIST_RELEASE/$version
    svn info "$from" >/dev/null 2>&1 || from=$DIST_DEV/$version-rc$rc
    local file="$NPM_PACKAGE-$version.tgz" suffix
    for suffix in "" .asc .sha512; do
        curl -fsSL -o "$work/$file$suffix" "$from/$file$suffix" || die "could not download $from/$file$suffix"
    done
    check_signature "$home" "$work/$file"
    check_checksum "$work/$file"
    [ ${#FAILURES[@]} -eq 0 ] || summary
    local integrity published
    integrity=$(npm_integrity "$work/$file")
    published=$(npm view "$NPM_PACKAGE@$version" dist.integrity 2>/dev/null || true)
    if [ -n "$published" ]; then
        [ "$published" = "$integrity" ] && ok "$NPM_PACKAGE@$version is on npm, and is the voted package" || fail "$NPM_PACKAGE@$version is on npm, but is not the voted package"
    else
        # A release of an older line than npm's latest keeps latest: 1.x is published as latest-1
        local latest major tag_args=()
        latest=$(npm view "$NPM_PACKAGE" dist-tags.latest 2>/dev/null || true)
        major=${version%%.*}
        if [ -n "$latest" ] && [ "$major" -lt "${latest%%.*}" ]; then
            tag_args=(--tag "latest-$major")
        fi
        if confirm "npm publish ${tag_args[*]+${tag_args[*]} }$file (npm's latest is ${latest:-none})?"; then
            npm publish "${tag_args[@]+"${tag_args[@]}"}" "$work/$file"
            published=$(npm view "$NPM_PACKAGE@$version" dist.integrity 2>/dev/null || true)
            [ "$published" = "$integrity" ] && ok "npm has $NPM_PACKAGE@$version, and it is the voted package" || fail "npm does not give the voted package for $NPM_PACKAGE@$version (integrity ${published:-none})"
        fi
    fi

    step "Next"
    write_announcement "$version" > "$work/announce-email.txt"
    ok "$work/announce-email.txt: add what the release brings, from CHANGES.md"
    JIRA_VERSION_ID=$(jira_version_id "$version")
    cat <<EOF
   1. JIRA: mark unomi-tracker-$version as released, dated today:
      $JIRA/projects/UNOMI/versions/${JIRA_VERSION_ID:-<version id>}
      and record the release on https://reporter.apache.org/addrelease.html?unomi
   2. From $(clock_in 60) (one hour after the move, for downloads.apache.org), update the download
      page: in unomi-site, src/main/webapp/_data/unomi.yml, tracker.latest: version $version, date
      $(date '+%Y-%m-%d'), JIRA version id ${JIRA_VERSION_ID:-<version id>}; and publish the site.
   3. Then: scripts/release.sh finish $version
EOF
    summary
}

write_result_email() {
    local version=$1 rc=$2 plus=$3 minus=$4
    cat <<EOF
To: dev@unomi.apache.org
Subject: [RESULT][VOTE] Release Apache Unomi tracker $version (release candidate $rc)

Hi all,

The vote to release Apache Unomi tracker $version (release candidate $rc) passes, with:

$plus binding +1: <names>
<n> non-binding +1: <names>
<n> +0: <names>
$minus binding -1: <names>

Thanks to everyone who checked the release candidate and voted. I will now publish the release.

<name>
EOF
}

write_announcement() {
    local version=$1
    cat <<EOF
To: dev@unomi.apache.org, user@unomi.apache.org, announce@apache.org
Subject: [ANNOUNCE] Apache Unomi tracker $version released

The Apache Unomi team is pleased to announce the release of Apache Unomi tracker $version.

Apache Unomi tracker is the JavaScript library that websites use to send their visitors' events
to Apache Unomi, a customer data platform, and to personalize their pages with its answers.

<What the release brings, in a few lines, from CHANGES.md.>

Download: https://unomi.apache.org/download.html
npm: npm install $NPM_PACKAGE@$version
Release notes: https://github.com/apache/unomi-tracker/blob/v$version/CHANGES.md

Thanks to everyone who contributed to this release.

<name>, on behalf of the Apache Unomi PMC
EOF
}

cmd_finish() {
    local version=$1
    check_version "$version"
    need curl node svn
    local downloads="https://downloads.apache.org/unomi/unomi-tracker/$version" work="$ROOT/target/release/$version"

    step "downloads.apache.org"
    local file missing=0
    for file in "unomi-tracker-$version.tar.gz" "unomi-tracker-$version.tar.gz.asc" "unomi-tracker-$version.tar.gz.sha512"; do
        curl -fsI "$downloads/$file" >/dev/null 2>&1 || missing=1
    done
    [ "$missing" = 0 ] && ok "$downloads/ has the source package, its signature and checksum" || fail "$downloads/ does not have the release yet: it can take an hour after the move"

    step "The download page"
    if curl -fsSL https://unomi.apache.org/download.html 2>/dev/null | grep -q "unomi-tracker/$version/"; then
        ok "https://unomi.apache.org/download.html links to $version"
    else
        fail "https://unomi.apache.org/download.html does not link to $version yet: update tracker.latest in unomi-site, and publish the site"
    fi

    step "JIRA"
    local released
    released=$(curl -fsSL "$JIRA/rest/api/2/project/UNOMI/versions" 2>/dev/null | json "(j.find(v => v.name === 'unomi-tracker-$version') || {}).released" 2>/dev/null || true)
    [ "$released" = true ] && ok "unomi-tracker-$version is released in JIRA" || fail "unomi-tracker-$version is not marked as released in JIRA"
    [ ${#FAILURES[@]} -eq 0 ] || summary

    step "The previous release of the line, from dist/release (it stays on archive.apache.org)"
    local major previous old
    major=${version%%.*}
    previous=$(svn ls "$DIST_RELEASE" 2>/dev/null | sed 's#/$##' | grep -E "^$major\.[0-9]+\.[0-9]+$" | grep -vx "$version" | tr '\n' ' ' || true)
    if [ -z "$previous" ]; then
        ok "none in dist/release"
    else
        local urls=()
        for old in $previous; do urls+=("$DIST_RELEASE/$old"); done
        if confirm "svn rm ${previous% }?"; then
            svn rm "${urls[@]}" -m "Archive Apache Unomi tracker ${previous% }: $version is released"
            ok "removed ${previous% }"
        fi
    fi

    step "Announcement"
    mkdir -p "$work"
    [ -f "$work/announce-email.txt" ] || write_announcement "$version" > "$work/announce-email.txt"
    cat <<EOF
   1. Send $work/announce-email.txt from your apache.org address (announce@ only takes those);
      signing it with your PGP key is recommended.
   2. Record the release, if not done yet: https://reporter.apache.org/addrelease.html?unomi
   3. Update the tracker that Unomi bundles (extensions/web-tracker/wab/package.json in apache/unomi).
   4. Set the next version in package.json, for example $major.$(( $(echo "$version" | cut -d. -f2) + 1 )).0.
EOF
    summary
}

cmd_abandon() {
    local version=$1 rc=$2
    check_version "$version"
    check_rc "$rc"
    need svn
    step "Remove release candidate $rc of $version from dist/dev (its tag stays)"
    svn info "$DIST_DEV/$version-rc$rc" >/dev/null 2>&1 || die "release candidate $rc of $version is not in dist/dev"
    if confirm "svn rm $DIST_DEV/$version-rc$rc?"; then
        svn rm "$DIST_DEV/$version-rc$rc" -m "Remove Apache Unomi tracker $version release candidate $rc: the vote did not pass"
        ok "removed"
    fi
    printf '   next: send the result to the vote thread, fix the problems, then scripts/release.sh candidate %s %s\n' "$version" "$((rc + 1))"
}

usage() {
    sed -n '/^# The checks and steps/,/^# The files go/p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
}

command=${1:-}
[ -n "$command" ] || usage
shift
args=()
while [ $# -gt 0 ]; do
    case "$1" in
        --key) KEY=${2:?--key needs a key id}; shift 2 ;;
        --dry-run) DRY_RUN=1; shift ;;
        --servers) SERVERS=1; shift ;;
        --safari) SAFARI=1; shift ;;
        --dir) DIR=${2:?--dir needs a folder}; shift 2 ;;
        --plus) PLUS=${2:?--plus needs a number}; shift 2 ;;
        --minus) MINUS=${2:?--minus needs a number}; shift 2 ;;
        -h | --help) usage ;;
        -*) die "unknown option $1" ;;
        *) args+=("$1"); shift ;;
    esac
done
set -- "${args[@]+"${args[@]}"}"

case "$command" in
    check) [ $# -eq 1 ] || usage; cmd_check "$1" ;;
    candidate) [ $# -eq 2 ] || usage; cmd_candidate "$1" "$2" ;;
    verify) [ $# -eq 2 ] || usage; cmd_verify "$1" "$2" ;;
    publish) [ $# -eq 2 ] || usage; cmd_publish "$1" "$2" ;;
    finish) [ $# -eq 1 ] || usage; cmd_finish "$1" ;;
    abandon) [ $# -eq 2 ] || usage; cmd_abandon "$1" "$2" ;;
    *) usage ;;
esac
