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
    hooker            = require('./hooker'),
    events            = require('./events'),
    Q                 = require('q');

// Returns a promise.
function shell_out_to_build(projectRoot, platform, options) {
    var cmd = '"' + path.join(projectRoot, 'platforms', platform, 'cordova', 'build') + (options.length ? '" ' + options.join(" ") : '"');
    events.emit('log', 'Compiling platform "' + platform + '" with command "' + cmd + '"');
    var d = Q.defer();
    child_process.exec(cmd, function(err, stdout, stderr) {
        events.emit('verbose', stdout);
        events.emit('verbose', stderr);
        if (err) {
            d.reject(new Error('An error occurred while building the ' + platform + ' project. ' + stderr));
        } else {
            events.emit('log', 'Platform "' + platform + '" compiled successfully.');
            d.resolve();
        }
    });
    return d.promise;
}

// Returns a promise.
module.exports = function compile(options) {
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
    return hooks.fire('before_compile', options)
    .then(function() {
        // Iterate over each added platform
        return Q.all(options.platforms.map(function(platform) {
            return shell_out_to_build(projectRoot, platform, options.options);
        }));
    }).then(function() {
        return hooks.fire('after_compile', options);
    });
};
