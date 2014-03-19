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
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    hooker = require('../src/hooker'),
    Q = require('q'),
    util = require('../src/util');

var supported_platforms = Object.keys(platforms).filter(function(p) { return p != 'www'; });

describe('build command', function() {
    var is_cordova, cd_project_root, list_platforms, fire;
    var project_dir = '/some/path';
    var prepare_spy, compile_spy;
    var result;

    function buildPromise(f) {
        f.then(function() { result = true; }, function(err) { result = err; });
    }

    function wrapper(f, post) {
        runs(function() {
            buildPromise(f);
        });
        waitsFor(function() { return result; }, 'promise never resolved', 500);
        runs(post);
    }

    beforeEach(function() {
        is_cordova = spyOn(util, 'isCordova').andReturn(project_dir);
        cd_project_root = spyOn(util, 'cdProjectRoot').andReturn(project_dir);
        list_platforms = spyOn(util, 'listPlatforms').andReturn(supported_platforms);
        fire = spyOn(hooker.prototype, 'fire').andReturn(Q());
        prepare_spy = spyOn(cordova.raw, 'prepare').andReturn(Q());
        compile_spy = spyOn(cordova.raw, 'compile').andReturn(Q());
    });
    describe('failure', function() {
        it('should not run inside a project with no platforms', function(done) {
            list_platforms.andReturn([]);
            Q().then(cordova.raw.build).then(function() {
                expect('this call').toBe('fail');
            }, function(err) {
                expect(err.message).toEqual(
                    'No platforms added to this project. Please use `cordova platform add <platform>`.'
                )
            }).fin(done);
        });

        it('should not run outside of a Cordova-based project', function(done) {
            is_cordova.andReturn(false);

            Q().then(cordova.raw.build).then(function() {
                expect('this call').toBe('fail');
            }, function(err) {
                expect(err.message).toEqual(
                    'Current working directory is not a Cordova-based project.'
                )
            }).fin(done);
        });
    });

    describe('callback',function() {
        var tag = false,
            promise,
            callback;

        beforeEach(function () {
            callback = function() {
                tag = true;
            }
        });

        it('should return null if a callback argument is supplied',function(){
            var promise;
           
             promise = cordova.raw.build(['android','ios'], callback);
             expect(promise).toBe(null);
        });

        it('should call the supplied callback if supplied', function() {
            runs(function(){
                cordova.raw.build(['android','ios'],callback);
            });
            waitsFor(function(){
                return tag;
            },10000);
        });
    });

    describe('success', function() {
        it('should run inside a Cordova-based project with at least one added platform and call both prepare and compile', function(done) {
           cordova.raw.build(['android','ios']).then(function() {
                var opts = {verbose: false, platforms: ['android', 'ios'], options: []};
                expect(prepare_spy).toHaveBeenCalledWith(opts);
                expect(compile_spy).toHaveBeenCalledWith(opts);
                done();
            });
        });
        it('should pass down options', function(done) {
            cordova.raw.build({platforms: ['android'], options: ['--release']}).then(function() {
                var opts = {platforms: ['android'], options: ["--release"], verbose: false};
                expect(prepare_spy).toHaveBeenCalledWith(opts);
                expect(compile_spy).toHaveBeenCalledWith(opts);
                done();
            });
        });
    });

    describe('',function(){

    });

    describe('hooks', function() {
        describe('when platforms are added', function() {
            it('should fire before hooks through the hooker module', function(done) {
                cordova.raw.build(['android', 'ios']).then(function() {
                    expect(fire).toHaveBeenCalledWith('before_build', {verbose: false, platforms:['android', 'ios'], options: []});
                    done();
                });
            });
            it('should fire after hooks through the hooker module', function(done) {
                cordova.raw.build('android').then(function() {
                     expect(fire).toHaveBeenCalledWith('after_build', {verbose: false, platforms:['android'], options: []});
                     done();
                });
            });
        });

        describe('with no platforms added', function() {
            it('should not fire the hooker', function(done) {
                list_platforms.andReturn([]);
                Q().then(cordova.raw.build).then(function() {
                    expect('this call').toBe('fail');
                }, function(err) {
                    expect(err.message).toEqual(
                        'No platforms added to this project. Please use `cordova platform add <platform>`.'
                    )
                }).fin(done);
            });
        });
    });
});
