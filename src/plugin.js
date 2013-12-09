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

// Returns a promise.
module.exports = function plugin(command, targets) {
    var cordova_util  = require('./util'),
        path          = require('path'),
        hooker        = require('./hooker'),
        Q             = require('q'),
        events        = require('./events');

    var projectRoot = cordova_util.cdProjectRoot(),
        err;

    if (arguments.length === 0){
        command = 'ls';
        targets = [];
    } else {
        targets = Array.prototype.slice.call(arguments, 1);
    }

    var hooks = new hooker(projectRoot);
    var platformList = cordova_util.listPlatforms(projectRoot);

    // Massage plugin name(s) / path(s)
    var pluginPath, plugins;
    pluginPath = path.join(projectRoot, 'plugins');
    plugins = cordova_util.findPlugins(pluginPath);
    if (!targets || !targets.length) {
        if (command == 'add' || command == 'rm') {
            return Q.reject(new Error('You need to qualify `add` or `remove` with one or more plugins!'));
        } else {
            targets = [];
        }
    }

    var opts = {
        plugins: [],
        options: []
    };

    if (targets.length == 1 && Array.isArray(targets[0]))
        targets = targets[0];

    //Split targets between plugins and options
    //Assume everything after a token with a '-' is an option
    var i;
    for (i = 0; i < targets.length; i++) {
        if (targets[i].match(/^-/)) {
            opts.options = targets.slice(i);
            break;
        } else {
            opts.plugins.push(targets[i]);
        }
    }

    switch(command) {
        case 'add':
            return hooks.fire('before_plugin_add', opts)
            .then(function() {
                return opts.plugins.reduce(function(soFar, target) {
                    var pluginsDir = path.join(projectRoot, 'plugins');
                    return soFar.then(function() {
                        if (target[target.length - 1] == path.sep) {
                            target = target.substring(0, target.length - 1);
                        }

                        // Fetch the plugin first.
                        events.emit('verbose', 'Calling plugman.fetch on plugin "' + target + '"');
                        var plugman = require('plugman');
                        return plugman.raw.fetch(target, pluginsDir, {})
                    })
                    .fail(function(err) {
                        return Q.reject(new Error('Fetching plugin failed: ' + err));
                    })
                    .then(function(dir) {
                        // Iterate (in serial!) over all platforms in the project and install the plugin.
                        return platformList.reduce(function(soFar, platform) {
                            return soFar.then(function() {
                                var platforms = require('../platforms');
                                var platformRoot = path.join(projectRoot, 'platforms', platform),
                                    parser = new platforms[platform].parser(platformRoot),
                                    options = {
                                        www_dir: parser.staging_dir(),
                                        cli_variables: {}
                                    },
                                    tokens,
                                    key,
                                    i;
                                //parse variables into cli_variables
                                for (i=0; i< opts.options.length; i++) {
                                    if (opts.options[i] === "--variable" && typeof opts.options[++i] === "string") {
                                        tokens = opts.options[i].split('=');
                                        key = tokens.shift().toUpperCase();
                                        if (/^[\w-_]+$/.test(key)) {
                                            options.cli_variables[key] = tokens.join('=');
                                        }
                                    }
                                }

                                events.emit('verbose', 'Calling plugman.install on plugin "' + dir + '" for platform "' + platform + '" with options "' + JSON.stringify(options)  + '"');
                                return plugman.raw.install(platform, platformRoot, path.basename(dir), pluginsDir, options);
                            });
                        }, Q());
                    });
                }, Q()); // end Q.all
            }).then(function() {
                return hooks.fire('after_plugin_add', opts);
            });
            break;
        case 'rm':
        case 'remove':
            return hooks.fire('before_plugin_rm', opts)
            .then(function() {
                return opts.plugins.reduce(function(soFar, target) {
                    // Check if we have the plugin.
                    if (plugins.indexOf(target) < 0) {
                        return Q.reject(new Error('Plugin "' + target + '" not added to project.'));
                    }

                    var targetPath = path.join(pluginPath, target);
                    // Iterate over all installed platforms and uninstall.
                    // If this is a web-only or dependency-only plugin, then
                    // there may be nothing to do here except remove the
                    // reference from the platform's plugin config JSON.
                    var plugman = require('plugman');
                    return platformList.reduce(function(soFar, platform) {
                        return soFar.then(function() {
                            var platformRoot = path.join(projectRoot, 'platforms', platform);
                            var platforms = require('../platforms');
                            var parser = new platforms[platform].parser(platformRoot);
                            events.emit('verbose', 'Calling plugman.uninstall on plugin "' + target + '" for platform "' + platform + '"');
                            return plugman.raw.uninstall.uninstallPlatform(platform, platformRoot, target, path.join(projectRoot, 'plugins'), { www_dir: parser.staging_dir() });
                        });
                    }, Q())
                    .then(function() {
                        return plugman.raw.uninstall.uninstallPlugin(target, path.join(projectRoot, 'plugins'));
                    });
                }, Q());
            }).then(function() {
                return hooks.fire('after_plugin_rm', opts);
            });
            break;
        case 'search':
            return hooks.fire('before_plugin_search')
            .then(function() {
                var plugman = require('plugman');
                return plugman.raw.search(opts.plugins);
            }).then(function(plugins) {
                for(var plugin in plugins) {
                    events.emit('results', plugins[plugin].name, '-', plugins[plugin].description || 'no description provided');
                }
            }).then(function() {
                return hooks.fire('after_plugin_search');
            });
            break;
        case 'ls':
        case 'list':
        default:
            return hooks.fire('before_plugin_ls')
            .then(function() {
                events.emit('results', (plugins.length ? plugins : 'No plugins added. Use `cordova plugin add <plugin>`.'));
                return hooks.fire('after_plugin_ls')
                .then(function() {
                    return plugins;
                });
            });
            break;
    }
};
