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

// Serves the test page and the built tracker on two origins:
// http://localhost:8000, which the Unomi 4 servers list as allowed to send cookies,
// and http://localhost:8001, which they do not.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTS = [8000, 8001];
const files = {
    '/': { file: path.join(__dirname, 'page', 'index.html'), type: 'text/html; charset=utf-8' },
    '/tracker.js': { file: path.join(__dirname, '..', '..', 'dist', 'apache-unomi-tracker.umd.js'), type: 'text/javascript; charset=utf-8' },
    // Downloaded by run.js, for the comparison with the published 1.5.0
    '/tracker-1.5.0.js': { file: path.join(__dirname, '.cache', 'apache-unomi-tracker-1.5.0', 'package', 'dist', 'apache-unomi-tracker.umd.js'), type: 'text/javascript; charset=utf-8' }
};

function handle(request, response) {
    const entry = files[new URL(request.url, 'http://localhost').pathname];
    if (!entry) {
        response.writeHead(404).end();
        return;
    }
    fs.readFile(entry.file, (error, content) => {
        if (error) {
            response.writeHead(500, { 'Content-Type': 'text/plain' }).end(String(error));
            return;
        }
        response.writeHead(200, { 'Content-Type': entry.type, 'Cache-Control': 'no-store' }).end(content);
    });
}

for (const port of PORTS) {
    http.createServer(handle).listen(port, () => console.log('Test page on http://localhost:' + port));
}
