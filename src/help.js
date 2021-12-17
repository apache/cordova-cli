/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/
const fs = require('fs');
const cordova_lib = require('cordova-lib');
const path = require('path');

module.exports = function help (args) {
    args = args || [];

    const command = ((args)[0] || 'cordova');
    const docdir = path.join(__dirname, '..', 'doc');
    const file = [
        `${command}.md`,
        `${command}.txt`,
        'cordova.md',
        'cordova.txt'
    ]
        .map(f => path.join(docdir, f))
        .filter(f => !!fs.existsSync(f));

    const raw = fs.readFileSync(file[0]).toString('utf8').replace(/cordova-cli/g, cordova_lib.binname);
    // cordova.emit('results', raw);

    return raw;
};
