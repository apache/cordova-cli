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
            var targetName = target.substr(target.lastIndexOf('/') + 1);
            if (targetName[targetName.length-1] == '/') targetName = targetName.substr(0, targetName.length-1);
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
            if (platforms.length === 0) {
                throw new Error('You need at least one platform added to your app. Use `cordova platform add <platform>`.');
            }
            targets.forEach(function(target, index) {
                var pluginContents = ls(target);
                var targetName = names[index];
                // Check if we already have the plugin.
                // TODO edge case: if a new platform is added, then you want
                // to re-add the plugin to the new platform.
                if (plugins.indexOf(targetName) > -1) {
                    throw new Error('Plugin "' + targetName + '" already added to project.');
                }
                // Check if the plugin has a plugin.xml in the root of the
                // specified dir.
                if (pluginContents.indexOf('plugin.xml') == -1) {
                    throw new Error('Plugin "' + targetName + '" does not have a plugin.xml in the root. Plugin must support the Cordova Plugin Specification: https://github.com/alunny/cordova-plugin-spec');
                }

                // Check if there is at least one match between plugin
                // supported platforms and app platforms
                var pluginXml = new plugin_parser(path.join(target, 'plugin.xml'));
                var intersection = pluginXml.platforms.filter(function(e) {
                    if (platforms.indexOf(e) == -1) return false;
                    else return true;
                });
                if (intersection.length === 0) {
                    throw new Error('Plugin "' + targetName + '" does not support any of your application\'s platforms. Plugin platforms: ' + pluginXml.platforms.join(', ') + '; your application\'s platforms: ' + platforms.join(', '));
                }

                hooks.fire('before_plugin_add');

                var cli = path.join(__dirname, '..', 'node_modules', 'plugman', 'plugman.js');

                // Iterate over all matchin app-plugin platforms in the project and install the
                // plugin.
                intersection.forEach(function(platform) {
                    var cmd = util.format('%s --platform %s --project "%s" --plugin "%s"', cli, platform, path.join(projectRoot, 'platforms', platform), target);
                    var plugin_cli = shell.exec(cmd, {silent:true});
                    if (plugin_cli.code > 0) throw new Error('An error occured during plugin installation for ' + platform + '. ' + plugin_cli.output);
                });

                // Add the plugin web assets to the www folder as well.
                var assets = pluginXml.doc.findall('plugin/asset');
                assets.forEach(function(asset) {
                    asset = path.resolve(path.join(target, asset.attrib.src));
                    var info = fs.lstatSync(asset);
                    var name = asset.substr(asset.lastIndexOf('/')+1);
                    var wwwPath = path.join(projectWww, name);
                    if (info.isDirectory()) {
                        shell.cp('-r', asset, projectWww);
                    } else {
                        fs.writeFileSync(wwwPath, fs.readFileSync(asset));
                    }
                });

                // Finally copy the plugin into the project
                var targetPath = path.join(pluginPath, targetName);
                shell.mkdir('-p', targetPath);
                shell.cp('-r', path.join(target, '*'), targetPath);

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
                    intersection.forEach(function(platform) {
                        var cmd = util.format('%s --platform %s --project "%s" --plugin "%s" --remove', cli, platform, path.join(projectRoot, 'platforms', platform), targetPath);
                        var plugin_cli = shell.exec(cmd, {silent:true});
                        if (plugin_cli.code > 0) throw new Error('An error occured during plugin uninstallation for ' + platform + '. ' + plugin_cli.output);
                    });

                    // Remove the plugin web assets from the www folder as well.
                    var assets = pluginXml.doc.findall('plugin/asset');
                    assets.forEach(function(asset) {
                        asset = path.resolve(path.join(projectWww, asset.attrib.src));
                        var info = fs.lstatSync(asset);
                        if (info.isDirectory()) {
                            shell.rm('-rf', asset);
                        } else {
                            fs.unlinkSync(asset);
                        }
                    });

                    // Remove the plugin web assets to the www folder as well
                    // TODO: assumption that web assets go under www folder
                    // inside plugin dir; instead should read plugin.xml
                    wwwContents.forEach(function(asset) {
                        asset = path.resolve(path.join(projectWww, asset));
                        var info = fs.lstatSync(asset);
                    });

                    // Finally remove the plugin dir from plugins/
                    shell.rm('-rf', targetPath);

                    hooks.fire('after_plugin_rm');
                } else {
                    throw 'Plugin "' + targetName + '" not added to project.';
                }
            });
            if (callback) callback();
            break;
        default:
            throw new Error('Unrecognized command "' + command + '". Use either `add`, `remove`, or `list`.');
    }
};
