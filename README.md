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

A JavaScript tracker library for Apache Unomi.

Installation
------------
```shell
yarn add apache-unomi-tracker
```

Unomi also ships this tracker, repackaged, at `/tracker/unomi-web-tracker.min.js` on the server.

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

Configuration options
---------------------
Options in `wemInitConfig`:

| Option | Default | Description |
|---|---|---|
| `contextServerUrl` | | Unomi server root URL, for example `https://cdp.example.com`, without `/cxs`: the tracker calls `/context.json` and `/eventcollector` there |
| `timeoutInMilliseconds` | | Request timeout; `-1` for none |
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

Versions
--------
| Tracker | Unomi servers | Branch |
|---|---|---|
| 2.x | 2.x, 3.x and 4.x (multi-tenant with `apiKey`) | `main` |
| 1.x | 2.x and 3.x; fixes only | `1_x` |

Upgrading from 1.x
------------------
Version 2.0 is a drop-in replacement: the same configuration sends the same requests, so a site that works with 1.x keeps working with the same Unomi server.

- To use a Unomi 4 multi-tenant server, set `apiKey` (see above).
- The package now ships TypeScript types (`dist/apache-unomi-tracker.d.ts`). The configurations shown here and in the Unomi manual compile with them. A project that declared its own types for `apache-unomi-tracker` can remove them.
- New option `sendCredentials`, see above.

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
- `yarn test:servers`: browser tests against Unomi 2.x, 3.x and 4.x started with Docker; not part of CI, see [test/servers](test/servers/README.md)

License
-------
The source code is available under the Apache License V2
