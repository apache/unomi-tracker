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

// What each Unomi server under test is, and how to set it up and query it.
const UNOMI_URL = process.env.UNOMI_URL || 'http://localhost:8181';
const SCOPE = 'tracker-test';

// Tracker 1.x supports Unomi 2.x and 3.x, which have no tenants and accept cookies from any origin.
// Unomi 2.0 to 2.3 accept an empty page "attributes"; 2.4 removed it from the page schema (UNOMI-790).
const TARGETS = {
    'unomi2-legacy': { admin: 'karaf:karaf' },
    'unomi2': { admin: 'karaf:karaf' },
    'unomi3': { admin: 'karaf:karaf' }
};

function target(name) {
    const config = TARGETS[name];
    if (!config) {
        throw new Error('Unknown target "' + name + '", expected one of: ' + Object.keys(TARGETS).join(', '));
    }
    return Object.assign({ name: name }, config);
}

function basic(credentials) {
    return 'Basic ' + Buffer.from(credentials).toString('base64');
}

async function request(method, path, { credentials, body, headers, allowNotFound } = {}) {
    const response = await fetch(UNOMI_URL + path, {
        method: method,
        headers: Object.assign(
            { 'Content-Type': 'application/json' },
            credentials ? { Authorization: basic(credentials) } : {},
            headers || {}),
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    if (allowNotFound && (response.status === 404 || response.status === 204)) {
        return undefined;
    }
    if (!response.ok) {
        throw new Error(method + ' ' + path + ' answered ' + response.status + ': ' + text.slice(0, 300));
    }
    return text ? JSON.parse(text) : undefined;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Waits until the server answers context.json.
async function waitForServer(timeoutMs = 300000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        try {
            const response = await fetch(UNOMI_URL + '/cxs/context.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: 'tracker-test-probe' })
            });
            if (response.status === 200) {
                return;
            }
        } catch (e) {
            // not listening yet
        }
        if (Date.now() > deadline) {
            throw new Error('Unomi did not start at ' + UNOMI_URL + ' within ' + timeoutMs / 1000 + 's');
        }
        await sleep(3000);
    }
}

// Retries a setup call while the server is still starting its services.
async function retry(action, timeoutMs = 120000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        try {
            return await action();
        } catch (e) {
            if (Date.now() > deadline) {
                throw e;
            }
            await sleep(3000);
        }
    }
}

// The endpoints the tests use answer. A starting server registers its endpoints one by one, and can
// remove and add them again while it starts, so a single answer is not enough. The event collector
// refuses an empty list of events (400), which shows it is there without storing anything.
async function endpointsAnswer(credentials) {
    const probe = { sessionId: 'tracker-test-probe', events: [] };
    const post = (path, body, headers) => fetch(UNOMI_URL + path, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify(body)
    });
    const context = await post('/cxs/context.json', probe);
    const collector = await post('/cxs/eventcollector', probe);
    const search = await post('/cxs/events/search', { limit: 1 }, { Authorization: basic(credentials) });
    return context.status === 200 && (collector.status === 200 || collector.status === 400) && search.status === 200;
}

// Waits until the server has kept answering for a while: STABLE_ROUNDS checks in a row, 2s apart.
const STABLE_ROUNDS = 5;
async function waitUntilStable(credentials, timeoutMs = 180000) {
    const deadline = Date.now() + timeoutMs;
    let rounds = 0;
    let lastProblem = 'no check yet';
    while (rounds < STABLE_ROUNDS) {
        let ok = false;
        try {
            if (await endpointsAnswer(credentials)) {
                ok = true;
            } else {
                lastProblem = 'an endpoint did not answer as expected';
            }
        } catch (e) {
            // not answering yet
            lastProblem = String(e);
        }
        rounds = ok ? rounds + 1 : 0;
        if (Date.now() > deadline) {
            throw new Error('Unomi did not answer steadily at ' + UNOMI_URL + ' within ' + timeoutMs / 1000 + 's (last problem: ' + lastProblem + ')');
        }
        await sleep(2000);
    }
}

// Creates the scope if it is missing, and waits until the server returns it.
async function ensureScope(credentials) {
    await retry(async () => {
        let scope = await request('GET', '/cxs/scopes/' + SCOPE, { credentials: credentials, allowNotFound: true });
        if (!scope) {
            await request('POST', '/cxs/scopes', {
                credentials: credentials,
                body: { itemId: SCOPE, metadata: { id: SCOPE, name: 'Tracker test' } }
            });
            console.log('Created scope ' + SCOPE);
            scope = await request('GET', '/cxs/scopes/' + SCOPE, { credentials: credentials, allowNotFound: true });
        }
        if (!scope || scope.itemId !== SCOPE) {
            throw new Error('Scope ' + SCOPE + ' is not available yet');
        }
    });
}

// A rule on the submits of the test form. Unomi returns its condition to the tracker in the
// "tracked conditions" of the context, which is how the tracker knows which forms to watch.
const FORM_NAME = 'tracker-test-form';
async function ensureFormRule(credentials) {
    await request('POST', '/cxs/rules', {
        credentials: credentials,
        body: {
            metadata: { id: 'tracker-test-form-rule', name: 'Tracker test form', scope: SCOPE, enabled: true },
            condition: { type: 'formEventCondition', parameterValues: { formId: FORM_NAME } },
            actions: [{ type: 'setPropertyAction', parameterValues: { setPropertyName: 'properties.trackerTestForm', setPropertyValue: 'sent', setPropertyStrategy: 'alwaysSet' } }]
        }
    });
    // Rules are loaded in the background: wait until the context returns the condition
    await retry(async () => {
        const context = await request('POST', '/cxs/context.json', {
            body: { sessionId: 'tracker-test-probe', source: { scope: SCOPE, itemType: 'page', itemId: 'tracker-test-page' } }
        });
        const tracked = (context.trackedConditions || []).some(condition => condition.parameterValues && condition.parameterValues.formId === FORM_NAME);
        if (!tracked) {
            throw new Error('The form rule is not in the tracked conditions yet');
        }
    });
}

// Prepares the server before the tests: the scope that the tracker events use, and the rule that
// makes the tracker watch the test form. Returns the credentials that can read the events.
async function setUp(t) {
    await waitForServer();
    await ensureScope(t.admin);
    await waitUntilStable(t.admin);
    await ensureFormRule(t.admin);
    console.log('Server ready: ' + t.name + ', scope ' + SCOPE);
    return { credentials: t.admin };
}

// Polls until at least minCount events on the given target are indexed, and returns them, newest
// first. Only the 10 newest events on the target are read; with "matching", only those it accepts
// count and are returned (a server kept from an earlier run can hold events on the same target).
// After timeoutMs it returns what it found, which can be fewer than minCount.
async function findEvents(credentials, targetId, { timeoutMs = 15000, minCount = 1, matching = () => true } = {}) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = await request('POST', '/cxs/events/search', {
            credentials: credentials,
            body: {
                limit: 10,
                sortby: 'timeStamp:desc',
                condition: {
                    type: 'eventPropertyCondition',
                    parameterValues: { propertyName: 'target.itemId', comparisonOperator: 'equals', propertyValue: targetId }
                }
            }
        });
        const events = (result.list || []).filter(matching);
        if (events.length >= minCount || Date.now() > deadline) {
            return events;
        }
        await sleep(1000);
    }
}

module.exports = { UNOMI_URL, TARGETS, FORM_NAME, target, setUp, findEvents };
