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
the Unomi versions that tracker 1.x supports (2.x and 3.x), started with Docker Compose. They check
what unit tests cannot: cookies, requests from other origins and the events actually stored by the
server. They also compare the tracker's requests with those of the published 1.5.0.

They are not part of CI. Run them before a release, and whenever you change how the tracker talks
to the server.

Requirements
------------
- Docker with Compose, and about 4 GB of free memory (one server runs at a time)
- Chromium for Playwright, installed once with `npx playwright install chromium`

Running
-------
```shell
yarn test:servers                  # the comparison with 1.5.0, then every server
yarn test:servers unomi2 unomi3    # only these servers
yarn test:servers compare-1.5.0    # only the comparison with 1.5.0 (no Docker needed)
yarn test:servers --keep unomi3    # leave the server running afterwards
```

The command builds the tracker and compares its requests with those of the published 1.5.0. Then,
for each server, it starts the server, creates the scope `tracker-test`, runs the tests and removes
the server with its data. It exits with an error if anything fails.

Servers
-------
| Name | Server | Search engine |
|---|---|---|
| `unomi2-legacy` | `apache/unomi:2.3.0`, the last version that accepts an empty page `attributes` | Elasticsearch 7.17 |
| `unomi2` | `apache/unomi:2.7.0` | Elasticsearch 7.17 |
| `unomi3` | `apache/unomi:3.0.0` | Elasticsearch 9.1 |

Unomi listens on http://localhost:8181. Override the images with `UNOMI2_LEGACY_VERSION`,
`UNOMI2_VERSION` and `UNOMI3_VERSION`, for example `UNOMI2_VERSION=2.6.1 yarn test:servers unomi2`.

What is tested
--------------
Compatibility with existing sites (`compare-1.5.0`): the current tracker and the published 1.5.0 are
loaded on the same page with the same configuration, and their requests are compared (URLs, headers
and bodies). They must be identical, except that an empty page `attributes` is no longer sent.
1.5.0 gets a `Buffer` polyfill, as sites using it always have one.

For each server:
- The context loads and a click event is stored.
- The browser build runs without a `Buffer` polyfill.
- With cookies, the profile is kept across page loads, also from another origin.
- A page with empty `attributes` (as the Unomi manual tutorial showed) gets its events stored.
  Non-empty `attributes` are sent as before; no default page schema accepts them, so the server
  drops the event, as with 1.5.0. Unomi 2.0 to 2.3 accept an empty one; 2.4 and later reject it
  too (UNOMI-790).

Files
-----
- `docker-compose.yml`: the servers, one Compose profile each
- `run.js`: starts each server and runs the tests (`yarn test:servers`)
- `unomi.js`: server setup (scope) and event queries
- `tracker.spec.js`: the tests against each server
- `compare-1.5.0.spec.js`: the comparison with the published 1.5.0
- `page/index.html`, `serve.js`: the test page, configured through its query string
