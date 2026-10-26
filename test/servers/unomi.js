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

// Prepares the server before the tests: the scope that the tracker events use.
// Returns the credentials that can read the events.
async function setUp(t) {
    await waitForServer();
    await ensureScope(t.admin);
    console.log('Server ready: ' + t.name + ', scope ' + SCOPE);
    return { credentials: t.admin };
}

// Polls until click events on the given target are indexed, and returns them.
async function findClickEvents(credentials, targetId, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = await request('POST', '/cxs/events/search', {
            credentials: credentials,
            body: {
                limit: 10,
                condition: {
                    type: 'eventPropertyCondition',
                    parameterValues: { propertyName: 'target.itemId', comparisonOperator: 'equals', propertyValue: targetId }
                }
            }
        });
        if ((result.list && result.list.length > 0) || Date.now() > deadline) {
            return result.list || [];
        }
        await sleep(1000);
    }
}

module.exports = { UNOMI_URL, TARGETS, target, setUp, findClickEvents };
