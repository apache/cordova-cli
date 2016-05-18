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
    nopt,
    _,
    updateNotifier,
    pkg = require('../package.json'),
    telemetry = require('./telemetry'),
    Q = require('q');

var cordova_lib = require('cordova-lib'),
    CordovaError = cordova_lib.CordovaError,
    cordova = cordova_lib.cordova,
    events = cordova_lib.events,
    logger = require('cordova-common').CordovaLogger.get();


/*
 * init
 *
 * initializes nopt and underscore
 * nopt and underscore are require()d in try-catch below to print a nice error
 * message if one of them is not installed.
 */
function init() {
    try {
        nopt = require('nopt');
        _ = require('underscore');
        updateNotifier = require('update-notifier');
    } catch (e) {
        console.error(
            'Please run npm install from this directory:\n\t' +
            path.dirname(__dirname)
        );
        process.exit(2);
    }
}

function checkForUpdates() {
    try {
        // Checks for available update and returns an instance
        var notifier = updateNotifier({
            pkg: pkg
        });

        // Notify using the built-in convenience method
        notifier.notify();
    } catch (e) {
        // https://issues.apache.org/jira/browse/CB-10062
        if (e && e.message && /EACCES/.test(e.message)) {
            console.log('Update notifier was not able to access the config file.\n' +
                'You may grant permissions to the file: \'sudo chmod 744 ~/.config/configstore/update-notifier-cordova.json\'');
        } else {
            throw e;
        }
    }
}

// For CordovaError print only the message without stack trace unless we
// are in a verbose mode.
process.on('uncaughtException', function (err) {
    logger.error(err);
    // Don't send exception details, just send that it happened
    if (shouldCollectTelemetry) {
        telemetry.track('uncaughtException');
    }
    process.exit(1);
});
    
    
var shouldCollectTelemetry = false;
module.exports = function (inputArgs, cb) {
    
    /**
     * mainly used for testing.
     */
    cb = cb || function(){};
    
    init();
    
    checkForUpdates();
    
    var args = parseArguments(inputArgs || process.argv);
        
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
        
        if(telemetry.isCI(process.env) || telemetry.isNoTelemetryFlag(inputArgs)) {
            return Q(false);
        }
        
        /**
         * We shouldn't prompt for telemetry if user issues a command of the form: `cordova telemetry on | off | ...x`
         * Also, if the user has already been prompted and made a decision, use his saved answer
         */
        if(args.command === 'telemetry') {
            return Q(telemetry.isOptedIn());
        }
        
        if(telemetry.hasUserOptedInOrOut()) {
            return Q(telemetry.isOptedIn());
        }
        
        /**
         * Otherwise, prompt user to opt-in or out
         * Note: the prompt is shown for 30 seconds. If no choice is made by that time, User is considered to have opted out.
         */
        return telemetry.showPrompt();
    }).then(function (collectTelemetry) {
        shouldCollectTelemetry = collectTelemetry;
        // ToDO: Test `cordova telemetry X` moved to `cli(...)`
        return cli(args);
    }).then(function () {
        // ToDO: test this
        // Always track telemetry opt-outs (whether user opted out or not!)
        var isOptingOut = (args.command === 'telemetry' && args.subcommand === 'off');
        if(isOptingOut) {
            telemetry.track(args.command, args.subcommand /* 'off' */, 'via-cordova-telemetry-cmd', 'successful');
        } else if(shouldCollectTelemetry) {
            telemetry.track(args.command, args.subcommand, 'successful');
        }

        // call cb with error as arg if something failed
        cb(null);
    }).fail(function (err) {
        // ToDO: test this
        // Always track telemetry opt-outs (whether user opted out or not!)
        var isOptingOut = (args.command === 'telemetry' && args.subcommand === 'off');
        if(isOptingOut) {
            telemetry.track(args.command, args.subcommand /* 'off' */, 'via-cordova-telemetry-cmd', 'unsuccessful');
        } else if(shouldCollectTelemetry) {
            telemetry.track(args.command, args.subcommand, 'unsuccessful');
        }
 
        // call cb with error as arg if something failed
        cb(err);
        throw err;
    }).done();
};

function parseArguments(inputArgs) {
    // When changing command line arguments, update doc/help.txt accordingly.
    var knownOpts =
        {
            'verbose': Boolean
            , 'version': Boolean
            , 'help': Boolean
            , 'silent': Boolean
            , 'experimental': Boolean
            , 'noregistry': Boolean
            , 'nohooks': Array
            , 'shrinkwrap': Boolean
            , 'copy-from': String
            , 'link-to': path
            , 'searchpath': String
            , 'variable': Array
            , 'link': Boolean
            , 'force': Boolean
            // Flags to be passed to `cordova build/run/emulate`
            , 'debug': Boolean
            , 'release': Boolean
            , 'archs': String
            , 'device': Boolean
            , 'emulator': Boolean
            , 'target': String
            , 'browserify': Boolean
            , 'noprepare': Boolean
            , 'fetch': Boolean
            , 'nobuild': Boolean
            , 'list': Boolean
            , 'buildConfig': String
            , 'template': String
        };

    var shortHands =
        {
            'd': '--verbose'
            , 'v': '--version'
            , 'h': '--help'
            , 'src': '--copy-from'
            , 't': '--template'
        };

    var args = nopt(knownOpts, shortHands, inputArgs); 
    
    // If there were arguments protected from nopt with a double dash, keep
    // them in unparsedArgs. For example:
    // cordova build ios -- --verbose --whatever
    // In this case "--verbose" is not parsed by nopt and args.vergbose will be
    // false, the unparsed args after -- are kept in unparsedArgs and can be
    // passed downstream to some scripts invoked by Cordova.
    var unparsedArgs = [];
    var parseStopperIdx =  args.argv.original.indexOf('--');
    if (parseStopperIdx != -1) {
        unparsedArgs = args.argv.original.slice(parseStopperIdx + 1);
    }

    // args.argv.remain contains both the undashed args (like platform names)
    // and whatever unparsed args that were protected by " -- ".
    // "undashed" stores only the undashed args without those after " -- " .
    var remain = args.argv.remain;
    var undashed = remain.slice(0, remain.length - unparsedArgs.length);
    
    args.command = undashed[0];
    
    // ToDO: Test cordova, cordova --help, cordova --h, cordova bogus
    if ( !args.command || args.command == 'help' || args.help ) {
        if(!args.help && remain[0] === 'help') {
            remain.shift();
        } 
        args.command = 'help';
    } else if (args.command === 'platform' || args.command === 'platforms' || args.command === 'plugin' || args.command === 'plugins') {
        args.subcommand = undashed[1];
        args.targets = undashed.slice(2); // array of targets, either platforms or plugins
        var cli_vars = {};
        if (args.variable) {
            args.variable.forEach(function (s) {
                // CB-9171
                var eq = s.indexOf('=');
                if (eq == -1)
                    throw new CordovaError("invalid variable format: " + s);
                var key = s.substr(0, eq).toUpperCase();
                var val = s.substr(eq + 1, s.length);
                cli_vars[key] = val;
            });
        }
        args.cli_vars = cli_vars;
    } else if(args.command === 'telemetry') {
        args.subcommand = undashed[1];
    } else if(args.command === 'serve') {
        args.port = args.undashed[1];
    }
    
    args.undashed = undashed;
    args.remain = remain;
    args.unparsedArgs = unparsedArgs; 
    
    return args;
}

function cli(args) {

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

    var msg;
    var known_platforms = Object.keys(cordova_lib.cordova_platforms);

    if ( args.command == 'help' ) {
        return help(args.remain);
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
        opts.platforms = args.undashed.slice(1);
        var badPlatforms = _.difference(opts.platforms, known_platforms);
        if( !_.isEmpty(badPlatforms) ) {
            msg = 'Unknown platforms: ' + badPlatforms.join(', ');
            throw new CordovaError(msg);
        }

        // Pass nopt-parsed args to PlatformApi through opts.options
        opts.options = args;
        opts.options.argv = args.unparsedArgs;

        if (args.command === 'run' && args.list && cordova.raw.targets) { // ToDO args.list ?
            return cordova.raw.targets.call(null, opts);
        }

        return cordova.raw[args.command].call(null, opts);
    } else if (args.command === 'telemetry') {
        return handleTelemetryCmd(args.subcommand, telemetry.isOptedIn());
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
        // platform/plugins add/rm [target(s)]
        // ToDO: test this //subcommand = undashed[1]; // sub-command like "add", "ls", "rm" etc.
        // ToDO: test targets  
        
        // ToDO: move this to parsing
        
        var download_opts = { searchpath : args.searchpath
                            , noregistry : args.noregistry
                            , nohooks : args.nohooks
                            , cli_variables : args.cli_vars
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
    
    // ToDO: Move telemetry tracking upwards
    // ToDO: Check if command succeeded or failed upwards
    function handleTelemetryCmd(args) {
        
        if (args.subcommand !== 'on' && args.subcommand !== 'off') {
            return help(['telemetry']);
        }
        
        var turnOn = args.subcommand === 'on' ? true : false;

        // turn telemetry on or off
        if (turnOn) {
            telemetry.turnOn();
            console.log("Thanks for opting into telemetry to help us improve cordova.");
        } else {
            telemetry.turnOff();
            console.log("You have been opted out of telemetry. To change this, run: cordova telemetry on.");
        }
   
        return Q();
    }
}
