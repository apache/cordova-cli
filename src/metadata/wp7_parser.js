
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
        var csproj_path   = fs.readdirSync(project).filter(function(e) { return e.match(/\.csproj$/i); })[0];
        this.wp7_proj_dir = project;
        this.csproj_path  = path.join(this.wp7_proj_dir, csproj_path);
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
        //Strip three bytes that windows adds (http://www.multiasking.com/2012/11/851/#comment-3076)
        var cleanedMan = man.replace('\ufeff', '');
        var manifest = new et.ElementTree(et.XML(cleanedMan));
        var prev_name = manifest.find('.//App[@Title]')['attrib']['Title'];
        if(prev_name != name)
        {
            console.log("Updating app name from " + prev_name + " to " + name);
            manifest.find('.//App').attrib.Title = name;
            manifest.find('.//Title').text = name;
            fs.writeFileSync(this.manifest_path, manifest.write({indent: 4}), 'utf-8'); 
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
         var cleanedPage = raw.replace('\ufeff', '');
         var csproj = new et.ElementTree(et.XML(cleanedPage));
         prev_name = csproj.find('.//RootNamespace').text;
         if(prev_name != pkg)
         {
            console.log("Updating package name from " + prev_name + " to " + pkg);
            //CordovaAppProj.csproj
            csproj.find('.//RootNamespace').text = pkg;
            csproj.find('.//AssemblyName').text = pkg;
            csproj.find('.//XapFilename').text = pkg + '.xap';
            csproj.find('.//SilverlightAppEntry').text = pkg + '.App';
            fs.writeFileSync(this.csproj_path, csproj.write({indent: 4}), 'utf-8');
            //MainPage.xaml
            raw = fs.readFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml'), 'utf-8');
            cleanedPage = raw.replace('\ufeff', '');
            var mainPageXAML = new et.ElementTree(et.XML(cleanedPage));
            mainPageXAML._root.attrib['x:Class'] = pkg + '.MainPage';
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml'), mainPageXAML.write({indent: 4}), 'utf-8');
            //MainPage.xaml.cs
            var mainPageCS = fs.readFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml.cs'), 'utf-8');
            var namespaceRegEx = new RegExp("namespace\s" + prev_name);
            mainPageCS.replace(namespaceRegEx, 'namespace ' + pkg);
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'MainPage.xaml'), mainPageCS, 'utf-8');
            //App.xaml
            raw = fs.readFileSync(path.join(this.wp7_proj_dir, 'App.xaml'), 'utf-8');
            cleanedPage = raw.replace('\ufeff', '');
            var appXAML = new et.ElementTree(et.XML(cleanedPage));
            appXAML._root.attrib['x:Class'] = pkg + '.App';
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'App.xaml'), appXAML.write({indent: 4}), 'utf-8');
            //App.xaml.cs
            var appCS = fs.readFileSync(path.join(this.wp7_proj_dir, 'App.xaml.cs'), 'utf-8');
            appCS.replace(namespaceRegEx, 'namespace ' + pkg);
            fs.writeFileSync(path.join(this.wp7_proj_dir, 'App.xaml.cs'), appCS, 'utf-8');
         }
    },
    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.wp7_proj_dir, 'www');
    },
    // copyies the app www folder into the wp7 project's www folder
    update_www:function() {
        var project_www = util.projectWww();
        // remove stock platform assets
        shell.rm('-rf', this.www_dir());
        // copy over all app www assets
        shell.cp('-rf', project_www, this.wp7_proj_dir);

        // copy over wp7 lib's cordova.js
        var VERSION = fs.readFileSync(path.join(this.wp7_proj_dir, 'VERSION'), 'utf-8').replace(/\r\n/,'').replace(/\n/,'');
        var cordovajs_path = path.join(util.libDirectory, 'cordova-wp7', 'templates', 'standalone', 'www', 'cordova-' + VERSION + '.js');
        fs.writeFileSync(path.join(this.www_dir(), 'cordova.js'), fs.readFileSync(cordovajs_path, 'utf-8'), 'utf-8');
    },
    // calls the nessesary functions to update the wp7 project 
    update_project:function(cfg, callback) {
        console.log("Updating wp7 project...");

        this.update_from_config(cfg);
        this.update_www();
        util.deleteSvnFolders(this.www_dir());

        console.log("Done updating.");

        if (callback) callback();
    }
};

