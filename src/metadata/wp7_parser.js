
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
var fs            = require('fs'),
    path          = require('path'),
    et            = require('elementtree'),
    util          = require('../util'),
    shell         = require('shelljs'),
    config_parser = require('../config_parser');

module.exports = function wp7_parser(project) {
    try {
        // TODO : Check that it's not a wp7 project?
        var csproj_file   = fs.readdirSync(project).filter(function(e) { return e.match(/\.csproj$/i); })[0];
        if (!csproj_file) throw new Error('The provided path "' + project + '" is not a Windows Phone 8 project.');
        this.wp7_proj_dir = project;
        this.csproj_path  = path.join(this.wp7_proj_dir, csproj_file);
        this.sln_path     = path.join(this.wp7_proj_dir, csproj_file.replace(/\.csproj/, '.sln'));
    } catch(e) {
        throw new Error('The provided path "' + project + '" is not a Windows Phone 8 project.' + e);
    }
    this.manifest_path  = path.join(this.wp7_proj_dir, 'Properties', 'WMAppManifest.xml');
};

module.exports.check_requirements = function(callback) {
    shell.exec(path.join(util.libDirectory, 'cordova-wp7', 'bin', 'check_reqs'), {silent:true, async:true}, function(code, output) {
        if (code != 0) {
            callback(output);
        } else {
                callback(false);
        }
    });
};

module.exports.prototype = {
    update_from_config:function(config) {
        //check config parser
        if (config instanceof config_parser) {
        } else throw new Error('update_from_config requires a config_parser object');

        // Update app name by editing app title in Properties\WMAppManifest.xml
        var name = config.name();
        var man = fs.readFileSync(this.manifest_path, 'utf-8');
        //Strip three bytes that windows adds (http://www.multiasking.com/2012/11/851/)
        var cleanedMan = man.replace('\ufeff', '');
        var manifest = new et.ElementTree(et.XML(cleanedMan));
        var prev_name = manifest.find('.//App[@Title]')['attrib']['Title'];
        if(prev_name != name)
        {
            //console.log("Updating app name from " + prev_name + " to " + name);
            manifest.find('.//App').attrib.Title = name;
            manifest.find('.//Title').text = name;
            fs.writeFileSync(this.manifest_path, manifest.write({indent: 4}), 'utf-8');

            //update name of sln and csproj.
            name = name.replace(/(\.\s|\s\.|\s+|\.+)/g, '_'); //make it a ligitamate name
            prev_name = prev_name.replace(/(\.\s|\s\.|\s+|\.+)/g, '_'); 
            // TODO: might return .sln.user? (generated file)
            var sln_name = fs.readdirSync(this.wp7_proj_dir).filter(function(e) { return e.match(/\.sln$/i); })[0];
            var sln_path = path.join(this.wp7_proj_dir, sln_name);
            var sln_file = fs.readFileSync(sln_path, 'utf-8');
            var name_regex = new RegExp(prev_name, "g");
            fs.writeFileSync(sln_path, sln_file.replace(name_regex, name), 'utf-8');
            shell.mv('-f', this.csproj_path, path.join(this.wp7_proj_dir, name + '.csproj'));
            this.csproj_path = path.join(this.wp7_proj_dir, name + '.csproj');
            shell.mv('-f', sln_path, path.join(this.wp7_proj_dir, name + '.sln'));
            this.sln_path    = path.join(this.wp7_proj_dir, name + '.sln');
        }

        // Update package name by changing:
        /*  - CordovaAppProj.csproj
         *  - MainPage.xaml
         *  - MainPage.xaml.cs
         *  - App.xaml
         *  - App.xaml.cs
         */
         var pkg = config.packageName();
         var raw = fs.readFileSync(this.csproj_path, 'utf-8');
         var cleanedPage = raw.replace(/^\uFEFF/i, '');
         var csproj = new et.ElementTree(et.XML(cleanedPage));
         prev_name = csproj.find('.//RootNamespace').text;
         if(prev_name != pkg)
         {
            //console.log("Updating package name from " + prev_name + " to " + pkg);
            //CordovaAppProj.csproj
            csproj.find('.//RootNamespace').text = pkg;
            csproj.find('.//AssemblyName').text = pkg;
            csproj.find('.//XapFilename').text = pkg + '.xap';
            csproj.find('.//SilverlightAppEntry').text = pkg + '.App';
            fs.writeFileSync(this.csproj_path, csproj.write({indent: 4}), 'utf-8');
            //MainPage.xaml
            raw = fs.readFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml'), 'utf-8');
            // Remove potential UTF Byte Order Mark
            cleanedPage = raw.replace(/^\uFEFF/i, '');
            var mainPageXAML = new et.ElementTree(et.XML(cleanedPage));
            mainPageXAML._root.attrib['x:Class'] = pkg + '.MainPage';
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml'), mainPageXAML.write({indent: 4}), 'utf-8');
            //MainPage.xaml.cs
            var mainPageCS = fs.readFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml.cs'), 'utf-8');
            var namespaceRegEx = new RegExp('namespace ' + prev_name);
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml.cs'), mainPageCS.replace(namespaceRegEx, 'namespace ' + pkg), 'utf-8');
            //App.xaml
            raw = fs.readFileSync(path.join(this.wp7_proj_dir, 'App.xaml'), 'utf-8');
            cleanedPage = raw.replace(/^\uFEFF/i, '');
            var appXAML = new et.ElementTree(et.XML(cleanedPage));
            appXAML._root.attrib['x:Class'] = pkg + '.App';
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'App.xaml'), appXAML.write({indent: 4}), 'utf-8');
            //App.xaml.cs
            var appCS = fs.readFileSync(path.join(this.wp7_proj_dir, 'App.xaml.cs'), 'utf-8');
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'App.xaml.cs'), appCS.replace(namespaceRegEx, 'namespace ' + pkg), 'utf-8');
         }
    },
    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.wp7_proj_dir, 'www');
    },
    // copyies the app www folder into the wp7 project's www folder
    update_www:function() {
        var project_www = path.join(this.wp7_proj_dir, '..', '..', util.projectWww());
        // remove stock platform assets
        shell.rm('-rf', this.www_dir());
        // copy over all app www assets
        shell.cp('-rf', project_www, this.wp7_proj_dir);

        // copy over wp7 lib's cordova.js
        var raw_version = fs.readFileSync(path.join(util.libDirectory, 'cordova-wp7', 'VERSION'), 'utf-8')
        var VERSION = raw_version.replace(/\r\n/,'').replace(/\n/,'');
        var cordovajs_path = path.join(util.libDirectory, 'cordova-wp7', 'templates', 'standalone', 'www', 'cordova-' + VERSION + '.js');
        fs.writeFileSync(path.join(this.www_dir(), 'cordova.js'), fs.readFileSync(cordovajs_path, 'utf-8'), 'utf-8');
    },

    staging_dir: function() {
        return path.join(this.path, '.staging', 'www');
    },

    update_staging: function() {
        var projectRoot = util.isCordova(this.path);
        if (fs.existsSync(this.staging_dir())) {
            var staging = path.join(this.staging_dir(), '*');
            shell.cp('-rf', staging, this.www_dir());
        }
    },

    // calls the nessesary functions to update the wp7 project 
    update_project:function(cfg, callback) {
        //console.log("Updating wp7 project...");

        this.update_from_config(cfg);
        this.update_www();
        // TODO: Add overrides support? Why is this missing?
        this.update_staging();
        util.deleteSvnFolders(this.www_dir());

        //console.log("Done updating.");

        if (callback) callback();
    }
};

