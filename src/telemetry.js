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

var path = require('path');
var Q = require('q');

var GOOGLE_ANALYTICS_TRACKING_ID = 'UA-64283057-7'; 

var pkg = require('../package.json');
var Insight = require('insight');
var insight = new Insight({
    trackingCode: GOOGLE_ANALYTICS_TRACKING_ID,
    pkg: pkg
});

/**
 * Telemetry Prompt:
 * If the user has not made any decision about telemetry yet,
 * ... a timed prompt is shown, asking him whether or not he wants to opt-in.
 * ... If the timeout expires without him having made any decisions, he is considered to have opted out.

 * Note: The timed prompt can be prevented from being shown by setting an environment variable: CORDOVA_TELEMETRY_OPT_OUT
 * ... This is useful in CI environments.

@returns {Boolean} It returns true if the user has agreed to opt-in to telemetry, false otherwise
*/
function setup() {
    var deferred = Q.defer();
    
    // ToDO: should we just rely on 'CI' env variable? (what are others doing?)
    var isInteractive = !process.env.CORDOVA_TELEMETRY_OPT_OUT && !process.env.CI;
    if(!isInteractive) {
        // Update user's config file to make sure telemetry doesn't get collected
        // This handles the case where user had previously opted-in, then 
        // ... sets up environment variable to signify they want out
        insight.optOut = true; 
    }
    
    if (isInteractive && insight.optOut === undefined) {

        // Note: insight.askPermission() won't display the permissions prompt if one of these is true:
        //     - the process is not a TTY
        //     - the process was started with --no-insight flag
        //     - the CI environment variable is set 
        // For further infos, see: https://github.com/yeoman/insight/blob/3a6ac613b7312272f9f10e1188310b199afa4e1d/lib/index.js#L133
        
        // ToDO: Fix link to privacy-statement
        var msg = 'Privacy statement: http://docs.cordova.io/privacy-statement.html' + require('os').EOL +
                    'May cordova anonymously report usage statitics to improve the tool over time ?';
        insight.askPermission(msg, function(unused, optIn) {
            if(!optIn) {
                // Always track telemetry opt-outs!
                track('telemetry-opt-out', 'via-cli-prompt-choice');
            }
            deferred.resolve(optIn /* same as !insight.optOut */);
        }, {
            optInByDefault: false // If prompt timeout expires, opt the user out of telemetry
        });
    } else {
        deferred.resolve(!insight.optOut);
    }
    
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

function isOptedIn() {
    return !insight.optOut;
}

module.exports = {
    setup: setup,
    track: track,
    trackEvent: trackEvent,
    turnOn: turnOn,
    turnOff: turnOff,
    isOptedIn: isOptedIn
};