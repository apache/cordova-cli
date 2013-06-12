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
    et = require('elementtree'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    hooker = require('../../src/hooker'),
    tempDir = path.join(__dirname, '..', '..', 'temp');

var cwd = process.cwd();

describe('emulate command', function() {
    beforeEach(function() {
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
    });

    describe('failure', function() {
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should not run inside a Cordova-based project with no added platforms', function() {
            process.chdir(tempDir);
            expect(function() {
                cordova.emulate();
            }).toThrow();
        });
        it('should not run outside of a Cordova-based project', function() {
            shell.mkdir('-p', tempDir);
            process.chdir(tempDir);

            expect(function() {
                cordova.emulate();
            }).toThrow();
        });
    });

    describe('success', function() {
        beforeEach(function() {
            process.chdir(tempDir);
            spyOn(cordova, 'prepare').andCallFake(function(ps, cb) {
                cb();
            });
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should run inside a Cordova-based project with at least one added platform', function(done) {
            var s = spyOn(shell, 'exec').andCallFake(function(cmd, opts, cb) {
                cb(0, 'yokay');
            });
            cordova.emulate(['android', 'beer'], function(err) {
                expect(s).toHaveBeenCalled();
                expect(s.mostRecentCall.args[0]).toMatch(/cordova.run" --emulator$/gi);
                done();
            });
        });
    });

    describe('hooks', function() {
        var hook_spy;
        var shell_spy;
        var prepare_spy;
        beforeEach(function() {
            hook_spy = spyOn(hooker.prototype, 'fire').andCallFake(function(hook, opts, cb) {
                if (cb) cb();
                else opts();
            });
            prepare_spy = spyOn(cordova, 'prepare').andCallFake(function(ps, cb) {
                cb();
            });
            shell_spy = spyOn(shell, 'exec').andCallFake(function(cmd, opts, cb) {
                cb(0, 'yup'); // fake out shell so system thinks every shell-out is successful
            });
            process.chdir(tempDir);
        });
        afterEach(function() {
            hook_spy.reset();
            prepare_spy.reset();
            shell_spy.reset();
            process.chdir(cwd);
        });

        describe('when platforms are added', function() {
            it('should fire before hooks through the hooker module', function(done) {
                cordova.emulate(['android', 'ios'], function(err) {
                    expect(hook_spy).toHaveBeenCalledWith('before_emulate', {platforms:['android', 'ios']}, jasmine.any(Function));
                    done();
                });
            });
            it('should fire after hooks through the hooker module', function(done) {
                cordova.emulate('android', function() {
                     expect(hook_spy).toHaveBeenCalledWith('after_emulate', {platforms:['android']}, jasmine.any(Function));
                     done();
                });
            });
        });

        describe('with no platforms added', function() {
            it('should not fire the hooker', function() {
                expect(function() {
                    cordova.emulate();
                }).toThrow();
                expect(hook_spy).not.toHaveBeenCalled();
            });
        });
    });
});
