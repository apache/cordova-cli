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
    config_parser = require('../../src/config_parser'),
    android_parser = require('../../src/metadata/android_parser'),
    hooker = require('../../src/hooker'),
    fixtures = path.join(__dirname, '..', 'fixtures'),
    hooks = path.join(fixtures, 'hooks'),
    tempDir = path.join(__dirname, '..', '..', 'temp'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

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
            shell.cp('-Rf', path.join(cordova_project, 'platforms', 'android'), path.join(tempDir, 'platforms'));
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should run inside a Cordova-based project with at least one added platform', function() {
            var s = spyOn(shell, 'exec');
            var a_spy = spyOn(android_parser.prototype, 'update_project');
            expect(function() {
                cordova.emulate();
                a_spy.mostRecentCall.args[1](); // fake out android parser
                expect(s).toHaveBeenCalled();
                expect(s.mostRecentCall.args[0]).toMatch(/cordova.run" --emulator$/gi);
            }).not.toThrow();
        });
    });

    describe('hooks', function() {
        var hook_spy;
        var shell_spy;
        beforeEach(function() {
            hook_spy = spyOn(hooker.prototype, 'fire').andCallFake(function(hook, opts, cb) {
                if (cb) cb();
                else opts();
            });
            shell_spy = spyOn(shell, 'exec').andCallFake(function(cmd, opts, cb) {
                cb(0, 'yup'); // fake out shell so system thinks every shell-out is successful
            });
            process.chdir(tempDir);
        });
        afterEach(function() {
            hook_spy.reset();
            shell_spy.reset();
            process.chdir(cwd);
        });

        describe('when platforms are added', function() {
            var android_platform = path.join(tempDir, 'platforms', 'android');
            beforeEach(function() {
                shell.mkdir('-p', path.join(android_platform, 'assets', 'www'));
                fs.writeFileSync(path.join(android_platform, 'AndroidManifest.xml'), '<xml></xml>', 'utf-8');
            });
            it('should fire before hooks through the hooker module', function() {

                cordova.emulate();
                expect(hook_spy).toHaveBeenCalledWith('before_emulate', {platforms:['android']}, jasmine.any(Function));
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
                expect(hook_spy).not.toHaveBeenCalled();
            });
        });
    });
});
