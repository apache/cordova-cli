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
    platforms         = require('../platforms'),
    platform          = require('./platform'),
    fs                = require('fs'),
    shell             = require('shelljs'),
    et                = require('elementtree'),
    hooker            = require('./hooker'),
    lazy_load         = require('./lazy_load'),
    config            = require('./config'),
    events            = require('./events'),
    n                 = require('ncallbacks'),
    Q                 = require('q'),
    prompt            = require('prompt'),
    plugman           = require('plugman'),
    util              = require('util');

// Returns a promise.
module.exports = function prepare(options) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!options) {
        options = {
            verbose: false,
            platforms: [],
            options: []
        };
    }

    options = cordova_util.preProcessOptions(options);
    if (options.constructor.name === "Error") {
        return Q.reject(options);
    }

    var xml = cordova_util.projectConfig(projectRoot);
    var paths = options.platforms.map(function(p) {
        var platform_path = path.join(projectRoot, 'platforms', p);
        var parser = (new platforms[p].parser(platform_path));
        return parser.www_dir();
    });
    options.paths = paths;

    var hooks = new hooker(projectRoot);
    return hooks.fire('before_prepare', options)
    .then(function() {
        var cfg = new cordova_util.config_parser(xml);

        // Iterate over each added platform
        return Q.all(options.platforms.map(function(platform) {
            var platformPath = path.join(projectRoot, 'platforms', platform);
            return lazy_load.based_on_config(projectRoot, platform)
            .then(function() {
                var parser = new platforms[platform].parser(platformPath);
                return parser.update_project(cfg);
            }).then(function() {
                // Call plugman --prepare for this platform. sets up js-modules appropriately.
                var plugins_dir = path.join(projectRoot, 'plugins');
                events.emit('verbose', 'Calling plugman.prepare for platform "' + platform + '"');
                plugman.prepare(platformPath, platform, plugins_dir);
                // Make sure that config changes for each existing plugin is in place
                var plugins = cordova_util.findPlugins(plugins_dir);
                var platform_json = plugman.config_changes.get_platform_json(plugins_dir, platform);
                plugins && plugins.forEach(function(plugin_id) {
                    if (platform_json.installed_plugins[plugin_id]) {
                        events.emit('verbose', 'Ensuring plugin "' + plugin_id + '" is installed correctly...');
                        plugman.config_changes.add_plugin_changes(platform, platformPath, plugins_dir, plugin_id, /* variables for plugin */ platform_json.installed_plugins[plugin_id], /* top level plugin? */ true, /* should increment config munge? cordova-cli never should, only plugman */ false);
                    } else if (platform_json.dependent_plugins[plugin_id]) {
                        events.emit('verbose', 'Ensuring plugin "' + plugin_id + '" is installed correctly...');
                        plugman.config_changes.add_plugin_changes(platform, platformPath, plugins_dir, plugin_id, /* variables for plugin */ platform_json.dependent_plugins[plugin_id], /* top level plugin? */ false, /* should increment config munge? cordova-cli never should, only plugman */ false);
                    }
                    events.emit('verbose', 'Plugin "' + plugin_id + '" is good to go.');
                });
            });
        })).then(function() {
            return hooks.fire('after_prepare', options);
        });
    });
};
