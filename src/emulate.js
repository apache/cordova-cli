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
var cordova_util      = require('./util'),
    path              = require('path'),
    shell             = require('shelljs'),
    config_parser     = require('./config_parser'),
    platforms         = require('../platforms'),
    platform          = require('./platform'),
    fs                = require('fs'),
    ls                = fs.readdirSync,
    n                 = require('ncallbacks'),
    hooker            = require('../src/hooker'),
    util              = require('util');

function shell_out_to_emulate(root, platform, callback) {
    var cmd = '"' + path.join(root, 'platforms', platform, 'cordova', 'run') + '"';
    // TODO: PLATFORM LIBRARY INCONSISTENCY 
    if (platform == 'blackberry') {
        cmd = 'ant -f "' + path.join(root, 'platforms', platform, 'build.xml') + '" qnx load-simulator';
    }
    shell.exec(cmd, {silent:true, async:true}, function(code, output) {
        if (code > 0) {
            throw new Error('An error occurred while emulating/deploying the ' + platform + ' project.' + output);
        } else {
            callback();
        }
    });
}

module.exports = function emulate (platformList, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw new Error('Current working directory is not a Cordova-based project.');
    }

    var xml = cordova_util.projectConfig(projectRoot);
    var cfg = new config_parser(xml);

    if (arguments.length === 0 || (platformList instanceof Array && platformList.length === 0)) {
        platformList = cordova_util.listPlatforms(projectRoot);
    } else if (typeof platformList == 'string') platformList = [platformList];
    else if (platformList instanceof Function && callback === undefined) {
        callback = platformList;
        platformList = cordova_util.listPlatforms(projectRoot);
    }

    if (platformList.length === 0) throw new Error('No platforms added to this project. Please use `cordova platform add <platform>`.');

    var hooks = new hooker(projectRoot);
    if (!(hooks.fire('before_emulate'))) {
        throw new Error('before_emulate hooks exited with non-zero code. Aborting build.');
    }

    var end = n(platformList.length, function() {
        if (!(hooks.fire('after_emulate'))) {
            throw new Error('after_emulate hooks exited with non-zero code. Aborting.');
        }
        if (callback) callback();
    });

    // Iterate over each added platform and shell out to debug command
    platformList.forEach(function(platform) {
        var platformPath = path.join(projectRoot, 'platforms', platform);
        var parser = new platforms[platform].parser(platformPath);
        parser.update_project(cfg, function() {
            shell_out_to_emulate(projectRoot, platform, end);
        });
    });
};

