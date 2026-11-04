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

globalThis.document = { cookie: 'wem-session-id=test-session' };

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

// UNOMI-1043: without a usable timeoutInMilliseconds, the tracker uses its default instead of a timer
// that fires at once
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
for (const value of [undefined, null, '', '  ', 'soon', NaN, Infinity, 0, -5, '0']) {
    assert.strictEqual(timeoutFor(value), 1500, 'the default for ' + JSON.stringify(String(value)));
}
assert.strictEqual(timeoutFor(3000), 3000, 'a configured timeout is kept');
assert.strictEqual(timeoutFor(-1), -1, '-1 (no timeout) is kept');
assert.strictEqual(timeoutFor('3000'), 3000, 'a number given as a string, as from an HTML attribute, is used');
assert.strictEqual(timeoutFor('-1'), -1, '-1 given as a string is kept');

// UNOMI-1037, UNOMI-1040, UNOMI-1041, UNOMI-1046, UNOMI-1047: sendClickEvent, what happens to the
// visitor's click. Fake elements have attributes and a parent; click() runs the tracker's listener on
// the tracked element as a browser does (currentTarget is the tracked element, target the clicked
// one). collectEvent is replaced, so each test sends or fails the event itself.
function fakeElement(localName, attributes = {}, properties = {}) {
    const element = Object.assign({
        localName,
        parentElement: null,
        getAttribute: name => Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null,
        hasAttribute: name => Object.prototype.hasOwnProperty.call(attributes, name)
    }, properties);
    if (attributes.id) {
        element.id = attributes.id;
    }
    return element;
}

const FORM = fakeElement('form');
const ELEMENTS = {
    // Clicks that leave the page
    link: () => fakeElement('a', { href: '/next' }),
    linkToTop: () => fakeElement('a', { href: '/next', target: '_top' }),
    area: () => fakeElement('area', { href: '/next' }),
    submitButton: () => fakeElement('button', {}, { type: 'submit', form: FORM }),
    submitInput: () => fakeElement('input', {}, { type: 'submit', form: FORM }),
    imageInput: () => fakeElement('input', {}, { type: 'image', form: FORM }),
    // Clicks that do not
    linkWithoutAddress: () => fakeElement('a'),
    linkToFragment: () => fakeElement('a', { href: '#part' }),
    linkToScript: () => fakeElement('a', { href: 'javascript:void(0)' }),
    linkToNewTab: () => fakeElement('a', { href: '/next', target: '_blank' }),
    download: () => fakeElement('a', { href: '/file.pdf', download: '' }),
    submitButtonToNewTab: () => fakeElement('button', { formtarget: '_blank' }, { type: 'submit', form: FORM }),
    button: () => fakeElement('button', {}, { type: 'button', form: FORM }),
    submitButtonWithoutForm: () => fakeElement('button', {}, { type: 'submit', form: null }),
    checkbox: () => fakeElement('input', {}, { type: 'checkbox', form: FORM }),
    div: () => fakeElement('div')
};
const LEAVING = ['link', 'linkToTop', 'area', 'submitButton', 'submitInput', 'imageInput'];

function clickTracker(kind = 'link', { fallback = false, timeout = 10000 } = {}) {
    const t = unomi.useTracker();
    t.initTracker({ scope: 'test', site: { siteInfo: { siteID: 'test' } }, page: { pageInfo: { pageID: 'home', pageName: 'Home' }, consentTypes: [] }, events: [], wemInitConfig: { contextServerUrl: '', timeoutInMilliseconds: timeout } });
    t.fallback = fallback;
    const sent = [];
    t.collectEvent = (event, success, error) => sent.push({ event, success, error });
    const element = ELEMENTS[kind]();
    element.id = 'element';
    element.dispatchedAgain = [];
    element.click = () => {
        const event = clickOn(element);
        t.sendClickEvent(event);
        element.dispatchedAgain.push(event);
    };
    return { t, sent, element };
}

// A click on clicked, seen by the tracker's listener on listening (the clicked element by default)
function clickOn(clicked, keys = {}, listening = clicked) {
    const event = {
        target: clicked,
        currentTarget: listening,
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
        clicks.sent[0][outcome === 'success' ? 'error' : 'success']({});
        assert.strictEqual(clicks.element.dispatchedAgain.length, leaves ? 1 : 0, kind + ': a second outcome for the same click does nothing');
        clicks.t.sendClickEvent(clickOn(clicks.element));
        assert.strictEqual(clicks.sent.length, 2, kind + ': the next click is sent too');
    }
}

// An image, an icon or some text inside the tracked link or button (UNOMI-1047)
for (const childId of [undefined, 'icon']) {
    for (const kind of ['link', 'submitButton', 'button']) {
        clicks = clickTracker(kind);
        const child = fakeElement('img', childId ? { id: childId } : {});
        child.parentElement = clicks.element;
        child.dispatchedAgain = 0;
        child.click = () => {
            child.dispatchedAgain++;
            clicks.t.sendClickEvent(clickOn(child, {}, clicks.element));
        };
        click = clickOn(child, {}, clicks.element);
        clicks.t.sendClickEvent(click);
        const leaves = kind !== 'button';
        const label = kind + ' with a child ' + (childId ? 'with' : 'without') + ' an id';
        assert.strictEqual(clicks.sent.length, 1, label + ': the click is sent');
        assert.strictEqual(clicks.sent[0].event.target.itemId, 'element', label + ': on the tracked element');
        assert.strictEqual(click.defaultPrevented, leaves, label + ': held back as for the element itself');
        clicks.sent[0].success({});
        assert.strictEqual(child.dispatchedAgain, leaves ? 1 : 0, label + ': dispatched again on the clicked child');
        assert.strictEqual(clicks.sent.length, 1, label + ': the click dispatched again is not sent');
    }
}

// Called from a listener on the document: the clicked element is tracked, as before
clicks = clickTracker();
click = clickOn(clicks.element, {}, { nodeType: 9 });
clicks.t.sendClickEvent(click);
assert.strictEqual(clicks.sent.length, 1, 'from a listener on the document, the click is sent');
assert.strictEqual(clicks.sent[0].event.target.itemId, 'element', 'on the clicked element');
assert.strictEqual(click.defaultPrevented, true, 'and held back');

// A click the site already prevented (a router on the link, registered first) is the site's
clicks = clickTracker();
click = clickOn(clicks.element, { defaultPrevented: true });
clicks.t.sendClickEvent(click);
assert.strictEqual(clicks.sent.length, 1, 'a click the site prevented is sent');
clicks.sent[0].success({});
assert.strictEqual(clicks.element.dispatchedAgain.length, 0, 'and not dispatched again');

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
    clicks = clickTracker(kind, { fallback: true });
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

// When sending the event throws at once, the click goes on, or the error callback is called
clicks = clickTracker();
clicks.t.collectEvent = () => {
    throw new Error('cannot send');
};
click = clickOn(clicks.element);
clicks.t.sendClickEvent(click);
assert.strictEqual(click.defaultPrevented, true, 'when sending throws, the click was held back');
assert.strictEqual(clicks.element.dispatchedAgain.length, 0, 'not dispatched again during the visitor\'s click');
let thrownErrors = 0;
clicks.t.sendClickEvent(clickOn(clicks.element), () => {}, () => thrownErrors++);
const throwing = clicks;
setTimeout(() => {
    assert.strictEqual(throwing.element.dispatchedAgain.length, 1, 'dispatched again right after it');
    assert.strictEqual(thrownErrors, 1, 'with callbacks, the error callback is called');
}, 0);

clicks = clickTracker();
click = clickOn(fakeElement('a', { href: '/next' }));
clicks.t.sendClickEvent(click);
assert.strictEqual(click.defaultPrevented, false, 'an element without id or name is not tracked');
assert.strictEqual(clicks.sent.length, 0, 'and nothing is sent');

// Without a request timeout (-1), a held back click goes on after 1.5s at most, once
const noAnswer = clickTracker('link', { timeout: -1 });
noAnswer.t.sendClickEvent(clickOn(noAnswer.element));
assert.strictEqual(noAnswer.element.dispatchedAgain.length, 0, 'without a timeout, the click is held back at first');
setTimeout(() => {
    assert.strictEqual(noAnswer.element.dispatchedAgain.length, 0, 'still held back after 1s');
}, 1000);
setTimeout(() => {
    assert.strictEqual(noAnswer.element.dispatchedAgain.length, 1, 'dispatched again after 1.5s');
    noAnswer.sent[0].success({});
    assert.strictEqual(noAnswer.element.dispatchedAgain.length, 1, 'a late answer from Unomi does not dispatch it again');
    // The last check, which runs after all the others
    console.log('Tests passed');
}, 1700);

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
