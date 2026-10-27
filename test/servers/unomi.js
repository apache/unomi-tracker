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
const ROOT_PASSWORD = process.env.UNOMI_ROOT_PASSWORD || 'tracker-test-root';
const TENANT_ID = 'tracker-test';
const SCOPE = 'tracker-test';

// Unomi 2.x and 3.x have no tenants and accept cookies from any origin.
// Unomi 4 only accepts cookies from listed origins (here http://localhost:8000, not http://localhost:8001).
// Unomi 2.0 to 2.3 accept an empty page "attributes"; 2.4 removed it from the page schema (UNOMI-790).
const TARGETS = {
    'unomi2-legacy': { major: 2, multiTenant: false, admin: 'karaf:karaf' },
    'unomi2': { major: 2, multiTenant: false, admin: 'karaf:karaf' },
    'unomi3': { major: 3, multiTenant: false, admin: 'karaf:karaf' },
    'unomi4': { major: 4, multiTenant: true, admin: 'karaf:' + ROOT_PASSWORD },
    'unomi4-compat': { major: 4, multiTenant: false, admin: 'karaf:' + ROOT_PASSWORD }
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

// Waits until the server answers context.json; Unomi 4 multi-tenant answers 401 without a key.
async function waitForServer(timeoutMs = 300000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        try {
            const response = await fetch(UNOMI_URL + '/cxs/context.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: 'tracker-test-probe' })
            });
            if (response.status === 200 || response.status === 401) {
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

// The tenant a server stores the tracker data in: the test tenant on Unomi 4 multi-tenant,
// tenant "default" in compatibility mode, none on Unomi 2.x and 3.x.
function tenantOf(t) {
    if (t.major < 4) {
        return undefined;
    }
    return t.multiTenant ? TENANT_ID : 'default';
}

// Creates the tenant if it is missing, and checks that it is active.
async function ensureTenant(t, tenantId) {
    await retry(async () => {
        let tenant = await request('GET', '/cxs/tenants/' + tenantId, { credentials: t.admin, allowNotFound: true });
        if (!tenant) {
            tenant = await request('POST', '/cxs/tenants', {
                credentials: t.admin,
                body: { requestedId: tenantId, properties: { name: tenantId } }
            });
            console.log('Created tenant ' + tenantId);
        }
        if (tenant.status !== 'ACTIVE') {
            throw new Error('Tenant ' + tenantId + ' is ' + tenant.status);
        }
    });
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

// Prepares the server before the tests: the tenant and its keys on Unomi 4, then the scope that
// the tracker events use. Returns the tenant public key (Unomi 4 multi-tenant only) and the
// credentials that can read the events.
async function setUp(t) {
    await waitForServer();
    const tenantId = tenantOf(t);
    let publicKey;
    let credentials = t.admin;
    if (tenantId) {
        await ensureTenant(t, tenantId);
    }
    if (t.multiTenant) {
        // Keys can only be read when they are generated, so generate new ones for this run
        const key = async type => (await request('POST', '/cxs/tenants/' + tenantId + '/apikeys?type=' + type, { credentials: t.admin })).plainTextKey;
        publicKey = await key('PUBLIC');
        credentials = tenantId + ':' + await key('PRIVATE');
        console.log('Tenant ' + tenantId + ' public key: ' + publicKey);
    }
    // In compatibility mode, administrator requests work on tenant "default"
    await ensureScope(credentials);
    console.log('Server ready: ' + t.name + (tenantId ? ', tenant ' + tenantId : '') + ', scope ' + SCOPE);
    return { publicKey: publicKey, credentials: credentials };
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

module.exports = { UNOMI_URL, TARGETS, target, tenantOf, setUp, findClickEvents };
