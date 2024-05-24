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

// For further details on telemetry, see:
// https://github.com/cordova/cordova-discuss/pull/43

/**
 * Returns true if the user opted in, and false otherwise
 */
function showPrompt () {
    return Promise.resolve(false);
}

function track (...args) {}

function turnOn () {}

function turnOff () {}

/**
 * Clears telemetry setting
 * Has the same effect as if user never answered the telemetry prompt
 * Useful for testing purposes
 */
function clear () {
    
}

function isOptedIn () {
    return false;
}

/**
 * Has the user already answered the telemetry prompt? (thereby opting in or out?)
 */
function hasUserOptedInOrOut () {
    return false;
}

/**
 * Is the environment variable 'CI' specified ?
 */
function isCI (env) {
    return !!env.CI;
}

/**
 * Has the user ran a command of the form: `cordova run --no-telemetry` ?
 */
function isNoTelemetryFlag (args) {
    return args.indexOf('--no-telemetry') > -1;
}

// this is to help testing, so we don't have to wait for the full 30
module.exports = {
    track,
    turnOn,
    turnOff,
    clear,
    isOptedIn,
    hasUserOptedInOrOut,
    isCI,
    showPrompt,
    isNoTelemetryFlag,
    timeoutInSecs: 30
};
