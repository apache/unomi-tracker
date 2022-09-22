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

Unomi tracker: Versioning and release
============

Branches
-------
Current repository is using Trunk based development.

- `main`: Used for latest currently develop version
- `1_x`: Used for maintenance branches of previous versions
- `UNOMI-XXX`: feature or bug fix branches used to create pull request targeting the `main` branch

Release example for 1.1.0
-------
Checks before starting the release process:
- Check headers and licenses
- Check your GPG configuration is correct ! it will be required for signing the package.
  - Follow: https://infra.apache.org/release-signing.html
  - And: https://unomi.apache.org/contribute/release-guide.html
- Check that you are logged into npm and you have permission to publish the package:
  - Create an account on NpmJS registry: https://www.npmjs.com/
  - Ask on Apache Unomi dev mailing list (dev@unomi.apache.org) to be added as a maintainer for the package to be able to push versions
  - Login locally: `npm login` and your credentials
- Do a final local check:
  - `yarn lint`: ensure linter checks are passing
  - `yarn test`: ensure tests are passing
  - `yarn build`: ensure build is passing

Start the release process:
- Check version and create Git tag:
  - Check `package.json` is using correct version: `1.1.0`
  - Create Git tag: `git tag -s v1.1.0 -m 'create v1.1.0 tag'` (`-s` is used for signing using your local git GPG config)
  - Push the tag: `git push origin v1.1.0`
- Sign the package and upload the package to Apache SVN. 
  - Download the `.tar.gz` source package from Git previously created tag.
  - Sign the package: `gpg -ab unomi-tracker-1.1.0.tar.gz`.
  - Verify the signature: `gpg --verify unomi-tracker-1.1.0.tar.gz.asc unomi-tracker-1.1.0.tar.gz` (Check that the signature is correctly using your Apache signature)
  - SHA the package: `shasum -a 512 unomi-tracker-1.1.0.tar.gz > unomi-tracker-1.1.0.tar.gz.sha512`
  - Upload the 3 files (`.tar.gz`, `.tar.gz.asc`, `.tar.gz.sha512`) to Apache SVN: `https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/1.1.0`
    (Create the folder if it doesn't exist)
- Start voting process, follow Unomi documentation it's the same: https://unomi.apache.org/contribute/release-guide.html
- Wait for the vote to finnish then finalize the release on Apache side:
  - move `https://dist.apache.org/repos/dist/dev/unomi/unomi-tracker/1.1.0` to `https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/1.1.0`
  - in JIRA mark the version `unomi-tracker-1.1.0` as released and add a release date
- Publish the release package to NPM:
  - Download the Apache released package: `https://dist.apache.org/repos/dist/release/unomi/unomi-tracker/1.1.0/unomi-tracker-1.1.0.tar.gz`
  - Untar the package and publish the package by running: `npm publish`
- You can set the next version into `package.json` like `1.2.0` for example.