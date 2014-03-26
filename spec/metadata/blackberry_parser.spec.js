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
    xmlHelpers = require('../../src/xml-helpers'),
    Q = require('q'),
    child_process = require('child_process'),
    config = require('../../src/config'),
    ConfigParser = require('../../src/ConfigParser'),
    cordova = require('../../cordova');

var cfg = new ConfigParser(path.join(__dirname, '..', 'test-config.xml'));

var TEST_XML = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<widget xmlns     = "http://www.w3.org/ns/widgets"\n' +
    '        xmlns:cdv = "http://cordova.apache.org/ns/1.0"\n' +
    '        id        = "io.cordova.hellocordova"\n' +
    '        version   = "0.0.1">\n' +
    '    <name>Hello Cordova</name>\n' +
    '    <description>\n' +
    '        A sample Apache Cordova application that responds to the deviceready event.\n' +
    '    </description>\n' +
    '    <author href="http://cordova.io" email="dev@cordova.apache.org">\n' +
    '        Apache Cordova Team\n' +
    '    </author>\n' +
    '    <content src="index.html" />\n' +
    '    <access origin="*" />\n' +
    '    <preference name="fullscreen" value="true" />\n' +
    '    <preference name="webviewbounce" value="true" />\n' +
    '</widget>\n';

describe('blackberry10 project parser', function() {
    var proj = '/some/path';
    var exists, custom, sh;
    beforeEach(function() {
        exists = spyOn(fs, 'existsSync').andReturn(true);
        custom = spyOn(config, 'has_custom_path').andReturn(false);
        sh = spyOn(child_process, 'exec').andCallFake(function(cmd, opts, cb) {
            (cb || opts)(0, '', '');
        });
        spyOn(ConfigParser.prototype, 'write');
        spyOn(xmlHelpers, 'parseElementtreeSync').andCallFake(function() {
            return new et.ElementTree(et.XML(TEST_XML));
        });
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
        it('should throw an exception with a path that is not a native blackberry project', function() {
            exists.andReturn(false);
            expect(function() {
                new platforms.blackberry10.parser(proj);
            }).toThrow();
        });
        it('should accept a proper native blackberry project path as construction parameter', function() {
            var project;
            expect(function() {
                project = new platforms.blackberry10.parser(proj);
            }).not.toThrow();
            expect(project).toBeDefined();
        });
    });

    describe('check_requirements', function() {
        it('should fire a callback if the blackberry-deploy shell-out fails', function(done) {
            sh.andCallFake(function(cmd, opts, cb) {
                (cb || opts)(1, 'no bb-deploy dewd!');
            });
            errorWrapper(platforms.blackberry10.parser.check_requirements(proj), done, function(err) {
                expect(err).toContain('no bb-deploy dewd');
            });
        });
        it('should fire a callback with no error if shell out is successful', function(done) {
            wrapper(platforms.blackberry10.parser.check_requirements(proj), done, function() {
                expect(1).toBe(1);
            });
        });
    });
    describe('instance', function() {
        var p, cp, rm, mkdir, is_cordova, write, read;
        var bb_proj = path.join(proj, 'platforms', 'blackberry10');
        beforeEach(function() {
            p = new platforms.blackberry10.parser(bb_proj);
            cp = spyOn(shell, 'cp');
            rm = spyOn(shell, 'rm');
            mkdir = spyOn(shell, 'mkdir');
            is_cordova = spyOn(util, 'isCordova').andReturn(proj);
            write = spyOn(fs, 'writeFileSync');
            read = spyOn(fs, 'readFileSync');
        });

        describe('update_from_config method', function() {
            var xml_name, xml_pkg, xml_version, xml_access_rm, xml_update, xml_append, xml_content;
            beforeEach(function() {
                xml_content = jasmine.createSpy('xml content');
                xml_name = jasmine.createSpy('xml name');
                xml_pkg = jasmine.createSpy('xml pkg');
                xml_version = jasmine.createSpy('xml version');
                xml_access_rm = jasmine.createSpy('xml access rm');
                xml_access_add = jasmine.createSpy('xml access add');
                xml_update = jasmine.createSpy('xml update');
                xml_append = jasmine.createSpy('xml append');
                xml_preference_remove = jasmine.createSpy('xml preference rm');
                xml_preference_add = jasmine.createSpy('xml preference add');
                p.xml.name = xml_name;
                p.xml.packageName = xml_pkg;
                p.xml.version = xml_version;
                p.xml.content = xml_content;
                p.xml.access = {
                    remove:xml_access_rm,
                    add: xml_access_add
                };
                p.xml.update = xml_update;
                p.xml.doc = {
                    getroot:function() { return { append:xml_append}; }
                };
                p.xml.preference = {
                    add: xml_preference_add,
                    remove: xml_preference_remove
                };
                cfg.name = function() { return 'testname'; };
                cfg.packageName = function() { return 'testpkg'; };
                cfg.version = function() { return 'one point oh'; };
            });
        });
        describe('www_dir method', function() {
            it('should return /www', function() {
                expect(p.www_dir()).toEqual(path.join(bb_proj, 'www'));
            });
        });
        describe('config_xml method', function() {
            it('should return the location of the config.xml', function() {
                expect(p.config_xml()).toEqual(path.join(proj, 'platforms', 'blackberry10', 'www', 'config.xml'));
            });
        });
        describe('update_www method', function() {

            it('should rm project-level www and cp in platform agnostic www', function() {
                p.update_www();
                expect(rm).toHaveBeenCalled();
                expect(cp).toHaveBeenCalled();
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
                expect(cp).toHaveBeenCalledWith('-rf', path.join(proj, 'merges', 'blackberry10', '*'), path.join(proj, 'platforms', 'blackberry10', 'www'));
            });
        });
        describe('update_project method', function() {
            var config, www, overrides, svn, parse, get_env, write_env;
            beforeEach(function() {
                config = spyOn(p, 'update_from_config');
                www = spyOn(p, 'update_www');
                overrides = spyOn(p, 'update_overrides');
                svn = spyOn(util, 'deleteSvnFolders');
                parse = spyOn(JSON, 'parse').andReturn({blackberry:{qnx:{}}});
            });
            it('should call update_from_config', function(done) {
                wrapper(p.update_project(), done, function() {
                    expect(config).toHaveBeenCalled();
                });
            });
            it('should throw if update_from_config throws', function(done) {
                var err = new Error('uh oh!');
                config.andCallFake(function() { throw err; });
                errorWrapper(p.update_project({}), done, function(e) {
                    expect(e).toEqual(err);
                });
            });
            it('should not call update_www', function(done) {
                wrapper(p.update_project(), done, function() {
                    expect(www).not.toHaveBeenCalled();
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
