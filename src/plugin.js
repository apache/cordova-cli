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
var cordova_util  = require('./util'),
    util          = require('util'),
    fs            = require('fs'),
    shell         = require('shelljs'),
    path          = require('path'),
    shell         = require('shelljs'),
    config_parser = require('./config_parser'),
    hooker        = require('./hooker'),
    core_platforms= require('../platforms'),
    platform      = require('./platform'),
    plugin_parser = require('./plugin_parser'),
    ls            = fs.readdirSync;

module.exports = function plugin(command, targets, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw new Error('Current working directory is not a Cordova-based project.');
    }
    if (arguments.length === 0) command = 'ls';

    var hooks = new hooker(projectRoot);

    var projectWww = path.join(projectRoot, 'www');

    // Grab config info for the project
    var xml = path.join(projectWww, 'config.xml');
    var cfg = new config_parser(xml);
    var platforms = cordova_util.listPlatforms(projectRoot);

    // Massage plugin name(s) / path(s)
    var pluginPath, plugins, names = [];
    pluginPath = path.join(projectRoot, 'plugins');
    plugins = ls(pluginPath);
    if (targets) {
        if (!(targets instanceof Array)) targets = [targets];
        targets.forEach(function(target) {
            if (target[target.length - 1] == path.sep) {
                target = target.substring(0, target.length - 1);
            }

            var targetName = target.substr(target.lastIndexOf(path.sep) + 1);
            names.push(targetName);
        });
    }

    switch(command) {
        case 'ls':
        case 'list':
            // TODO awkward before+after hooks here
            hooks.fire('before_plugin_ls');
            hooks.fire('after_plugin_ls');
            if (plugins.length) {
                return plugins;
            } else return 'No plugins added. Use `cordova plugin add <plugin>`.';
            break;
        case 'add':
            targets.forEach(function(target, index) {
                hooks.fire('before_plugin_add');
                var cli = path.join(__dirname, '..', 'node_modules', 'plugman', 'plugman.js');
                var pluginsDir = path.join(projectRoot, 'plugins');

                if (target[target.length - 1] == path.sep) {
                    target = target.substring(0, target.length - 1);
                }

                // Fetch the plugin first.
                var cmd = util.format('%s --fetch --plugin "%s" --plugins_dir "%s"', cli, target, pluginsDir);
                console.log(cmd);
                var plugin_fetch = shell.exec(cmd, {silent: true});
                if (plugin_fetch.code > 0) throw new Error('An error occured during plugin fetching:\n' + plugin_fetch.output);

                // Iterate over all platforms in the project and install the plugin.
                platforms.forEach(function(platform) {
                    cmd = util.format('%s --platform %s --project "%s" --plugin "%s" --plugins_dir "%s"', cli, platform, path.join(projectRoot, 'platforms', platform), names[index], pluginsDir);
                    console.log(cmd);
                    var plugin_cli = shell.exec(cmd, {silent:true});
                    if (plugin_cli.code > 0) throw new Error('An error occured during plugin installation for ' + platform + ': ' + plugin_cli.output);
                });

                hooks.fire('after_plugin_add');
            });
            if (callback) callback();
            break;
        case 'rm':
        case 'remove':
            if (platforms.length === 0) {
                throw new Error('You need at least one platform added to your app. Use `cordova platform add <platform>`.');
            }
            targets.forEach(function(target, index) {
                var targetName = names[index];
                // Check if we have the plugin.
                if (plugins.indexOf(targetName) > -1) {
                    var targetPath = path.join(pluginPath, targetName);
                    hooks.fire('before_plugin_rm');
                    var cli = path.join(__dirname, '..', 'node_modules', 'plugman', 'plugman.js');

                    // Check if there is at least one match between plugin
                    // supported platforms and app platforms
                    var pluginXml = new plugin_parser(path.join(targetPath, 'plugin.xml'));
                    var intersection = pluginXml.platforms.filter(function(e) {
                        if (platforms.indexOf(e) == -1) return false;
                        else return true;
                    });

                    // Iterate over all matchin app-plugin platforms in the project and uninstall the
                    // plugin.
                    var cmd;
                    intersection.forEach(function(platform) {
                        cmd = util.format('%s --platform %s --project "%s" --plugin "%s" --plugins_dir "%s" --uninstall', cli, platform, path.join(projectRoot, 'platforms', platform), targetName, path.join(projectRoot, 'plugins'));
                        console.log(cmd);
                        var plugin_cli = shell.exec(cmd, {silent:true});
                        if (plugin_cli.code > 0) throw new Error('An error occured during plugin uninstallation for ' + platform + '. ' + plugin_cli.output);
                    });

                    // Finally remove the plugin dir from plugins/
                    cmd = util.format('%s --plugin "%s" --plugins_dir "%s" --remove', cli, targetName, path.join(projectRoot, 'plugins'));
                    console.log(cmd);
                    var plugin_remove = shell.exec(cmd, {silent: true});
                    if (plugin_remove.code > 0) throw new Error('An error occurred during plugin removal:\n' + plugin_remove.output);

                    hooks.fire('after_plugin_rm');
                } else {
                    throw new Error('Plugin "' + targetName + '" not added to project.');
                }
            });
            if (callback) callback();
            break;
        default:
            throw new Error('Unrecognized command "' + command + '". Use either `add`, `remove`, or `list`.');
    }
};
