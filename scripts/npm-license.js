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

/* eslint-env node */

// The LICENSE of the npm package. Its browser build bundles third-party code that the source package
// does not contain, and ASF policy wants each package's LICENSE to describe exactly what the package
// contains (https://www.apache.org/legal/release-policy.html#licensing). So the source package has
// LICENSE (the Apache License), and the npm package LICENSE-binary (the Apache License and the
// bundled components), which npm pack puts in place of LICENSE.
//
//   node scripts/npm-license.js generate     writes LICENSE-binary from the build (dist)
//   node scripts/npm-license.js check        fails if LICENSE-binary does not match the build
//   node scripts/npm-license.js use-binary   before npm pack: LICENSE-binary becomes LICENSE
//   node scripts/npm-license.js restore      after npm pack: LICENSE again
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const LICENSE = path.join(root, 'LICENSE');
const LICENSE_BINARY = path.join(root, 'LICENSE-binary');
// Where LICENSE waits while npm packs the package (not in the package: "files" does not list it)
const LICENSE_SOURCE = path.join(root, '.LICENSE-source');
const BUNDLE = 'dist/apache-unomi-tracker.umd.js';

// The third-party packages the browser build contains, from its source map: name, version,
// license and license text, sorted by name
function bundledPackages() {
    const map = JSON.parse(fs.readFileSync(path.join(root, BUNDLE + '.map'), 'utf8'));
    const names = new Set(map.sources
        .filter(source => source.includes('node_modules/'))
        .map(source => {
            const parts = source.split('node_modules/').pop().split('/');
            return parts[0].startsWith('@') ? parts[0] + '/' + parts[1] : parts[0];
        }));
    return [...names].sort().map(name => {
        const directory = path.join(root, 'node_modules', name);
        const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
        const licenseFile = fs.readdirSync(directory).find(file => /^licen[cs]e/i.test(file));
        if (!licenseFile) {
            throw new Error(name + ' has no license file');
        }
        return {
            name,
            version: pkg.version,
            license: pkg.license,
            text: fs.readFileSync(path.join(directory, licenseFile), 'utf8').replace(/\r\n/g, '\n').trim()
        };
    });
}

function binaryLicense() {
    const apache = fs.readFileSync(LICENSE, 'utf8').replace(/\s+$/, '');
    const lines = [
        apache,
        '',
        '',
        '------------------------------------------------------------------------------------',
        'APACHE UNOMI TRACKER SUBCOMPONENTS',
        '',
        'The npm package of Apache Unomi tracker contains, in its browser build',
        '(' + BUNDLE + ' and ' + BUNDLE + '.map), the following',
        'components, under the licenses below. The other files of the package are under the',
        'Apache License 2.0 above.'
    ];
    for (const pkg of bundledPackages()) {
        lines.push('', '', pkg.name + ' ' + pkg.version + ' (' + pkg.license + ')', '', pkg.text);
    }
    return lines.join('\n') + '\n';
}

const command = process.argv[2];
if (command === 'generate') {
    fs.writeFileSync(LICENSE_BINARY, binaryLicense());
    console.log('LICENSE-binary: ' + bundledPackages().map(pkg => pkg.name + ' ' + pkg.version).join(', '));
} else if (command === 'check' || command === 'use-binary') {
    if (fs.existsSync(LICENSE_SOURCE)) {
        throw new Error('.LICENSE-source exists: a previous npm pack did not finish. Run `node scripts/npm-license.js restore` first');
    }
    if (!fs.existsSync(LICENSE_BINARY) || fs.readFileSync(LICENSE_BINARY, 'utf8') !== binaryLicense()) {
        console.error('LICENSE-binary does not match the browser build (' + bundledPackages().map(pkg => pkg.name + ' ' + pkg.version).join(', ') +
            '). Run `node scripts/npm-license.js generate` and commit it.');
        process.exit(1);
    }
    if (command === 'use-binary') {
        fs.renameSync(LICENSE, LICENSE_SOURCE);
        fs.copyFileSync(LICENSE_BINARY, LICENSE);
    }
} else if (command === 'restore') {
    if (fs.existsSync(LICENSE_SOURCE)) {
        fs.renameSync(LICENSE_SOURCE, LICENSE);
    }
} else {
    console.error('Usage: node scripts/npm-license.js generate|check|use-binary|restore');
    process.exit(2);
}
