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

// Compares the requests of the current tracker with those of the published 1.5.0, for the same
// page and configuration, so that existing sites keep sending the same data. The test answers
// the requests itself: no Unomi server is needed. Run through `yarn test:servers`.
const { test, expect } = require('@playwright/test');

const UNOMI_URL = 'http://localhost:8181';
const ORIGIN = 'http://localhost:8000';

async function captureRequests(page, tracker, config) {
    const requests = [];
    await page.route(UNOMI_URL + '/**', async route => {
        const request = route.request();
        const headers = await request.allHeaders();
        requests.push({
            method: request.method(),
            url: request.url(),
            contentType: headers['content-type'],
            accept: headers['accept'],
            apiKey: headers['x-unomi-api-key'],
            body: request.postData() ? JSON.parse(request.postData()) : undefined
        });
        await route.fulfill({
            status: 200,
            headers: { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Credentials': 'true', 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId: 'compare-profile', sessionId: 'compare-session' })
        });
    });
    if (tracker) {
        await page.context().addCookies([{ name: 'tracker', value: tracker, url: ORIGIN }]);
    }
    const params = new URLSearchParams(Object.assign({ unomi: UNOMI_URL, sessionId: 'compare-session' }, config));
    await page.goto(ORIGIN + '/?' + params);
    const context = await page.evaluate(() => window.trackerTest.context);
    expect(context.loaded).toBe(true);
    const click = await page.evaluate(() => window.trackerTest.sendClick('compared-click'));
    expect(click.sent).toBe(true);
    return requests;
}

// Removes an empty "attributes" from the page items, the only change the current tracker makes
function withoutEmptyPageAttributes(value) {
    if (Array.isArray(value)) {
        return value.map(withoutEmptyPageAttributes);
    }
    if (value && typeof value === 'object') {
        const copy = {};
        for (const key of Object.keys(value)) {
            copy[key] = withoutEmptyPageAttributes(value[key]);
        }
        if (copy.itemType === 'page' && copy.properties && copy.properties.attributes
            && typeof copy.properties.attributes === 'object' && Object.keys(copy.properties.attributes).length === 0) {
            delete copy.properties.attributes;
        }
        return copy;
    }
    return value;
}

const cases = [
    { name: 'a page without attributes', config: {}, same: true },
    { name: 'a page with non-empty attributes', config: { pageAttributes: '{"color":"blue"}' }, same: true },
    { name: 'a page with empty attributes', config: { pageAttributes: '{}' }, same: false }
];

for (const { name, config, same } of cases) {
    test('sends the same requests as 1.5.0 for ' + name, async ({ browser }) => {
        const published = await browser.newPage();
        const current = await browser.newPage();
        const before = await captureRequests(published, '1.5.0', config);
        const after = await captureRequests(current, undefined, config);
        expect(before.map(request => request.url)).toEqual([UNOMI_URL + '/context.json', UNOMI_URL + '/eventcollector']);
        expect(after).toEqual(same ? before : withoutEmptyPageAttributes(before));
        if (!same) {
            // The difference must be real: 1.5.0 sends the empty attributes, the current tracker does not
            expect(after).not.toEqual(before);
        }
        await published.close();
        await current.close();
    });
}
