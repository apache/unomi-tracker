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
const { UNOMI_URL, target, tenantOf, findClickEvents } = require('./unomi');

const server = target(process.env.UNOMI_TARGET);
const LISTED_ORIGIN = 'http://localhost:8000';
const UNLISTED_ORIGIN = 'http://localhost:8001';
// The key a site uses for this server: the tenant key on Unomi 4 multi-tenant, none elsewhere
const siteConfig = server.multiTenant ? { apiKey: process.env.UNOMI_PUBLIC_KEY } : {};

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

async function apiKeyHeaders(requests) {
    return Promise.all(requests.map(async request => (await request.allHeaders())['x-unomi-api-key']));
}

async function expectStoredClick(click) {
    expect(click.sent).toBe(true);
    const events = await findClickEvents(process.env.UNOMI_READ_CREDENTIALS, click.targetId);
    expect(events).toHaveLength(1);
    if (tenantOf(server)) {
        expect(events[0].tenantId).toBe(tenantOf(server));
    }
}

test.describe(server.name, () => {
    test('the browser build runs without Node polyfills', async ({ page }) => {
        // Known bug: es6-crawler-detect calls Buffer.byteLength, so the UMD build throws in a browser.
        // Remove test.fail() once the build works without the shim.
        test.fail();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ noBufferShim: 'true' }, siteConfig), 10000);
        expect(errors).toEqual([]);
        expect(context.loaded).toBe(true);
    });

    test('collects events from a page with "attributes", as the Unomi manual shows', async ({ page }) => {
        // Known bug: the tracker sends digitalData.page as the page properties, and the page schema
        // does not allow "attributes", so Unomi drops the events. Remove test.fail() once fixed.
        test.fail();
        await openPage(page, LISTED_ORIGIN, Object.assign({ pageAttributes: 'true' }, siteConfig));
        await expectStoredClick(await sendClick(page, 'page-attributes'));
    });

    test('loads the context and collects an event with the site configuration', async ({ page }) => {
        const { context, requests } = await openPage(page, LISTED_ORIGIN, siteConfig);
        expect(context.loaded).toBe(true);
        expect(context.profileId).toBeTruthy();
        await expectStoredClick(await sendClick(page, 'site-config'));
        const headers = await apiKeyHeaders(requests);
        expect(headers.length).toBeGreaterThan(0);
        expect(new Set(headers)).toEqual(new Set([siteConfig.apiKey]));
    });

    test('works when an API key is set', async ({ page }) => {
        // Servers without tenants ignore the header, but the browser still sends a preflight
        const apiKey = server.multiTenant ? process.env.UNOMI_PUBLIC_KEY : 'ignored-by-this-server';
        const { context, requests } = await openPage(page, LISTED_ORIGIN, { apiKey });
        expect(context.loaded).toBe(true);
        await expectStoredClick(await sendClick(page, 'api-key'));
        expect(new Set(await apiKeyHeaders(requests))).toEqual(new Set([apiKey]));
    });

    test('Unomi 4 multi-tenant refuses a page without an API key', async ({ page }) => {
        test.skip(!server.multiTenant, 'only Unomi 4 multi-tenant requires a key');
        const statuses = [];
        page.on('response', response => {
            if (response.url().startsWith(UNOMI_URL + '/context.json')) {
                statuses.push(response.status());
            }
        });
        const { context } = await openPage(page, LISTED_ORIGIN, {});
        expect(context.loaded).toBe(false);
        expect(statuses).toContain(401);
    });

    test('keeps the profile across page loads with cookies', async ({ page }) => {
        const first = await openPage(page, LISTED_ORIGIN, siteConfig);
        const second = await openPage(page, LISTED_ORIGIN, siteConfig);
        expect(first.context.loaded).toBe(true);
        expect(second.context.loaded).toBe(true);
        expect(first.context.profileId).toBeTruthy();
        expect(second.context.profileId).toBe(first.context.profileId);
    });

    test('works without cookies', async ({ page }) => {
        const config = Object.assign({ sendCredentials: 'false' }, siteConfig);
        const first = await openPage(page, LISTED_ORIGIN, config);
        const second = await openPage(page, LISTED_ORIGIN, config);
        expect(first.context.loaded).toBe(true);
        expect(second.context.loaded).toBe(true);
        expect(first.context.profileId).toBeTruthy();
        expect(second.context.profileId).toBeTruthy();
        await expectStoredClick(await sendClick(page, 'no-cookies'));
        if (server.major >= 4) {
            // Unomi 4 creates a new anonymous profile on every request without the cookie
            expect(second.context.profileId).not.toBe(first.context.profileId);
        } else {
            // Unomi 2.x and 3.x find the profile through the session
            expect(second.context.profileId).toBe(first.context.profileId);
        }
    });

    test('from an origin the server does not list, with cookies', async ({ page }) => {
        const { context } = await openPage(page, UNLISTED_ORIGIN, siteConfig);
        // Unomi 4 does not allow cookies from unlisted origins, so the browser blocks the answer
        expect(context.loaded).toBe(server.major < 4);
    });

    test('from an origin the server does not list, without cookies', async ({ page }) => {
        const { context } = await openPage(page, UNLISTED_ORIGIN, Object.assign({ sendCredentials: 'false' }, siteConfig));
        expect(context.loaded).toBe(true);
        await expectStoredClick(await sendClick(page, 'unlisted-no-cookies'));
    });
});
