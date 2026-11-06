<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one or more
  ~ contributor license agreements.  See the NOTICE file distributed with
  ~ this work for additional information regarding copyright ownership.
  ~ The ASF licenses this file to You under the Apache License, Version 2.0
  ~ (the "License"); you may not use this file except in compliance with
  ~ the License.  You may obtain a copy of the License at
  ~
  ~      http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing, software
  ~ distributed under the License is distributed on an "AS IS" BASIS,
  ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  ~ See the License for the specific language governing permissions and
  ~ limitations under the License.
  -->

Unomi tracker: versioning and release
=====================================

Branches and versions
---------------------
- `main`: the 2.x line, for Unomi 2.x, 3.x and 4.x.
- `1_x`: the 1.x line, for Unomi 2.x and 3.x; fixes only.
- `UNOMI-XXX`: a branch for one JIRA ticket, merged with a pull request.

Each release has a JIRA version, `unomi-tracker-X.Y.Z`, a tag for each release candidate,
`vX.Y.Z-rcN`, and once the vote passes, a tag `vX.Y.Z` on the same commit. A fix for both lines has
both fix versions, and a pull request on each branch. Below, `X.Y.Z` is the version being
released, for example `2.0.0`.

Before the release
------------------
- In JIRA, every ticket with the fix version `unomi-tracker-X.Y.Z` is resolved, or moved to a later
  version.
- `CHANGES.md` has the release notes of `X.Y.Z`, and the README is up to date ("Upgrading from 1.x"
  for a 2.x release).
- `NOTICE` has the current year.
- The licensing is right (https://www.apache.org/legal/release-policy.html#licensing):
  `LICENSE` and `NOTICE` describe exactly what each package contains. The source package has
  `LICENSE` (the Apache License). The npm package bundles third-party code in its browser build, so
  it has `LICENSE-binary` as its `LICENSE`, which also lists those components (`npm pack` puts it in
  place, see `scripts/npm-license.js`; `yarn test` checks that it matches the build). Every bundled
  component has a license of category A (https://www.apache.org/legal/resolved.html).
- Every source file has the ASF license header. This lists the files without it (the result must
  be empty):
  ```shell
  git ls-files -- '*.js' '*.ts' '*.md' '*.html' '*.yml' '*.yaml' ':!:.github/*' | xargs grep -L "Licensed to the Apache Software Foundation"
  ```
  Apache RAT (https://creadur.apache.org/rat/) checks every file, also those of other types. With
  RAT 0.18, in a checkout or the extracted source package, this must report `Unapproved: 0`:
  ```shell
  java -jar apache-rat-0.18.jar --input-exclude-parsed-scm GIT --input-exclude yarn.lock .eslintignore .npmignore -- .
  ```
- Your signing key: an RSA key of at least 2048 bits (4096 recommended) with your @apache.org
  address, on your own machine (never on an ASF machine), published on a key server
  (keys.openpgp.org), and in the `KEYS` files: in this repository, and in the distribution
  directory, https://dist.apache.org/repos/dist/dev/unomi/KEYS and
  https://dist.apache.org/repos/dist/release/unomi/KEYS (the one voters and users check, served as
  https://downloads.apache.org/unomi/KEYS). See https://infra.apache.org/release-signing.html and
  https://unomi.apache.org/contribute/release-guide.html
- You can publish to npm: an account on https://www.npmjs.com/, added as a maintainer of
  `apache-unomi-tracker` (ask on dev@unomi.apache.org), and `npm login`.
- The checks pass on the commit to release:
  - CI (all the required checks of the pull requests, `.asf.yaml`)
  - `yarn install --frozen-lockfile`, `yarn lint`, `yarn test`
  - `TRACKER_BROWSERS=chromium,firefox,webkit yarn test:servers`: the comparison with 1.5.0 and
    every Unomi server, in the three browsers (Docker, see [test/servers](test/servers/README.md))
  - `yarn test:safari` on a Mac, with Safari visible

The release candidate
---------------------
Each release candidate has a number, `N`, from 1: `rcN` below.

- `package.json` has the version `X.Y.Z`.
- Tag and push the candidate: `git tag -s -u <your key id> vX.Y.Z-rcN -m 'Release candidate N of X.Y.Z'`,
  then `git push origin vX.Y.Z-rcN`. Give your Apache key explicitly: without `-u`, git signs with
  `user.signingkey`, which can be another key (for example the one that signs your commits). The
  tag of a candidate is never moved or deleted: a new candidate gets a new tag.
- The source package, from the tag, then the npm package built from it, each signed and with its
  checksum:
  ```shell
  git archive --format=tar.gz --prefix=unomi-tracker-X.Y.Z/ -o unomi-tracker-X.Y.Z.tar.gz vX.Y.Z-rcN
  tar xzf unomi-tracker-X.Y.Z.tar.gz && cd unomi-tracker-X.Y.Z
  yarn install --frozen-lockfile && yarn test
  npm pack --pack-destination ..
  cd ..
  for f in unomi-tracker-X.Y.Z.tar.gz apache-unomi-tracker-X.Y.Z.tgz; do
    gpg -ab -u <your key id> $f && gpg --verify $f.asc $f && shasum -a 512 $f > $f.sha512
  done
  ```
  Check that the signatures use your Apache key, and that the npm package has `dist`, `NOTICE`,
  `KEYS`, and as `LICENSE` the content of `LICENSE-binary` (`tar tzf apache-unomi-tracker-X.Y.Z.tgz`).
  The npm package is the one published after the vote: voters check it too. The build is
  reproducible, so `npm pack` on the same source gives the same file, with the same checksum.
- Upload the six files to https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/X.Y.Z-rcN/
  (create the folder).

The vote
--------
Send the vote to dev@unomi.apache.org; it lasts at least 72 hours, and needs at least three +1
votes from PMC members (binding), and more binding +1 than -1 votes
(https://www.apache.org/legal/release-policy.html#release-approval). Before a +1, voters download
the packages to their own machine, check their signatures and checksums, their licensing, and build
and test the source package there. For example:

```
Subject: [VOTE] Release Apache Unomi tracker X.Y.Z (release candidate N)

Hi all,

I would like to release Apache Unomi tracker X.Y.Z, the JavaScript tracker for Apache Unomi.
<One or two sentences on what the release brings, from CHANGES.md.>

Release notes:
https://github.com/apache/unomi-tracker/blob/vX.Y.Z-rcN/CHANGES.md
JIRA: https://issues.apache.org/jira/secure/ReleaseNote.jspa?projectId=12319220&version=<version id>

Source package and npm package, with their signatures and checksums:
https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/X.Y.Z-rcN/

Tag: https://github.com/apache/unomi-tracker/releases/tag/vX.Y.Z-rcN (commit <sha>)

Signing keys: https://downloads.apache.org/unomi/KEYS

To check the packages, on your own machine:
  gpg --import KEYS
  gpg --verify unomi-tracker-X.Y.Z.tar.gz.asc unomi-tracker-X.Y.Z.tar.gz
  gpg --verify apache-unomi-tracker-X.Y.Z.tgz.asc apache-unomi-tracker-X.Y.Z.tgz
  shasum -a 512 -c unomi-tracker-X.Y.Z.tar.gz.sha512 apache-unomi-tracker-X.Y.Z.tgz.sha512
then untar the source package, check LICENSE and NOTICE, and run yarn install --frozen-lockfile,
yarn test and npm pack: the npm package it builds has the same checksum as the one above. The tests
against Unomi servers need Docker: yarn test:servers.

The npm package is the one published to npm after the vote.

The vote is open for at least 72 hours.

[ ] +1 Release these packages as Apache Unomi tracker X.Y.Z
[ ] +0 No opinion
[ ] -1 Do not release these packages because...

Thanks,
<name>
```

Send the result to the same list, with `[RESULT][VOTE]` in the subject, and the votes counted
(binding and non-binding). If the vote fails, remove the candidate's folder from `dist/dev`
(`svn rm https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/X.Y.Z-rcN -m "..."`), fix the
problems, and start again with the next candidate, `rcN+1`. Keep the failed candidate's tag.

After the vote
--------------
- Tag the release on the commit of the candidate that passed, and push it:
  `git tag -s -u <your key id> vX.Y.Z vX.Y.Z-rcN^{commit} -m 'Release X.Y.Z'`, then
  `git push origin vX.Y.Z`.
- Move the packages: `svn mv https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/X.Y.Z-rcN
  https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/X.Y.Z -m "Apache Unomi tracker X.Y.Z
  release"` (a PMC member does it).
- In JIRA, mark `unomi-tracker-X.Y.Z` as released, with the date, and record the release on
  https://reporter.apache.org/addrelease.html?unomi
- Publish to npm the npm package that was voted, after checking it:
  ```shell
  curl -O https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/X.Y.Z/apache-unomi-tracker-X.Y.Z.tgz
  curl -O https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/X.Y.Z/apache-unomi-tracker-X.Y.Z.tgz.asc
  curl -O https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/X.Y.Z/apache-unomi-tracker-X.Y.Z.tgz.sha512
  gpg --verify apache-unomi-tracker-X.Y.Z.tgz.asc apache-unomi-tracker-X.Y.Z.tgz
  shasum -a 512 -c apache-unomi-tracker-X.Y.Z.tgz.sha512
  npm publish apache-unomi-tracker-X.Y.Z.tgz
  ```
  Publishing the file publishes it as it is, without building anything. For a 1.x release once 2.x
  is published, use `npm publish --tag latest-1 apache-unomi-tracker-X.Y.Z.tgz`, so that
  `npm install apache-unomi-tracker` keeps installing 2.x.
- Wait at least one hour after the move, so that https://downloads.apache.org has the release,
  then update the Unomi download page (https://unomi.apache.org/download.html): in the
  `unomi-site` repository, set `tracker.latest` (version, date, JIRA version id) in
  `src/main/webapp/_data/unomi.yml`. The page then links to the source package through
  `https://www.apache.org/dyn/closer.lua/unomi/unomi-tracker/X.Y.Z/unomi-tracker-X.Y.Z.tar.gz`, its
  signature and checksum on `https://downloads.apache.org/unomi/unomi-tracker/X.Y.Z/`, and KEYS;
  older releases are on the archive.
- Once the download page links to the new release, remove the previous release of the same line
  from `dist/release` (`svn rm`): it stays on https://archive.apache.org/dist/unomi/unomi-tracker/,
  and `dist/release` keeps only the latest release of each line still maintained. Removing it
  earlier would break the download page's links until it is updated.
- Then announce the release on dev@unomi.apache.org, user@unomi.apache.org and announce@apache.org,
  from your apache.org address (announce@ only accepts that). Signing the email with your PGP key is
  recommended. For example:

  ```
  Subject: [ANNOUNCE] Apache Unomi tracker X.Y.Z released

  The Apache Unomi team is pleased to announce the release of Apache Unomi tracker X.Y.Z.

  Apache Unomi tracker is the JavaScript library that websites use to send their visitors' events
  to Apache Unomi, a customer data platform, and to personalize their pages with its answers.

  <What the release brings, in a few lines, from CHANGES.md.>

  Download: https://unomi.apache.org/download.html
  npm: npm install apache-unomi-tracker@X.Y.Z
  Release notes: https://github.com/apache/unomi-tracker/blob/vX.Y.Z/CHANGES.md

  Thanks to everyone who contributed to this release.

  <name>, on behalf of the Apache Unomi PMC
  ```
- Update the tracker that Unomi bundles (`extensions/web-tracker/wab/package.json` in
  https://github.com/apache/unomi) to the released version.
- Set the next version in `package.json`, for example `2.1.0`.
