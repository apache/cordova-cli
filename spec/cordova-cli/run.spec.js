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

describe('run command', function() {
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
                cordova.run();
            }).toThrow();
        });
        it('should not run outside of a Cordova-based project', function() {
            shell.mkdir('-p', tempDir);
            process.chdir(tempDir);

            expect(function() {
                cordova.run();
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
        it('should invoke prepare', function() {
            var spy = spyOn(cordova, 'prepare');
            spyOn(shell, 'exec');
            cordova.run();
            expect(spy).toHaveBeenCalled();
        });
        it('should shell out to underlying `run` platform-level scripts', function(done) {
            spyOn(cordova, 'prepare').andCallFake(function(platforms, callback) {
                callback(false);
            });
            var spy = spyOn(shell, 'exec').andCallFake(function(cmd, options, cb) {
                cb(0, 'yep');
            });
            cordova.run('android', function() {
                 expect(spy.mostRecentCall.args[0]).toMatch(/cordova.run" --device$/gi);
                 done();
            });
        });
    });


    describe('hooks', function() {
        var s;
        beforeEach(function() {
            s = spyOn(hooker.prototype, 'fire').andCallFake(function(hook, opts, cb) {
                if (cb) cb();
                else opts();
            });
        });

        describe('when platforms are added', function() {
            beforeEach(function() {
                shell.cp('-Rf', path.join(cordova_project, 'platforms', 'android'), path.join(tempDir, 'platforms'));
                process.chdir(tempDir);
            });
            afterEach(function() {
                process.chdir(cwd);
            });

            it('should fire before hooks through the hooker module', function() {

                spyOn(shell, 'exec');
                cordova.run();
                expect(hooker.prototype.fire).toHaveBeenCalledWith('before_run', {platforms:['android']}, jasmine.any(Function));
            });
            it('should fire after hooks through the hooker module', function(done) {
                spyOn(shell, 'exec').andCallFake(function(cmd, options, callback) {
                    callback(0, 'fucking eh');
                });
                cordova.run('android', function() {
                     expect(hooker.prototype.fire).toHaveBeenCalledWith('after_run', {platforms:['android']}, jasmine.any(Function));
                     done();
                });
            });
        });

        describe('with no platforms added', function() {
            beforeEach(function() {
                process.chdir(tempDir);
            });
            afterEach(function() {
                process.chdir(cwd);
            });
            it('should not fire the hooker', function() {
                spyOn(shell, 'exec');
                expect(function() {
                    cordova.run();
                }).toThrow();
                expect(s).not.toHaveBeenCalledWith('before_run');
                expect(s).not.toHaveBeenCalledWith('after_run');
            });
        });
    });
});
