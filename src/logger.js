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
    output: process.stdout
};

logger.cursor = ansi(logger.output);

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
    }

    // Some error messages start with 'Error: ' prefix, so cut it off here to avoid duplication.
    // This will also remove generic Error.name (type), which Error.stack outputs in verbose mode,
    // i.e. events.emit('error', new Error('...')), while preserving a specific Error type like RangeError.
    // TODO: Update platforms code to remove such prefixes
    message = message && message.replace(/^error:\s+/i, '');

    return message;
}

logger.log = function (logLevel, message) {
    if (this.levels[logLevel] >= this.levels[this.logLevel]) {
        var isVerbose = this.logLevel === 'verbose';

        if(message instanceof Error) {
            message = formatError(message, isVerbose);
        }

        message = message + EOL;

        if (!this.cursor) {
            this.output.write(message);
        }
        if (this.output !== this.cursor.stream) {
            this.cursor = ansi(this.output, { enabled: colorEnabled });
        }
        var color = this.colors[logLevel];
        !!color && this.cursor.bold().fg[color]();
        this.cursor.write(message);
        this.cursor.reset();
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
