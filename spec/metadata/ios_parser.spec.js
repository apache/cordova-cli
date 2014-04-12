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
    plist = require('plist-with-patches'),
    xcode = require('xcode'),
    et = require('elementtree'),
    fs = require('fs'),
    Q = require('q'),
    config = require('../../src/config'),
    ConfigParser = require('../../src/ConfigParser'),
    cordova = require('../../cordova');

// Create a real config object before mocking out everything.
var cfg = new ConfigParser(path.join(__dirname, '..', 'test-config.xml'));

describe('ios project parser', function () {
    var proj = path.join('some', 'path');
    var custom, readdir;
    beforeEach(function() {
        custom = spyOn(config, 'has_custom_path').andReturn(false);
        readdir = spyOn(fs, 'readdirSync').andReturn(['test.xcodeproj']);
    });

    function wrapper(p, done, post) {
        p.then(post, function(err) {
            expect(err).toBeUndefined();
        }).fin(done);
    }

    function errorWrapper(p, done, post) {
        p.then(function() {
            expect('this call').toBe('fail');
        }, post).fin(done);
    }

    describe('constructions', function() {
        it('should throw if provided directory does not contain an xcodeproj file', function() {
            readdir.andReturn(['noxcodehere']);
            expect(function() {
                new platforms.ios.parser(proj);
            }).toThrow();
        });
        it('should create an instance with path, pbxproj, xcodeproj, originalName and cordovaproj properties', function() {
            expect(function() {
                var p = new platforms.ios.parser(proj);
                expect(p.path).toEqual(proj);
                expect(p.pbxproj).toEqual(path.join(proj, 'test.xcodeproj', 'project.pbxproj'));
                expect(p.xcodeproj).toEqual(path.join(proj, 'test.xcodeproj'));
            }).not.toThrow();
        });
    });

    describe('instance', function() {
        var p, cp, rm, mkdir, is_cordova, write, read;
        var ios_proj = path.join(proj, 'platforms', 'ios');
        beforeEach(function() {
            p = new platforms.ios.parser(ios_proj);
            cp = spyOn(shell, 'cp');
            rm = spyOn(shell, 'rm');
            mkdir = spyOn(shell, 'mkdir');
            is_cordova = spyOn(util, 'isCordova').andReturn(proj);
            write = spyOn(fs, 'writeFileSync');
            read = spyOn(fs, 'readFileSync').andReturn('');
        });

        describe('update_from_config method', function() {
            var mv;
            var cfg_access_add, cfg_access_rm, cfg_pref_add, cfg_pref_rm, cfg_content;
            var plist_parse, plist_build, xc;
            var update_name, xc_write;
            beforeEach(function() {
                mv = spyOn(shell, 'mv');
                plist_parse = spyOn(plist, 'parseFileSync').andReturn({
                });
                plist_build = spyOn(plist, 'build').andReturn('');
                update_name = jasmine.createSpy('update_name');
                xc_write = jasmine.createSpy('xcode writeSync');
                xc = spyOn(xcode, 'project').andReturn({
                    parse:function(cb) {cb();},
                    updateProductName:update_name,
                    writeSync:xc_write
                });
                cfg.name = function() { return 'testname' };
                cfg.packageName = function() { return 'testpkg' };
                cfg.version = function() { return 'one point oh' };
                p = new platforms.ios.parser(ios_proj);
            });

            it('should update the app name in pbxproj by calling xcode.updateProductName, and move the ios native files to match the new name', function(done) {
                var test_path = path.join(proj, 'platforms', 'ios', 'test');
                var testname_path = path.join(proj, 'platforms', 'ios', 'testname');
                wrapper(p.update_from_config(cfg), done, function() {
                    expect(update_name).toHaveBeenCalledWith('testname');
                    expect(mv).toHaveBeenCalledWith(path.join(test_path, 'test-Info.plist'), path.join(test_path, 'testname-Info.plist'));
                    expect(mv).toHaveBeenCalledWith(path.join(test_path, 'test-Prefix.pch'), path.join(test_path, 'testname-Prefix.pch'));
                    expect(mv).toHaveBeenCalledWith(test_path + '.xcodeproj', testname_path + '.xcodeproj');
                    expect(mv).toHaveBeenCalledWith(test_path, testname_path);
                });
            });
            it('should write out the app id to info plist as CFBundleIdentifier', function(done) {
                wrapper(p.update_from_config(cfg), done, function() {
                    expect(plist_build.mostRecentCall.args[0].CFBundleIdentifier).toEqual('testpkg');
                });
            });
            it('should write out the app version to info plist as CFBundleVersion', function(done) {
                wrapper(p.update_from_config(cfg), done, function() {
                    expect(plist_build.mostRecentCall.args[0].CFBundleShortVersionString).toEqual('one point oh');
                });
            });
        });
        describe('www_dir method', function() {
            it('should return /www', function() {
                expect(p.www_dir()).toEqual(path.join(ios_proj, 'www'));
            });
        });
        describe('config_xml method', function() {
            it('should return the location of the config.xml', function() {
                expect(p.config_xml()).toEqual(path.join(ios_proj, 'test', 'config.xml'));
            });
        });
        describe('update_www method', function() {
            it('should rm project-level www and cp in platform agnostic www', function() {
                p.update_www(path.join('lib','dir'));
                expect(rm).toHaveBeenCalled();
                expect(cp).toHaveBeenCalled();
            });
        });
        describe('update_overrides method', function() {
            var exists;
            beforeEach(function() {
                exists = spyOn(fs, 'existsSync').andReturn(true);
            });
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
        describe('update_project method', function() {
            var config, www, overrides, svn;
            beforeEach(function() {
                config = spyOn(p, 'update_from_config').andReturn(Q());
                www = spyOn(p, 'update_www');
                overrides = spyOn(p, 'update_overrides');
                svn = spyOn(util, 'deleteSvnFolders');
            });
            it('should call update_from_config', function(done) {
                wrapper(p.update_project(), done, function() {
                    expect(config).toHaveBeenCalled();
                });
            });
            it('should throw if update_from_config errors', function(done) {
                var e = new Error('uh oh!');
                config.andReturn(Q.reject(e));
                errorWrapper(p.update_project({}), done, function(err) {
                    expect(err).toEqual(e);
                });
            });
            it('should not call update_www', function(done) {
                wrapper(p.update_project({}), done, function() {
                    expect(www).not().toHaveBeenCalled();
                });
            });
            it('should call update_overrides', function(done) {
                wrapper(p.update_project(), done, function() {
                    expect(overrides).toHaveBeenCalled();
                });
            });
            it('should call deleteSvnFolders', function(done) {
                wrapper(p.update_project(), done, function() {
                    expect(svn).toHaveBeenCalled();
                });
            });
        });
    });
});
