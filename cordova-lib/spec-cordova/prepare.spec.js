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
    shell = require('shelljs'),
    plugman = require('plugman'),
    path = require('path'),
    fs = require('fs'),
    util = require('../src/util'),
    prepare = require('../src/prepare'),
    lazy_load = require('../src/lazy_load'),
    ConfigParser = require('../src/ConfigParser'),
    platforms = require('../platforms'),
    hooker = require('../src/hooker'),
    xmlHelpers = require('../src/xml-helpers'),
    fixtures = path.join(__dirname, 'fixtures'),
    et = require('elementtree'),
    Q = require('q'),
    hooks = path.join(fixtures, 'hooks');

var project_dir = '/some/path';
var supported_platforms = Object.keys(platforms).filter(function(p) { return p != 'www'; });
var supported_platforms_paths = supported_platforms.map(function(p) { return path.join(project_dir, 'platforms', p, 'www'); });

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

describe('prepare command', function() {
    var is_cordova,
        cd_project_root,
        list_platforms,
        fire,
        parsers = {},
        plugman_prepare,
        find_plugins,
        plugman_get_json,
        cp,
        mkdir,
        load;
    beforeEach(function() {
        is_cordova = spyOn(util, 'isCordova').andReturn(project_dir);
        cd_project_root = spyOn(util, 'cdProjectRoot').andReturn(project_dir);
        list_platforms = spyOn(util, 'listPlatforms').andReturn(supported_platforms);
        fire = spyOn(hooker.prototype, 'fire').andReturn(Q());
        supported_platforms.forEach(function(p) {
            parsers[p] = jasmine.createSpy(p + ' update_project').andReturn(Q());
            spyOn(platforms[p], 'parser').andReturn({
                update_project:parsers[p],
                update_www: jasmine.createSpy(p + ' update_www'),
                cordovajs_path: function(libDir) { return 'path/to/cordova.js/in/.cordova/lib';},
                www_dir:function() { return path.join(project_dir, 'platforms', p, 'www'); },
                config_xml: function () { return path.join(project_dir, "platforms", p, "www", "config.xml");}
            });
        });
        plugman_prepare = spyOn(plugman, 'prepare').andReturn(Q());
        find_plugins = spyOn(util, 'findPlugins').andReturn([]);
        plugman_get_json = spyOn(plugman.config_changes, 'get_platform_json').andReturn({
            prepare_queue:{installed:[], uninstalled:[]},
            config_munge:{},
            installed_plugins:{},
            dependent_plugins:{}
        });
        load = spyOn(lazy_load, 'based_on_config').andReturn(Q());
        cp = spyOn(shell, 'cp').andReturn(true);
        mkdir = spyOn(shell, 'mkdir');
        spyOn(prepare, '_mergeXml');
        spyOn(ConfigParser.prototype, 'write');
        spyOn(xmlHelpers, 'parseElementtreeSync').andCallFake(function() {
            return new et.ElementTree(et.XML(TEST_XML));
        });
    });

    describe('failure', function() {
        it('should not run outside of a cordova-based project by calling util.isCordova', function(done) {
            is_cordova.andReturn(false);
            Q().then(prepare).then(function() {
                expect('this call').toBe('fail');
            }, function(err) {
                expect('' + err).toContain('Current working directory is not a Cordova-based project.');
            }).fin(done);
        });
        it('should not run inside a cordova-based project with no platforms', function(done) {
            list_platforms.andReturn([]);
            Q().then(prepare).then(function() {
                expect('this call').toBe('fail');
            }, function(err) {
                expect('' + err).toContain('No platforms added to this project. Please use `cordova platform add <platform>`.');
            }).fin(done);
        });
    });

    describe('success', function() {
        it('should run inside a Cordova-based project by calling util.isCordova', function(done) {
            prepare().then(function() {
                expect(is_cordova).toHaveBeenCalled();
            }, function(err) {
                expect(err).toBeUndefined();
            }).fin(done);
        });
        it('should invoke each platform\'s parser\'s update_project method', function(done) {
            prepare().then(function() {
                supported_platforms.forEach(function(p) {
                    expect(parsers[p]).toHaveBeenCalled();
                });
            }, function(err) {
                expect(err).toBeUndefined();
            }).fin(done);
        });
        it('should invoke lazy_load for each platform to make sure platform libraries are loaded', function(done) {
            prepare().then(function() {
                supported_platforms.forEach(function(p) {
                    expect(load).toHaveBeenCalledWith(project_dir, p);
                });
            }, function(err) {
                expect(err).toBeUndefined();
            }).fin(done);
        });
        describe('plugman integration', function() {
            it('should invoke plugman.prepare after update_project', function(done) {
                prepare().then(function() {
                    var plugins_dir = path.join(project_dir, 'plugins');
                    supported_platforms.forEach(function(p) {
                        var platform_path = path.join(project_dir, 'platforms', p);
                        expect(plugman_prepare).toHaveBeenCalledWith(platform_path, (p=='blackberry'?'blackberry10':p), plugins_dir);
                    });
                }, function(err) {
                    expect(err).toBeUndefined();
                }).fin(done);
            });
        });
    });

    describe('hooks', function() {
        describe('when platforms are added', function() {
            it('should fire before hooks through the hooker module, and pass in platforms and paths as data object', function(done) {
                prepare().then(function() {
                    expect(fire).toHaveBeenCalledWith('before_prepare', {verbose: false, platforms:supported_platforms, options: [], paths:supported_platforms_paths});
                }, function(err) {
                    expect(err).toBeUndefined();
                }).fin(done);
            });
            it('should fire after hooks through the hooker module, and pass in platforms and paths as data object', function(done) {
                prepare('android').then(function() {
                     expect(fire).toHaveBeenCalledWith('after_prepare', {verbose: false, platforms:['android'], options: [], paths:[path.join(project_dir, 'platforms', 'android', 'www')]});
                }, function(err) {
                    expect(err).toBeUndefined();
                }).fin(done);
            });
        });

        describe('with no platforms added', function() {
            beforeEach(function() {
                list_platforms.andReturn([]);
            });
            it('should not fire the hooker', function(done) {
                Q().then(prepare).then(function() {
                    expect('this call').toBe('fail');
                }, function(err) {
                    expect(err).toEqual(jasmine.any(Error));
                    expect(fire).not.toHaveBeenCalledWith('before_prepare');
                    expect(fire).not.toHaveBeenCalledWith('after_prepare');
                }).fin(done);
            });
        });
    });
});

describe('prepare._mergeXml', function () {
    var dstXml;
    beforeEach(function() {
        dstXml = et.XML(TEST_XML);
    });
    it("should merge attributes and text of the root element without clobbering", function () {
        var testXml = et.XML("<widget foo='bar' id='NOTANID'>TEXT</widget>");
        prepare._mergeXml(testXml, dstXml);
        expect(dstXml.attrib.foo).toEqual("bar");
        expect(dstXml.attrib.id).not.toEqual("NOTANID");
        expect(dstXml.text).not.toEqual("TEXT");
    });

    it("should merge attributes and text of the root element with clobbering", function () {
        var testXml = et.XML("<widget foo='bar' id='NOTANID'>TEXT</widget>");
        prepare._mergeXml(testXml, dstXml, "foo", true);
        expect(dstXml.attrib.foo).toEqual("bar");
        expect(dstXml.attrib.id).toEqual("NOTANID");
        expect(dstXml.text).toEqual("TEXT");
    });

    it("should not merge platform tags with the wrong platform", function () {
        var testXml = et.XML("<widget><platform name='bar'><testElement testAttrib='value'>testTEXT</testElement></platform></widget>"),
            origCfg = et.tostring(dstXml);

        prepare._mergeXml(testXml, dstXml, "foo", true);
        expect(et.tostring(dstXml)).toEqual(origCfg);
    });

    it("should merge platform tags with the correct platform", function () {
        var testXml = et.XML("<widget><platform name='bar'><testElement testAttrib='value'>testTEXT</testElement></platform></widget>"),
            origCfg = et.tostring(dstXml);

        prepare._mergeXml(testXml, dstXml, "bar", true);
        expect(et.tostring(dstXml)).not.toEqual(origCfg);
        var testElement = dstXml.find("testElement");
        expect(testElement).toBeDefined();
        expect(testElement.attrib.testAttrib).toEqual("value");
        expect(testElement.text).toEqual("testTEXT");
    });

    it("should merge singelton children without clobber", function () {
        var testXml = et.XML("<widget><author testAttrib='value' href='http://www.nowhere.com'>SUPER_AUTHOR</author></widget>");

        prepare._mergeXml(testXml, dstXml);
        var testElements = dstXml.findall("author");
        expect(testElements).toBeDefined();
        expect(testElements.length).toEqual(1);
        expect(testElements[0].attrib.testAttrib).toEqual("value");
        expect(testElements[0].attrib.href).toEqual("http://cordova.io");
        expect(testElements[0].attrib.email).toEqual("dev@cordova.apache.org");
        expect(testElements[0].text).toContain("Apache Cordova Team");
    });

    it("should clobber singelton children with clobber", function () {
        var testXml = et.XML("<widget><author testAttrib='value' href='http://www.nowhere.com'>SUPER_AUTHOR</author></widget>");

        prepare._mergeXml(testXml, dstXml, '', true);
        var testElements = dstXml.findall("author");
        expect(testElements).toBeDefined();
        expect(testElements.length).toEqual(1);
        expect(testElements[0].attrib.testAttrib).toEqual("value");
        expect(testElements[0].attrib.href).toEqual("http://www.nowhere.com");
        expect(testElements[0].attrib.email).toEqual("dev@cordova.apache.org");
        expect(testElements[0].text).toEqual("SUPER_AUTHOR");
    });

    it("should append non singelton children", function () {
        var testXml = et.XML("<widget><preference num='1'/> <preference num='2'/></widget>");

        prepare._mergeXml(testXml, dstXml, '', true);
        var testElements = dstXml.findall("preference");
        expect(testElements.length).toEqual(4);
    });

    it("should handle namespaced elements", function () {
        var testXml = et.XML("<widget><foo:bar testAttrib='value'>testText</foo:bar></widget>");

        prepare._mergeXml(testXml, dstXml, 'foo', true);
        var testElement = dstXml.find("foo:bar");
        expect(testElement).toBeDefined();
        expect(testElement.attrib.testAttrib).toEqual("value");
        expect(testElement.text).toEqual("testText");
    });

    it("should not append duplicate non singelton children", function () {
        var testXml = et.XML("<widget><preference name='fullscreen' value='true'/></widget>");

        prepare._mergeXml(testXml, dstXml, '', true);
        var testElements = dstXml.findall("preference");
        expect(testElements.length).toEqual(2);
    });
});
