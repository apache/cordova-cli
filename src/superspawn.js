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

var child_process = require('child_process');
var fs = require('fs');
var _ = require('underscore');
var Q = require('q');
var shell = require('shelljs');
var events = require('./events');

// On Windows, spawn() for batch files requires absolute path & having the extension.
function resolvePath(cmd) {
    if (fs.exists(cmd)) {
        return cmd;
    }
    cmd = shell.which(cmd) || cmd;
    if (!fs.exists(cmd)) {
        ['.cmd', '.bat', '.js'].some(function(ext) {
            if (fs.exists(cmd + ext)) {
                cmd = cmd + ext;
                return true;
            }
        });
    }
    return cmd;
}

// opts:
//   printCommand: Whether to log the command (default: false)
//   stdio: 'default' is to capture output and returning it as a string to success (same as exec)
//          'ignore' means don't bother capturing it
//          'inherit' means pipe the input & output. This is required for anything that prompts.
//   env: Map of extra environment variables.
//   cwd: Working directory for the command.
// Returns a promise that succeeds only for return code = 0.
exports.spawn = function(cmd, args, opts) {
    args = args || [];
    opts = opts || {};
    var d = Q.defer();
    if (process.platform.slice(0, 3) == 'win') {
        cmd = resolvePath(cmd);
        // If we couldn't find the file, likely we'll end up failing,
        // but for things like "del", cmd will do the trick.
        if (!fs.exists(cmd)) {
            args = ['/c', cmd].concat(args);
            cmd = 'cmd';
        }
    }

    var spawnOpts = {};
    if (opts.stdio == 'ignore') {
        spawnOpts.stdio = 'ignore';
    } else if (opts.stdio == 'inherit') {
        spawnOpts.stdio = 'inherit';
    }
    if (opts.cwd) {
        spawnOpts.cwd = opts.cwd;
    }
    if (opts.env) {
        spawnOpts.env = _.extend(_.extend({}, process.env), opts.env);
    }

    events.emit(opts.printCommand ? 'log' : 'verbose', 'Running command: ' + cmd + ' args=' + JSON.stringify(args));

    var child = child_process.spawn(cmd, args, spawnOpts);
    var capturedOut = '';
    var capturedErr = '';

    if (child.stdout) {
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', function(data) {
            capturedOut += data;
        });

        child.stderr.setEncoding('utf8');
        child.stderr.on('data', function(data) {
            capturedErr += data;
        });
    }

    child.on('close', whenDone);
    child.on('error', whenDone);
    function whenDone(arg) {
        child.removeListener('close', whenDone);
        child.removeListener('error', whenDone);
        var code = typeof arg == 'number' ? arg : arg && arg.code;

        events.emit('verbose', 'Command finished with error code ' + code + ': ' + cmd + ' ' + args);
        if (code === 0) {
            d.resolve(capturedOut.trim());
        } else {
            var errMsg = cmd + ': Command failed with exit code ' + code;
            if (capturedErr) {
                errMsg += ' Error output:\n' + capturedErr.trim();
            }
            var err = new Error(errMsg);
            err.code = code;
            d.reject(err);
        }
    }

    return d.promise;
};

