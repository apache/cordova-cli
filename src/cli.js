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


var path = require('path'),
    fs = require('fs'),
    help = require('./help'),
    telemetryHelper = require('./telemetry'),
    utils = require('./utils'),
    Q = require('q'),
    _ = require('underscore');

var cordova_lib = require('cordova-lib'),
    CordovaError = cordova_lib.CordovaError,
    cordova = cordova_lib.cordova,
    events = cordova_lib.events,
    logger = require('cordova-common').CordovaLogger.get();

// For CordovaError print only the message without stack trace unless we
// are in a verbose mode.
process.on('uncaughtException', function (err) {
    logger.error(err);
    // Don't send exception details, just send that it happened
    if (shouldCollectTelemetry) {
        telemetryHelper.track('uncaughtException');
    }
    process.exit(1);
});
    
    
var shouldCollectTelemetry = false;
function main(inputArgs, cb) {
    
    /**
     * mainly used for testing.
     */
    cb = cb || function(){};
    
    utils.init();
    
    utils.checkForUpdates();
    
    var args = utils.parseArguments(inputArgs || process.argv);
        
    logger.subscribe(events); 

    if (args.silent) {
        logger.setLevel('error'); 
    }
    
    if (args.verbose) {
        logger.setLevel('verbose');
    }
            
    Q().then(function() {
        
        /**
         * Skip telemetry prompt if:
         * - CI environment variable is present
         * - Command is run with `--no-telemetry` flag
         * - Command ran is: `cordova telemetry on | off | ...`
         */
        
        if(telemetryHelper.isCI(process.env) || telemetryHelper.isNoTelemetryFlag(inputArgs)) {
            return Q(false);
        }
        
        /**
         * We shouldn't prompt for telemetry if user issues a command of the form: `cordova telemetry on | off | ...x`
         * Also, if the user has already been prompted and made a decision, use his saved answer
         */
        if(args.command === 'telemetry') {
            return Q(telemetryHelper.isOptedIn());
        }
        
        if(telemetryHelper.hasUserOptedInOrOut()) {
            return Q(telemetryHelper.isOptedIn());
        }
        
        /**
         * Otherwise, prompt user to opt-in or out
         * Note: the prompt is shown for 30 seconds. If no choice is made by that time, User is considered to have opted out.
         */
        return telemetryHelper.showPrompt();
    }).then(function (collectTelemetry) {
        shouldCollectTelemetry = collectTelemetry;
        return cli(args);
    }).then(function () {
        handleTelemetry(args, 'successful');
        
        // call cb with error as arg if something failed
        cb(null);
    }).fail(function (err) {
        handleTelemetry(args, 'unsuccessful');
        
        // call cb with error as arg if something failed
        cb(err);
        throw err;
    }).done();
};

function handleTelemetry(args, status) {
    // Always track telemetry opt-outs (whether user opted out or not!)
    var isOptingOut = (args.command === 'telemetry' && args.subcommand === 'off');
    if (isOptingOut) {
        telemetryHelper.track(args.command, args.subcommand /*'off'*/, 'via-cordova-telemetry-cmd', status);
    } else if (shouldCollectTelemetry) {
        telemetryHelper.track(args.command, args.subcommand, status);
    }
}

function cli(args) {
     
    var msg;
    var known_platforms = Object.keys(cordova_lib.cordova_platforms);
    
    if (args.version) {
        var cliVersion = require('../package').version;
        var libVersion = require('cordova-lib/package').version;
        var toPrint = cliVersion;
        if (cliVersion != libVersion || /-dev$/.exec(libVersion)) {
            toPrint += ' (cordova-lib@' + libVersion + ')';
        }
        console.log(toPrint);
        return Q();
    }

    if (args.command === 'help') {
        return help(args.remain);
    }
    
    if (args.command === 'telemetry') {
        return telemetry(args.subcommand);
    }

    if ( !cordova.hasOwnProperty(args.command) ) {
        msg =
            'Cordova does not know ' + args.command + '; try `' + cordova_lib.binname +
            ' help` for a list of all the available commands.';
        throw new CordovaError(msg);
    }

    var opts = {
        platforms: [],
        options: [],
        verbose: args.verbose || false,
        silent: args.silent || false,
        browserify: args.browserify || false,
        fetch: args.fetch || false, //ToDO: check that they all get parsed
        nohooks: args.nohooks || [],
        searchpath : args.searchpath
    };
    

    if (args.command == 'emulate' || args.command == 'build' || args.command == 'prepare' || args.command == 'compile' || args.command == 'run' || args.command === 'clean') {
        // All options without dashes are assumed to be platform names
        opts.platforms = args.platforms;
        var badPlatforms = _.difference(opts.platforms, known_platforms);
        if( !_.isEmpty(badPlatforms) ) {
            msg = 'Unknown platforms: ' + badPlatforms.join(', ');
            throw new CordovaError(msg);
        }

        // Pass nopt-parsed args to PlatformApi through opts.options
        opts.options = args.nopt; 
        opts.options.argv = args.unparsedArgs;
        
        if (args.command === 'run' && args.list && cordova.raw.targets) { // ToDO args.list ?
            return cordova.raw.targets.call(null, opts);
        }

        return cordova.raw[args.command].call(null, opts);
    } else if (args.command === 'requirements') {
        // All options without dashes are assumed to be platform names
        opts.platforms = undashed.slice(1);
        var badPlatforms = _.difference(opts.platforms, known_platforms);
        if( !_.isEmpty(badPlatforms) ) {
            msg = 'Unknown platforms: ' + badPlatforms.join(', ');
            throw new CordovaError(msg);
        }

        return cordova.raw[args.command].call(null, opts.platforms)
            .then(function(platformChecks) {

                var someChecksFailed = Object.keys(platformChecks).map(function(platformName) {
                    events.emit('log', '\nRequirements check results for ' + platformName + ':');
                    var platformCheck = platformChecks[platformName];
                    if (platformCheck instanceof CordovaError) {
                        events.emit('warn', 'Check failed for ' + platformName + ' due to ' + platformCheck);
                        return true;
                    }

                    var someChecksFailed = false;
                    platformCheck.forEach(function(checkItem) {
                        var checkSummary = checkItem.name + ': ' +
                            (checkItem.installed ? 'installed ' : 'not installed ') +
                            (checkItem.metadata.version || '');
                        events.emit('log', checkSummary);
                        if (!checkItem.installed) {
                            someChecksFailed = true;
                            events.emit('warn', checkItem.metadata.reason);
                        }
                    });

                    return someChecksFailed;
                }).some(function(isCheckFailedForPlatform) {
                    return isCheckFailedForPlatform;
                });

                if (someChecksFailed) throw new CordovaError('Some of requirements check failed');
            });
    } else if (args.command == 'serve') {
        return cordova.raw.serve(args.port);
    } else if (args.command == 'create') {
        return create();
    } else {
        var download_opts = {
            searchpath: args.searchpath
            , noregistry: args.noregistry
            , nohooks: args.nohooks
            , cli_variables: args.cli_vars
            , browserify: args.browserify || false
            , fetch: args.fetch || false
            , link: args.link || false
            , save: args.save || false
            , shrinkwrap: args.shrinkwrap || false
            , force: args.force || false
        };
        return cordova.raw[args.command](args.subcommand, args.targets, download_opts);
    }

    function create() {
        var cfg;            // Create config
        var customWww;      // Template path
        var wwwCfg;         // Template config

        // If we got a fourth parameter, consider it to be JSON to init the config.
        if (args.undashed[4])
            cfg = JSON.parse(args.undashed[4]);
        else
            cfg = {};

        customWww = args['copy-from'] || args['link-to'] || args.template;

        if (customWww) {
            if (!args.template && customWww.indexOf('http') === 0) {
                throw new CordovaError(
                    'Only local paths for custom www assets are supported.'
                );
            }

            // Resolve tilda
            if (customWww.substr(0,1) === '~')
                customWww = path.join(process.env.HOME,  customWww.substr(1));

            wwwCfg = {
                url: customWww,
                template: false
            };

            if (args['link-to'])
                wwwCfg.link = true;
            else if (args.template)
                wwwCfg.template = true;

            cfg.lib = cfg.lib || {};
            cfg.lib.www = wwwCfg;
        }

        // create(dir, id, name, cfg)
        return cordova.raw.create( args.undashed[1]  // dir to create the project in
            , args.undashed[2]  // App id
            , args.undashed[3]  // App name
            , cfg
        );
    }
    
    function telemetry(subcommand) {

        if (subcommand !== 'on' && subcommand !== 'off') {
            return help(['telemetry']);
        }
        
        var turnOn = subcommand === 'on' ? true : false;

        // turn telemetry on or off
        if (turnOn) {
            telemetryHelper.turnOn();
            console.log("Thanks for opting into telemetry to help us improve cordova.");
        } else {
            telemetryHelper.turnOff();
            console.log("You have been opted out of telemetry. To change this, run: cordova telemetry on.");
        }
   
        return Q();
    }
}

module.exports = main;
