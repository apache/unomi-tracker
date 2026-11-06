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
# The checks and steps of RELEASE.md, as commands:
#
#   scripts/release.sh check     X.Y.Z --key <id> [--servers] [--safari]
#       The checks before a release, on this checkout.
#   scripts/release.sh candidate X.Y.Z N --key <id> [--dry-run]
#       Release candidate N: tag vX.Y.Z-rcN, source and npm packages, signed, checked as voters
#       will, staged in dist/dev, and the vote email.
#   scripts/release.sh verify    X.Y.Z N [--dir <folder>] [--servers]
#       What a voter checks, on the staged candidate (or on the files in <folder>).
#   scripts/release.sh publish   X.Y.Z N --key <id> [--dry-run]
#       After the vote: tag vX.Y.Z, move to dist/release, publish the voted npm package, and the
#       announcement email.
#   scripts/release.sh abandon   X.Y.Z N [--dry-run]
#       After a failed vote: remove the candidate from dist/dev (its tag stays).
#
# Each step that is seen by others (git push, svn, npm publish) asks first; --dry-run skips them.
# The files go to target/release/X.Y.Z-rcN/.

set -euo pipefail

DIST_DEV=https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker
DIST_RELEASE=https://dist.apache.org/repos/dist/release/unomi/unomi-tracker
KEYS_URL=https://downloads.apache.org/unomi/KEYS
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
need() { for tool in "$@"; do command -v "$tool" >/dev/null || die "$tool is needed"; done; }

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
    if (cd "$(dirname "$file")" && shasum -a 512 -c "$(basename "$file").sha512" >/dev/null 2>&1); then
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

cmd_check() {
    local version=$1
    check_version "$version"
    need git gpg node yarn npm curl shasum
    [ -n "$KEY" ] || die "give your signing key: --key <id>"
    cd "$ROOT"

    step "The checkout"
    local branch sha
    branch=$(git rev-parse --abbrev-ref HEAD)
    sha=$(git rev-parse HEAD)
    [ -z "$(git status --porcelain)" ] && ok "no uncommitted changes" || fail "there are uncommitted changes"
    git fetch --quiet origin
    case "$branch" in
        main | 1_x)
            [ "$sha" = "$(git rev-parse "origin/$branch")" ] && ok "$branch is up to date with origin/$branch" || fail "$branch is not the same as origin/$branch"
            ;;
        *) fail "releases are made from main or 1_x, not $branch" ;;
    esac
    [ "$(json j.version < package.json)" = "$version" ] && ok "package.json has the version $version" || fail "package.json does not have the version $version"
    if git rev-parse -q --verify "refs/tags/v$version" >/dev/null || git ls-remote --exit-code --tags origin "v$version" >/dev/null 2>&1; then
        fail "the tag v$version exists already"
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
    summary
}

cmd_candidate() {
    local version=$1 rc=$2
    check_version "$version"
    check_rc "$rc"
    need git gpg node yarn npm curl shasum svn
    [ -n "$KEY" ] || die "give your signing key: --key <id>"
    cd "$ROOT"
    local tag="v$version-rc$rc" work="$ROOT/target/release/$version-rc$rc"
    git rev-parse -q --verify "refs/tags/$tag" >/dev/null && die "the tag $tag exists already: use the next candidate number"
    [ -z "$(git status --porcelain)" ] || die "there are uncommitted changes"
    [ "$(json j.version < package.json)" = "$version" ] || die "package.json does not have the version $version"

    step "Tag $tag"
    local ref=$tag
    if [ "$DRY_RUN" = 1 ]; then
        printf '   dry run: no tag, the packages are built from HEAD\n'
        ref=HEAD
    else
        git tag -s -u "$KEY" "$tag" -m "Release candidate $rc of $version"
        git tag -v "$tag" >/dev/null 2>&1 && ok "signed tag $tag on $(git rev-parse --short "$tag^{commit}")" || die "the tag $tag does not verify"
    fi
    local sha
    sha=$(git rev-parse "$ref^{commit}")

    step "Source package and npm package"
    rm -rf "$work"
    mkdir -p "$work/stage"
    local source="$work/stage/unomi-tracker-$version.tar.gz"
    git archive --format=tar.gz --prefix="unomi-tracker-$version/" -o "$source" "$ref"
    ok "unomi-tracker-$version.tar.gz, from $ref ($sha)"
    BUILT_NPM_PACKAGE=
    check_source_package "$version" "$source"
    [ ${#FAILURES[@]} -eq 0 ] || summary
    cp "$BUILT_NPM_PACKAGE" "$work/stage/"
    ok "$NPM_PACKAGE-$version.tgz, built from the source package"

    step "Signatures and checksums"
    local file
    for file in "unomi-tracker-$version.tar.gz" "$NPM_PACKAGE-$version.tgz"; do
        (cd "$work/stage" && gpg --batch --yes --armor --detach-sign -u "$KEY" "$file" && shasum -a 512 "$file" > "$file.sha512")
    done
    local home keys
    keys=$(temp_dir)/KEYS
    curl -fsSL -o "$keys" "$KEYS_URL" || die "could not download $KEYS_URL"
    home=$(keys_keyring "$keys")
    for file in "unomi-tracker-$version.tar.gz" "$NPM_PACKAGE-$version.tgz"; do
        check_signature "$home" "$work/stage/$file"
        check_checksum "$work/stage/$file"
    done
    [ ${#FAILURES[@]} -eq 0 ] || summary

    step "Publish the candidate"
    if confirm "Push the tag $tag to origin?"; then
        git push origin "$tag"
        ok "pushed $tag"
    fi
    if confirm "Upload the six files to $DIST_DEV/$version-rc$rc/?"; then
        svn import --no-auth-cache "$work/stage" "$DIST_DEV/$version-rc$rc" -m "Apache Unomi tracker $version, release candidate $rc (for the PMC vote)"
        ok "staged in $DIST_DEV/$version-rc$rc/"
    fi

    step "Vote email"
    local jira_id
    jira_id=$(jira_version_id "$version")
    jira_id=${jira_id:-<version id>}
    write_vote_email "$version" "$rc" "$sha" "$jira_id" > "$work/vote-email.txt"
    ok "$work/vote-email.txt (add what the release brings, from CHANGES.md)"
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
It checks the signatures and checksums with the KEYS above, the licensing (LICENSE, NOTICE,
headers, Apache RAT), builds and tests the source package, and checks that npm pack on it gives
the npm package above, byte for byte. Add --servers for the tests against Unomi servers (Docker).
Or by hand:
  gpg --import KEYS
  gpg --verify unomi-tracker-$version.tar.gz.asc unomi-tracker-$version.tar.gz
  gpg --verify $NPM_PACKAGE-$version.tgz.asc $NPM_PACKAGE-$version.tgz
  shasum -a 512 -c unomi-tracker-$version.tar.gz.sha512 $NPM_PACKAGE-$version.tgz.sha512
then untar the source package, check LICENSE and NOTICE, and run yarn install --frozen-lockfile,
yarn test and npm pack: the npm package it builds has the same checksum as the one above.

The npm package is the one published to npm after the vote.

The vote is open for at least 72 hours.

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
    need gpg node yarn npm curl shasum tar
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
    local keys home
    keys=$(temp_dir)/KEYS
    curl -fsSL -o "$keys" "$KEYS_URL" || die "could not download $KEYS_URL"
    home=$(keys_keyring "$keys")
    for file in "unomi-tracker-$version.tar.gz" "$NPM_PACKAGE-$version.tgz"; do
        check_signature "$home" "$files/$file"
        check_checksum "$files/$file"
    done

    step "Source package"
    check_source_package "$version" "$files/unomi-tracker-$version.tar.gz" "$files/$NPM_PACKAGE-$version.tgz"
    [ "$SERVERS" = 1 ] || skip "the tests against Unomi servers (--servers, needs Docker)"
    summary
}

cmd_publish() {
    local version=$1 rc=$2
    check_version "$version"
    check_rc "$rc"
    need git gpg node npm curl shasum svn
    [ -n "$KEY" ] || die "give your signing key: --key <id>"
    cd "$ROOT"
    local rc_tag="v$version-rc$rc" tag="v$version" work="$ROOT/target/release/$version"
    git fetch --quiet origin --tags
    git rev-parse -q --verify "refs/tags/$rc_tag" >/dev/null || die "there is no tag $rc_tag"
    local sha
    sha=$(git rev-parse "$rc_tag^{commit}")

    step "Tag $tag on the commit of $rc_tag ($sha)"
    if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
        [ "$(git rev-parse "$tag^{commit}")" = "$sha" ] && ok "$tag exists, on $sha" || die "$tag exists, on another commit than $rc_tag"
    elif [ "$DRY_RUN" = 0 ]; then
        git tag -s -u "$KEY" "$tag" "$sha" -m "Release $version"
        ok "signed tag $tag"
    else
        printf '   dry run, skipped: git tag -s -u %s %s %s\n' "$KEY" "$tag" "$sha"
    fi
    if confirm "Push the tag $tag to origin?"; then
        git push origin "$tag"
        ok "pushed $tag"
    fi

    step "Move the candidate to dist/release (a PMC member does it)"
    if svn info "$DIST_RELEASE/$version" >/dev/null 2>&1; then
        ok "$DIST_RELEASE/$version/ exists"
    elif confirm "svn mv $DIST_DEV/$version-rc$rc $DIST_RELEASE/$version?"; then
        svn mv "$DIST_DEV/$version-rc$rc" "$DIST_RELEASE/$version" -m "Apache Unomi tracker $version release"
        ok "moved to $DIST_RELEASE/$version/"
    fi
    local moved_at
    moved_at=$(date '+%H:%M')

    step "Publish the voted npm package"
    local from=$DIST_RELEASE/$version
    svn info "$from" >/dev/null 2>&1 || from=$DIST_DEV/$version-rc$rc
    rm -rf "$work"
    mkdir -p "$work"
    local file="$NPM_PACKAGE-$version.tgz" suffix
    for suffix in "" .asc .sha512; do
        curl -fsSL -o "$work/$file$suffix" "$from/$file$suffix" || die "could not download $from/$file$suffix"
    done
    local keys home
    keys=$(temp_dir)/KEYS
    curl -fsSL -o "$keys" "$KEYS_URL" || die "could not download $KEYS_URL"
    home=$(keys_keyring "$keys")
    check_signature "$home" "$work/$file"
    check_checksum "$work/$file"
    [ ${#FAILURES[@]} -eq 0 ] || summary
    # A release of an older line than npm's latest keeps latest: 1.x is published as latest-1
    local latest major tag_args=()
    latest=$(npm view "$NPM_PACKAGE" dist-tags.latest 2>/dev/null || true)
    major=${version%%.*}
    if [ -n "$latest" ] && [ "$major" -lt "${latest%%.*}" ]; then
        tag_args=(--tag "latest-$major")
    fi
    if confirm "npm publish ${tag_args[*]+${tag_args[*]} }$file (npm's latest is ${latest:-none})?"; then
        npm publish "${tag_args[@]+"${tag_args[@]}"}" "$work/$file"
        ok "published $NPM_PACKAGE@$version"
    fi

    step "Announcement email"
    write_announcement "$version" > "$work/announce-email.txt"
    ok "$work/announce-email.txt (add what the release brings, from CHANGES.md)"

    local previous
    previous=$(svn ls "$DIST_RELEASE" 2>/dev/null | sed 's#/$##' | grep -E "^$major\.[0-9]+\.[0-9]+$" | grep -vx "$version" | tr '\n' ' ' || true)
    local remove="(none in dist/release)" old
    if [ -n "$previous" ]; then
        remove="svn rm"
        for old in $previous; do remove="$remove $DIST_RELEASE/$old"; done
        remove="$remove -m \"Archive Apache Unomi tracker ${previous% }\""
    fi
    JIRA_VERSION_ID=$(jira_version_id "$version")
    cat <<EOF

== By hand, in this order
   1. JIRA: mark unomi-tracker-$version as released, dated today:
      $JIRA/projects/UNOMI/versions/${JIRA_VERSION_ID:-<version id>}
      and record the release on https://reporter.apache.org/addrelease.html?unomi
   2. From $(date -v+1H '+%H:%M' 2>/dev/null || date -d '+1 hour' '+%H:%M'), one hour after the move ($moved_at), update the download page: in
      unomi-site, src/main/webapp/_data/unomi.yml, tracker.latest: version $version,
      date $(date '+%Y-%m-%d'), JIRA version id ${JIRA_VERSION_ID:-<version id>}.
   3. Once the download page links to $version, remove the previous release of the line:
      $remove
   4. Send $work/announce-email.txt from your apache.org address.
   5. Update the tracker that Unomi bundles (extensions/web-tracker/wab/package.json in apache/unomi).
   6. Set the next version in package.json.
EOF
    summary
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

cmd_abandon() {
    local version=$1 rc=$2
    check_version "$version"
    check_rc "$rc"
    need svn
    step "Remove release candidate $rc of $version from dist/dev (its tag stays)"
    if confirm "svn rm $DIST_DEV/$version-rc$rc?"; then
        svn rm "$DIST_DEV/$version-rc$rc" -m "Remove Apache Unomi tracker $version release candidate $rc: the vote did not pass"
        ok "removed"
    fi
    printf '   next: fix the problems, then scripts/release.sh candidate %s %s\n' "$version" "$((rc + 1))"
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
    abandon) [ $# -eq 2 ] || usage; cmd_abandon "$1" "$2" ;;
    *) usage ;;
esac
