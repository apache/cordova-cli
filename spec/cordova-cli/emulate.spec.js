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

    it('should not run inside a Cordova-based project with no added platforms', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);
        expect(function() {
            cordova.emulate();
        }).toThrow();
    });
    
    it('should run inside a Cordova-based project with at least one added platform', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        var s = spyOn(shell, 'exec');
        var a_spy = spyOn(android_parser.prototype, 'update_project');
        expect(function() {
            shell.cp('-Rf', path.join(cordova_project, 'platforms', 'android'), path.join(tempDir, 'platforms'));
            process.chdir(tempDir);
            cordova.emulate();
            a_spy.mostRecentCall.args[1](); // fake out android parser
            expect(s).toHaveBeenCalled();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        shell.mkdir('-p', tempDir);
        process.chdir(tempDir);

        expect(function() {
            cordova.emulate();
        }).toThrow();
    });

    describe('hooks', function() {
        var s;
        beforeEach(function() {
            s = spyOn(hooker.prototype, 'fire').andReturn(true);
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
                cordova.emulate();
                expect(hooker.prototype.fire).toHaveBeenCalledWith('before_emulate');
            });
            it('should fire after hooks through the hooker module', function() {
                spyOn(shell, 'exec').andCallFake(function(cmd, options, callback) {
                    callback(0, 'fucking eh');
                });
                cordova.emulate('android', function() {
                     expect(hooker.prototype.fire).toHaveBeenCalledWith('after_emulate');
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
                    cordova.emulate();
                }).toThrow();
                expect(s).not.toHaveBeenCalledWith('before_emulate');
                expect(s).not.toHaveBeenCalledWith('after_emulate');
            });
        });
    });
});
