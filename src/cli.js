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
    Q = require('q'),
    nopt = require('nopt'),
    updateNotifier = require('update-notifier'),
    pkg = require('../package.json'),
    telemetry = require('./telemetry'),
    help = require('./help'),
    cordova_lib = require('cordova-lib'),
    CordovaError = cordova_lib.CordovaError,
    cordova = cordova_lib.cordova,
    events = cordova_lib.events,
    logger = require('cordova-common').CordovaLogger.get(),
    Configstore = require('configstore'),
    conf = new Configstore(pkg.name + '-config'),
    editor = require('editor'),
    fs = require('fs');

var knownOpts = {
    'verbose' : Boolean
    ,'version' : Boolean
    ,'help' : Boolean
    ,'silent' : Boolean
    ,'experimental' : Boolean
    ,'noregistry' : Boolean
    ,'nohooks': Array
    ,'shrinkwrap' : Boolean
    ,'copy-from' : String
    ,'link-to' : path
    ,'searchpath' : String
    ,'variable' : Array
    ,'link': Boolean
    ,'force': Boolean
    // Flags to be passed to `cordova build/run/emulate`
    ,'debug' : Boolean
    ,'release' : Boolean
    ,'archs' : String
    ,'device' : Boolean
    ,'emulator': Boolean
    ,'target' : String
    ,'browserify': Boolean
    ,'noprepare': Boolean
    ,'fetch': Boolean
    ,'nobuild': Boolean
    ,'list': Boolean
    ,'buildConfig' : String
    ,'template' : String
};

var shortHands = {
    'd' : '--verbose'
    ,'v' : '--version'
    ,'h' : '--help'
    ,'src' : '--copy-from'
    ,'t' : '--template'
};

var Configstore = require('configstore');
var conf = new Configstore(pkg.name + '-config');


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

var shouldCollectTelemetry = false;

module.exports = function (inputArgs, cb) {
    /**
     * mainly used for testing.
     */
    cb = cb || function(){};

    // If no inputArgs given, use process.argv.
    inputArgs = inputArgs || process.argv;
    var cmd = inputArgs[2]; // e.g: inputArgs= 'node cordova run ios'
    var subcommand = getSubCommand(inputArgs, cmd);
    var isTelemetryCmd = (cmd === 'telemetry');
    var isConfigCmd = (cmd === 'config');

    // ToDO: Move nopt-based parsing of args up here
    if(cmd === '--version' || cmd === '-v') {
        cmd = 'version';
    } else if(!cmd || cmd === '--help' || cmd === 'h') {
        cmd = 'help';
    }

    // If "get" is called
    if (isConfigCmd && inputArgs[3] === 'get') {
        if (inputArgs[4]) {
            logger.subscribe(events);
            conf.get(inputArgs[4]);
            if(conf.get(inputArgs[4]) !== undefined) {
                events.emit('log', conf.get(inputArgs[4]).toString());
            } else {
                events.emit('log', 'undefined');
            }
        }
    }

    // If "set" is called
    if (isConfigCmd && inputArgs[3] === 'set') {
        if (inputArgs[5] === undefined) {
            conf.set(inputArgs[4], true);
        }

        if(inputArgs[5]) {
            conf.set(inputArgs[4], inputArgs[5]);
        }
    }

    // If "delete" is called
    if (isConfigCmd && inputArgs[3] === 'delete') {
        if (inputArgs[4]) {
            conf.del(inputArgs[4]);
        }
    }

    // If "edit" is called
    if (isConfigCmd && inputArgs[3] === 'edit') {
        editor(conf.path, function (code, sig) {
            console.log('Finished editing with code ' + code);
        });
    }

    // If "ls" is called
    if (isConfigCmd && inputArgs[3] === 'ls' || inputArgs[3] === 'list') {
        fs.readFile(conf.path, 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
          console.log(data);
        });
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
        if(isTelemetryCmd) {
            var isOptedIn = telemetry.isOptedIn();
            return handleTelemetryCmd(subcommand, isOptedIn);
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
        if(isTelemetryCmd) {
            return Q();
        }
        return cli(inputArgs);
    }).then(function () {
        if (shouldCollectTelemetry && !isTelemetryCmd) {
            telemetry.track(cmd, subcommand, 'successful');
        }
        // call cb with error as arg if something failed
        cb(null);
    }).fail(function (err) {
        if (shouldCollectTelemetry && !isTelemetryCmd) {
            telemetry.track(cmd, subcommand, 'unsuccessful');
        }
        // call cb with error as arg if something failed
        cb(err);
        throw err;
    }).done();
};

function getSubCommand(args, cmd) {
    if(cmd === 'platform' || cmd === 'platforms' || cmd === 'plugin' || cmd === 'plugins' || cmd === 'telemetry' || cmd === 'config') {
        return args[3]; // e.g: args='node cordova platform rm ios', 'node cordova telemetry on'
    }
    return null;
}

function handleTelemetryCmd(subcommand, isOptedIn) {

    if (subcommand !== 'on' && subcommand !== 'off') {
        logger.subscribe(events);
        return help(['telemetry']);
    }

    var turnOn = subcommand === 'on' ? true : false;
    var cmdSuccess = true;

    // turn telemetry on or off
    try {
        if (turnOn) {
            telemetry.turnOn();
            console.log('Thanks for opting into telemetry to help us improve cordova.');
        } else {
            telemetry.turnOff();
            console.log('You have been opted out of telemetry. To change this, run: cordova telemetry on.');
        }
    } catch (ex) {
        cmdSuccess = false;
    }

    // track or not track ?, that is the question

    if (!turnOn) {
        // Always track telemetry opt-outs (whether user opted out or not!)
        telemetry.track('telemetry', 'off', 'via-cordova-telemetry-cmd', cmdSuccess ? 'successful': 'unsuccessful');
        return Q();
    }

    if(isOptedIn) {
        telemetry.track('telemetry', 'on', 'via-cordova-telemetry-cmd', cmdSuccess ? 'successful' : 'unsuccessful');
    }

    return Q();
}

function cli(inputArgs) {

    checkForUpdates();

    var args = nopt(knownOpts, shortHands, inputArgs);

    process.on('uncaughtException', function(err) {
        if(err.message) {
            logger.error(err.message);
        } else {
            logger.error(err);
        }
        // Don't send exception details, just send that it happened
        if(shouldCollectTelemetry) {
            telemetry.track('uncaughtException');
        }
        process.exit(1);
    });

    logger.subscribe(events);

    if (args.silent) {
        logger.setLevel('error');
    }

    if (args.verbose) {
        logger.setLevel('verbose');
    }

    var cliVersion = require('../package').version;
    // TODO: Use semver.prerelease when it gets released
    var usingPrerelease = /-nightly|-dev$/.exec(cliVersion);
    if (args.version || usingPrerelease) {
        var libVersion = require('cordova-lib/package').version;
        var toPrint = cliVersion;
        if (cliVersion != libVersion || usingPrerelease) {
            toPrint += ' (cordova-lib@' + libVersion + ')';
        }

        if (args.version) {
            logger.results(toPrint);
            return Q();
        } else {
            // Show a warning and continue
            logger.warn('Warning: using prerelease version ' + toPrint);
        }
    }

    if (/^v0.\d+[.\d+]*/.exec(process.version)) { // matches v0.*
        var msg1 = 'Warning: using node version ' + process.version +
                ' which has been deprecated. Please upgrade to the latest node version available (v6.x is recommended).';
        logger.warn(msg1);
    }

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
    var cmd = undashed[0];
    var subcommand;

    if ( !cmd || cmd == 'help' || args.help ) {
        if (!args.help && remain[0] == 'help') {
            remain.shift();
        }
        return help(remain);
    }

    if ( !cordova.hasOwnProperty(cmd) ) {
        var msg2 = 'Cordova does not know ' + cmd + '; try `' + cordova_lib.binname +
            ' help` for a list of all the available commands.';
        throw new CordovaError(msg2);
    }

    if (args.nofetch) {
        args.fetch = false;
    } else {
        args.fetch = true;
    }

    var opts = {
        platforms: [],
        options: [],
        verbose: args.verbose || false,
        silent: args.silent || false,
        browserify: args.browserify || false,
        fetch: args.fetch,
        nohooks: args.nohooks || [],
        searchpath : args.searchpath
    };

    var platformCommands = ['emulate', 'build', 'prepare', 'compile', 'run', 'clean'];
    if (platformCommands.indexOf(cmd) !== -1) {

        // All options without dashes are assumed to be platform names
        opts.platforms = undashed.slice(1);

        // Pass nopt-parsed args to PlatformApi through opts.options
        opts.options = args;
        opts.options.argv = unparsedArgs;
        if (cmd === 'run' && args.list && cordova.raw.targets) {
            return cordova.raw.targets.call(null, opts);
        }
        return cordova.raw[cmd].call(null, opts);

    } else if (cmd === 'requirements') {
        // All options without dashes are assumed to be platform names
        opts.platforms = undashed.slice(1);

        return cordova.raw[cmd].call(null, opts.platforms)
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

                if (someChecksFailed) {
                    throw new CordovaError('Some of requirements check failed');
                }
            });
    } else if (cmd === 'serve') {
        var port = undashed[1];
        return cordova.raw.serve(port);
    } else if (cmd === 'create') {
        return create(undashed,args);
    } else if (cmd === 'config') {
        //Don't need to do anything with cordova-lib since config was handled above
        return true;
    } else {
        // platform/plugins add/rm [target(s)]
        subcommand = undashed[1]; // sub-command like "add", "ls", "rm" etc.
        var targets = undashed.slice(2); // array of targets, either platforms or plugins
        var cli_vars = {};
        if (args.variable) {
            args.variable.forEach(function (strVar) {
                // CB-9171
                var keyVal = strVar.split('=');
                if(keyVal.length < 2) {
                    throw new CordovaError('invalid variable format: ' + strVar);
                }
                else {
                    var key = keyVal.shift().toUpperCase();
                    var val = keyVal.join('=');
                    cli_vars[key] = val;
                }
            });
        }

        if (args.nosave) {
            args.save = false;
        } else {
            args.save = true;
        }

        if (args.save === undefined) {
            // User explicitly did not pass in save
            args.save = conf.get('autosave');
        }
        if (args.fetch === undefined) {
            // User explicitly did not pass in fetch
            args.fetch = conf.get('fetch');
        }
        if(args.browserify === undefined) {
           // User explicitly did not pass in browserify
           args.browserify = conf.get('browserify');
        }

        var download_opts = { searchpath : args.searchpath
                            , noregistry : args.noregistry
                            , nohooks : args.nohooks
                            , cli_variables : cli_vars
                            , browserify: args.browserify || false
                            , fetch: args.fetch
                            , link: args.link || false
                            , save: args.save
                            , shrinkwrap: args.shrinkwrap || false
                            , force: args.force || false
        };
        return cordova.raw[cmd](subcommand, targets, download_opts);
    }
}

function create(undashed, args) {
    var cfg;            // Create config
    var customWww;      // Template path
    var wwwCfg;         // Template config

    // If we got a fourth parameter, consider it to be JSON to init the config.
    if (undashed[4])
        cfg = JSON.parse(undashed[4]);
    else
        cfg = {};

    customWww = args['copy-from'] || args['link-to'] || args.template;

    if (customWww) {
        if (!args.template && !args['copy-from'] && customWww.indexOf('http') === 0) {
            throw new CordovaError(
                'Only local paths for custom www assets are supported for linking' + customWww
            );
        }

        // Resolve tilda
        if (customWww.substr(0,1) === '~')
            customWww = path.join(process.env.HOME,  customWww.substr(1));

        wwwCfg = {
            url: customWww,
            template: false,
            link: false
        };

        if (args['link-to']) {
            wwwCfg.link = true;
        }
        if (args.template) {
            wwwCfg.template = true;
        } else if (args['copy-from']) {
            logger.warn('Warning: --copy-from option is being deprecated. Consider using --template instead.');
            wwwCfg.template = true;
        }

        cfg.lib = cfg.lib || {};
        cfg.lib.www = wwwCfg;
    }
    return cordova.raw.create( undashed[1]  // dir to create the project in
        , undashed[2]  // App id
        , undashed[3]  // App name
        , cfg
        , events || undefined
    );
}
