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
var util              = require('./util'),
    path              = require('path'),
    fs                = require('fs'),
    shell             = require('shelljs'),
    hooker            = require('./hooker'),
    events            = require('./events'),
    n                 = require('ncallbacks');

module.exports = function build(platformList, callback) {
    var projectRoot = util.isCordova(process.cwd());
    if (!projectRoot) {
        var err = new Error('Current working directory is not a Cordova-based project.');
        if (callback) callback(err);
        else throw err;
        return;
    }

    if (arguments.length === 0 || (platformList instanceof Array && platformList.length === 0)) {
        platformList = util.listPlatforms(projectRoot);
    } else if (typeof platformList == 'string') platformList = [platformList];
    else if (platformList instanceof Function && callback === undefined) {
        callback = platformList;
        platformList = util.listPlatforms(projectRoot);
    }

    if (platformList.length === 0) {
        var err = new Error('No platforms added! `cordova platform add <platform>` to add a platform.');
        if (callback) callback(err);
        else throw err;
        return;
    }

    // fire build hooks
    var hooks = new hooker(projectRoot);
    var opts = {
        platforms:platformList
    };
    hooks.fire('before_build', opts, function(err) {
        if (err) {
            if (callback) callback(err);
            else throw err;
        } else {
            require('../cordova').prepare(platformList, function(err) {
                if (err) {
                    if (callback) callback(err);
                    else throw err;
                } else {
                    require('../cordova').compile(platformList, function(err) {
                        if (err) {
                            if (callback) callback(err);
                            else throw err;
                        } else {
                            hooks.fire('after_build', opts, function(err) {
                                if (err) {
                                    if (callback) callback(err);
                                    else throw err;
                                } else {
                                    if (callback) callback();
                                }
                            });
                        }
                    });
                }
            });
        }
    });;
};
