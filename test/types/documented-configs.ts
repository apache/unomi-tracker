/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Checks that the configurations shown in the README and in the Unomi manual compile against the
// published types, so that a TypeScript project can move from 1.x without changes. Compiled by
// `yarn test` after the build.
import { useTracker } from '../../dist/apache-unomi-tracker';

const tracker = useTracker();

// README "Usage"
tracker.initTracker({
    scope: 'my-site',
    site: { siteInfo: { siteID: 'my-site' } },
    page: {
        pageInfo: {
            pageID: 'home',
            pageName: 'Home',
            pagePath: '/',
            destinationURL: 'https://www.example.com/',
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
    }
});

// Configuration from the Unomi manual tutorial up to 2026, which still had page "attributes",
// with the Unomi 4 multi-tenant options
tracker.initTracker({
    scope: 'unomi-tracker-test',
    site: { siteInfo: { siteID: 'unomi-tracker-test' } },
    page: {
        pageInfo: {
            pageID: 'unomi-tracker-test-page',
            pageName: 'Test page',
            pagePath: '/',
            destinationURL: 'http://localhost:8181/',
            language: 'en',
            categories: [],
            tags: []
        },
        attributes: {},
        consentTypes: []
    },
    events: [],
    wemInitConfig: {
        contextServerUrl: 'http://localhost:8181',
        timeoutInMilliseconds: 1500,
        contextServerCookieName: 'context-profile-id',
        activateWem: true,
        trackerSessionIdCookieName: 'unomi-tracker-test-session-id',
        trackerProfileIdCookieName: 'unomi-tracker-test-profile-id',
        apiKey: 'YOUR_PUBLIC_API_KEY',
        sendCredentials: false
    }
});

tracker._registerCallback(() => {
    console.log(tracker.getLoadedContext());
}, 'Unomi tracker test callback example');
tracker.startTracker();
