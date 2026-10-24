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

// Runs the browser tests against each Unomi server version, one after the other.
//
//   yarn test:servers                    all servers
//   yarn test:servers unomi2 unomi4      only these servers
//   yarn test:servers --keep unomi4      leave the server running afterwards
//
// Not part of CI: it needs Docker and takes several minutes.
const { spawnSync } = require('child_process');
const path = require('path');
const { TARGETS } = require('./unomi');

const root = path.join(__dirname, '..', '..');
const composeFile = path.join(__dirname, 'docker-compose.yml');
const args = process.argv.slice(2);
const keep = args.includes('--keep');
const names = args.filter(arg => !arg.startsWith('--'));
const selected = names.length > 0 ? names : Object.keys(TARGETS);

for (const name of selected) {
    if (!TARGETS[name]) {
        console.error('Unknown server "' + name + '", expected one of: ' + Object.keys(TARGETS).join(', '));
        process.exit(2);
    }
}

function run(command, commandArgs, env) {
    console.log('$ ' + command + ' ' + commandArgs.join(' '));
    const result = spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit', env: Object.assign({}, process.env, env) });
    return result.status === 0;
}

function compose(name, ...commandArgs) {
    return run('docker', ['compose', '-f', composeFile, '-p', 'unomi-tracker-' + name, '--profile', name, ...commandArgs]);
}

if (!run('yarn', ['build'])) {
    process.exit(1);
}

const results = [];
for (const name of selected) {
    console.log('\n=== ' + name);
    let passed = false;
    try {
        if (compose(name, 'up', '-d')) {
            passed = run('npx', ['playwright', 'test', '-c', path.join(__dirname, 'playwright.config.js')], { UNOMI_TARGET: name });
        }
    } finally {
        if (!keep) {
            compose(name, 'down', '-v');
        }
    }
    results.push({ name, passed });
}

console.log('\n=== Results');
for (const result of results) {
    console.log((result.passed ? 'PASS ' : 'FAIL ') + result.name);
}
process.exit(results.every(result => result.passed) ? 0 : 1);
