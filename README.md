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

Apache Unomi tracker
============
- [Apache Unomi website](https://unomi.apache.org)
- [Apache Unomi Documentation](https://unomi.apache.org/manual/latest/)
- [Versioning and release process](RELEASE.md)
- [Release notes](CHANGES.md)

A JavaScript tracker library for Apache Unomi.

Installation
------------
```shell
yarn add apache-unomi-tracker
```

Unomi also ships this tracker, repackaged, at `/tracker/unomi-web-tracker.min.js` on the server.

A page can also load the browser build (`dist/apache-unomi-tracker.umd.js`) directly; it defines
`window['apache-unomi-tracker']` and needs no polyfill.

Usage
-----
```javascript
import { useTracker } from 'apache-unomi-tracker';

const tracker = useTracker();
const digitalData = {
    scope: 'my-site',
    site: { siteInfo: { siteID: 'my-site' } },
    page: {
        pageInfo: {
            pageID: 'home',
            pageName: document.title,
            pagePath: document.location.pathname,
            destinationURL: document.location.origin + document.location.pathname,
            language: 'en',
            categories: [],
            tags: []
        },
        consentTypes: []
    },
    events: [],
    wemInitConfig: {
        contextServerUrl: 'https://cdp.example.com',
        timeoutInMilliseconds: 1500,
        contextServerCookieName: 'context-profile-id',
        activateWem: true,
        trackerSessionIdCookieName: 'wem-session-id',
        trackerProfileIdCookieName: 'wem-profile-id'
        // apiKey: 'YOUR_PUBLIC_API_KEY' // Unomi 4 multi-tenant only, see below
    }
};

// The tracker does not start without a session ID cookie
if (tracker.getCookie(digitalData.wemInitConfig.trackerSessionIdCookieName) == null) {
    tracker.setCookie(digitalData.wemInitConfig.trackerSessionIdCookieName, tracker.generateGuid(), 1);
}
tracker.initTracker(digitalData);
tracker.startTracker();
```

Configuring for your Unomi server
---------------------------------
The same tracker works with every Unomi version. Only the configuration changes.

| Unomi server | `apiKey` | Data goes to |
|---|---|---|
| 2.x or 3.x | Leave it out | The server (no tenants) |
| 4.x in single-tenant compatibility mode | Leave it out (a key is ignored) | The `default` tenant |
| 4.x multi-tenant | The tenant's **public** API key | That tenant |

Without a key, a Unomi 4 server that is not in compatibility mode answers `401 Unauthorized`.

Things to know when you set `apiKey`:

- Use the tenant's **public** key only, never its private key. The page configuration is visible to every visitor.
- The tracker sends the key in the `X-Unomi-Api-Key` header. A custom header makes the browser send a CORS preflight request before the real one when Unomi is on another origin.
- Unomi 2.x and 3.x servers accept the header and ignore it, so a page that sets a key still works against them.

`apiKey` and `sendCredentials` need tracker 2.0.0 or later.

Cookies when Unomi is on another origin
---------------------------------------
By default the tracker sends its requests with cookies, so that Unomi can recognise a returning visitor. When the website and Unomi are on different origins (another subdomain counts), the Unomi server must list the website origin, or the browser blocks the answers:

- Unomi 4: in `UNOMI_PUBLIC_CORS_ALLOWED_ORIGINS`, or in the tenant's `publicCorsAllowedOrigins` property.
- Unomi 2.x and 3.x: the public endpoints accept cookies from any origin.

If the site does not need to recognise visitors, set `sendCredentials: false`. Requests are then sent without cookies and work with the default server settings, but Unomi no longer sees the profile cookie:

- Unomi 4 creates a new anonymous profile on every request.
- Unomi 2.x and 3.x find the profile through the session only, so it lasts for the session.

See the [web tracker reference](https://unomi.apache.org/manual/latest/#_unomi_web_tracker_reference) in the Unomi manual for details.

Deploying the website and Unomi
-------------------------------
Unomi recognises a returning visitor by its profile cookie (`context-profile-id`), which it sets on its own host. Whether browsers keep that cookie depends on where Unomi is, compared with the website:

| Setup | Example | Profile cookie |
|---|---|---|
| Same host, Unomi behind a reverse proxy | `contextServerUrl: 'https://www.example.com/unomi'` | First-party: kept by all browsers. Recommended |
| Another host on the same domain | `www.example.com` and `cdp.example.com` | Same site: kept by all browsers. Unomi 4 must list the website origin, see above |
| Another domain | `www.example.com` and `unomi.example.net` | Third-party: blocked by Safari, and by Chrome in private windows or when the user blocks third-party cookies. Firefox keeps a separate one for each website |

When the browser blocks the profile cookie, Unomi sees the visitor as with `sendCredentials: false` (see above): a new profile on each request with Unomi 4, a profile for the session only with Unomi 2.x and 3.x. The tracker cannot keep the profile itself yet: it copies the profile ID into its own cookie (`trackerProfileIdCookieName`), on the website's host, but does not send it to Unomi (UNOMI-733).

Configuration options
---------------------
Options in `wemInitConfig`:

| Option | Default | Description |
|---|---|---|
| `contextServerUrl` | | Unomi server root URL, for example `https://cdp.example.com`, without `/cxs`: the tracker calls `/context.json` and `/eventcollector` there |
| `timeoutInMilliseconds` | `1500` | Request timeout: a positive number of milliseconds (a string such as `'3000'` works too), or `-1` for none. Any other value (missing, `0`, a blank string) uses the default |
| `contextServerCookieName` | | Name of the profile cookie set by the server (`context-profile-id` on a default server) |
| `activateWem` | | Whether the tracker is active |
| `trackerSessionIdCookieName` | `wem-session-id` | Cookie holding the session ID |
| `trackerProfileIdCookieName` | `wem-profile-id` | Cookie where the tracker copies the profile ID |
| `browserGeneratedSessionSuffix` | `''` | Suffix added to session IDs generated by the browser |
| `disableTrackedConditionsListeners` | `false` | Do not register listeners for the tracked conditions returned by Unomi |
| `sendCredentials` | `true` | Send cookies with requests. See above |
| `apiKey` | none | Unomi 4 tenant public API key. See above |
| `requiredProfileProperties`, `requiredSessionProperties` | | Properties to return in the context |
| `requireSegments`, `requireScores` | | Return the profile segments and scores in the context |

Tracking clicks and forms
-------------------------
The tracker sends a click event for the links and buttons whose clicks Unomi tracks (rules with a
`clickOnLinkEventCondition`), and for the elements a site passes to `sendClickEvent`. It sends a
form event for the forms Unomi tracks (rules with a `formEventCondition`). It does not change what
the visitor's click or submit does:

- A click that leaves the page (a link, a button that submits its form) waits until its event is
  sent, or could not be, then goes on. Without a timeout (`-1`), it waits 1.5s at most.
- Other clicks do not wait: buttons that stay on the page, links that open another tab or window,
  downloads, `#` and `javascript:` links, clicks with Ctrl, Cmd, Shift or Alt (unless a callback
  is given, see below), and clicks the site already handled (`preventDefault()`, as single-page
  application routers do). The site's own click handlers run once per click, and routers handle
  tracked links as usual.
- A click on an image, an icon or some text inside a tracked element is sent on the tracked
  element.
- With callbacks, `sendClickEvent(event, onSent, onNotSent)` calls one of them once the event is
  sent, or could not be; for a click that leaves the page, the site then handles it in the callback.
  When tracking is off, or Unomi could not be reached, nothing is sent and neither callback is
  called: the click goes on as if the tracker were not there.
- A tracked form waits for its event, then is submitted as a native submit would be: the site's
  submit handlers run once, and the button that was used is sent with the form. Forms that open in
  another tab or window, and submits the site already handled, do not wait.
- When Unomi could not be reached, or tracking is turned off, nothing is sent and clicks and forms
  are left alone.

Supported browsers
------------------
Current versions of Chrome, Edge, Firefox and Safari. The tests run in Chromium, Firefox and
WebKit, and in Safari on macOS; mobile browsers are not tested. Like 1.x, the tracker needs a browser with
ES2015 support; in browsers without `HTMLFormElement.requestSubmit` (Safari before 16), tracked
forms are submitted another way, with the same data.

Versions
--------
| Tracker | Unomi servers | Branch |
|---|---|---|
| 2.x | 2.x, 3.x and 4.x (multi-tenant with `apiKey`) | `main` |
| 1.x | 2.x and 3.x; fixes only | `1_x` |

Upgrading from 1.x
------------------
Version 2.0 is a drop-in replacement: the same configuration works with the same Unomi server, and
sends the same context requests. A site needs no change.

New:
- To use a Unomi 4 multi-tenant server, set `apiKey` (see above).
- New option `sendCredentials`, see above.
- The package now ships TypeScript types (`dist/apache-unomi-tracker.d.ts`). The configurations shown here and in the Unomi manual compile with them. A project that declared its own types for `apache-unomi-tracker` can remove them.

What a site may notice, all fixes (see [CHANGES.md](CHANGES.md) for the details):
- The browser build works without a `Buffer` polyfill. With 1.5.0 and earlier, a page loading it directly got no tracking.
- An empty page `attributes` is no longer sent, so the page views and clicks of sites set up with an older example from the Unomi manual are stored again (Unomi 2.4 and later rejected them).
- Every click on a tracked element is sent: 1.x only sent the first click on each element.
- A click on a child of a tracked element (an image, an icon, some text) is sent on the tracked element, where 1.x sent nothing, or an event on the child.
- Clicks that do not leave the page are no longer held back, so the site's own click handlers run once per click (they ran twice).
- Links and forms keep working when Unomi cannot be reached, when it never answers and there is no timeout, and when tracking is turned off; Ctrl or Cmd+click opens a new tab again.
- A tracked form is submitted with the button that was used, also a button named `submit`.
- A configuration without a usable `timeoutInMilliseconds` now tracks; with 1.x, every request failed at once.

Using an unreleased version
---------------------------
For development only, a project can depend on a commit of this repository. The tracker is built
from source when it is installed (the `prepare` script):
```shell
yarn add "apache-unomi-tracker@git+https://github.com/apache/unomi-tracker.git#<commit>"
```
Releases of other projects must depend on a released version instead.

Testing
-------
- `yarn test`: unit tests, and a check that the documented configurations compile against the TypeScript types
- `yarn test:servers`: browser tests against Unomi 2.x, 3.x and 4.x started with Docker; Unomi 3 and 4 must pass on every pull request, in Chromium, Firefox and WebKit (`TRACKER_BROWSERS`), see [test/servers](test/servers/README.md)
- `yarn test:safari`: the same questions in the real Safari of a Mac, against a simulated Unomi (no Docker)

License
-------
The source code is available under the Apache License V2
