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
var config_parser     = require('./config_parser'),
    cordova_util      = require('./util'),
    util              = require('util'),
    fs                = require('fs'),
    path              = require('path'),
    hooker            = require('./hooker'),
    n                 = require('ncallbacks'),
    platforms         = require('../platforms'),
    plugman           = require('plugman'),
    shell             = require('shelljs');

module.exports = function platform(command, targets, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw new Error('Current working directory is not a Cordova-based project.');
    }

    var hooks = new hooker(projectRoot),
        end;

    var createOverrides = function(target) {
        shell.mkdir('-p', path.join(cordova_util.appDir(projectRoot), 'merges', target));
    };

    if (arguments.length === 0) command = 'ls';
    if (targets) {
        if (!(targets instanceof Array)) targets = [targets];
        end = n(targets.length, function() {
            if (callback) callback();
        });
    }

    var xml = cordova_util.projectConfig(projectRoot);
    var cfg = new config_parser(xml);

    switch(command) {
        case 'ls':
        case 'list':
            // TODO before+after hooks here are awkward
            hooks.fire('before_platform_ls');
            hooks.fire('after_platform_ls');
            return fs.readdirSync(path.join(projectRoot, 'platforms'));
            break;
        case 'add':
            targets.forEach(function(target) {
                hooks.fire('before_platform_add');
                var output = path.join(projectRoot, 'platforms', target);

                // Check if output directory already exists.
                if (fs.existsSync(output)) {
                    throw new Error('Platform "' + target + '" already exists' );
                }

                // Make sure we have minimum requirements to work with specified platform
                module.exports.supports(target, function(err) {
                    if (err) {
                        throw new Error('Your system does not meet the requirements to create ' + target + ' projects: ' + err.message);
                    } else {
                        // Create a platform app using the ./bin/create scripts that exist in each repo.
                        // TODO: eventually refactor to allow multiple versions to be created.
                        // Run platform's create script
                        var bin = path.join(cordova_util.libDirectory, 'cordova-' + target, 'bin', 'create');
                        var args = (target=='ios') ? '--arc' : '';
                        var pkg = cfg.packageName().replace(/[^\w.]/g,'_');
                        var name = cfg.name().replace(/\W/g,'_');
                        // TODO: PLATFORM LIBRARY INCONSISTENCY: order/number of arguments to create
                        // TODO: keep tabs on CB-2300
                        var command = util.format('"%s" %s "%s" "%s" "%s"', bin, args, output, (target=='blackberry'?name:pkg), name);

                        shell.exec(command, {silent:true,async:true}, function(code, create_output) {
                            if (code > 0) {
                                throw new Error('An error occured during creation of ' + target + ' sub-project. ' + create_output);
                            }

                            var parser = new platforms[target].parser(output);
                            parser.update_project(cfg, function() {
                                createOverrides(target);
                                hooks.fire('after_platform_add');

                                // Install all currently installed plugins into this new platform.
                                var pluginsDir = path.join(projectRoot, 'plugins');
                                var plugins = fs.readdirSync(pluginsDir);
                                plugins && plugins.forEach(function(plugin) {
                                    if (!fs.statSync(path.join(projectRoot, 'plugins', plugin)).isDirectory()) {
                                        return;
                                    }

                                    plugman.install(target, output, path.basename(plugin), pluginsDir, { www_dir: parser.staging_dir() });
                                });
                                end();
                            });
                        });
                    }
                });
            });
            break;
        case 'rm':
        case 'remove':
            targets.forEach(function(target) {
                hooks.fire('before_platform_rm');
                shell.rm('-rf', path.join(projectRoot, 'platforms', target));
                shell.rm('-rf', path.join(cordova_util.appDir(projectRoot), 'merges', target));
                hooks.fire('after_platform_rm');
            });
            break;
        default:
            throw new Error('Unrecognized command "' + command + '". Use either `add`, `remove`, or `list`.');
    }
};

/**
 * Check Platform Support.
 *
 * Options:
 *
 *   - {String} `name` of the platform to test.
 *   - {Function} `callback` is triggered with the answer.
 *     - {Error} `e` null when a platform is supported otherwise describes error.
 */

module.exports.supports = function(name, callback) {
    // required parameters
    if (!name) throw new Error('requires a platform name parameter');
    if (!callback) throw new Error('requires a callback parameter');

    // check if platform exists
    var platform = platforms[name];
    if (!platform) {
        callback(new Error(util.format('"%s" platform does not exist', name)));
        return;
    }

    // look up platform meta-data parser
    var platformParser = platforms[name].parser;
    if (!platformParser) {
        callback(new Error(util.format('"%s" platform parser does not exist', name)));
        return;
    }

    // check for platform support
    platformParser.check_requirements(function(e) {
        // typecast String to Error
        e = (e instanceof String) ? new Error(e) : e;
        // typecast false Boolean to null
        e = (e) ? e : null;

        callback(e);
    });
};
