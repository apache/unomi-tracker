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

const assert = require('assert');
const unomi = require('..');
const tracker = unomi.useTracker();

assert(tracker !== null);

// Requests sent by wem.ajax for a given tracker configuration
globalThis.document = { cookie: 'wem-session-id=test-session' };
globalThis.XMLHttpRequest = class {
    constructor() {
        this.withCredentials = undefined;
        this.headers = {};
    }
    open() {}
    setRequestHeader(name, value) {
        this.headers[name] = value;
    }
    send() {}
};

function requestFor(wemInitConfig) {
    const t = unomi.useTracker();
    t.initTracker({ wemInitConfig: Object.assign({ contextServerUrl: '', timeoutInMilliseconds: -1 }, wemInitConfig) });
    let sentXhr;
    const OriginalXHR = globalThis.XMLHttpRequest;
    globalThis.XMLHttpRequest = class extends OriginalXHR {
        send() {
            sentXhr = this;
        }
    };
    try {
        t.ajax({ type: 'POST', url: '/context.json', async: true, contentType: 'text/plain;charset=UTF-8' });
    } finally {
        globalThis.XMLHttpRequest = OriginalXHR;
    }
    return sentXhr;
}

function withCredentialsFor(wemInitConfig) {
    return requestFor(wemInitConfig).withCredentials;
}

assert.strictEqual(withCredentialsFor({}), true, 'credentials are sent by default');
assert.strictEqual(withCredentialsFor({ sendCredentials: true }), true, 'credentials are sent when sendCredentials is true');
assert.strictEqual(withCredentialsFor({ sendCredentials: false }), false, 'credentials are not sent when sendCredentials is false');

assert.strictEqual(requestFor({}).headers['X-Unomi-Api-Key'], undefined, 'no API key header by default');
assert.strictEqual(requestFor({ apiKey: '' }).headers['X-Unomi-Api-Key'], undefined, 'no API key header for an empty key');
assert.strictEqual(requestFor({ apiKey: 'public-key' }).headers['X-Unomi-Api-Key'], 'public-key', 'API key header is sent when apiKey is set');
assert.strictEqual(requestFor({ apiKey: 'public-key' }).headers['Content-Type'], 'text/plain;charset=UTF-8', 'other headers are unchanged');

// UNOMI-1023: crawler detection, the same result with and without Node's Buffer
const crawlerTracker = unomi.useTracker();
const edgeStrings = ['', 'abc', 'é漢字😀', '\uD800', 'a\uDC00b', '😀\uD800', 'x'.repeat(4096), 'é'.repeat(2048), 'é'.repeat(2049)];
for (let i = 0; i < 500; i++) {
    let value = '';
    for (let j = 0; j < 30; j++) {
        value += String.fromCharCode(Math.floor(Math.random() * 0x10000));
    }
    edgeStrings.push(value);
}
for (const value of edgeStrings) {
    assert.strictEqual(crawlerTracker._utf8ByteLength(value), globalThis.Buffer.byteLength(value, 'utf8'), 'UTF-8 length of ' + JSON.stringify(value));
}

const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'curl/8.4.0',
    'Googlebot/2.1 ' + 'x'.repeat(5000),
    'Googlebot/2.1 ' + 'é'.repeat(2045),
    'Googlebot/2.1 ' + 'é'.repeat(2040)
];
const withBuffer = userAgents.map(userAgent => crawlerTracker._isCrawler(userAgent));
assert.deepStrictEqual(withBuffer.slice(0, 3), [false, true, true], 'crawlers are detected');
const nodeBuffer = globalThis.Buffer;
delete globalThis.Buffer;
try {
    const withoutBuffer = userAgents.map(userAgent => crawlerTracker._isCrawler(userAgent));
    assert.strictEqual(typeof globalThis.Buffer, 'undefined', 'no Buffer is left behind');
    assert.deepStrictEqual(withoutBuffer, withBuffer, 'the same result without Buffer');
} finally {
    globalThis.Buffer = nodeBuffer;
}

// UNOMI-1024: page properties sent with events: an empty "attributes" is left out, digitalData.page is unchanged
function pagePropertiesFor(attributes) {
    const page = { pageInfo: { pageID: 'home', pageName: 'Home' }, consentTypes: [] };
    if (attributes !== undefined) {
        page.attributes = attributes;
    }
    const t = unomi.useTracker();
    t.initTracker({ scope: 'test', site: { siteInfo: { siteID: 'test' } }, page: page, events: [], wemInitConfig: { contextServerUrl: '', timeoutInMilliseconds: -1 } });
    return { page, source: t.buildSourcePage().properties, target: t.buildTargetPage().properties };
}

let pageResult = pagePropertiesFor(undefined);
assert.strictEqual(pageResult.source, pageResult.page, 'a page without attributes is sent as is');
assert.strictEqual(pageResult.target, pageResult.page, 'a page without attributes is sent as is');

pageResult = pagePropertiesFor({ color: 'blue' });
assert.strictEqual(pageResult.source, pageResult.page, 'a page with non-empty attributes is sent as is');
assert.strictEqual(pageResult.target, pageResult.page, 'a page with non-empty attributes is sent as is');

pageResult = pagePropertiesFor({});
assert.deepStrictEqual(Object.keys(pageResult.source), ['pageInfo', 'consentTypes'], 'empty attributes are left out');
assert.deepStrictEqual(Object.keys(pageResult.target), ['pageInfo', 'consentTypes'], 'empty attributes are left out');
assert.strictEqual(pageResult.source.pageInfo, pageResult.page.pageInfo, 'pageInfo is the same object');
assert.deepStrictEqual(pageResult.page.attributes, {}, 'digitalData.page keeps its attributes');

// UNOMI-1043: without timeoutInMilliseconds, the tracker uses its default instead of a timer that fires at once
function timeoutFor(timeoutInMilliseconds) {
    const t = unomi.useTracker();
    const wemInitConfig = { contextServerUrl: '' };
    if (timeoutInMilliseconds !== 'missing') {
        wemInitConfig.timeoutInMilliseconds = timeoutInMilliseconds;
    }
    t.initTracker({ wemInitConfig });
    return t.timeoutInMilliseconds;
}
assert.strictEqual(timeoutFor('missing'), 1500, 'no timeout: the default');
for (const value of [undefined, null, '', 'soon', NaN, Infinity]) {
    assert.strictEqual(timeoutFor(value), 1500, 'the default for ' + String(value));
}
assert.strictEqual(timeoutFor(3000), 3000, 'a configured timeout is kept');
assert.strictEqual(timeoutFor(-1), -1, '-1 (no timeout) is kept');
assert.strictEqual(timeoutFor('3000'), 3000, 'a number given as a string, as from an HTML attribute, is used');

// UNOMI-1037, UNOMI-1040, UNOMI-1041, UNOMI-1046: sendClickEvent, what happens to the visitor's
// click. collectEvent is replaced, so each test sends or fails the event itself; the element's
// click() runs the tracker's listener again, as browsers do for a click dispatched again.
const ELEMENTS = {
    // Clicks that leave the page
    link: { localName: 'a', hasAttribute: name => name === 'href' },
    area: { localName: 'area', hasAttribute: name => name === 'href' },
    submitButton: { localName: 'button', type: 'submit', form: {} },
    submitInput: { localName: 'input', type: 'submit', form: {} },
    imageInput: { localName: 'input', type: 'image', form: {} },
    // Clicks that do not
    linkWithoutAddress: { localName: 'a', hasAttribute: () => false },
    button: { localName: 'button', type: 'button', form: {} },
    submitButtonWithoutForm: { localName: 'button', type: 'submit', form: null },
    checkbox: { localName: 'input', type: 'checkbox', form: {} },
    div: { localName: 'div' }
};
const LEAVING = ['link', 'area', 'submitButton', 'submitInput', 'imageInput'];

function clickTracker(kind = 'link', fallback = false) {
    const t = unomi.useTracker();
    t.initTracker({ scope: 'test', site: { siteInfo: { siteID: 'test' } }, page: { pageInfo: { pageID: 'home', pageName: 'Home' }, consentTypes: [] }, events: [], wemInitConfig: { contextServerUrl: '', timeoutInMilliseconds: -1 } });
    t.fallback = fallback;
    const sent = [];
    t.collectEvent = (event, success, error) => sent.push({ event, success, error });
    const element = Object.assign({
        id: 'element',
        dispatchedAgain: [],
        click() {
            const event = clickOn(element);
            t.sendClickEvent(event);
            element.dispatchedAgain.push(event);
        }
    }, ELEMENTS[kind]);
    return { t, sent, element };
}

function clickOn(target, keys = {}) {
    const event = {
        target,
        defaultPrevented: false,
        preventDefault() {
            event.defaultPrevented = true;
        }
    };
    return Object.assign(event, keys);
}

let clicks;
let click;
for (const kind of Object.keys(ELEMENTS)) {
    const leaves = LEAVING.includes(kind);
    for (const outcome of ['success', 'error']) {
        clicks = clickTracker(kind);
        click = clickOn(clicks.element);
        clicks.t.sendClickEvent(click);
        assert.strictEqual(click.defaultPrevented, leaves, kind + ': the click is ' + (leaves ? '' : 'not ') + 'held back while its event is sent');
        assert.strictEqual(clicks.sent.length, 1, kind + ': one event is sent');
        assert.strictEqual(clicks.sent[0].event.target.itemId, 'element', kind + ': the event is on the element');
        clicks.sent[0][outcome]({});
        assert.strictEqual(clicks.element.dispatchedAgain.length, leaves ? 1 : 0, kind + ', ' + outcome + ': the click is ' + (leaves ? '' : 'not ') + 'dispatched again');
        if (leaves) {
            assert.strictEqual(clicks.element.dispatchedAgain[0].defaultPrevented, false, kind + ': the click dispatched again goes through');
        }
        assert.strictEqual(clicks.sent.length, 1, kind + ': the click dispatched again is not sent');
        assert.deepStrictEqual(clicks.t.eventsPrevented, [], kind + ': nothing is left marked');
        clicks.t.sendClickEvent(clickOn(clicks.element));
        assert.strictEqual(clicks.sent.length, 2, kind + ': the next click is sent too');
    }
}

clicks = clickTracker();
clicks.t.sendClickEvent(clickOn(clicks.element));
clicks.t.sendClickEvent(clickOn(clicks.element));
assert.strictEqual(clicks.sent.length, 2, 'a second click before the first event is sent is sent too');
clicks.sent[0].success({});
clicks.sent[1].success({});
assert.deepStrictEqual(clicks.element.dispatchedAgain.map(event => event.defaultPrevented), [false, false], 'each click is dispatched again once');

for (const kind of ['link', 'button']) {
    const callbacks = [];
    clicks = clickTracker(kind);
    for (const outcome of ['success', 'error', 'success']) {
        click = clickOn(clicks.element);
        clicks.t.sendClickEvent(click, () => callbacks.push('success'), () => callbacks.push('error'));
        assert.strictEqual(click.defaultPrevented, kind === 'link', kind + ' with callbacks: held back only if the click leaves the page');
        clicks.sent[clicks.sent.length - 1][outcome]({});
    }
    assert.strictEqual(clicks.sent.length, 3, kind + ' with callbacks: every click is sent');
    assert.deepStrictEqual(callbacks, ['success', 'error', 'success'], kind + ' with callbacks: the callback of each outcome is called');
    assert.strictEqual(clicks.element.dispatchedAgain.length, 0, kind + ' with callbacks: the site handles the click itself');
}

for (const kind of ['link', 'button']) {
    clicks = clickTracker(kind, true);
    click = clickOn(clicks.element);
    clicks.t.sendClickEvent(click);
    assert.strictEqual(click.defaultPrevented, false, kind + ' in fallback: the click goes through');
    assert.strictEqual(clicks.sent.length, 0, kind + ' in fallback: nothing is sent');
}

for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
    clicks = clickTracker();
    click = clickOn(clicks.element, { [key]: true });
    clicks.t.sendClickEvent(click);
    assert.strictEqual(click.defaultPrevented, false, 'a click with ' + key + ' goes through (new tab or window)');
    assert.strictEqual(clicks.sent.length, 1, 'a click with ' + key + ' is sent');
    clicks.sent[0].success({});
    assert.strictEqual(clicks.element.dispatchedAgain.length, 0, 'and is not dispatched again');
    click = clickOn(clicks.element, { [key]: true });
    clicks.t.sendClickEvent(click, () => {});
    assert.strictEqual(click.defaultPrevented, true, 'with a callback, a click with ' + key + ' is held back for the site');
}

clicks = clickTracker();
click = clickOn({ localName: 'a' });
clicks.t.sendClickEvent(click);
assert.strictEqual(click.defaultPrevented, false, 'an element without id or name is not tracked');
assert.strictEqual(clicks.sent.length, 0, 'and nothing is sent');

// UNOMI-1038: ids of tracked videos and links, mapped through digitalData.sourceLocalIdentifierMap
function resolveId(id, sourceLocalIdentifierMap) {
    const t = unomi.useTracker();
    t.initTracker({ sourceLocalIdentifierMap: sourceLocalIdentifierMap, wemInitConfig: { contextServerUrl: '', timeoutInMilliseconds: -1 } });
    return t._resolveId(id);
}

const idMap = { 'live-': 'default-' };
assert.strictEqual(resolveId('live-video', idMap), 'default-video', 'a mapped part at the start of the id');
assert.strictEqual(resolveId('page-live-video', idMap), 'page-default-video', 'a mapped part inside the id');
assert.strictEqual(resolveId('other-video', idMap), 'other-video', 'an id without a mapped part is unchanged');
assert.strictEqual(resolveId('live-video', undefined), 'live-video', 'no map, no change');

console.log('Tests passed');