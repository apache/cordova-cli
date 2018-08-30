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
var cordova_lib = require('cordova-lib');
var cordova = cordova_lib.cordova;
var help = require('../src/help');
var allcommands = [
    '', 'prepare', 'build', 'config', 'emulate', 'plugin', 'plugins',
    'serve', 'platform', 'platforms', 'compile', 'run', 'info', 'targets',
    'requirements', 'projectMetadata', 'clean'
];

describe('help', function () {
    describe('commands should', function () {
        afterEach(function () {
            cordova.removeAllListeners('results');
        });
        describe('return results, and no long lines', function () {
            allcommands.forEach(function (k) {
                it(k, function (done) {
                    var result = help([k]);
                    expect(result).toMatch(/^Synopsis/);
                    expect(result.split('\n').filter(function (l) { return l.length > 130; }).length).toBe(0);
                    done();
                });
            });
        });
        describe('use cordova-cli instead of cordova:', function () {
            var binname = cordova.binname;
            var testname = 'testgap';
            beforeEach(function () {
                cordova.binname = testname;
            });
            afterEach(function () {
                cordova.binname = binname;
            });
            allcommands.forEach(function (k) {
                it(k || '(default)', function (done) {
                    var result = help([k]);
                    expect(result.split('\n')[2]).toMatch(RegExp(testname + ' (?:' + k + '|command)\\b'));
                    done();
                });
            });
        });
    });
});
