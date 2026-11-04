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

// Browser tests of the tracker against one running Unomi server. Run them through
// `yarn test:servers`, which starts each server and sets UNOMI_TARGET.
// TRACKER_BROWSERS chooses the browsers, comma-separated: chromium (the default), firefox, webkit
// (Playwright's build of Safari's engine).
const path = require('path');
const { defineConfig } = require('@playwright/test');

const BROWSERS = {
    // The tracker treats a "HeadlessChrome" user agent as a crawler and does not start
    chromium: { browserName: 'chromium', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
    firefox: { browserName: 'firefox' },
    webkit: { browserName: 'webkit' }
};
const browsers = (process.env.TRACKER_BROWSERS || 'chromium').split(',').map(name => name.trim()).filter(Boolean);
for (const name of browsers) {
    if (!BROWSERS[name]) {
        throw new Error('Unknown browser "' + name + '" in TRACKER_BROWSERS, expected: ' + Object.keys(BROWSERS).join(', '));
    }
}

module.exports = defineConfig({
    testDir: __dirname,
    testMatch: 'tracker.spec.js',
    outputDir: path.join(__dirname, 'test-results'),
    timeout: 60000,
    workers: 1,
    reporter: 'list',
    globalSetup: require.resolve('./global-setup.js'),
    projects: browsers.map(name => ({ name, use: BROWSERS[name] })),
    webServer: {
        command: 'node ' + JSON.stringify(path.join(__dirname, 'serve.js')),
        url: 'http://localhost:8000/',
        reuseExistingServer: true
    }
});
