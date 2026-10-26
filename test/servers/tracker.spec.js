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

const { test, expect } = require('@playwright/test');
const { UNOMI_URL, target, findClickEvents } = require('./unomi');

const server = target(process.env.UNOMI_TARGET);
const LISTED_ORIGIN = 'http://localhost:8000';
const UNLISTED_ORIGIN = 'http://localhost:8001';
// Tracker 1.x has no Unomi 4 options, so sites use no extra configuration
const siteConfig = {};

// Opens the test page and waits for the tracker to load the context or fall back.
async function openPage(page, origin, config, timeoutMs = 30000) {
    const requests = [];
    page.on('request', request => {
        if (request.url().startsWith(UNOMI_URL) && request.method() !== 'OPTIONS') {
            requests.push(request);
        }
    });
    const params = new URLSearchParams(Object.assign({ unomi: UNOMI_URL }, config));
    await page.goto(origin + '/?' + params);
    const context = await page.evaluate(ms => Promise.race([
        window.trackerTest.context,
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('The tracker neither loaded the context nor fell back')), ms))
    ]), timeoutMs);
    return { context, requests };
}

async function sendClick(page, label) {
    const targetId = label + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    const result = await page.evaluate(id => window.trackerTest.sendClick(id), targetId);
    return Object.assign({ targetId }, result);
}

async function expectStoredClick(click) {
    expect(click.sent).toBe(true);
    const events = await findClickEvents(process.env.UNOMI_READ_CREDENTIALS, click.targetId);
    expect(events).toHaveLength(1);
}

test.describe(server.name, () => {
    test('the browser build runs without a Buffer polyfill', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const { context } = await openPage(page, LISTED_ORIGIN, siteConfig);
        expect(errors).toEqual([]);
        expect(context.loaded).toBe(true);
    });

    test('collects events from a page with empty "attributes", as the Unomi manual showed', async ({ page }) => {
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ pageAttributes: '{}' }, siteConfig));
        expect(context.loaded).toBe(true);
        await expectStoredClick(await sendClick(page, 'empty-page-attributes'));
    });

    test('sends non-empty page "attributes" as before', async ({ page }) => {
        // No default page schema accepts attributes with content, so the server drops the event, as with
        // 1.5.0 (compare-1.5.0 checks that the request is the same). Unomi 2.0 to 2.3 accept an empty one.
        await openPage(page, LISTED_ORIGIN, Object.assign({ pageAttributes: '{"color":"blue"}' }, siteConfig));
        const click = await sendClick(page, 'page-attributes');
        expect(click.sent).toBe(true);
        const events = await findClickEvents(process.env.UNOMI_READ_CREDENTIALS, click.targetId, 5000);
        expect(events).toHaveLength(0);
    });

    test('loads the context and collects an event with the site configuration', async ({ page }) => {
        const { context, requests } = await openPage(page, LISTED_ORIGIN, siteConfig);
        expect(context.loaded).toBe(true);
        expect(context.profileId).toBeTruthy();
        await expectStoredClick(await sendClick(page, 'site-config'));
        expect(requests.length).toBeGreaterThan(0);
    });

    test('keeps the profile across page loads with cookies', async ({ page }) => {
        const first = await openPage(page, LISTED_ORIGIN, siteConfig);
        const second = await openPage(page, LISTED_ORIGIN, siteConfig);
        expect(first.context.loaded).toBe(true);
        expect(second.context.loaded).toBe(true);
        expect(first.context.profileId).toBeTruthy();
        expect(second.context.profileId).toBe(first.context.profileId);
    });

    test('from another origin, with cookies', async ({ page }) => {
        // Unomi 2.x and 3.x accept cookies from any origin
        const { context } = await openPage(page, UNLISTED_ORIGIN, siteConfig);
        expect(context.loaded).toBe(true);
    });

});
