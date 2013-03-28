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
    xcode         = require('xcode'),
    util          = require('../util'),
    shell         = require('shelljs'),
    plist         = require('plist'),
    semver        = require('semver'),
    et            = require('elementtree'),
    config_parser = require('../config_parser');

var MIN_XCODE_VERSION = '4.5.x';

var default_prefs = {
    "KeyboardDisplayRequiresUserAction":"true",
    "SuppressesIncrementalRendering":"false",
    "UIWebViewBounce":"true",
    "TopActivityIndicator":"gray",
    "EnableLocation":"false",
    "EnableViewportScale":"false",
    "AutoHideSplashScreen":"true",
    "ShowSplashScreenSpinner":"true",
    "MediaPlaybackRequiresUserAction":"false",
    "AllowInlineMediaPlayback":"false",
    "OpenAllWhitelistURLsInWebView":"false",
    "BackupWebStorage":"cloud"
};

module.exports = function ios_parser(project) {
    try {
        var xcodeproj_dir = fs.readdirSync(project).filter(function(e) { return e.match(/\.xcodeproj$/i); })[0];
        if (!xcodeproj_dir) throw new Error('The provided path "' + project + '" is not a Cordova iOS project.');
        this.xcodeproj = path.join(project, xcodeproj_dir);
        this.originalName = this.xcodeproj.substring(this.xcodeproj.lastIndexOf('/'), this.xcodeproj.indexOf('.xcodeproj'));
        this.cordovaproj = path.join(project, this.originalName);
    } catch(e) {
        throw new Error('The provided path is not a Cordova iOS project.');
    }
    this.path = project;
    this.pbxproj = path.join(this.xcodeproj, 'project.pbxproj');
    this.config = new config_parser(path.join(this.cordovaproj, 'config.xml'));
};

module.exports.check_requirements = function(callback) {
    // Check xcode + version.
    shell.exec('xcodebuild -version', {silent:true, async:true}, function(code, output) {
        if (code != 0) {
            callback('Xcode is (probably) not installed, specifically the command `xcodebuild` is unavailable or erroring out. Output of `xcodebuild -version` is: ' + output);
        } else {
            var xc_version = output.split('\n')[0].split(' ')[1];
            if (semver.lt(xc_version, MIN_XCODE_VERSION)) {
                callback('Xcode version installed is too old. Minimum: ' + MIN_XCODE_VERSION + ', yours: ' + xc_version);
            } else callback(false);
        }
    });
};

module.exports.prototype = {
    update_from_config:function(config, callback) {
        if (config instanceof config_parser) {
        } else throw new Error('update_from_config requires a config_parser object');
        var name = config.name();
        var pkg = config.packageName();

        // Update package id (bundle id)
        var plistFile = path.join(this.cordovaproj, this.originalName + '-Info.plist');
        var infoPlist = plist.parseFileSync(plistFile);
        infoPlist['CFBundleIdentifier'] = pkg;
        var info_contents = plist.build(infoPlist);
        info_contents = info_contents.replace(/<string>[\s\r\n]*<\/string>/g,'<string></string>');
        fs.writeFileSync(plistFile, info_contents, 'utf-8');

        var root = util.isCordova(this.path);
        shell.cp( '-f', path.join( root, 'www', 'config.xml'),path.join(this.cordovaproj, 'config.xml') );

        // Update product name
        var proj = new xcode.project(this.pbxproj);
        var parser = this;
        proj.parse(function(err,hash) {
            if (err) throw new Error('An error occured during parsing of project.pbxproj. Start weeping.');
            else {
                proj.updateProductName(name);
                fs.writeFileSync(parser.pbxproj, proj.writeSync(), 'utf-8');
                if (callback) callback();
            }
        });
    },

    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.path, 'www');
    },

    update_www:function() {
        var projectRoot = util.isCordova(this.path);
        var www = path.join(projectRoot, 'www');
        var project_www = this.www_dir();

        // remove the stock www folder
        shell.rm('-rf', project_www);

        // copy over project www assets
        shell.cp('-rf', www, this.path);

        // write out proper cordova.js
        shell.cp('-f', path.join(util.libDirectory, 'cordova-ios', 'CordovaLib', 'cordova.ios.js'), path.join(project_www, 'cordova.js'));

    },

    // update the overrides folder into the www folder
    update_overrides:function() {
        var projectRoot = util.isCordova(this.path);
        var merges_path = path.join(projectRoot, 'merges', 'ios');
        if (fs.existsSync(merges_path)) {
            var overrides = path.join(merges_path, '*');
            shell.cp('-rf', overrides, this.www_dir());
        }
    },

    update_project:function(cfg, callback) {
        var self = this;
        this.update_from_config(cfg, function() {
            self.update_www();
            self.update_overrides();
            util.deleteSvnFolders(self.www_dir());
            if (callback) callback();
        });
    }
};
