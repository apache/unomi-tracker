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

// Crawler detection: the same result with and without Node's Buffer
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

// Page properties sent with events: an empty "attributes" is left out, digitalData.page is unchanged
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

console.log('Tests passed');