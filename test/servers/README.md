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

Tracker tests against Unomi servers
===================================

These tests load the tracker in a real browser (Chromium, through Playwright) and run it against
each supported Unomi version, started with Docker Compose. They check what unit tests cannot:
CORS, preflight requests, cookies, API keys and the events actually stored by the server.

They are not part of CI. Run them before a release, and whenever you change how the tracker talks
to the server.

Requirements
------------
- Docker with Compose, and about 4 GB of free memory (one server runs at a time)
- Chromium for Playwright, installed once with `npx playwright install chromium`

Running
-------
```shell
yarn test:servers                  # every server, one after the other
yarn test:servers unomi2 unomi4    # only these servers
yarn test:servers --keep unomi4    # leave the server running afterwards
```

The command builds the tracker, then for each server: starts it, sets it up, runs the tests and
removes it with its data. It exits with an error if any server fails.

Servers
-------
| Name | Server | Search engine | Setup before the tests |
|---|---|---|---|
| `unomi2` | `apache/unomi:2.7.0` | Elasticsearch 7.17 | Scope `tracker-test` |
| `unomi3` | `apache/unomi:3.0.0` | Elasticsearch 9.1 | Scope `tracker-test` |
| `unomi4` | `apache/unomi:4.0.0-SNAPSHOT`, multi-tenant | Elasticsearch 9.4 | Tenant `tracker-test`, new public and private keys, scope `tracker-test` in the tenant |
| `unomi4-compat` | `apache/unomi:4.0.0-SNAPSHOT`, single-tenant compatibility mode | Elasticsearch 9.4 | Tenant `default`, scope `tracker-test` in it |

Unomi listens on http://localhost:8181. Override the images with `UNOMI2_VERSION`, `UNOMI3_VERSION`
and `UNOMI4_VERSION`, for example `UNOMI4_VERSION=4.0.1-SNAPSHOT yarn test:servers unomi4`.

The Unomi 4 servers use the administrator password `tracker-test-root` (`UNOMI_ROOT_PASSWORD`).
With `--keep`, the setup log shows the tenant public key, so you can try the server by hand.

The test page is served on two origins. Unomi 4 lists http://localhost:8000 as allowed to send
cookies (`UNOMI_PUBLIC_CORS_ALLOWED_ORIGINS`) and does not list http://localhost:8001.

What is tested
--------------
For each server:
- The context loads and a click event is stored, with the configuration a site uses for that
  server (`apiKey` on Unomi 4 multi-tenant only), and in the expected tenant on Unomi 4.
- Setting `apiKey` works on every server, and the `X-Unomi-Api-Key` header is only sent when set.
- Unomi 4 multi-tenant answers `401` without a key.
- With cookies, the profile is kept across page loads.
- With `sendCredentials: false`, tracking works; Unomi 4 gives a new profile on each request,
  Unomi 2.x and 3.x keep the profile through the session.
- From an origin the server does not list, Unomi 4 blocks requests with cookies, and accepts them
  without cookies.

Two tests are marked as known failures (`test.fail()`), for bugs that are not fixed yet. Playwright
reports them as passed while the bug is there, and fails them once it is fixed, so that the marker
gets removed:
- The UMD build throws `Buffer is not defined` in a browser: es6-crawler-detect calls
  `Buffer.byteLength`. The test page adds a small shim so that the other tests can run.
- Events from a page whose `digitalData.page` has `attributes` (as the Unomi manual tutorial
  showed) are dropped by the server: the page schema does not allow that property since
  UNOMI-790 (Unomi 2.4.0).

Files
-----
- `docker-compose.yml`: the servers, one Compose profile each
- `run.js`: starts each server and runs the tests (`yarn test:servers`)
- `unomi.js`: server setup (tenant, keys, scope) and event queries
- `tracker.spec.js`: the tests
- `page/index.html`, `serve.js`: the test page, configured through its query string
