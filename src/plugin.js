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
module.exports = function plugin(cmd, targets, command) {
    var cordova_util  = require('./util'),
        path          = require('path'),
        hooker        = require('./hooker'),
        config        = require('./config'),
        Q             = require('q'),
        CordovaError  = require('./CordovaError'),
        events        = require('./events');

    var projectRoot = cordova_util.cdProjectRoot(),
        err;

    // Dance with all the possible call signatures we've come up over the time. They can be:
    // 1. plugin() -> list the plugins
    // 2. plugin(cmd, Array of targets, maybe command object)
    // 3. plugin(cmd, target1, target2, target3 ... )
    // The targets are not really targets, they can be a mixture of plugins and options to be passed to plugman.

    cmd = cmd || 'ls';
    targets = targets || [];
    if ( command && command.length ) {
        // This is the case with multiple targes as separate arguments and opts is not opts but another target.
        targets = Array.prototype.slice.call(arguments, 1);
        command = null;
    }
    if ( !Array.isArray(targets) ) {
        // This means we had a single target given as string.
        targets = [targets];
    }

    command = cordova_util.preProcessOptions(command);
    command.plugins = targets;

    var options = command.flags || {};
    
    var hooks = new hooker(projectRoot),
        platformList = cordova_util.listPlatforms(projectRoot);

    // Massage plugin name(s) / path(s)
    var pluginPath = path.join(projectRoot, 'plugins'), 
        plugins = cordova_util.findPlugins(pluginPath);

    switch(cmd) {
        case 'add':
            if (!targets.length) {
                return Q.reject(new CordovaError('No plugin specified. Please specify a plugin to add. See "plugin search".'));
            }

            var config_json = config(projectRoot, {});
            options.searchpath = options.searchpath || config_json.plugin_search_path;
            
            //parse variables into cli_variables
            options.cli_variables = {};
            for (i=0; i< command.options.length; i++) {
                if (command.options[i] === "--variable" && typeof command.options[++i] === "string") {
                    tokens = command.options[i].split('=');
                    key = tokens.shift().toUpperCase();
                    if (/^[\w-_]+$/.test(key)) {
                        options.cli_variables[key] = tokens.join('=');
                    }
                }
            }

            return hooks.fire('before_plugin_add', command)
            .then(function() {
                var plugman = require('plugman');		   

                return command.plugins.reduce(function(soFar, target) {

                    return soFar.then(function() {
                        if (target[target.length - 1] == path.sep) {
                            target = target.substring(0, target.length - 1);
                        }

                        var opts = plugman.cloneOptions(options);

                        // Fetch the plugin first.
                        events.emit('verbose', 'Calling plugman.fetch on plugin "' + target + '"');

                        return plugman.raw.fetch(target, pluginPath, opts);
                    })
                    .fail(function(err) {
                        return Q.reject(new Error('Fetching plugin failed: ' + err));
                    })
                    .then(function(plugin_install_dir) {
                        // Iterate (in serial!) over all platforms in the project and install the plugin.

                        return platformList.reduce(function(soFar, platform) {
                            return soFar.then(function() {
                                var platforms = require('../platforms');
                                var platformRoot = path.join(projectRoot, 'platforms', platform),
                                    parser = new platforms[platform].parser(platformRoot),
                                    tokens,
                                    plugin_id = path.basename(plugin_install_dir),
                                    key,
                                    i;

                                var opts = plugman.cloneOptions(options, {						   
                                    www_dir: parser.staging_dir()
                                });

                                events.emit('verbose', 'Calling plugman.install on plugin "' + plugin_install_dir + '" for platform "' + platform + '" with options "' + JSON.stringify(command.options)  + '"');
                                return plugman.raw.install(platform, platformRoot, plugin_id, pluginPath, opts);
                            });
                        }, Q());
                    });
                }, Q()); // end Q.all
            }).then(function() {
                return hooks.fire('after_plugin_add', command);
            });
            break;
        case 'rm':
        case 'remove':
            if (!targets.length) {
                return Q.reject(new CordovaError('No plugin specified. Please specify a plugin to remove. See "plugin list".'));
            }

            return hooks.fire('before_plugin_rm', command)
            .then(function() {
                var plugman = require('plugman');		   

                return command.plugins.reduce(function(soFar, target) {
                    // Check if we have the plugin.
                    if (plugins.indexOf(target) < 0) {
                        return Q.reject(new CordovaError('Plugin "' + target + '" is not present in the project. See "plugin list".'));
                    }

                    var targetPath = path.join(pluginPath, target);

                    // Iterate over all installed platforms and uninstall.
                    // If this is a web-only or dependency-only plugin, then
                    // there may be nothing to do here except remove the
                    // reference from the platform's plugin config JSON.

                    return platformList.reduce(function(soFar, platform) {
                        return soFar.then(function() {
                            var platformRoot = path.join(projectRoot, 'platforms', platform);
                            var platforms = require('../platforms');
                            var parser = new platforms[platform].parser(platformRoot);
                            events.emit('verbose', 'Calling plugman.uninstall on plugin "' + target + '" for platform "' + platform + '"');
                            
                            var opts = plugman.cloneOptions(options, {						   
                                www_dir: parser.staging_dir()
                            });

                            return plugman.raw.uninstall.uninstallPlatform(platform, platformRoot, target, path.join(projectRoot, 'plugins'), opts);
                        });
                    }, Q())
                    .then(function() {
                        return plugman.raw.uninstall.uninstallPlugin(target, path.join(projectRoot, 'plugins'), options);
                    });
                }, Q());
            }).then(function() {
                return hooks.fire('after_plugin_rm', command);
            });
            break;
        case 'search':
            return hooks.fire('before_plugin_search')
            .then(function() {
                var plugman = require('plugman');
                return plugman.raw.search(command.plugins);
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
