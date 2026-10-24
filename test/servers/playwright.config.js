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
const path = require('path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: __dirname,
    testMatch: 'tracker.spec.js',
    outputDir: path.join(__dirname, 'test-results'),
    timeout: 60000,
    workers: 1,
    reporter: 'list',
    globalSetup: require.resolve('./global-setup.js'),
    use: {
        browserName: 'chromium',
        // The tracker treats a "HeadlessChrome" user agent as a crawler and does not start
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
    },
    webServer: {
        command: 'node ' + JSON.stringify(path.join(__dirname, 'serve.js')),
        url: 'http://localhost:8000/',
        reuseExistingServer: true
    }
});
