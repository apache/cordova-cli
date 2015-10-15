/*
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

var util = require('util'),
    ansi = require('ansi'),
    Stream = require('stream'),
    cordova_lib = require('cordova-lib'),
    CordovaError = cordova_lib.CordovaError;

var EOL = require('os').EOL;

var logger = {
    levels: {},
    colors: {},
    stdout: process.stdout,
    stderr: process.stderr
};

logger.stdoutCursor = ansi(logger.stdout);
logger.stderrCursor = ansi(logger.stderr);

function formatError(error, isVerbose) {
    var message = '';

    if(error instanceof CordovaError) {
        message = error.toString(isVerbose);
    } else if(error instanceof Error) {
        if(isVerbose) {
            message = error.stack;
        } else {
            message = error.message;
        }
    } else {
        // Plain text error message
        message = error;
    }

    if(message.toUpperCase().indexOf('ERROR:') !== 0) {
        // Needed for backward compatibility with external tools
        message = 'Error: ' + message;
    }

    return message;
}

logger.log = function (logLevel, message) {
    if (this.levels[logLevel] >= this.levels[this.logLevel]) {
        var isVerbose = this.logLevel === 'verbose';
        var cursor, output;

        if(message instanceof Error || logLevel === 'error') {
            message = formatError(message, isVerbose);
            cursor = this.stderrCursor;
            output = this.stderr;
        } else {
            cursor = this.stdoutCursor;
            output = this.stdout;
        }

        message = message + EOL;

        if (!cursor) {
            output.write(message);
        }
        if (output !== cursor.stream) {
            cursor = ansi(output, { enabled: colorEnabled });
        }
        var color = this.colors[logLevel];
        !!color && cursor.bold().fg[color]();
        cursor.write(message);
        cursor.reset();
    }
};

logger.addLevel = function (level, severity, color) {
    this.levels[level] = severity;
    color && (this.colors[level] = color);

    if (!this[level]) {
        this[level] = this.log.bind(this, level);
        return this[level];
    }
};

logger.setLevel = function (logLevel) {
    if (this.levels[logLevel]) {
        this.logLevel = logLevel;
    }
};

logger.addLevel('verbose', 1000, 'grey');
logger.addLevel('normal' , 2000);
logger.addLevel('warn'   , 2000, 'yellow');
logger.addLevel('info'   , 3000, 'blue');
logger.addLevel('error'  , 5000, 'red');
logger.addLevel('results' , 10000);

logger.setLevel('normal');

module.exports = logger;
