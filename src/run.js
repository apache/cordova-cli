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

/*global require: true, module: true, process: true*/
/*jslint sloppy: true, white: true, newcap: true */

var cordova_util      = require('./util'),
    path              = require('path'),
    hooker            = require('./hooker'),
    events            = require('./events'),
    Q                 = require('q'),
    child_process     = require('child_process'),
    DEFAULT_OPTIONS   = ["--device"],
    os                = require('os');

// Returns a promise.
function shell_out_to_run(projectRoot, platform, options) {
    var cmd = path.join(projectRoot, 'platforms', platform, 'cordova', 'run'),
        args = options.length ? DEFAULT_OPTIONS.concat(options) : DEFAULT_OPTIONS,
        d = Q.defer(),
        errors = "",
        child;

    events.emit('log', 'Running app on platform "' + platform + '" via command "' + cmd + '" ' + args.join(" "));

    // TODO: inconsistent API for BB10 run command
/*  if (platform == 'blackberry') {
        var bb_project = path.join(projectRoot, 'platforms', 'blackberry')
        var project = new platforms.blackberry.parser(bb_project);
        if (project.has_device_target()) {
            var bb_config = project.get_cordova_config();
            var device = project.get_device_targets()[0].name;
            cmd = '"' + path.join(bb_project, 'cordova', 'run') + '" --target=' + device + ' -k ' + bb_config.signing_password;
        } else {
            var err = new Error('No BlackBerry device targets defined. If you want to run `run` with BB10, please add a device target. For more information run "' + path.join(bb_project, 'cordova', 'target') + '" -h');
            if (error_callback) error_callback(err);
            else throw err;
        }
    }
*/

    //CB-5125 using spawn instead of exec to avoid errors with stdout on maxBuffer
    child = child_process.spawn(cmd, args);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (data) {
        events.emit('verbose', data);
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
        events.emit('verbose', data);
        errors = errors + data;
    });

    child.on('close', function (code) {
        events.emit('verbose', "child_process.spawn(" + cmd + "," + args.join(" ") + ") = " + code);
        if (code === 0) {
            events.emit('log', 'Platform "' + platform + '" ran successfully.');
            d.resolve();
        } else {
            d.reject(new Error('n error occurred while running the ' + platform + ' project.' + errors));
        }
    });

    return d.promise;
}

// Returns a promise.
module.exports = function run(options) {
    var projectRoot = cordova_util.isCordova(process.cwd()),
        hooks;

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

    hooks = new hooker(projectRoot);
    return hooks.fire('before_run', options)
    .then(function() {
        // Run a prepare first, then shell out to run
        return require('../cordova').raw.prepare(options.platforms)
        .then(function() {
            return Q.all(options.platforms.map(function(platform) {
                return shell_out_to_run(projectRoot, platform, options.options);
            }));
        }).then(function() {
            return hooks.fire('after_run', options);
        });
    });
};
