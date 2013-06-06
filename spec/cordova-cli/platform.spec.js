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
    path = require('path'),
    shell = require('shelljs'),
    request = require('request'),
    fs = require('fs'),
    et = require('elementtree'),
    config_parser = require('../../src/config_parser'),
    helper = require('./helper'),
    util = require('../../src/util'),
    hooker = require('../../src/hooker'),
    platforms = require('../../platforms'),
    platform  = require('../../src/platform'),
    tempDir = path.join(__dirname, '..', '..', 'temp');
    android_parser = require('../../src/metadata/android_parser'),
    ios_parser = require('../../src/metadata/ios_parser'),
    blackberry_parser = require('../../src/metadata/blackberry_parser'),
    cordova_project = path.join(__dirname, '..', 'fixtures', 'projects', 'cordova');

var cwd = process.cwd();

describe('platform command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });
    it('should run inside a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).toThrow();
    });

    describe('`ls`', function() { 
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should list out no platforms for a fresh project', function() {
            shell.rm('-rf', path.join(tempDir, 'platforms', '*'));
            expect(cordova.platform('list').length).toEqual(0);
        });

        it('should list out added platforms in a project', function() {
            var platforms = path.join(tempDir, 'platforms');
            shell.mkdir(path.join(platforms, 'android'));
            shell.mkdir(path.join(platforms, 'ios'));
            expect(cordova.platform('list').length).toEqual(2);
        });
    });

    describe('`add`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should handle multiple platforms', function() {
            spyOn(platform, 'supports').andCallFake(function(target, callback) {
                    callback(null);
            });
            var sh = spyOn(shell, 'exec');
            cordova.platform('add', ['foo', 'bar']);
            var foo_create = path.join('foo', 'bin', 'create');
            var bar_create      = path.join('bar', 'bin', 'create');
            expect(sh.argsForCall[0][0]).toContain(foo_create);
            expect(sh.argsForCall[1][0]).toContain(bar_create);
        });
    });

    describe('`remove`',function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should remove a supported and added platform', function() {
            shell.mkdir(path.join(tempDir, 'platforms', 'android'));
            shell.mkdir(path.join(tempDir, 'platforms', 'ios'));
            cordova.platform('remove', 'android');
            expect(cordova.platform('ls').length).toEqual(1);
        });

        it('should be able to remove multiple platforms', function() {
            shell.mkdir(path.join(tempDir, 'platforms', 'android'));
            shell.mkdir(path.join(tempDir, 'platforms', 'blackberry'));
            shell.mkdir(path.join(tempDir, 'platforms', 'ios'));
            cordova.platform('remove', ['android','blackberry']);
            expect(cordova.platform('ls').length).toEqual(1);
        });
    });

    describe('hooks', function() {
        var s;
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            s = spyOn(hooker.prototype, 'fire').andReturn(true);
        });
        afterEach(function() {
            process.chdir(cwd);
            shell.rm('-rf', tempDir);
        });

        describe('list (ls) hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform();
                expect(s).toHaveBeenCalledWith('before_platform_ls');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform();
                expect(s).toHaveBeenCalledWith('after_platform_ls');
            });
        });
        describe('remove (rm) hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform('rm', 'android');
                expect(s).toHaveBeenCalledWith('before_platform_rm');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform('rm', 'android');
                expect(s).toHaveBeenCalledWith('after_platform_rm');
            });
        });
        describe('add hooks', function() {
            var sh, cr;
            var fake_reqs_check = function() {
                cr.mostRecentCall.args[0](false);
            };
            var fake_create = function(a_path) {
                shell.mkdir('-p', a_path);
                fs.writeFileSync(path.join(a_path, 'AndroidManifest.xml'), 'hi', 'utf-8');
                sh.mostRecentCall.args[2](0, '');
            };
            beforeEach(function() {
                sh = spyOn(shell, 'exec');
                cr = spyOn(android_parser, 'check_requirements');
            });
            it('should fire before and after hooks through the hooker module', function() {
                var ap = spyOn(android_parser.prototype, 'update_project');
                cordova.platform('add', 'android');
                fake_reqs_check();
                fake_create(path.join(tempDir, 'platforms', 'android'));
                ap.mostRecentCall.args[1](); // fake out update_project
                expect(s).toHaveBeenCalledWith('before_platform_add');
                expect(s).toHaveBeenCalledWith('after_platform_add');
            });
        });
    });
});

describe('platform.supports(name, callback)', function() {
    var androidParser = require('../../src/metadata/android_parser');

    beforeEach(function() {
        spyOn(androidParser, 'check_requirements');
    });

    it('should require a platform name', function() {
        expect(function() {
            cordova.platform.supports(undefined, function(e){});
        }).toThrow();
    });

    it('should require a callback function', function() {
        expect(function() {
            cordova.platform.supports('android', undefined);
        }).toThrow();
    });

    describe('when platform is unknown', function() {
        it('should trigger callback with false', function(done) {
            cordova.platform.supports('windows-3.1', function(e) {
                expect(e).toEqual(jasmine.any(Error));
                done();
            });
        });
    });

    describe('when platform is supported', function() {
        beforeEach(function() {
            androidParser.check_requirements.andCallFake(function(callback) {
                callback(null);
            });
        });

        it('should trigger callback without error', function(done) {
            cordova.platform.supports('android', function(e) {
                expect(e).toBeNull();
                done();
            });
        });
    });

    describe('when platform is unsupported', function() {
        beforeEach(function() {
            androidParser.check_requirements.andCallFake(function(callback) {
                callback(new Error('could not find the android sdk'));
            });
        });

        it('should trigger callback with error', function(done) {
            cordova.platform.supports('android', function(e) {
                expect(e).toEqual(jasmine.any(Error));
                done();
            });
        });
    });
});

describe('platform parsers', function() {
    it('should be exposed on the platform module', function() {
        for (var platform in platforms) {
            expect(cordova.platform[platform]).toBeDefined();
            for (var prop in platforms[platform]) {
                expect(cordova.platform[platform][prop]).toBeDefined();
            }
        }
    });
});
