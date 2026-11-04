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

Browsers
--------
The tests run in Chromium by default. `TRACKER_BROWSERS` chooses others, comma-separated:
`chromium`, `firefox`, and `webkit` (Playwright's build of Safari's engine). Install them once with
`npx playwright install firefox webkit`.

```shell
TRACKER_BROWSERS=chromium,firefox,webkit yarn test:servers unomi3
```

WebKit is not Safari: popup blocking, how long a click still counts as the visitor's own, and
cookie rules (Intelligent Tracking Prevention) belong to Safari. `yarn test:safari` checks the
tracker in the real Safari of a Mac, against a Unomi simulated in Node (no Docker): links followed
once the event is sent, also when the visitor clicks inside a link; new tabs opened while Unomi is
slow; Cmd+click; single-page application routers; site click handlers run once; links followed
when Unomi cannot be reached or never answers; forms submitted with their button, in browsers with
and without `requestSubmit`. `yarn test:safari --tracker <file>` runs the same checks with another
build, for example to compare with the previous release, and `--only <text>` only the checks whose
question contains the text.

Once, on the Mac: `sudo safaridriver --enable`, then in Safari, Settings > Advanced > Show
features for web developers, and Develop > Allow Remote Automation.

Safari drops automated clicks on a hidden page (display asleep, screen locked, window hidden), so
each check runs in a Safari session of its own, the display is kept awake during the run, and the
run stops with no result (exit code 2) if the page is hidden anyway. A click the page did not get
is clicked again, and a check whose clicks were dropped runs once more; both are shown in the
output. A failing check also shows what Unomi got, the page's address and the tracker's logs.

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
- Personalization: Unomi chooses the variant whose condition matches, and the tracker displays it.
  When Unomi cannot be reached, or does not answer within `timeoutInMilliseconds`, the tracker
  falls back and displays the fallback variant.
- A configuration without `timeoutInMilliseconds` loads the context and sends events (UNOMI-1043).
- Clicks sent with `sendClickEvent` (UNOMI-1037), on a button and on a link, as an event listener
  and with callbacks: every click is stored, also a second click made before the first event is
  sent, and none twice. When the event cannot be sent, the error callback is called, or a link is
  still followed. The site's own click handler runs once per click on a button, and single-page
  application routers, on the document or on the link itself, handle a tracked link once per
  click without reloading the page (UNOMI-1046).
- A click on a child of a tracked link or button (an image, an icon, some text), with or without
  its own id, is stored on the tracked element; the link waits for the event, then is followed
  (UNOMI-1047).
- Links and forms do not wait for Unomi when they keep the page: a link to a new tab, a download, a
  form submitted into a new tab; Ctrl or Cmd+click opens a new tab, and the click is still stored
  (UNOMI-1041). They still work at once when Unomi could not be reached, when tracking is turned
  off (`_enableWem(false)`), or when the event cannot even be sent; without a timeout, they wait
  1.5s at most for a Unomi that never answers (UNOMI-1040).
- A form: the setup adds a rule on its submit, so Unomi returns it in the tracked conditions and
  the tracker watches it. On submit, the form event is stored with the field values (text, text
  area, checked checkboxes and radio button, selected options; empty fields are left out). The
  site's own submit handler runs once, once the event is sent or could not be, and learns which
  button was used. A form the site lets submit sends the same data as a native submit, with the
  button that was used (also one named `submit`, an image button, one the site removes meanwhile),
  in browsers with and without `requestSubmit` (UNOMI-1042), also with Enter, when the event cannot
  be sent, and at once when tracking is turned off (UNOMI-1040). A click on a tracked submit button
  of a tracked form stores the click and the form event.

Not tested yet: optimization tests, search and video events, `invalidateSessionAndProfile`,
digitalData overrides, personalization with a control group or a result callback, and a site and
Unomi on different domains (the test origins are all on localhost, which browsers treat as one
site).

Files
-----
- `docker-compose.yml`: the servers, one Compose profile each
- `run.js`: starts each server and runs the tests (`yarn test:servers`)
- `unomi.js`: server setup (scope) and event queries
- `tracker.spec.js`: the tests against each server
- `compare-1.5.0.spec.js`: the comparison with the published 1.5.0
- `page/index.html`, `serve.js`: the test page, configured through its query string
