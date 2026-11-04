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

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import license from 'rollup-plugin-license';
import pkg from './package.json';
import * as path from 'path';
import * as fs from 'fs';

// The browser build bundles third-party code: its header names it, with its license (the npm package's
// LICENSE-binary lists it too, see scripts/npm-license.js)
// eslint-disable-next-line no-undef
const header = fs.readFileSync(path.join(__dirname, 'LICENSE_HEADER'), 'utf8').trim();
const bundledHeader = header + `

This file also contains code from the following packages, under their own licenses:
<% _.forEach(_.sortBy(dependencies, 'name'), function (dependency) { %>
<%= dependency.name %> <%= dependency.version %> (<%= dependency.license %>)

<%= dependency.licenseText.replace(/\\r\\n/g, '\\n').trim() %>
<% }) %>`;

export default [
    {
        input: 'src/apache-unomi-tracker.js',
        output: {
            name: pkg.name,
            file: pkg.browser,
            format: 'umd',
            sourcemap: true
        },
        plugins: [
            license({
                banner: {
                    commentStyle: 'regular',
                    content: bundledHeader
                }
            }),
            resolve(),
            commonjs(),
            babel({
                babelHelpers: 'runtime',
                exclude: ['node_modules/**'],
            }),
        ],
    },
    {
        input: 'src/apache-unomi-tracker.js',
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true },
            { file: pkg.module, format: 'es', sourcemap: true },
        ],
        plugins: [
            license({
                banner: {
                    commentStyle: 'regular',
                    content: {
                        // eslint-disable-next-line no-undef
                        file: path.join(__dirname, 'LICENSE_HEADER')
                    }
                }
            }),
            babel({
                babelHelpers: 'runtime',
                exclude: ['node_modules/**'],
            }),
        ],
        external: id => id === 'es6-crawler-detect' || id.includes('@babel/runtime')
    },
];