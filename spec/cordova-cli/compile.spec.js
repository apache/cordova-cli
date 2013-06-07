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
var cordova = require('../../cordova'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    events = require('../../src/events'),
    hooker = require('../../src/hooker'),
    tempDir = path.join(__dirname, '..', '..', 'temp');

var cwd = process.cwd();

describe('compile command', function() {
    beforeEach(function() {
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });

    describe('failure', function() {
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should not run inside a Cordova-based project with no added platforms', function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            expect(function() {
                cordova.compile();
            }).toThrow();
        });
        it('should not run outside of a Cordova-based project', function() {
            shell.mkdir('-p', tempDir);
            process.chdir(tempDir);
            expect(function() {
                cordova.compile();
            }).toThrow();
        });
    });

    describe('success', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should run inside a Cordova-based project with at least one added platform and shell out to a build command', function(done) {
            var sh_spy = spyOn(shell, 'exec').andCallFake(function(cmd, opts, cb) {
                cb(0, 'mhmm');
            });
            cordova.compile(['android', 'ios'], function(err) {
                expect(sh_spy).toHaveBeenCalled();
                expect(sh_spy.mostRecentCall.args[0]).toMatch(/cordova.build"$/gi);
                done();
            });
        });
    });

    describe('hooks', function() {
        var hook_spy;
        var shell_spy;
        beforeEach(function() {
            hook_spy = spyOn(hooker.prototype, 'fire').andCallFake(function(hook, opts, cb) {
                cb();
            });
            shell_spy = spyOn(shell, 'exec').andCallFake(function(cmd, opts, cb) {
                cb(0, 'yup'); // fake out shell so system thinks every shell-out is successful
            });
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            hook_spy.reset();
            shell_spy.reset();
            process.chdir(cwd);
        });

        describe('when platforms are added', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.compile(['android', 'ios']);
                expect(hook_spy).toHaveBeenCalledWith('before_compile', {platforms:['android', 'ios']}, jasmine.any(Function));
            });
            it('should fire after hooks through the hooker module', function(done) {
                cordova.compile('android', function() {
                     expect(hook_spy).toHaveBeenCalledWith('after_compile', {platforms:['android']}, jasmine.any(Function));
                     done();
                });
            });
        });

        describe('with no platforms added', function() {
            it('should not fire the hooker', function() {
                expect(function() {
                    cordova.compile();
                }).toThrow();
                expect(hook_spy).not.toHaveBeenCalled();
            });
        });
    });
});
