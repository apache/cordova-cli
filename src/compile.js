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
    config_parser     = require('./config_parser'),
    fs                = require('fs'),
    shell             = require('shelljs'),
    et                = require('elementtree'),
    hooker            = require('./hooker'),
    n                 = require('ncallbacks');


function shell_out_to_debug(projectRoot, platform, callback) {
    var cmd = path.join(projectRoot, 'platforms', platform);
    // TODO: this is bb10 only for now
    // TODO: PLATFORM LIBRARY INCONSISTENCY
    if (platform == 'blackberry') {
        cmd = 'ant -f "' + path.join(cmd, 'build.xml') + '" qnx load-device';
    } else {
        cmd = '"' + path.join(cmd, 'cordova', 'build') + '"';
    }
    shell.exec(cmd, {silent:true, async:true}, function(code, output) {
        if (code > 0) {
            throw new Error('An error occurred while building the ' + platform + ' project. ' + output);
        } else {
            if (callback) callback();
        }
    });
}


module.exports = function compile(platforms, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw new Error('Current working directory is not a Cordova-based project.');
    }

    var xml = cordova_util.projectConfig(projectRoot);
    var cfg = new config_parser(xml);

    if (arguments.length === 0 || (platforms instanceof Array && platforms.length === 0)) {
        platforms = cordova_util.listPlatforms(projectRoot);
    } else if (typeof platforms == 'string') platforms = [platforms];
    else if (platforms instanceof Function && callback === undefined) {
        callback = platforms;
        platforms = cordova_util.listPlatforms(projectRoot);
    }

    if (platforms.length === 0) throw new Error('No platforms added to this project. Please use `cordova platform add <platform>`.');

    var hooks = new hooker(projectRoot);
    if (!(hooks.fire('before_compile'))) {
        throw new Error('before_compile hooks exited with non-zero code. Aborting.');
    }

    var end = n(platforms.length, function() {
        if (!(hooks.fire('after_compile'))) {
            throw new Error('after_compile hooks exited with non-zero code. Aborting.');
        }
        if (callback) callback();
    });

    // Iterate over each added platform
    platforms.forEach(function(platform) {
        shell_out_to_debug(projectRoot, platform, end);
    });
};


