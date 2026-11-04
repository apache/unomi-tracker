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

// Checks the tracker in the real Safari of this Mac, where Playwright's WebKit can differ (popup
// blocking, how long a click counts as the visitor's own, cookies). Safari is driven through
// safaridriver (WebDriver), whose clicks are real user clicks. Unomi is simulated here, so no
// Docker is needed: it can answer, answer late, never answer, or refuse connections, and it
// counts the events it gets.
//
//   yarn test:safari                         the current build (dist), built first
//   yarn test:safari --tracker <file>        another build of apache-unomi-tracker.umd.js
//   yarn test:safari --only <text>           only the checks whose question contains the text
//
// Once, on the Mac: `sudo safaridriver --enable`, then in Safari, Settings > Advanced > Show
// features for web developers, and Develop > Allow Remote Automation.
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

const DRIVER_PORT = 4445;
const UNOMI_PORT = 8282;
const UNOMI = 'http://localhost:' + UNOMI_PORT;
const SITE = 'http://localhost:8000';
const FORM_NAME = 'tracker-test-form';
const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';
const KEYS = { meta: '' };

const args = process.argv.slice(2);
const trackerArg = args.indexOf('--tracker');
const trackerFile = trackerArg !== -1 ? path.resolve(args[trackerArg + 1]) : null;
const onlyArg = args.indexOf('--only');
const only = onlyArg !== -1 ? args[onlyArg + 1].toLowerCase() : null;

// --- Simulated Unomi -------------------------------------------------------------------------

const unomi = { mode: 'answer', delayMs: 0, events: [], requests: [] };

function corsHeaders(request) {
    return {
        'Access-Control-Allow-Origin': request.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, X-Unomi-Api-Key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
}

const unomiServer = http.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
        response.writeHead(204, corsHeaders(request)).end();
        return;
    }
    let body = '';
    request.on('data', chunk => body += chunk);
    request.on('end', () => {
        const url = new URL(request.url, UNOMI);
        unomi.requests.push(request.method + ' ' + url.pathname + (url.pathname === '/eventcollector' ? ' (' + unomi.mode + ')' : ''));
        if (url.pathname === '/context.json') {
            response.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, corsHeaders(request)));
            response.end(JSON.stringify({
                profileId: 'safari-profile',
                sessionId: 'safari-session',
                trackedConditions: [{ type: 'formEventCondition', parameterValues: { formId: FORM_NAME } }]
            }));
            return;
        }
        if (url.pathname === '/eventcollector') {
            if (unomi.mode === 'refuse') {
                request.socket.destroy();
                return;
            }
            if (unomi.mode === 'never') {
                return;
            }
            const answer = () => {
                try {
                    unomi.events.push(...JSON.parse(body).events);
                } catch (e) {
                    // not an event list
                }
                response.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, corsHeaders(request)));
                response.end('{}');
            };
            setTimeout(answer, unomi.delayMs);
            return;
        }
        response.writeHead(404, corsHeaders(request)).end();
    });
});

function setUnomi(mode, delayMs = 0) {
    unomi.mode = mode;
    unomi.delayMs = delayMs;
    unomi.events = [];
    unomi.requests = [];
}

// --- WebDriver ---------------------------------------------------------------------------------

let session;

async function driver(method, endpoint, body) {
    const response = await fetch('http://localhost:' + DRIVER_PORT + endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(method + ' ' + endpoint + ': ' + JSON.stringify(result.value));
    }
    return result.value;
}

const safari = {
    open: url => driver('POST', '/session/' + session + '/url', { url }),
    url: () => driver('GET', '/session/' + session + '/url'),
    run: (script, ...scriptArgs) => driver('POST', '/session/' + session + '/execute/sync', { script, args: scriptArgs }),
    runAsync: (script, ...scriptArgs) => driver('POST', '/session/' + session + '/execute/async', { script, args: scriptArgs }),
    find: async selector => (await driver('POST', '/session/' + session + '/element', { using: 'css selector', value: selector }))[ELEMENT],
    click: async selector => driver('POST', '/session/' + session + '/element/' + await safari.find(selector) + '/click', {}),
    clickWithKey: async (selector, key) => {
        const element = await safari.find(selector);
        await driver('POST', '/session/' + session + '/actions', {
            actions: [
                { type: 'key', id: 'keyboard', actions: [{ type: 'keyDown', value: key }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'keyUp', value: key }] },
                { type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', origin: { [ELEMENT]: element }, x: 0, y: 0 }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }, { type: 'pause', duration: 0 }] }
            ]
        });
        await driver('DELETE', '/session/' + session + '/actions');
    },
    windows: () => driver('GET', '/session/' + session + '/window/handles'),
    switchTo: handle => driver('POST', '/session/' + session + '/window', { handle }),
    closeWindow: () => driver('DELETE', '/session/' + session + '/window')
};

async function closeOtherWindows(keep) {
    for (const handle of await safari.windows()) {
        if (handle !== keep) {
            await safari.switchTo(handle);
            await safari.closeWindow();
        }
    }
    await safari.switchTo(keep);
}

// --- Checks ------------------------------------------------------------------------------------

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(condition, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const value = await condition();
        if (value || Date.now() > deadline) {
            return value;
        }
        await sleep(100);
    }
}

// Opens the test page with the given options and waits for the tracker to load the context. It
// starts from a blank page, and waits for the test page itself: a navigation left over from the
// previous check (a link followed late) must not land on this one.
async function openPage(params) {
    await safari.open('about:blank');
    await sleep(500);
    const query = new URLSearchParams(Object.assign({ unomi: UNOMI, sessionId: 'safari-session-' + Date.now() }, params));
    const url = SITE + '/?' + query;
    await safari.open(url);
    const ready = await waitFor(async () => await safari.url() === url && await safari.run('return !!(window.trackerTest && window.trackerTest.context);'), 5000);
    if (!ready) {
        throw new Error('The test page did not load: at ' + await safari.url());
    }
    // Keep what the tracker logs from now on, to explain a failure
    await safari.run(`window.trackerLogs = [];
        ['debug', 'info', 'log', 'warn', 'error'].forEach(level => {
            const original = console[level];
            console[level] = function () {
                window.trackerLogs.push(level + ': ' + Array.prototype.join.call(arguments, ' '));
                return original.apply(console, arguments);
            };
        });`);
    return safari.runAsync('const done = arguments[arguments.length - 1]; window.trackerTest.context.then(done);');
}

const pathOf = async () => new URL(await safari.url()).pathname;
const eventsOn = targetId => unomi.events.filter(event => event.target && event.target.itemId === targetId);

const checks = [
    {
        question: 'A tracked link is followed once its event is sent',
        async run() {
            setUnomi('answer', 300);
            await openPage({ clickButton: 'link', clickLink: 'true' });
            await safari.click('#link');
            const arrived = await waitFor(async () => await pathOf() === '/arrived', 5000);
            return { ok: arrived && eventsOn('link').length === 1, details: 'followed: ' + arrived + ', events: ' + eventsOn('link').length };
        }
    },
    {
        question: 'A click on an image or text inside a tracked link is tracked, and the link followed',
        async run() {
            setUnomi('answer', 300);
            await openPage({ clickButton: 'link', clickLink: 'true', clickChild: 'plain' });
            await safari.click('#link .tracked-child');
            const arrived = await waitFor(async () => await pathOf() === '/arrived', 5000);
            return { ok: arrived && eventsOn('link').length === 1, details: 'followed: ' + arrived + ', events on the link: ' + eventsOn('link').length };
        }
    },
    {
        question: 'A link to a new tab opens it while Unomi is slow (3s), with no popup blocked',
        async run(main) {
            setUnomi('answer', 3000);
            await openPage({ clickButton: 'blank', clickLink: 'blank' });
            const before = (await safari.windows()).length;
            await safari.click('#blank');
            const opened = await waitFor(async () => (await safari.windows()).length > before, 5000);
            await waitFor(async () => eventsOn('blank').length === 1, 5000);
            await closeOtherWindows(main);
            return { ok: opened && eventsOn('blank').length === 1, details: 'new tab: ' + opened + ', events: ' + eventsOn('blank').length };
        }
    },
    {
        question: 'Cmd+click on a tracked link opens a new tab and keeps the page',
        async run(main) {
            setUnomi('answer', 300);
            await openPage({ clickButton: 'link', clickLink: 'true' });
            const before = (await safari.windows()).length;
            await safari.clickWithKey('#link', KEYS.meta);
            const opened = await waitFor(async () => (await safari.windows()).length > before, 3000);
            const stayed = await pathOf() === '/';
            await waitFor(async () => eventsOn('link').length === 1, 3000);
            await closeOtherWindows(main);
            return { ok: opened && stayed && eventsOn('link').length === 1, details: 'new tab: ' + opened + ', page kept: ' + stayed + ', events: ' + eventsOn('link').length };
        }
    },
    {
        question: 'A single-page application router (on the document) handles a tracked link without a reload',
        async run() {
            setUnomi('answer', 300);
            await openPage({ clickButton: 'link', clickLink: 'true', router: 'true' });
            const loadId = await safari.run('return window.trackerTest.pageLoadId();');
            await safari.click('#link');
            const routed = await waitFor(() => safari.run('return window.trackerTest.routed();'), 5000);
            const sameLoad = await safari.run('return window.trackerTest.pageLoadId();') === loadId;
            return { ok: routed === 1 && sameLoad, details: 'routed: ' + routed + ', no reload: ' + sameLoad };
        }
    },
    {
        question: 'A router on the link itself (as Vue Router) handles each click once',
        async run() {
            setUnomi('answer', 300);
            await openPage({ clickButton: 'link', clickLink: 'true', router: 'link' });
            await safari.click('#link');
            await waitFor(async () => eventsOn('link').length === 1, 3000);
            await sleep(700);
            const routed = await safari.run('return window.trackerTest.routed();');
            return { ok: routed === 1, details: 'routed: ' + routed };
        }
    },
    {
        question: 'A site click handler on a tracked button runs once per click',
        async run() {
            setUnomi('answer', 300);
            await openPage({ clickButton: 'button' });
            await safari.click('#button');
            await waitFor(async () => eventsOn('button').length === 1, 3000);
            await sleep(500);
            const handled = await safari.run('return window.trackerTest.siteClicks();');
            return { ok: handled === 1, details: 'site handler runs: ' + handled };
        }
    },
    {
        question: 'A link is followed at once when Unomi could not be reached',
        async run() {
            setUnomi('refuse');
            const context = await openPage({ clickButton: 'link', clickLink: 'true', unomi: 'http://localhost:1' });
            await safari.click('#link');
            const arrived = await waitFor(async () => await pathOf() === '/arrived', 3000);
            return { ok: !context.loaded && arrived, details: 'context loaded: ' + context.loaded + ', followed: ' + arrived };
        }
    },
    {
        question: 'A link is followed within 1.5s when Unomi never answers and there is no timeout',
        async run() {
            setUnomi('never');
            await openPage({ clickButton: 'link', clickLink: 'true', timeout: '-1' });
            const start = Date.now();
            await safari.click('#link');
            const arrived = await waitFor(async () => await pathOf() === '/arrived', 5000);
            const elapsed = Date.now() - start;
            return { ok: arrived && elapsed >= 1400, details: 'followed: ' + arrived + ' after ' + elapsed + 'ms' };
        }
    },
    ...[
        { name: 'its button', button: 'delete-form', expect: { action: 'delete' } },
        { name: 'a button named "submit"', button: 'submit-named', expect: { submit: 'go' } },
        { name: 'an image button', button: 'submit-image', expect: { 'pic.x': /^\d+$/ } }
    ].flatMap(form => [false, true].map(oldBrowser => ({
        question: 'A tracked form is submitted with ' + form.name + (oldBrowser ? ', without requestSubmit' : ''),
        async run() {
            setUnomi('answer', 300);
            await openPage(Object.assign({ form: FORM_NAME, formSubmit: 'native' }, oldBrowser ? { oldBrowser: 'true' } : {}));
            await safari.click('#' + form.button);
            const submitted = await waitFor(async () => await pathOf() === '/submitted', 5000);
            const sent = new URL(await safari.url()).searchParams;
            const fields = Object.keys(form.expect).every(name => {
                const value = sent.get(name);
                return value !== null && (form.expect[name] instanceof RegExp ? form.expect[name].test(value) : value === form.expect[name]);
            });
            const formEvents = unomi.events.filter(event => event.eventType === 'form').length;
            return { ok: submitted && fields && formEvents === 1, details: 'submitted: ' + submitted + ', ' + sent.toString() + ', form events: ' + formEvents };
        }
    }))),
    {
        question: 'Safari has requestSubmit and SubmitEvent',
        async run() {
            await openPage({});
            const support = await safari.run('return { requestSubmit: typeof HTMLFormElement.prototype.requestSubmit, SubmitEvent: typeof SubmitEvent };');
            return { ok: support.requestSubmit === 'function' && support.SubmitEvent === 'function', details: JSON.stringify(support) };
        }
    }
];

// --- Run ---------------------------------------------------------------------------------------

async function main() {
    const root = path.join(__dirname, '..', '..');
    if (!trackerFile && spawnSync('yarn', ['build'], { cwd: root, stdio: 'inherit' }).status !== 0) {
        process.exit(1);
    }
    const env = Object.assign({}, process.env, trackerFile ? { TRACKER_FILE: trackerFile } : {});
    const page = spawn('node', [path.join(__dirname, 'serve.js')], { env, stdio: 'ignore' });
    const safaridriver = spawn('/usr/bin/safaridriver', ['-p', String(DRIVER_PORT)], { stdio: 'ignore' });
    await new Promise(resolve => unomiServer.listen(UNOMI_PORT, resolve));
    const stop = () => {
        page.kill();
        safaridriver.kill();
        unomiServer.close();
    };
    try {
        await sleep(1500);
        try {
            session = (await driver('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'safari' } } })).sessionId;
        } catch (e) {
            console.error('Could not start Safari through safaridriver: ' + e.message);
            console.error('Once: `sudo safaridriver --enable`, then Safari > Develop > Allow Remote Automation.');
            process.exitCode = 2;
            return;
        }
        const mainWindow = (await safari.windows())[0];
        console.log('Tracker: ' + (trackerFile || 'dist/apache-unomi-tracker.umd.js') + '\n');
        let failed = 0;
        const selected = checks.filter(check => !only || check.question.toLowerCase().includes(only));
        for (const check of selected) {
            let result;
            try {
                result = await check.run(mainWindow);
            } catch (e) {
                result = { ok: false, details: e.message };
            }
            failed += result.ok ? 0 : 1;
            console.log((result.ok ? 'PASS ' : 'FAIL ') + check.question + '\n     ' + result.details);
            if (!result.ok) {
                // What happened, to tell a tracker problem from a test or browser one
                console.log('     Unomi got: ' + (unomi.requests.join(', ') || 'nothing'));
                try {
                    console.log('     page: ' + await safari.url());
                    const logs = await safari.run('return window.trackerLogs || null;');
                    console.log('     tracker logs: ' + (logs ? logs.filter(line => line.includes('[WEM]')).join(' | ') || 'none' : 'not on this page (it was left)'));
                } catch (e) {
                    console.log('     page: unavailable (' + e.message + ')');
                }
            }
        }
        console.log('\n' + (selected.length - failed) + ' of ' + selected.length + ' passed');
        process.exitCode = failed ? 1 : 0;
        await driver('DELETE', '/session/' + session);
    } finally {
        stop();
    }
}

if (!fs.existsSync('/usr/bin/safaridriver')) {
    console.error('safaridriver not found: these checks run on macOS, with Safari');
    process.exit(2);
}
main().catch(e => {
    console.error(e);
    process.exit(1);
});
