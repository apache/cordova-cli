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
var platforms = require('../../platforms'),
    util = require('../../src/util'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    et = require('elementtree'),
    cordova = require('../../cordova');

describe('android project parser', function() {
    var proj = '/some/path';
    var exists, exec;
    beforeEach(function() {
        exists = spyOn(fs, 'existsSync').andReturn(true);
        exec = spyOn(shell, 'exec').andCallFake(function(cmd, opts, cb) {
            cb(0, 'android-17');
        });
    });

    describe('constructions', function() {
        it('should throw if provided directory does not contain an AndroidManifest.xml', function() {
            exists.andReturn(false);
            expect(function() {
                new platforms.android.parser(proj);
            }).toThrow('The provided path "/some/path" is not an Android project.');
        });
        it('should create an instance with path, strings, manifest and android_config properties', function() {
            expect(function() {
                var p = new platforms.android.parser(proj);
                expect(p.path).toEqual(proj);
                expect(p.strings).toEqual(path.join(proj, 'res', 'values', 'strings.xml'));
                expect(p.manifest).toEqual(path.join(proj, 'AndroidManifest.xml'));
                expect(p.android_config).toEqual(path.join(proj, 'res', 'xml', 'config.xml'));
            }).not.toThrow();
        });
    });

    describe('check_requirements', function() {
        it('should fire a callback if there is an error during shelling out', function(done) {
            exec.andCallFake(function(cmd, opts, cb) {
                cb(50, 'there was an errorz!');
            });
            platforms.android.parser.check_requirements(function(err) {
                expect(err).toContain('there was an errorz!');
                done();
            });
        });
        it('should fire a callback if `android list target` does not return anything containing "android-17"', function(done) {
            exec.andCallFake(function(cmd, opts, cb) {
                cb(0, 'android-15');
            });
            platforms.android.parser.check_requirements(function(err) {
                expect(err).toEqual('Please install Android target 17 (the Android 4.2 SDK). Make sure you have the latest Android tools installed as well. Run `android` from your command-line to install/update any missing SDKs or tools.');
                done();
            });
        });
        it('should check that `android` is on the path by calling `android list target`', function(done) {
            platforms.android.parser.check_requirements(function(err) {
                expect(err).toEqual(false);
                expect(exec).toHaveBeenCalledWith('android list target', jasmine.any(Object), jasmine.any(Function));
                done();
            });
        });
        it('should check that we can update an android project by calling `android update project`', function(done) {
            platforms.android.parser.check_requirements(function(err) {
                expect(err).toEqual(false);
                expect(exec.mostRecentCall.args[0]).toMatch(/^android update project -p .*framework -t android-17$/gi);
                done();
            });
        });
    });

    describe('instance', function() {
        var p, cp, rm, is_cordova, write;
        var android_proj = path.join(proj, 'platforms', 'android');
        beforeEach(function() {
            p = new platforms.android.parser(android_proj);
            cp = spyOn(shell, 'cp');
            rm = spyOn(shell, 'rm');
            is_cordova = spyOn(util, 'isCordova').andReturn(proj);
            write = spyOn(fs, 'writeFileSync');
        });

        describe('update_from_config method', function() {
            it('should write out the app name to strings.xml');
            it('should write out the app id to androidmanifest.xml and update the cordova-android entry Java class');
            it('should write out the app version to androidmanifest.xml');
            it('should update the whitelist');
            it('should update preferences');
        });
        describe('www_dir method', function() {
            it('should return assets/www', function() {
                expect(p.www_dir()).toEqual(path.join(android_proj, 'assets', 'www'));
            });
        });
        describe('staging_dir method', function() {
            it('should return .staging/www', function() {
                expect(p.staging_dir()).toEqual(path.join(android_proj, '.staging', 'www'));
            });
        });
        describe('config_xml method', function() {
            it('should return the location of the config.xml', function() {
                expect(p.config_xml()).toEqual(p.android_config);
            });
        });
        describe('update_www method', function() {
            it('should rm project-level www and cp in platform agnostic www', function() {
                p.update_www();
                expect(rm).toHaveBeenCalled();
                expect(cp).toHaveBeenCalled();
            });
            it('should copy in a fresh cordova.js', function() {
                p.update_www();
                expect(write).toHaveBeenCalled();
            });
        });
        describe('update_overrides method', function() {
            it('should do nothing if merges directory does not exist', function() {
                exists.andReturn(false);
                p.update_overrides();
                expect(cp).not.toHaveBeenCalled();
            });
            it('should copy merges path into www', function() {
                p.update_overrides();
                expect(cp).toHaveBeenCalled();
            });
        });
        describe('update_staging method', function() {
            it('should do nothing if staging dir does not exist', function() {
                exists.andReturn(false);
                p.update_staging();
                expect(cp).not.toHaveBeenCalled();
            });
            it('should copy the staging dir into www if staging dir exists', function() {
                p.update_staging();
                expect(cp).toHaveBeenCalled();
            });
        });
        describe('update_project method', function() {
            var config, www, overrides, staging, svn;
            beforeEach(function() {
                config = spyOn(p, 'update_from_config');
                www = spyOn(p, 'update_www');
                overrides = spyOn(p, 'update_overrides');
                staging = spyOn(p, 'update_staging');
                svn = spyOn(util, 'deleteSvnFolders');
            });
            it('should call update_from_config', function() {
                p.update_project();
                expect(config).toHaveBeenCalled();
            });
            it('should throw if update_from_config throws', function(done) {
                var err = new Error('uh oh!');
                config.andCallFake(function() { throw err; });
                p.update_project({}, function(err) {
                    expect(err).toEqual(err);
                    done();
                });
            });
            it('should call update_www', function() {
                p.update_project();
                expect(www).toHaveBeenCalled();
            });
            it('should call update_overrides', function() {
                p.update_project();
                expect(overrides).toHaveBeenCalled();
            });
            it('should call update_staging', function() {
                p.update_project();
                expect(staging).toHaveBeenCalled();
            });
            it('should call deleteSvnFolders', function() {
                p.update_project();
                expect(svn).toHaveBeenCalled();
            });
        });
    });
});
