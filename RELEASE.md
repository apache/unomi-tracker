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

Each release has a JIRA version, `unomi-tracker-X.Y.Z`, and a tag, `vX.Y.Z`. A fix for both lines
has both fix versions, and a pull request on each branch. Below, `X.Y.Z` is the version being
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
- `package.json` has the version `X.Y.Z`.
- Tag and push: `git tag -s -u <your key id> vX.Y.Z -m 'Release X.Y.Z'`, then
  `git push origin vX.Y.Z`. Give your Apache key explicitly: without `-u`, git signs with
  `user.signingkey`, which can be another key (for example the one that signs your commits).
- The source package, from the tag:
  ```shell
  git archive --format=tar.gz --prefix=unomi-tracker-X.Y.Z/ -o unomi-tracker-X.Y.Z.tar.gz vX.Y.Z
  gpg -ab -u <your key id> unomi-tracker-X.Y.Z.tar.gz
  gpg --verify unomi-tracker-X.Y.Z.tar.gz.asc unomi-tracker-X.Y.Z.tar.gz
  shasum -a 512 unomi-tracker-X.Y.Z.tar.gz > unomi-tracker-X.Y.Z.tar.gz.sha512
  ```
  Check that the signature uses your Apache key.
- Check the package as voters will: untar it, then `yarn install --frozen-lockfile`, `yarn test`,
  and `npm pack` (it builds `dist`; the package has `dist`, `NOTICE`, `KEYS`, and as `LICENSE` the
  content of `LICENSE-binary`).
- Upload the three files to https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/X.Y.Z/
  (create the folder).

The vote
--------
Send the vote to dev@unomi.apache.org; it lasts at least 72 hours, and needs at least three +1
votes from PMC members (binding), and more binding +1 than -1 votes
(https://www.apache.org/legal/release-policy.html#release-approval). Before a +1, voters download
the package to their own machine, check its signature and checksum, its licensing, and build and
test it there. For example:

```
Subject: [VOTE] Release Apache Unomi tracker X.Y.Z

Hi all,

I would like to release Apache Unomi tracker X.Y.Z, the JavaScript tracker for Apache Unomi.
<One or two sentences on what the release brings, from CHANGES.md.>

Release notes:
https://github.com/apache/unomi-tracker/blob/vX.Y.Z/CHANGES.md
JIRA: https://issues.apache.org/jira/secure/ReleaseNote.jspa?projectId=12319220&version=<version id>

Source package, signature and checksum:
https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/X.Y.Z/

Tag: https://github.com/apache/unomi-tracker/releases/tag/vX.Y.Z (commit <sha>)

Signing keys: https://downloads.apache.org/unomi/KEYS

To check the package, on your own machine:
  gpg --import KEYS
  gpg --verify unomi-tracker-X.Y.Z.tar.gz.asc unomi-tracker-X.Y.Z.tar.gz
  shasum -a 512 -c unomi-tracker-X.Y.Z.tar.gz.sha512
then untar it, check LICENSE and NOTICE, and run yarn install --frozen-lockfile, yarn test and
npm pack --dry-run. The tests against Unomi servers need Docker: yarn test:servers.

The vote is open for at least 72 hours.

[ ] +1 Release this package as Apache Unomi tracker X.Y.Z
[ ] +0 No opinion
[ ] -1 Do not release this package because...

Thanks,
<name>
```

Send the result to the same list, with `[RESULT][VOTE]` in the subject, and the votes counted
(binding and non-binding). If the vote fails, delete the tag, fix the problems, and start again with
a new release candidate.

After the vote
--------------
- Move the release: `svn mv https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/X.Y.Z
  https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/X.Y.Z -m "Apache Unomi tracker X.Y.Z
  release"` (a PMC member does it). Then remove the previous release of the same line from
  `dist/release`: it stays on https://archive.apache.org/dist/unomi/unomi-tracker/, and
  `dist/release` keeps only the latest release of each line still maintained.
- In JIRA, mark `unomi-tracker-X.Y.Z` as released, with the date, and record the release on
  https://reporter.apache.org/addrelease.html?unomi
- Publish to npm, from the released package:
  ```shell
  curl -O https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/X.Y.Z/unomi-tracker-X.Y.Z.tar.gz
  tar xzf unomi-tracker-X.Y.Z.tar.gz && cd unomi-tracker-X.Y.Z
  yarn install --frozen-lockfile
  npm publish
  ```
  `npm publish` builds `dist` from the released sources first (the `prepare` script), so the
  dependencies must be installed. For a 1.x release once 2.x is published, use
  `npm publish --tag latest-1`, so that `npm install apache-unomi-tracker` keeps installing 2.x.
- Wait at least one hour after the move, so that https://downloads.apache.org has the release,
  then update the Unomi download page (https://unomi.apache.org/download.html): in the
  `unomi-site` repository, set `tracker.latest` (version, date, JIRA version id) in
  `src/main/webapp/_data/unomi.yml`. The page then links to the source package through
  `https://www.apache.org/dyn/closer.lua/unomi/unomi-tracker/X.Y.Z/unomi-tracker-X.Y.Z.tar.gz`, its
  signature and checksum on `https://downloads.apache.org/unomi/unomi-tracker/X.Y.Z/`, and KEYS;
  older releases are on the archive.
- Then announce the release on dev@unomi.apache.org, user@unomi.apache.org and announce@apache.org,
  from your apache.org address (announce@ only accepts that): a short description of the tracker,
  what the release brings, and a link to the download page. Signing the email with your PGP key is
  recommended.
- Update the tracker that Unomi bundles (`extensions/web-tracker/wab/package.json` in
  https://github.com/apache/unomi) to the released version.
- Set the next version in `package.json`, for example `2.1.0`.
