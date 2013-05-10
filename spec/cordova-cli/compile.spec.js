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
    fixtures = path.join(__dirname, '..', 'fixtures'),
    hooks = path.join(fixtures, 'hooks'),
    tempDir = path.join(__dirname, '..', '..', 'temp'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

var cwd = process.cwd();

describe('compile command', function() {
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
            cordova.compile();
        }).toThrow();
    });
    
    it('should run inside a Cordova-based project with at least one added platform', function() {
        // move platform project fixtures over to fake cordova into thinking platforms were added
        // TODO: possibly add this to helper?
        // Just make a folder instead of moving the whole platform? 
        shell.mkdir('-p', tempDir);
        shell.mv('-f', path.join(cordova_project, 'platforms', 'android'), path.join(tempDir));
        this.after(function() {
            process.chdir(cwd);
            shell.mv('-f', path.join(tempDir, 'android'), path.join(cordova_project, 'platforms', 'android'));
        });

        process.chdir(cordova_project);

        var sh_spy = spyOn(shell, 'exec');

        expect(function() {
            cordova.compile();
            expect(sh_spy).toHaveBeenCalled();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        shell.mkdir('-p', tempDir);
        process.chdir(tempDir);

        // we don't actually want it building the project (if it does somehow exist)
        var sh_spy = spyOn(shell, 'exec');

        expect(function() {
            cordova.compile();
        }).toThrow();
    });
    /* Is this a repeat of the util.spec.js test? */
    it('should not treat a .gitignore file as a platform', function() {
        var gitignore = path.join(cordova_project, 'platforms', '.gitignore');
        fs.writeFileSync(gitignore, 'somethinghere', 'utf-8');
        this.after(function() {
            shell.rm('-f', gitignore);
            process.chdir(cwd);
        });

        var s = spyOn(shell, 'exec');
        process.chdir(cordova_project);
        cordova.compile();
        for (call in s.calls) {
            expect(s.calls[call].args[0]).not.toMatch(/\.gitignore/);
        }
    });

    describe('hooks', function() {
        var s;
        beforeEach(function() {
            s = spyOn(hooker.prototype, 'fire').andReturn(true);
        });

        describe('when platforms are added', function() {
            beforeEach(function() {
                shell.mv('-f', path.join(cordova_project, 'platforms', 'android'), path.join(tempDir));
                process.chdir(cordova_project);
            });
            afterEach(function() {
                shell.mv('-f', path.join(tempDir, 'android'), path.join(cordova_project, 'platforms', 'android'));
                process.chdir(cwd);
            });

            it('should fire before hooks through the hooker module', function() {
                spyOn(shell, 'exec');
                cordova.compile();
                expect(s).toHaveBeenCalledWith('before_compile');
            });
            it('should fire after hooks through the hooker module', function(done) {
                spyOn(shell, 'exec').andCallFake(function(cmd, options, callback) {
                    callback(0, 'fucking eh');
                });
                cordova.compile('android', function() {
                     expect(hooker.prototype.fire).toHaveBeenCalledWith('after_compile');
                     done();
                });
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
                    cordova.compile();
                }).toThrow();
                expect(s).not.toHaveBeenCalledWith('before_compile');
                expect(s).not.toHaveBeenCalledWith('after_compile');
            });
        });
    });
});
