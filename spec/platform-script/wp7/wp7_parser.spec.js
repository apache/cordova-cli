
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
var wp7_parser = require('../../../src/metadata/wp7_parser'),
    config_parser = require('../../../src/config_parser'),
    util = require('../../../src/util'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    os = require('os'),
    et = require('elementtree'),
    cordova = require('../../../cordova'),
    projects_path = path.join(__dirname, '..', '..', 'fixtures', 'projects'),
    wp7_path = path.join(projects_path, 'native', 'wp7_fixture'),
    project_path = path.join(projects_path, 'cordova'),
    wp7_project_path = path.join(project_path, 'platforms', 'wp7');

var www_config = util.projectConfig(project_path);
var original_www_config = fs.readFileSync(www_config, 'utf-8');

describe('wp7 project parser', function() {
    it('should throw an exception with a path that is not a native wp7 project', function() {
        expect(function() {
            var project = new wp7_parser(process.cwd());
        }).toThrow();
    });
    it('should accept a proper native wp7 project path as construction parameter', function() {
        expect(function() {
            var project = new wp7_parser(wp7_path);
            expect(project).toBeDefined();
        }).not.toThrow();
    });

    describe('update_from_config method', function() {
        var config;
        var project = new wp7_parser(wp7_path);

        var manifest_path  = path.join(wp7_path, 'Properties', 'WMAppManifest.xml');
        var csproj_path    = project.csproj_path;
        var sln_path       = project.sln_path;
        var app_xaml_path  = path.join(wp7_path, 'App.xaml');
        var app_cs_path    = path.join(wp7_path, 'App.xaml.cs');
        var main_xaml_path = path.join(wp7_path, 'MainPage.xaml');
        var main_cs_path   = path.join(wp7_path, 'MainPage.xaml.cs');


        var original_manifest  = fs.readFileSync(manifest_path, 'utf-8');
        var original_csproj    = fs.readFileSync(csproj_path, 'utf-8');
        var original_sln       = fs.readFileSync(sln_path, 'utf-8');
        var original_app_xaml  = fs.readFileSync(app_xaml_path, 'utf-8');
        var original_app_cs    = fs.readFileSync(app_cs_path, 'utf-8');
        var original_main_xaml = fs.readFileSync(main_xaml_path, 'utf-8');
        var original_main_cs   = fs.readFileSync(main_cs_path, 'utf-8');

        beforeEach(function() {
            project = new wp7_parser(wp7_path);
            config = new config_parser(www_config);
        });
        afterEach(function() {
            fs.writeFileSync(manifest_path, original_manifest, 'utf-8');
            // csproj file changes name if app changes name
            fs.unlinkSync(project.csproj_path);
            fs.unlinkSync(project.sln_path);
            fs.writeFileSync(csproj_path, original_csproj, 'utf-8');
            fs.writeFileSync(sln_path, original_sln, 'utf-8');
            fs.writeFileSync(app_xaml_path, original_app_xaml, 'utf-8');
            fs.writeFileSync(app_cs_path, original_app_cs, 'utf-8');
            fs.writeFileSync(main_xaml_path, original_main_xaml, 'utf-8');
            fs.writeFileSync(main_cs_path, original_main_cs, 'utf-8');
        });
        it('should throw an exception if a non config_parser object is passed into it', function() {
            expect(function() {
                project.update_from_config({});
            }).toThrow();
        });
        it('should update the application name properly', function() {
            var test_name = 'bond. james bond.';
            config.name(test_name);
            project.update_from_config(config);
            var raw_manifest = fs.readFileSync(manifest_path, 'utf-8');
            //Strip three bytes that windows adds (http://www.multiasking.com/2012/11/851)
            var cleaned_manifest = raw_manifest.replace('\ufeff', '');
            var manifest = new et.ElementTree(et.XML(cleaned_manifest));
            var app_name = manifest.find('.//App[@Title]')['attrib']['Title'];
            expect(app_name).toBe(test_name);

            //check for the proper name of csproj and solution files
            test_name = test_name.replace(/(\.\s|\s\.|\s+|\.+)/g, '_'); //make it a ligitamate name
            expect(project.csproj_path).toContain(test_name);
            expect(project.sln_path).toContain(test_name);
        });
        it('should update the application package name properly', function() {
            var test_package = 'ca.filmaj.dewd'
            config.packageName(test_package);
            project.update_from_config(config);

            // check csproj file (use regex instead of elementtree?)
            var raw_csproj = fs.readFileSync(project.csproj_path, 'utf-8');
            var cleaned_csproj = raw_csproj.replace(/^\uFEFF/i, '');
            var csproj = new et.ElementTree(et.XML(cleaned_csproj));
            expect(csproj.find('.//RootNamespace').text).toEqual(test_package);
            expect(csproj.find('.//AssemblyName').text).toEqual(test_package);
            expect(csproj.find('.//XapFilename').text).toEqual(test_package + '.xap');
            expect(csproj.find('.//SilverlightAppEntry').text).toEqual(test_package + '.App');

            // check app.xaml (use regex instead of elementtree?)
            var new_app_xaml = fs.readFileSync(app_xaml_path, 'utf-8');
            var cleaned_app_xaml = new_app_xaml.replace(/^\uFEFF/i, '');
            var app_xaml = new et.ElementTree(et.XML(cleaned_app_xaml));
            expect(app_xaml._root.attrib['x:Class']).toEqual(test_package + '.App');

            // check app.xaml.cs
            var new_app_cs = fs.readFileSync(app_cs_path, 'utf-8');
            expect(new_app_cs).toContain('namespace ' + test_package);

            // check MainPage.xaml (use regex instead of elementtree?)
            var new_main_xaml = fs.readFileSync(main_xaml_path, 'utf-8');
            var cleaned_main_xaml = new_main_xaml.replace(/^\uFEFF/i, '');
            var main_xaml = new et.ElementTree(et.XML(cleaned_main_xaml));
            expect(main_xaml._root.attrib['x:Class']).toEqual(test_package + '.MainPage');

            //check MainPage.xaml.cs
            var new_main_cs = fs.readFileSync(main_cs_path, 'utf-8');
            expect(new_main_cs).toContain('namespace ' + test_package);
        });
        xdescribe('preferences', function() {
            it('should not change default project preferences and copy over additional project preferences to platform-level config.xml', function() {
                /*config.preference.add({name:'henrik',value:'sedin'});
                project.update_from_config(config);

                var native_config = new et.ElementTree(et.XML(fs.readFileSync(android_config, 'utf-8')));
                var ps = native_config.findall('preference');
                expect(ps.length).toEqual(7);
                expect(ps[0].attrib.name).toEqual('useBrowserHistory');
                expect(ps[0].attrib.value).toEqual('true');
                expect(ps[6].attrib.name).toEqual('henrik');
                expect(ps[6].attrib.value).toEqual('sedin');*/

                // TODO : figure out if this is supported
                //expect(true).toBe(false);
            });
            it('should override a default project preference if applicable', function() {
                /*config.preference.add({name:'useBrowserHistory',value:'false'});
                project.update_from_config(config);

                var native_config = new et.ElementTree(et.XML(fs.readFileSync(android_config, 'utf-8')));
                var ps = native_config.findall('preference');
                expect(ps.length).toEqual(6);
                expect(ps[0].attrib.name).toEqual('useBrowserHistory');
                expect(ps[0].attrib.value).toEqual('false');*/

                // TODO : figure out if this is supported
                //expect(true).toBe(false);
            });
        });
    });

    describe('cross-platform project level methods', function() {
        var parser, config;

        beforeEach(function() {
            parser = new wp7_parser(wp7_project_path);
            config = new config_parser(www_config);
        });
        afterEach(function() {
        });
        describe('update_www method', function() {
            it('should update all www assets', function() {
                var newFile = path.join(util.projectWww(project_path), 'somescript.js');
                this.after(function() {
                    shell.rm('-f', newFile);
                });
                fs.writeFileSync(newFile, 'alert("sup");', 'utf-8');
                parser.update_www();
                expect(fs.existsSync(path.join(wp7_project_path, 'www', 'somescript.js'))).toBe(true);
            });
            it('should write out windows-phone js to cordova.js', function() {
                parser.update_www();
                expect(fs.readFileSync(path.join(wp7_project_path, 'www', 'cordova.js'),'utf-8')).toEqual(fs.readFileSync(path.join(util.libDirectory, 'cordova-wp7', 'templates', 'standalone', 'www', 'cordova.js'), 'utf-8'));
            });
        });

        xdescribe('update_overrides method',function() {
            /*var mergesPath = path.join(util.appDir(project_path), 'merges', 'android');
            var newFile = path.join(mergesPath, 'merge.js');
            beforeEach(function() {
                shell.mkdir('-p', mergesPath);
                fs.writeFileSync(newFile, 'alert("sup");', 'utf-8');
            });
            afterEach(function() {
                shell.rm('-rf', mergesPath);
            });
            it('should copy a new file from merges into www', function() {
                parser.update_overrides();
                expect(fs.existsSync(path.join(wp7_project_path, 'assets', 'www', 'merge.js'))).toBe(true);
            });

            it('should copy a file from merges over a file in www', function() {
                var newFileWWW = path.join(util.projectWww(project_path), 'merge.js');
                fs.writeFileSync(newFileWWW, 'var foo=1;', 'utf-8');
                this.after(function() {
                    shell.rm('-rf', newFileWWW);
                });
                parser.update_overrides();
                expect(fs.existsSync(path.join(wp7_project_path, 'assets', 'www', 'merge.js'))).toBe(true);
                expect(fs.readFileSync(path.join(wp7_project_path, 'assets', 'www', 'merge.js'),'utf-8')).toEqual('alert("sup");');
            });*/

            // TODO : figure out if this is supported
            //expect(true).toBe(false);
        });

        describe('update_project method', function() {
            it('should invoke update_www', function() {
                var spyWww = spyOn(parser, 'update_www');
                parser.update_project(config);
                expect(spyWww).toHaveBeenCalled();
            });
            it('should invoke update_from_config', function() {
                var spyConfig = spyOn(parser, 'update_from_config');
                parser.update_project(config);
                expect(spyConfig).toHaveBeenCalled();
            });
            it('should call out to util.deleteSvnFolders', function() {
                var spy = spyOn(util, 'deleteSvnFolders');
                parser.update_project(config);
                expect(spy).toHaveBeenCalled();
            });
        });
    });
});