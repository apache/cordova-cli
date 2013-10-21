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
    child_process     = require('child_process'),
    events            = require('./events'),
    hooker            = require('./hooker'),
    Q                 = require('q'),
    DEFAULT_OPTIONS   = ["--emulator"],
    MAX_BUFFER        = 500*1024;

// Returns a promise.
function shell_out_to_emulate(root, platform, options) {
    options = options.length ? DEFAULT_OPTIONS.concat(options) : DEFAULT_OPTIONS;
    var cmd = '"' + path.join(root, 'platforms', platform, 'cordova', 'run') + '" ' + options.join(" ");
    events.emit('log', 'Running on emulator for platform "' + platform + '" via command "' + cmd + '"');
    var d = Q.defer();
    child_process.exec(cmd, {maxBuffer: MAX_BUFFER}, function(err, stdout, stderr) {
        events.emit('verbose', stdout + stderr);
        if (err) {
            d.reject(new Error('An error occurred while emulating/deploying the ' + platform + ' project.' + stdout + stderr + err.message));
        } else {
            events.emit('log', 'Platform "' + platform + '" deployed to emulator.');
            d.resolve();
        }
    });
    return d.promise;
}

// Returns a promise.
module.exports = function emulate (options) {
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

    var hooks = new hooker(projectRoot);
    return hooks.fire('before_emulate', options)
    .then(function() {
        // Run a prepare first!
        return require('../cordova').raw.prepare(options.platforms);
    }).then(function() {
        return Q.all(options.platforms.map(function(platform) {
            return shell_out_to_emulate(projectRoot, platform, options.options);
        }));
    }).then(function() {
        return hooks.fire('after_emulate', options);
    });
};
