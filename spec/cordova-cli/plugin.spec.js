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
    fs = require('fs'),
    hooker = require('../../src/hooker'),
    tempDir = path.join(__dirname, '..', '..', 'temp'),
    fixturesDir = path.join(__dirname, '..', 'fixtures'),
    testPlugin = path.join(fixturesDir, 'plugins', 'test'),
    cordova_project = path.join(fixturesDir, 'projects', 'cordova'),
    androidPlugin = path.join(fixturesDir, 'plugins', 'android');

var cwd = process.cwd();

describe('plugin command', function() {
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
            cordova.plugin();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.plugin();
        }).toThrow();
    });

    describe('edge cases', function() {
       beforeEach(function() {
           cordova.create(tempDir);
           process.chdir(tempDir);
       });

       afterEach(function() {
           process.chdir(cwd);
           cordova.removeAllListeners('results');
       });

       it('should not fail when the plugins directory is missing', function() {
           fs.rmdirSync('plugins');

           expect(function() {
               cordova.plugin();
           }).not.toThrow();
       });

       it('should ignore files, like .gitignore, in the plugins directory', function(done) {
           var someFile = path.join(tempDir, 'plugins', '.gitignore');
           fs.writeFileSync(someFile, 'not a plugin');
           cordova.on('results', function(res) {
               expect(res).toEqual('No plugins added. Use `cordova plugin add <plugin>`.');
               done();
           });

           cordova.plugin('list');
       });
    });

    describe('`ls`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
            cordova.removeAllListeners('results');
        });

        it('should list out no plugins for a fresh project', function(done) {
            cordova.on('results', function(res) {
                expect(res).toEqual('No plugins added. Use `cordova plugin add <plugin>`.');
                done();
            });
            cordova.plugin('list');
        });
        it('should list out any added plugins in a project', function(done) {
            var random_plug = 'randomplug';
            shell.mkdir('-p', path.join(tempDir, 'plugins', random_plug));
            cordova.on('results', function(res) {
                expect(res).toEqual([random_plug]);
                done();
            });
            cordova.plugin('list');
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
        describe('failure', function() {
            it('should throw if plugin does not have a plugin.xml', function() {
                process.chdir(cordova_project);
                this.after(function() {
                    process.chdir(cwd);
                });
                expect(function() {
                    cordova.plugin('add', fixturesDir);
                }).toThrow();
            });
        });
    });
});

