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
Current repository is using Git Flow.

- `main`: Used for merging develop branch for tagging and releasing a new version
- `develop`: Used for merging new features and/or bug fixes from UNOMI-XXX branches
- `UNOMI-XXX`: feature or bug fix branches

Npm account
-------
- Create an account on NpmJS registry: https://www.npmjs.com/
- Ask on Apache Unomi dev mailing list (dev@unomi.apache.org) to be added as a maintainer for the package to be able to push versions
- Login locally: `npm login` and your credentials

Create a new release
-------
- Create a pull request from `develop` branch -> `main` branch.
  - Wait for a review and merge the PR.
- Bump version in the `main` branch: `1.0.0` -> `1.1.0` or for beta version `1.0.0-beta.0` -> `1.0.0-beta.1`
  - You can run `npm version 3.1.0-beta.0` to update `package.json` and create a git tag in one go (see https://docs.npmjs.com/cli/version).
- Run checks:
  - `yarn lint`: ensure linter checks are passing
  - `yarn test`: ensure tests are passing
  - `yarn build`: ensure build is passing
- Publish on npm the package:
  - in case of beta: `npm publish`
  - in case of normal version: `npm publish --tag beta`
- Create the release on GitHub for this tag.
- merge back `main` -> `develop` to get latest package version in `develop` branch