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
var cordova_lib = require('cordova-lib'),
    cordova = cordova_lib.cordova,
    help = require('../src/help'),
    allcommands;

describe('help', function() {
    allcommands = [''].concat(Object.keys(cordova).map(function(k) {
        if (k in cordova.raw)
            return k;
        return null;
    }).filter(function (k) { return k; }));
    describe('commands should', function() {
        afterEach(function() {
            cordova.removeAllListeners('results');
        });
        describe('emit results', function () {
            allcommands.forEach(function (k) {
                it(k, function(done) {
                    cordova.on('results', function(h) {
                        expect(h).toMatch(/^Synopsis/);
                        done();
                    });
                    help([k]).then(function () {
                        expect(done).toHaveBeenCalled();
                    });
                });
            });
        });
        describe('not have overly long lines:', function () {
            allcommands.forEach(function (k) {
                it(k || '(default)', function(done) {
                    cordova.on('results', function(h) {
                        expect(h.split("\n").filter(function (l) { return l.length > 130; }).length).toBe(0);
                        done();
                    });
                    help([k]).then(function () {
                        expect(done).toHaveBeenCalled();
                    });
                });
            });
        });
        describe('use cordova-cli instead of cordova:', function () {
            var binname = cordova.binname,
                testname = 'testgap';
            beforeEach(function() {
                cordova.binname = testname;
            });
            afterEach(function() {
                cordova.binname = binname;
            });
            allcommands.forEach(function (k) {
                it(k || '(default)', function(done) {
                    cordova.on('results', function(h) {
                        expect(h.split("\n")[2]).toMatch(RegExp(testname + ' (?:' + k + '|command)\\b'));
                        done();
                    });
                    help([k]).then(function () {
                        expect(done).toHaveBeenCalled();
                    });
                });
            });
        });
    });
});
