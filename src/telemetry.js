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
    
    var msg = 'Do you want to prevent cordova from anonymously collecting usage statitics to improve the tool over time ?';
    insight.askPermission(msg, function (unused, optOut) {
        if (optOut) {
            console.log("You have been opted out of telemetry. To change this, run: cordova telemetry on");
            // Always track telemetry opt-outs! (whether opted-in or opted-out)
            track('telemetry-opt-out', 'via-cli-prompt-choice');
        } else {
            console.log("Thanks for opting into telemetry to help us better cordova");
        }

        deferred.resolve(!optOut); 
    });
    
    return deferred.promise;
}

function track() {
    insight.track.apply(insight, arguments);
}

function trackEvent(category, action, label, value) {
    insight.trackEvent({
        category: category,
        action: action,
        label: label,
        value: value
    });
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
    return !(insight.optOut === undefined);
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
    trackEvent: trackEvent,
    turnOn: turnOn,
    turnOff: turnOff,
    clear: clear,
    isOptedIn: isOptedIn,
    hasUserOptedInOrOut: hasUserOptedInOrOut,
    isCI: isCI,
    showPrompt: showPrompt,
    isNoTelemetryFlag: isNoTelemetryFlag
};