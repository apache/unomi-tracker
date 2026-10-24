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

// sendCredentials controls xhr.withCredentials
globalThis.document = { cookie: 'wem-session-id=test-session' };
globalThis.XMLHttpRequest = class {
    constructor() {
        this.withCredentials = undefined;
    }
    open() {}
    setRequestHeader() {}
    send() {}
};

function withCredentialsFor(wemInitConfig) {
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
        t.ajax({ type: 'POST', url: '/context.json', async: true });
    } finally {
        globalThis.XMLHttpRequest = OriginalXHR;
    }
    return sentXhr.withCredentials;
}

assert.strictEqual(withCredentialsFor({}), true, 'credentials are sent by default');
assert.strictEqual(withCredentialsFor({ sendCredentials: true }), true, 'credentials are sent when sendCredentials is true');
assert.strictEqual(withCredentialsFor({ sendCredentials: false }), false, 'credentials are not sent when sendCredentials is false');

console.log('Tests passed');