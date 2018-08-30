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

const { cordova } = require('cordova-lib');
const help = require('../src/help');
const allcommands = [
    '', 'prepare', 'build', 'config', 'emulate', 'plugin', 'plugins',
    'serve', 'platform', 'platforms', 'compile', 'run', 'info', 'targets',
    'requirements', 'projectMetadata', 'clean'
];

describe('help', () => {
    describe('commands should', () => {
        afterEach(() => {
            cordova.removeAllListeners('results');
        });
        describe('return results, and no long lines', () => {
            allcommands.forEach(k => {
                it(k, () => {
                    const result = help([k]);
                    expect(result).toMatch(/^Synopsis/);
                    expect(result.split('\n').filter(l => l.length > 130).length).toBe(0);
                });
            });
        });
        describe('use cordova-cli instead of cordova:', () => {
            const binname = cordova.binname;
            const testname = 'testgap';
            beforeEach(() => {
                cordova.binname = testname;
            });
            afterEach(() => {
                cordova.binname = binname;
            });
            allcommands.forEach(k => {
                it(k || '(default)', () => {
                    const result = help([k]);
                    expect(result.split('\n')[2]).toMatch(RegExp(testname + ' (?:' + k + '|command)\\b'));
                });
            });
        });
    });
});
