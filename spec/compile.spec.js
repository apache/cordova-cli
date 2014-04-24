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
    platforms = require('../platforms'),
    path = require('path'),
    fs = require('fs'),
    hooker = require('../src/hooker'),
    superspawn = require('../src/superspawn'),
    util = require('../src/util'),
    Q = require('q'),
    os = require('os');


var supported_platforms = Object.keys(platforms).filter(function(p) { return p != 'www'; });


describe('compile command', function() {
    var is_cordova, list_platforms, fire, result, cd_project_root;
    var project_dir = '/some/path';

    function wrapper(f, post) {
        runs(function() {
            Q().then(f).then(function() { result = true; }, function(err) { result = err; });
        });
        waitsFor(function() { return result; }, 'promise never resolved', 500);
        runs(post);
    }
    beforeEach(function() {
        is_cordova = spyOn(util, 'isCordova').andReturn(project_dir);
        cd_project_root = spyOn(util, 'cdProjectRoot').andReturn(project_dir);
        list_platforms = spyOn(util, 'listPlatforms').andReturn(supported_platforms);
        fire = spyOn(hooker.prototype, 'fire').andReturn(Q());
        spyOn(superspawn, 'spawn').andCallFake(function() { return Q() });
    });
    describe('failure', function() {
        it('should not run inside a Cordova-based project with no added platforms by calling util.listPlatforms', function() {
            list_platforms.andReturn([]);
            wrapper(cordova.raw.compile, function() {
                expect('' + result).toContain('No platforms added to this project. Please use `cordova platform add <platform>`.');
            });
        });
        it('should not run outside of a Cordova-based project', function() {
            is_cordova.andReturn(false);
            wrapper(cordova.raw.compile, function() {
                expect(result instanceof Error).toBe(true);
            });
        });
    });

    describe('success', function() {
        it('should run inside a Cordova-based project with at least one added platform and shell out to build', function(done) {
            cordova.raw.compile(['android','ios']).then(function() {
                expect(superspawn.spawn).toHaveBeenCalledWith(path.join(project_dir, 'platforms', 'android', 'cordova', 'build'), [], jasmine.any(Object));
                expect(superspawn.spawn).toHaveBeenCalledWith(path.join(project_dir, 'platforms', 'ios', 'cordova', 'build'), [], jasmine.any(Object));
                done();
            });
        });

        it('should pass down optional parameters', function (done) {
            cordova.raw.compile({platforms:["blackberry10"], options:["--release"]}).then(function () {
                expect(superspawn.spawn).toHaveBeenCalledWith(path.join(project_dir, 'platforms', 'blackberry10', 'cordova', 'build'), ['--release'], jasmine.any(Object));
                done();
            });
        });
    });

    describe('hooks', function() {
        describe('when platforms are added', function() {
            it('should fire before hooks through the hooker module', function(done) {
                cordova.raw.compile(['android', 'ios']).then(function() {
                    expect(fire).toHaveBeenCalledWith('before_compile', {verbose: false, platforms:['android', 'ios'], options: []});
                    done();
                });
            });
            it('should fire after hooks through the hooker module', function(done) {
                cordova.raw.compile('android').then(function() {
                     expect(fire).toHaveBeenCalledWith('after_compile', {verbose: false, platforms:['android'], options: []});
                     done();
                });
            });
        });

        describe('with no platforms added', function() {
            it('should not fire the hooker', function(done) {
                list_platforms.andReturn([]);
                Q().then(cordova.raw.compile).then(function() {
                    expect('this call').toBe('fail');
                }, function(err) {
                    expect(fire).not.toHaveBeenCalled();
                    expect(err.message).toContain(
                        'No platforms added to this project. Please use `cordova platform add <platform>`.'
                    )
                }).fin(done);
            });
        });
    });
});
