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
var cordova = require('../cordova'),
    et = require('elementtree'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    config_parser = require('../src/config_parser'),
    android_parser = require('../src/metadata/android_parser'),
    ios_parser = require('../src/metadata/ios_parser'),
    blackberry_parser = require('../src/metadata/blackberry_parser'),
    hooker = require('../src/hooker'),
    fixtures = path.join(__dirname, 'fixtures'),
    hooks = path.join(fixtures, 'hooks'),
    tempDir = path.join(__dirname, '..', 'temp'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

var cwd = process.cwd();

describe('prepare command', function() {
    beforeEach(function() {
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });

    it('should not run inside a Cordova-based project with no added platforms', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);
        process.chdir(tempDir);
        expect(function() {
            cordova.prepare();
        }).toThrow();
    });
    
    it('should run inside a Cordova-based project with at least one added platform', function() {
        // move platform project fixtures over to fake cordova into thinking platforms were added
        // TODO: possibly add this to helper?
        shell.mv('-f', path.join(cordova_project, 'platforms', 'blackberry'), path.join(tempDir));
        this.after(function() {
            process.chdir(cwd);
            shell.mv('-f', path.join(tempDir, 'blackberry'), path.join(cordova_project, 'platforms', 'blackberry'));
        });

        process.chdir(cordova_project);

        var a_parser_spy = spyOn(android_parser.prototype, 'update_project');
        var i_parser_spy = spyOn(ios_parser.prototype, 'update_project');
        expect(function() {
            cordova.prepare();
            expect(a_parser_spy).toHaveBeenCalled();
            expect(i_parser_spy).toHaveBeenCalled();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        shell.mkdir('-p', tempDir);
        process.chdir(tempDir);

        expect(function() {
            cordova.prepare();
        }).toThrow();
    });

    describe('hooks', function() {
        var s;
        beforeEach(function() {
            s = spyOn(hooker.prototype, 'fire').andReturn(true);
        });

        describe('when platforms are added', function() {
            beforeEach(function() {
                shell.mv('-f', path.join(cordova_project, 'platforms', 'blackberry'), path.join(tempDir));
                shell.mv('-f', path.join(cordova_project, 'platforms', 'ios'), path.join(tempDir));
                process.chdir(cordova_project);
            });
            afterEach(function() {
                shell.mv('-f', path.join(tempDir, 'blackberry'), path.join(cordova_project, 'platforms', 'blackberry'));
                shell.mv('-f', path.join(tempDir, 'ios'), path.join(cordova_project, 'platforms', 'ios'));
                process.chdir(cwd);
            });

            it('should fire before hooks through the hooker module', function() {
                cordova.prepare();
                expect(s).toHaveBeenCalledWith('before_prepare');
            });
            it('should fire after hooks through the hooker module', function() {
                var parser_spy = spyOn(android_parser.prototype, 'update_project');
                cordova.prepare();
                parser_spy.mostRecentCall.args[1](); // parser cb
                expect(s).toHaveBeenCalledWith('after_prepare');
            });
        });

        describe('with no platforms added', function() {
            beforeEach(function() {
                cordova.create(tempDir);
                process.chdir(tempDir);
            });
            afterEach(function() {
                process.chdir(cwd);
            });
            it('should not fire the hooker', function() {
                expect(function() {
                    cordova.prepare();
                }).toThrow();
                expect(s).not.toHaveBeenCalledWith('before_prepare');
                expect(s).not.toHaveBeenCalledWith('after_prepare');
            });
        });
    });
});
