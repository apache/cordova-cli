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
    cordova_project = path.join(fixtures, 'projects', 'cordova'),
    ios_project_path = path.join(cordova_project, 'platforms', 'ios'),
    blackberry_project_path = path.join(cordova_project, 'platforms', 'blackberry'),
    www_config = path.join(cordova_project, 'www', 'config.xml');



var cwd = process.cwd();

describe('build command', function() {
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
            cordova.build();
        }).toThrow();
    });
    
    it('should run inside a Cordova-based project with at least one added platform', function() {
        // move platform project fixtures over to fake cordova into thinking platforms were added
        // TODO: possibly add this to helper?
        shell.mv('-f', path.join(cordova_project, 'platforms', 'blackberry'), path.join(tempDir));
        shell.mv('-f', path.join(cordova_project, 'platforms', 'ios'), path.join(tempDir));
        this.after(function() {
            process.chdir(cwd);
            shell.mv('-f', path.join(tempDir, 'blackberry'), path.join(cordova_project, 'platforms', 'blackberry'));
            shell.mv('-f', path.join(tempDir, 'ios'), path.join(cordova_project, 'platforms', 'ios'));
        });

        process.chdir(cordova_project);

        var prepare_spy = spyOn(cordova, 'prepare');
        var compile_spy = spyOn(cordova, 'compile');
        expect(function() {
            cordova.build();
            var prep_cb = prepare_spy.mostRecentCall.args[0];
            prep_cb();
            expect(prepare_spy).toHaveBeenCalled();
            expect(compile_spy).toHaveBeenCalled();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        shell.mkdir('-p', tempDir);
        process.chdir(tempDir);

        expect(function() {
            cordova.build();
        }).toThrow();
    });

    describe('hooks', function() {
        var s, p, c;
        beforeEach(function() {
            s = spyOn(hooker.prototype, 'fire').andReturn(true);
            p = spyOn(cordova, 'prepare');
            c = spyOn(cordova, 'compile');
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
                cordova.build();
                expect(s).toHaveBeenCalledWith('before_build');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.build();
                p.mostRecentCall.args[0](); // prep cb
                c.mostRecentCall.args[0](); // compile cb
                expect(s).toHaveBeenCalledWith('after_build');
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
                    cordova.build();
                }).toThrow();
                expect(s).not.toHaveBeenCalledWith('before_build');
                expect(s).not.toHaveBeenCalledWith('after_build');
            });
        });

    });

    describe('merges', function() {
        describe('per platform', function() {
            beforeEach(function() {
                process.chdir(cordova_project);
            });

            afterEach(function() {
                process.chdir(cwd);
            });

            describe('Android', function() {
                it('should call android_parser\'s update_overrides', function() {
                    spyOn(require('shelljs'), 'exec').andReturn({code:0});
                    var s = spyOn(android_parser.prototype, 'update_overrides');

                    cordova.build('android');
                    expect(s).toHaveBeenCalled();
                });

            });

            describe('iOS', function() {
                it('should call ios_parser\'s update_overrides', function(done) {
                    var parser = new ios_parser(ios_project_path);
                    var config = new config_parser(www_config);

                    var s = spyOn(parser, 'update_overrides');
                    parser.update_project(config, function() {
                        expect(s).toHaveBeenCalled();
                        done();
                    });
                });

            });

            describe('BlackBerry', function() {
                it('should call blackberry_parser\'s update_overrides', function(done) {
                    var parser = new blackberry_parser(blackberry_project_path);
                    var config = new config_parser(www_config);

                    var s = spyOn(parser, 'update_overrides');
                    parser.update_project(config, function() {
                        expect(s).toHaveBeenCalled();
                        done();
                    });
                });

            });


        });
    });

});
