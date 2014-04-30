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
    child_process = require('child_process'),
    xmlHelpers = require('../../src/xml-helpers'),
    et = require('elementtree'),
    Q = require('q'),
    fs = require('fs'),
    config = require('../../src/config'),
    ConfigParser = require('../../src/ConfigParser'),
    cordova = require('../../cordova');

// Create a real config object before mocking out everything.
var cfg = new ConfigParser(path.join(__dirname, '..', 'test-config.xml'));

describe('windows8 project parser', function() {

    var proj = '/some/path';
    var exists, exec, custom, readdir, cfg_parser;
    var winXml;
    beforeEach(function() {
        exists = spyOn(fs, 'existsSync').andReturn(true);
        exec = spyOn(child_process, 'exec').andCallFake(function(cmd, opts, cb) {
            if (!cb) cb = opts;
            cb(null, '', '');
        });
        custom = spyOn(config, 'has_custom_path').andReturn(false);
        readdir = spyOn(fs, 'readdirSync').andReturn(['test.jsproj']);
        winXml = null;
        spyOn(xmlHelpers, 'parseElementtreeSync').andCallFake(function(path) {
            return winXml = new et.ElementTree(et.XML('<foo><Application/><Identity/><VisualElements><a/></VisualElements><Capabilities><a/></Capabilities></foo>'));
        });
    });

    function wrapper(promise, done, post) {
        promise.then(post, function(err) {
            expect(err).toBeUndefined();
        }).fin(done);
    }

    function errorWrapper(promise, done, post) {
        promise.then(function() {
            expect('this call').toBe('fail');
        }, post).fin(done);
    }

    describe('constructions', function() {
        it('should throw if provided directory does not contain a jsproj file', function() {
            readdir.andReturn([]);
            expect(function() {
                new platforms.windows8.parser(proj);
            }).toThrow();
        });
        it('should create an instance with path, manifest properties', function() {
            expect(function() {
                var parser = new platforms.windows8.parser(proj);
                expect(parser.windows8_proj_dir).toEqual(proj);
                expect(parser.manifest_path).toEqual(path.join(proj, 'package.appxmanifest'));
            }).not.toThrow();
        });
    });

    describe('check_requirements', function() {
        it('should fire a callback if there is an error during shelling out', function(done) {
            exec.andCallFake(function(cmd, opts, cb) {
                if (!cb) cb = opts;
                cb(50, 'there was an errorz!', '');
            });
            errorWrapper(platforms.windows8.parser.check_requirements(proj), done, function(err) {
                expect(err).toContain('there was an errorz!');
            });
        });
        it('should check by calling check_reqs on the stock lib path if no custom path is defined', function(done) {
            wrapper(platforms.windows8.parser.check_requirements(proj), done, function() {
                expect(exec.mostRecentCall.args[0]).toContain(util.libDirectory);
                expect(exec.mostRecentCall.args[0]).toMatch(/check_reqs"$/);
            });
        });
        it('should check by calling check_reqs on a custom path if it is so defined', function(done) {
            var custom_path = path.join('some','custom','path','to','windows8','lib');
            custom.andReturn(custom_path);
            wrapper(platforms.windows8.parser.check_requirements(proj),done, function() {
                expect(exec.mostRecentCall.args[0]).toContain(custom_path);
                expect(exec.mostRecentCall.args[0]).toMatch(/check_reqs"$/);
            });
            done();
        });
    });

    describe('instance', function() {
        var parser, cp, rm, is_cordova, write, read, mv, mkdir;
        var windows8_proj = path.join(proj, 'platforms', 'windows8');
        beforeEach(function() {
            parser = new platforms.windows8.parser(windows8_proj);
            cp = spyOn(shell, 'cp');
            rm = spyOn(shell, 'rm');
            mv = spyOn(shell, 'mv');
            mkdir = spyOn(shell, 'mkdir');
            is_cordova = spyOn(util, 'isCordova').andReturn(proj);
            write = spyOn(fs, 'writeFileSync');
            read = spyOn(fs, 'readFileSync').andReturn('');
        });

        describe('update_from_config method', function() {
            beforeEach(function() {
                cfg.name = function() { return 'testname' };
                cfg.content = function() { return 'index.html' };
                cfg.packageName = function() { return 'testpkg' };
                cfg.version = function() { return 'one point oh' };
                readdir.andReturn(['test.sln']);
            });

            it('should write out the app name to package.appxmanifest', function() {
                parser.update_from_config(cfg);
                var identityNode = winXml.getroot().find('.//Identity');
                expect(identityNode.attrib.Name).toEqual(cfg.packageName());
            });

            it('should write out the app version to package.appxmanifest', function() {
                parser.update_from_config(cfg);
                var identityNode = winXml.getroot().find('.//Identity');
                expect(identityNode.attrib.Version).toEqual('one point oh');
            });
        });

        describe('www_dir method', function() {
            it('should return www', function() {
                expect(parser.www_dir()).toEqual(path.join(windows8_proj, 'www'));
            });
        });
        describe('update_www method', function() {
            var update_jsproj;
            beforeEach(function() {
                update_jsproj = spyOn(parser, 'update_jsproj');
            });
            it('should rm project-level www and cp in platform agnostic www', function() {
                parser.update_www(path.join('lib','dir'));
                expect(rm).toHaveBeenCalled();
                expect(cp).toHaveBeenCalled();
            });
        });
        describe('update_project method', function() {
            var config, www, overrides, svn;
            beforeEach(function() {
                config = spyOn(parser, 'update_from_config');
                www = spyOn(parser, 'update_www');
                www = spyOn(parser, 'update_jsproj');
                svn = spyOn(util, 'deleteSvnFolders');
                exists.andReturn(false);
            });
            it('should call update_from_config', function() {
                parser.update_project();
                expect(config).toHaveBeenCalled();
            });
            it('should throw if update_from_config throws', function(done) {
                var err = new Error('uh oh!');
                config.andCallFake(function() { throw err; });
                errorWrapper(parser.update_project({}), done, function(err) {
                    expect(err).toEqual(err);
                });
            });
            it('should call deleteSvnFolders', function(done) {
                wrapper(parser.update_project(), done, function() {
                    expect(svn).toHaveBeenCalled();
                });
            });
        });
    });
});
