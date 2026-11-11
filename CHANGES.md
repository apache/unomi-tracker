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

Apache Unomi tracker: release notes
===================================

2.0.0
-----
Tracker 2.0.0 works with Unomi 2.x, 3.x and 4.x, including Unomi 4 multi-tenant servers, and
replaces 1.x without changes to the sites that use it. It also fixes clicks and forms that were not
tracked, or stopped working for visitors, and ships TypeScript types.

All the tickets: [JIRA release notes](https://issues.apache.org/jira/secure/ReleaseNote.jspa?projectId=12319220&version=12357743).

### Compatibility
| Unomi server | Configuration |
|---|---|
| 2.x, 3.x | As with tracker 1.x |
| 4.x, single-tenant compatibility mode | As with tracker 1.x |
| 4.x, multi-tenant | `apiKey`: the tenant's public API key |

A site that works with tracker 1.x keeps working with the same Unomi server and the same
configuration. What it may notice is listed in [Upgrading from 1.x](README.md#upgrading-from-1x):
all of it are fixes.

### New
- UNOMI-1019: `apiKey`, the tenant public API key Unomi 4 multi-tenant servers need, sent in the
  `X-Unomi-Api-Key` header. Older servers ignore it.
- UNOMI-1005: `sendCredentials: false` sends the requests without cookies, for sites that do not
  need to recognise visitors (Unomi 4 then creates a profile per request).
- UNOMI-891: TypeScript types (`dist/apache-unomi-tracker.d.ts`).
- UNOMI-1019: the README explains how to configure the tracker for each Unomi version, and which
  deployments keep the visitor's profile (the profile cookie is a third-party cookie when Unomi is
  on another domain).

### Fixes
- UNOMI-1023: the browser build works without a `Buffer` polyfill; a page loading it directly got
  no tracking at all.
- UNOMI-1024: an empty page `attributes` is no longer sent, so sites set up with an older example
  from the Unomi manual get their page views and clicks stored again on Unomi 2.4 and later.
- UNOMI-1037: every click on a tracked element is sent, not only the first one, also with
  callbacks, and also a second click made before the first event is sent.
- UNOMI-1047: a click on an image, an icon or some text inside a tracked link or button is sent on
  the tracked element, and a link waits for its event before it is followed.
- UNOMI-1046: clicks that do not leave the page are no longer held back nor dispatched again, so
  the site's own click handlers run once per click (they ran twice). Single-page application
  routers handle tracked links as before.
- UNOMI-1040: links and forms keep working when Unomi cannot be reached, when tracking is turned
  off, when the event cannot even be sent, and, without a timeout, when Unomi never answers (they
  wait 1.5s at most). Links and forms that keep the page (new tab or window, download, `#` and
  `javascript:` links) and clicks the site already handled do not wait for Unomi.
- UNOMI-1041: Ctrl or Cmd+click on a tracked link opens it in a new tab again.
- UNOMI-1042: a tracked form is submitted as a native submit would be, with the button that was
  used: also a button named `submit` (the form was not submitted at all), an image button, and in
  browsers without `requestSubmit` (the button's `formaction`, `formmethod`, `formenctype` and
  `formtarget` are applied).
- UNOMI-1043: without a usable `timeoutInMilliseconds` (missing, `0`, a blank string), the default
  of 1500 ms is used; every request used to fail at once. A number given as a string works.
- UNOMI-1038: `sourceLocalIdentifierMap` finds the elements whose id contains a mapped
  part anywhere, also at its start (1.x missed those).

### Build and tests
- The dependencies are updated within their major versions, which fixes the security advisories
  that did not need a major upgrade. `@babel/runtime`, whose helpers are part of the tracker that
  pages load, now requires 7.26.10 or later. `es6-crawler-detect`, also part of it, stays at 3.3.0;
  the others are build tools. The build tool `rollup-plugin-license` moves to 3.7.1, for the
  lodash and moment advisories; the build output is the same.
- `dist` is no longer committed: it is built when the package is published, and when a project
  installs a commit of this repository (the `prepare` script, for development only).
- The npm package's `LICENSE` now lists the third-party code its browser build bundles
  (`es6-crawler-detect` and a `@babel/runtime` helper, both MIT), and the browser build's header
  gives their licenses. The 1.x packages had the Apache License only.
- Tests: unit tests; browser tests against Unomi 2.3, 2.7, 3.0, 4.0 multi-tenant and 4.0
  single-tenant (Docker), in Chromium, Firefox and WebKit; a comparison of the requests with the
  published 1.5.0; checks in the real Safari of a Mac. Pull requests must pass the tests against
  Unomi 3 and 4 in the three browsers. See [test/servers](test/servers/README.md).

### Known limitations
Planned for later versions:
- UNOMI-733: when Unomi is on another domain and the browser blocks its cookie (Safari does), the
  visitor's profile only lasts a session (Unomi 2.x and 3.x) or a request (Unomi 4). The tracker
  does not send its own copy of the profile ID yet.
- UNOMI-1045: while Unomi is slow to answer, a tracked link or form waits up to
  `timeoutInMilliseconds` before it goes on.
- UNOMI-1044: events that cannot be sent while Unomi is briefly unreachable are lost.
- UNOMI-1039: deployments where the website and Unomi are on different domains are not tested yet.
