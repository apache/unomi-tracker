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

// Comparison with the published 1.5.0 tracker (compare-1.5.0.spec.js). No Unomi server needed.
// Run through `yarn test:servers`, which downloads 1.5.0 first.
const path = require('path');
const { defineConfig } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig(Object.assign({}, base, {
    testMatch: 'compare-1.5.0.spec.js',
    outputDir: path.join(__dirname, 'test-results', 'compare-1.5.0'),
    globalSetup: undefined
}));
