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
    path          = require('path'),
    shell         = require('shelljs'),
    platforms     = require('../platforms'),
    n             = require('ncallbacks'),
    hooker        = require('./hooker'),
    plugman       = require('plugman'),
    events        = require('./events');

module.exports = function plugin(command, targets, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        var err = new Error('Current working directory is not a Cordova-based project.');
        if (callback) callback(err);
        else throw err;
        return;
    }
    if (arguments.length === 0) command = 'ls';

    var hooks = new hooker(projectRoot);
    var platformList = cordova_util.listPlatforms(projectRoot);

    // Massage plugin name(s) / path(s)
    var pluginPath, plugins;
    pluginPath = path.join(projectRoot, 'plugins');
    plugins = cordova_util.findPlugins(pluginPath);
    if (targets) {
        if (!(targets instanceof Array)) {
            targets = [targets];
        }
    } else {
        if (command == 'add' || command == 'rm') {
            var err = new Error('You need to qualify `add` or `remove` with one or more plugins!');
            if (callback) return callback(err);
            else throw err;
        }
    }

    var opts = {
        plugins:targets
    };

    switch(command) {
        case 'add':
            var end = n(targets.length, function() {
                hooks.fire('after_plugin_add', opts, function(err) {
                    if (err) {
                        if (callback) callback(err);
                        else throw err;
                    } else {
                        if (callback) callback();
                    }
                });
            });
            hooks.fire('before_plugin_add', opts, function(err) {
                if (err) {
                    if (callback) callback(err);
                    else throw err;
                } else {
                    targets.forEach(function(target, index) {
                        var pluginsDir = path.join(projectRoot, 'plugins');

                        if (target[target.length - 1] == path.sep) {
                            target = target.substring(0, target.length - 1);
                        }

                        // Fetch the plugin first.
                        events.emit('log', 'Calling plugman.fetch on plugin "' + target + '"');
                        plugman.fetch(target, pluginsDir, {}, function(err, dir) {
                            if (err) {
                                var err = new Error('Error fetching plugin: ' + err);
                                if (callback) callback(err);
                                else throw err;
                            } else {
                                // Iterate over all platforms in the project and install the plugin.
                                platformList.forEach(function(platform) {
                                    var platformRoot = path.join(projectRoot, 'platforms', platform);
                                    var parser = new platforms[platform].parser(platformRoot);
                                    // TODO: unify use of blackberry in cli vs blackberry10 in plugman
                                    events.emit('log', 'Calling plugman.install on plugin "' + dir + '" for platform "' + platform + '"');
                                    plugman.install((platform=='blackberry'?'blackberry10':platform), platformRoot,
                                                    path.basename(dir), pluginsDir, { www_dir: parser.staging_dir() });
                                });
                                end();
                            }
                        });
                    });
                }
            });
            break;
        case 'rm':
        case 'remove':
            var end = n(targets.length, function() {
                hooks.fire('after_plugin_rm', opts, function(err) {
                    if (err) {
                        if (callback) callback(err);
                        else throw err;
                    } else {
                        if (callback) callback();
                    }
                });
            });
            hooks.fire('before_plugin_rm', opts, function(err) {
                if (err) {
                    if (callback) callback(err);
                    else throw err;
                } else {
                    targets.forEach(function(target, index) {
                        // Check if we have the plugin.
                        if (plugins.indexOf(target) > -1) {
                            var targetPath = path.join(pluginPath, target);
                            // Check if there is at least one match between plugin
                            // supported platforms and app platforms
                            var pluginXml = new cordova_util.plugin_parser(path.join(targetPath, 'plugin.xml'));
                            var intersection = pluginXml.platforms.filter(function(e) {
                                if (platformList.indexOf(e) == -1) return false;
                                else return true;
                            });

                            // Iterate over all installed platforms and uninstall.
                            // If this is a web-only or dependency-only plugin, then
                            // there may be nothing to do here except remove the
                            // reference from the platform's plugin config JSON.
                            platformList.forEach(function(platform) {
                                var platformRoot = path.join(projectRoot, 'platforms', platform);
                                var parser = new platforms[platform].parser(platformRoot);
                                events.emit('log', 'Calling plugman.uninstall on plugin "' + target + '" for platform "' + platform + '"');
                                plugman.uninstall.uninstallPlatform((platform=='blackberry'?'blackberry10':platform), platformRoot, target, path.join(projectRoot, 'plugins'), { www_dir: parser.staging_dir() });
                            });
                            plugman.uninstall.uninstallPlugin(target, path.join(projectRoot, 'plugins'), end);
                        } else {
                            var err = new Error('Plugin "' + target + '" not added to project.');
                            if (callback) callback(err);
                            else throw err;
                            return;
                        }
                    });
                }
            });
            break;
        case 'ls':
        case 'list':
        default:
            hooks.fire('before_plugin_ls', function(err) {
                if (err) {
                    if (callback) callback(err);
                    else throw err;
                } else {
                    events.emit('results', (plugins.length ? plugins : 'No plugins added. Use `cordova plugin add <plugin>`.'));
                    hooks.fire('after_plugin_ls', function(err) {
                        if (err) {
                            if (callback) callback(err);
                            else throw err;
                        } else {
                            if (callback) callback(undefined, plugins);
                        }
                    });
                }
            });
            break;
    }
};
