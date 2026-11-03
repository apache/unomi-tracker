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
const { UNOMI_URL, FORM_NAME, target, tenantOf, findEvents } = require('./unomi');

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

// An id no earlier test or run has used, so that the events found on it are this test's
function uniqueId(label) {
    return label + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

// Only the events of the page that loaded this context: a server kept from an earlier run can hold
// older ones on the same target
function thisSession(context) {
    return event => event.sessionId === context.sessionId;
}

// The events stored on the target, with the credentials that can read them
function events(targetId, options) {
    return findEvents(process.env.UNOMI_READ_CREDENTIALS, targetId, options);
}

// The form fields of the submitted page's address, as a native submit sends them: the form's
// fields, plus only the button that was used, with the expected values (strings or patterns)
function expectSubmitted(page, expectedButton) {
    const sent = new URL(page.url()).searchParams;
    expect(sent.get('email')).toBe('tracker-test@example.com');
    for (const name of ['action', 'submit', 'pic.x', 'pic.y']) {
        const values = sent.getAll(name);
        const expected = expectedButton[name] || [];
        expect(values, name).toHaveLength(expected.length);
        expected.forEach((value, index) => value instanceof RegExp ? expect(values[index]).toMatch(value) : expect(values[index]).toBe(value));
    }
}

// Unomi gets each event 1.5s late, as when it is slow to answer
async function answerEventsLate(page) {
    await page.route(UNOMI_URL + '/eventcollector', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.continue();
    });
}

// The count found by findEvents stays the same 2s later: no duplicate event arrives afterwards
async function expectNoMoreEvents(targetId, count, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    expect(await events(targetId, Object.assign({}, options, { minCount: count + 1, timeoutMs: 1000 }))).toHaveLength(count);
}

async function sendClick(page, label) {
    const targetId = uniqueId(label);
    const result = await page.evaluate(id => window.trackerTest.sendClick(id), targetId);
    return Object.assign({ targetId }, result);
}

async function apiKeyHeaders(requests) {
    return Promise.all(requests.map(async request => (await request.allHeaders())['x-unomi-api-key']));
}

async function expectStoredClick(click) {
    expect(click.sent).toBe(true);
    const clickEvents = await events(click.targetId);
    expect(clickEvents).toHaveLength(1);
    if (tenantOf(server)) {
        expect(clickEvents[0].tenantId).toBe(tenantOf(server));
    }
}

test.describe(server.name, () => {
    test('the browser build runs without a Buffer polyfill (UNOMI-1023)', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const { context } = await openPage(page, LISTED_ORIGIN, siteConfig);
        expect(errors).toEqual([]);
        expect(context.loaded).toBe(true);
    });

    test('collects events from a page with empty "attributes", as the Unomi manual showed (UNOMI-1024)', async ({ page }) => {
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ pageAttributes: '{}' }, siteConfig));
        expect(context.loaded).toBe(true);
        await expectStoredClick(await sendClick(page, 'empty-page-attributes'));
    });

    test('sends non-empty page "attributes" as before (UNOMI-1024)', async ({ page }) => {
        // No default page schema accepts attributes with content, so the server drops the event, as with
        // 1.5.0 (compare-1.5.0 checks that the request is the same). Unomi 2.0 to 2.3 accept an empty one.
        await openPage(page, LISTED_ORIGIN, Object.assign({ pageAttributes: '{"color":"blue"}' }, siteConfig));
        const click = await sendClick(page, 'page-attributes');
        expect(click.sent).toBe(true);
        expect(await events(click.targetId, { timeoutMs: 5000 })).toHaveLength(0);
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

    test('works when an API key is set (UNOMI-1019)', async ({ page }) => {
        // Servers without tenants ignore the header, but the browser still sends a preflight
        const apiKey = server.multiTenant ? process.env.UNOMI_PUBLIC_KEY : 'ignored-by-this-server';
        const { context, requests } = await openPage(page, LISTED_ORIGIN, { apiKey });
        expect(context.loaded).toBe(true);
        await expectStoredClick(await sendClick(page, 'api-key'));
        expect(new Set(await apiKeyHeaders(requests))).toEqual(new Set([apiKey]));
    });

    test('Unomi 4 multi-tenant refuses a page without an API key (UNOMI-1019)', async ({ page }) => {
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

    test('works without cookies (UNOMI-1005)', async ({ page }) => {
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

    test('from an origin the server does not list, with cookies (UNOMI-1005)', async ({ page }) => {
        const { context } = await openPage(page, UNLISTED_ORIGIN, siteConfig);
        // Unomi 4 does not allow cookies from unlisted origins, so the browser blocks the answer
        expect(context.loaded).toBe(server.major < 4);
    });

    test('from an origin the server does not list, without cookies (UNOMI-1005)', async ({ page }) => {
        const { context } = await openPage(page, UNLISTED_ORIGIN, Object.assign({ sendCredentials: 'false' }, siteConfig));
        expect(context.loaded).toBe(true);
        await expectStoredClick(await sendClick(page, 'unlisted-no-cookies'));
    });

    test('works when the configuration has no timeoutInMilliseconds (UNOMI-1043)', async ({ page }) => {
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ timeout: 'none' }, siteConfig));
        expect(context.loaded).toBe(true);
        await expectStoredClick(await sendClick(page, 'no-timeout'));
    });

    test('shows the personalized variant that Unomi chooses', async ({ page }) => {
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ personalization: 'true' }, siteConfig));
        expect(context.loaded).toBe(true);
        expect(await page.evaluate(() => window.trackerTest.shownVariants())).toEqual(['variant-always']);
    });

    test('shows the fallback variant when Unomi cannot be reached', async ({ page }) => {
        await page.route(UNOMI_URL + '/**', route => route.abort('connectionrefused'));
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ personalization: 'true' }, siteConfig));
        expect(context.loaded).toBe(false);
        expect(await page.evaluate(() => window.trackerTest.shownVariants())).toEqual(['variant-fallback']);
    });

    test('shows the fallback variant when Unomi does not answer in time', async ({ page }) => {
        // The requests are never answered: the tracker gives up after timeoutInMilliseconds (1s
        // here, instead of the page's 10s), so the fallback must come well before 10s
        await page.route(UNOMI_URL + '/**', () => {});
        const start = Date.now();
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ personalization: 'true', timeout: '1000' }, siteConfig));
        expect(Date.now() - start).toBeLessThan(5000);
        expect(context.loaded).toBe(false);
        expect(await page.evaluate(() => window.trackerTest.shownVariants())).toEqual(['variant-fallback']);
    });

    // Clicks on a button do not leave the page; clicks on a link to #arrived do, as far as the tracker
    // can tell (it holds them back), but keep the page open, so that the test can go on
    const CLICKED = [
        { name: 'a button', config: {} },
        { name: 'a link', config: { clickLink: 'hash' } }
    ];
    const SENT = [
        { name: 'as an event listener', config: {} },
        { name: 'with callbacks', config: { clickCallback: 'true' } }
    ];

    for (const clicked of CLICKED) {
        for (const sent of SENT) {
            test('tracks every click on ' + clicked.name + ' sent with sendClickEvent ' + sent.name + ' (UNOMI-1037)', async ({ page }) => {
                const elementId = uniqueId('tracked-element');
                const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId }, clicked.config, sent.config, siteConfig));
                expect(context.loaded).toBe(true);
                for (const count of [1, 2, 3]) {
                    await page.click('#' + elementId);
                    expect(await events(elementId, { minCount: count })).toHaveLength(count);
                }
                await expectNoMoreEvents(elementId, 3);
                if (sent.config.clickCallback) {
                    expect(await page.evaluate(() => window.trackerTest.clickCallbacks())).toEqual({ success: 3, error: 0 });
                }
            });
        }
    }

    test('runs the site\'s own click handler once per click on a button sent with sendClickEvent (UNOMI-1046)', async ({ page }) => {
        const elementId = uniqueId('tracked-button');
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId }, siteConfig));
        expect(context.loaded).toBe(true);
        for (const count of [1, 2]) {
            await page.click('#' + elementId);
            expect(await events(elementId, { minCount: count })).toHaveLength(count);
            expect(await page.evaluate(() => window.trackerTest.siteClicks())).toBe(count);
        }
    });

    test('lets a single-page application router handle a tracked link, without reloading the page (UNOMI-1046)', async ({ page }) => {
        const elementId = uniqueId('tracked-link');
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId, clickLink: 'true', router: 'true' }, siteConfig));
        expect(context.loaded).toBe(true);
        const pageLoadId = await page.evaluate(() => window.trackerTest.pageLoadId());
        for (const count of [1, 2]) {
            await page.click('#' + elementId);
            expect(await events(elementId, { minCount: count })).toHaveLength(count);
            await expect.poll(() => page.evaluate(() => window.trackerTest.routed())).toBe(count);
        }
        expect(new URL(page.url()).pathname).toBe('/arrived');
        expect(await page.evaluate(() => window.trackerTest.pageLoadId())).toBe(pageLoadId);
    });

    for (const sent of SENT) {
        test('tracks a second click made before the first event is sent, ' + sent.name + ' (UNOMI-1037)', async ({ page }) => {
            const elementId = uniqueId('tracked-link');
            const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId, clickLink: 'hash' }, sent.config, siteConfig));
            expect(context.loaded).toBe(true);
            // Unomi does not answer until both clicks are made
            const pending = [];
            let answer;
            const answered = new Promise(resolve => {
                answer = resolve;
            });
            await page.route(UNOMI_URL + '/eventcollector', async route => {
                pending.push(route);
                await answered;
                await route.continue();
            });
            await page.click('#' + elementId);
            await page.click('#' + elementId);
            await expect.poll(() => pending.length).toBe(2);
            answer();
            expect(await events(elementId, { minCount: 2 })).toHaveLength(2);
            await expectNoMoreEvents(elementId, 2);
            if (sent.config.clickCallback) {
                expect(await page.evaluate(() => window.trackerTest.clickCallbacks())).toEqual({ success: 2, error: 0 });
            }
        });
    }

    for (const clicked of CLICKED) {
        test('calls the error callback on each click on ' + clicked.name + ' when the event cannot be sent (UNOMI-1037)', async ({ page }) => {
            const elementId = uniqueId('tracked-element');
            const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId, clickCallback: 'true' }, clicked.config, siteConfig));
            expect(context.loaded).toBe(true);
            await page.route(UNOMI_URL + '/eventcollector', route => route.abort('connectionrefused'));
            for (const count of [1, 2, 3]) {
                await page.click('#' + elementId);
                await expect.poll(() => page.evaluate(() => window.trackerTest.clickCallbacks().error)).toBe(count);
            }
            expect(await page.evaluate(() => window.trackerTest.clickCallbacks())).toEqual({ success: 0, error: 3 });
        });
    }

    test('follows a tracked link when its event cannot be sent (UNOMI-1037)', async ({ page }) => {
        const elementId = uniqueId('tracked-link');
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId, clickLink: 'true' }, siteConfig));
        expect(context.loaded).toBe(true);
        await page.route(UNOMI_URL + '/eventcollector', route => route.abort('connectionrefused'));
        await page.click('#' + elementId);
        await page.waitForURL('**/arrived', { timeout: 5000 });
    });

    test('follows a tracked link at once when Unomi could not be reached (UNOMI-1040)', async ({ page }) => {
        await page.route(UNOMI_URL + '/**', route => route.abort('connectionrefused'));
        const elementId = uniqueId('tracked-link');
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId, clickLink: 'true' }, siteConfig));
        expect(context.loaded).toBe(false);
        await page.click('#' + elementId);
        await page.waitForURL('**/arrived', { timeout: 3000 });
    });

    test('follows a tracked link at once when tracking is turned off (UNOMI-1040)', async ({ page }) => {
        const elementId = uniqueId('tracked-link');
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId, clickLink: 'true' }, siteConfig));
        expect(context.loaded).toBe(true);
        await page.evaluate(() => window.trackerTest.disableTracking());
        await page.click('#' + elementId);
        await page.waitForURL('**/arrived', { timeout: 3000 });
        expect(await events(elementId, { timeoutMs: 3000 })).toHaveLength(0);
    });

    test('opens a tracked link in a new tab with Ctrl or Cmd, and still tracks the click (UNOMI-1041)', async ({ page }) => {
        const elementId = uniqueId('tracked-link');
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ clickButton: elementId, clickLink: 'true' }, siteConfig));
        expect(context.loaded).toBe(true);
        const newTab = page.context().waitForEvent('page');
        await page.click('#' + elementId, { modifiers: ['ControlOrMeta'] });
        await newTab;
        expect(new URL(page.url()).pathname).toBe('/');
        expect(await events(elementId)).toHaveLength(1);
        await expectNoMoreEvents(elementId, 1);
    });

    test('sends the submit of a form that Unomi tracks, then lets the site handle it (UNOMI-1042)', async ({ page }) => {
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ form: FORM_NAME }, siteConfig));
        expect(context.loaded).toBe(true);
        expect(await page.evaluate(() => window.trackerTest.watchedForms())).toContain(FORM_NAME);
        // Unomi gets the form event late, so the site must not see the submit before that
        await answerEventsLate(page);
        await page.click('#submit-form');
        await page.waitForTimeout(700);
        expect(await page.evaluate(() => window.trackerTest.siteSubmits())).toEqual([]);
        const formEvents = await events(FORM_NAME, { matching: thisSession(context) });
        expect(formEvents).toHaveLength(1);
        expect(formEvents[0].eventType).toBe('form');
        // Each kind of field: the checked checkboxes and the selected options as lists, the checked
        // radio button, the text area; the empty field is left out
        expect(formEvents[0].flattenedProperties.fields).toEqual({
            email: 'tracker-test@example.com',
            topics: ['news'],
            country: 'ch',
            languages: ['fr', 'de'],
            contact: 'email',
            message: 'Hello'
        });
        // Then the site gets the submit once (not also the visitor's own), which says which button was used
        await expect.poll(() => page.evaluate(() => window.trackerTest.siteSubmits().length)).toBe(1);
        await page.waitForTimeout(1000);
        expect(await page.evaluate(() => window.trackerTest.siteSubmits())).toEqual([{ submitter: 'submit-form' }]);
        await expectNoMoreEvents(FORM_NAME, 1, { matching: thisSession(context) });
    });

    // Browsers with HTMLFormElement.requestSubmit, and older ones, where the tracker submits the form itself
    const BROWSERS = [
        { name: '', config: {} },
        { name: ', in a browser without requestSubmit', config: { oldBrowser: 'true' } }
    ];
    const BUTTONS = [
        { name: 'the button that was used', id: 'delete-form', expected: { action: ['delete'] } },
        { name: 'a button named "submit"', id: 'submit-named', expected: { submit: ['go'] } },
        { name: 'an image button', id: 'submit-image', expected: { 'pic.x': [/^\d+$/], 'pic.y': [/^\d+$/] } },
        { name: 'a button the site removes meanwhile', id: 'submit-removed', expected: { action: ['removed'] } }
    ];

    for (const browser of BROWSERS) {
        for (const button of BUTTONS) {
            test('submits a tracked form with ' + button.name + ', as a native submit does' + browser.name + ' (UNOMI-1042)', async ({ page }) => {
                const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ form: FORM_NAME, formSubmit: 'native' }, browser.config, siteConfig));
                expect(context.loaded).toBe(true);
                await page.click('#' + button.id);
                await page.waitForURL('**/submitted?**', { timeout: 5000 });
                expectSubmitted(page, button.expected);
                expect(await events(FORM_NAME, { matching: thisSession(context) })).toHaveLength(1);
            });
        }

        test('submits a tracked form with its button when the event cannot be sent' + browser.name + ' (UNOMI-1042)', async ({ page }) => {
            const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ form: FORM_NAME, formSubmit: 'native' }, browser.config, siteConfig));
            expect(context.loaded).toBe(true);
            await page.route(UNOMI_URL + '/eventcollector', route => route.abort('connectionrefused'));
            await page.click('#delete-form');
            await page.waitForURL('**/submitted?**', { timeout: 5000 });
            expectSubmitted(page, { action: ['delete'] });
        });
    }

    test('submits a tracked form at once when tracking is turned off (UNOMI-1040)', async ({ page }) => {
        const { context } = await openPage(page, LISTED_ORIGIN, Object.assign({ form: FORM_NAME, formSubmit: 'native' }, siteConfig));
        expect(context.loaded).toBe(true);
        await page.evaluate(() => window.trackerTest.disableTracking());
        await page.click('#submit-form');
        await page.waitForURL('**/submitted?**', { timeout: 3000 });
        expectSubmitted(page, { action: ['send'] });
    });
});
