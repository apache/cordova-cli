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
var util  = require('./util'),
    fs    = require('fs'),
    os    = require('os'),
    events= require('./events'),
    superspawn = require('./superspawn'),
    CordovaError = require('./CordovaError'),
    Q     = require('q'),
    path  = require('path'),
    _ = require('underscore');

module.exports = function hooker(root) {
    var r = util.isCordova(root);
    if (!r) throw new Error('Not a Cordova project, can\'t use hooks.');
    else this.root = r;
};

// Returns a promise.
module.exports.fire = function global_fire(hook, opts) {
    opts = opts || {};
    var handlers = events.listeners(hook);
    return execute_handlers_serially(handlers, opts);
};

function compareNumbers(a, b) {
    return isNaN (parseInt(a))
        ? a.toLowerCase().localeCompare(b.toLowerCase ? b.toLowerCase(): b)
        : parseInt(a) > parseInt(b) ? 1 : parseInt(a) < parseInt(b) ? -1 : 0;
}

module.exports.prototype = {
    // Returns a promise.
    fire:function fire(hook, opts) {
        var root = this.root;
        opts = opts || {};
        opts.root = root;

        function fireHooksInDir(dir) {
            if (!(fs.existsSync(dir))) {
                return Q();
            } else {
                var scripts = fs.readdirSync(dir).sort(compareNumbers).filter(function(s) {
                    return s[0] != '.';
                });
                return execute_scripts_serially(scripts, root, dir, opts);
            }
        }
        // Fire JS hook for the event
        // These ones need to "serialize" events, that is, each handler attached to the event needs to finish processing (if it "opted in" to the callback) before the next one will fire.
        var handlers = events.listeners(hook);
        return execute_handlers_serially(handlers, opts)
        .then(function() {
            return fireHooksInDir(path.join(root, '.cordova', 'hooks', hook));
        }).then(function() {
            return fireHooksInDir(path.join(root, 'hooks', hook));
        });
    }
};

function extractSheBangInterpreter(fullpath) {
    var hookFd = fs.openSync(fullpath, "r");
    try {
        // this is a modern cluster size. no need to read less
        var fileData = new Buffer (4096);
        var octetsRead = fs.readSync(hookFd, fileData, 0, 4096, 0);
        var fileChunk = fileData.toString();
    } finally {
        fs.closeSync(hookFd);
    }

    var hookCmd, shMatch;
    // Filter out /usr/bin/env so that "/usr/bin/env node" works like "node".
    var shebangMatch = fileChunk.match(/^#!(?:\/usr\/bin\/env )?([^\r\n]+)/m);
    if (octetsRead == 4096 && !fileChunk.match(/[\r\n]/))
        events.emit('warn', 'shebang is too long for "' + fullpath + '"');
    if (shebangMatch)
        hookCmd = shebangMatch[1];
    // Likewise, make /usr/bin/bash work like "bash".
    if (hookCmd)
        shMatch = hookCmd.match(/bin\/((?:ba)?sh)$/)
    if (shMatch)
        hookCmd = shMatch[1]
    return hookCmd;
}

// Returns a promise.
function execute_scripts_serially(scripts, root, dir, opts) {
    opts = opts || {};
    var isWindows = os.platform().slice(0, 3) === 'win';
    if (scripts.length) {
        var s = scripts.shift();
        var fullpath = path.join(dir, s);
        if (fs.statSync(fullpath).isDirectory()) {
            events.emit('verbose', 'skipped directory "' + fullpath + '" within hook directory');
            return execute_scripts_serially(scripts, root, dir, opts); // skip directories if they're in there.
        } else {
            var command = fullpath;
            var args = [root];
            if (os.platform().slice(0, 3) == 'win') {
                // TODO: Make shebang sniffing a setting (not everyone will want this).
                var interpreter = extractSheBangInterpreter(fullpath);
                // we have shebang, so try to run this script using correct interpreter
                if (interpreter) {
                    args.unshift(command);
                    command = interpreter;
                }
            }

            var execOpts = {cwd: root, printCommand: true, stdio: 'inherit'};
            execOpts.env = {};
            execOpts.env.CORDOVA_VERSION = require('../package').version;
            execOpts.env.CORDOVA_PLATFORMS = opts.platforms ? opts.platforms.join() : '';
            execOpts.env.CORDOVA_PLUGINS = opts.plugins?opts.plugins.join():'';
            execOpts.env.CORDOVA_HOOK = fullpath;
            execOpts.env.CORDOVA_CMDLINE = process.argv.join(' ');

            return superspawn.spawn(command, args, execOpts)
            .catch(function(err) {
                // Don't treat non-executable files as errors. They could be READMEs, or Windows-only scripts.
                if (!isWindows && err.code == 'EACCES') {
                    events.emit('verbose', 'skipped non-executable file: ' + fullpath);
                } else {
                    throw new CordovaError('Hook failed with error code ' + err.code + ': ' + command);
                }
            }).then(function() {
                return execute_scripts_serially(scripts, root, dir, opts);
            });
        }
    } else {
        return Q(); // Nothing to do.
    }
}

// Returns a promise.
function execute_handlers_serially(handlers, opts) {
    if (handlers.length) {
        // Chain the handlers in series.
        return handlers.reduce(function(soFar, f) {
            return soFar.then(function() { return f(opts) });
        }, Q());
    } else {
        return Q(); // Nothing to do.
    }
}
