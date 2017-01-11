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

/* jshint node:true, bitwise:true, undef:true, trailing:true, quotmark:true,
          indent:4, unused:vars, latedef:nofunc,
          laxcomma:true
*/



// For further details on telemetry, see:
// https://github.com/cordova/cordova-discuss/pull/43

var Q = require('q');

// Google Analytics tracking code
var GA_TRACKING_CODE = 'UA-64283057-7';

var pkg = require('../package.json');
var Insight = require('insight');
var insight = new Insight({
    trackingCode: GA_TRACKING_CODE,
    pkg: pkg
});

/**
 * Returns true if the user opted in, and false otherwise
 */
function showPrompt() {

    var deferred = Q.defer();
    
    var msg = 'May Cordova anonymously report usage statistics to improve the tool over time?';
    insight.askPermission(msg, function (unused, optIn) {
        var EOL = require('os').EOL;
        if (optIn) {
            console.log(EOL + 'Thanks for opting into telemetry to help us improve cordova.');
            track('telemetry', 'on', 'via-cli-prompt-choice', 'successful');
        } else {
            console.log(EOL + 'You have been opted out of telemetry. To change this, run: cordova telemetry on.');
            // Always track telemetry opt-outs! (whether opted-in or opted-out)
            track('telemetry', 'off', 'via-cli-prompt-choice', 'successful');
        }
        
        deferred.resolve(optIn); 
    });
    
    return deferred.promise;
}

function track() {
    // Remove empty, null or undefined strings from arguments
    for (var property in arguments) {
        var val = arguments[property]; 
        if (!val || val.length === 0) {
            delete arguments.property;
        }
    }
    insight.track.apply(insight, arguments);
}

function turnOn() {
    insight.optOut = false;
}

function turnOff() {
    insight.optOut = true;
}

/**
 * Clears telemetry setting
 * Has the same effect as if user never answered the telemetry prompt
 * Useful for testing purposes
 */
function clear() {
    insight.optOut = undefined;
}

function isOptedIn() {
    return !insight.optOut;
}

/**
 * Has the user already answered the telemetry prompt? (thereby opting in or out?)
 */
function hasUserOptedInOrOut() {
    var insightOptOut = insight.optOut === undefined;
    return !(insightOptOut);
}

/**
 * Is the environment variable 'CI' specified ?
 */
function isCI(env) {
    return !!env.CI;
}

/**
 * Has the user ran a command of the form: `cordova run --no-telemetry` ?
 */
function isNoTelemetryFlag(args) {
    return args.indexOf('--no-telemetry') > -1;
}

module.exports = {
    track: track,
    turnOn: turnOn,
    turnOff: turnOff,
    clear: clear,
    isOptedIn: isOptedIn,
    hasUserOptedInOrOut: hasUserOptedInOrOut,
    isCI: isCI,
    showPrompt: showPrompt,
    isNoTelemetryFlag: isNoTelemetryFlag
};