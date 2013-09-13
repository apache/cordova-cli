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
    events= require('./events'),
    child_process = require('child_process'),
    Q     = require('q'),
    path  = require('path');

module.exports = function hooker(root) {
    var r = util.isCordova(root);
    if (!r) throw new Error('Not a Cordova project, can\'t use hooks.');
    else this.root = r;
}

// Returns a promise.
module.exports.fire = function global_fire(hook, opts) {
    opts = opts || {};
    var handlers = events.listeners(hook);
    return execute_handlers_serially(handlers, opts);
};

module.exports.prototype = {
    // Returns a promise.
    fire:function fire(hook, opts) {
        opts = opts || {};
        var self = this;
        var dir = path.join(this.root, '.cordova', 'hooks', hook);
        opts.root = this.root;

        // Fire JS hook for the event
        // These ones need to "serialize" events, that is, each handler attached to the event needs to finish processing (if it "opted in" to the callback) before the next one will fire.
        var handlers = events.listeners(hook);
        return execute_handlers_serially(handlers, opts)
        .then(function() {
            // Fire script-based hooks
            if (!(fs.existsSync(dir))) {
                return Q(); // hooks directory got axed post-create; ignore.
            } else {
                var scripts = fs.readdirSync(dir).filter(function(s) {
                    return s[0] != '.';
                });
                return execute_scripts_serially(scripts, self.root, dir);
            }
        });
    }
}

// Returns a promise.
function execute_scripts_serially(scripts, root, dir) {
    if (scripts.length) {
        var s = scripts.shift();
        var fullpath = path.join(dir, s);
        if (fs.statSync(fullpath).isDirectory()) {
            return execute_scripts_serially(scripts, root, dir); // skip directories if they're in there.
        } else {
            var command = fullpath + ' "' + root + '"';
            events.emit('log', 'Executing hook "' + command + '" (output to follow)...');
            var d = Q.defer();
            child_process.exec(command, function(err, stdout, stderr) {
                events.emit('log', stdout);
                if (err) {
                    d.reject(new Error('Script "' + fullpath + '" exited with non-zero status code. Aborting. Output: ' + stdout + stderr));
                } else {
                    d.resolve(execute_scripts_serially(scripts, root, dir));
                }
            });
            return d.promise;
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
