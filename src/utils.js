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
    nopt,
    _,
    updateNotifier,
    pkg = require('../package.json');
    
    
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
    } else if (args.command == 'emulate' || args.command == 'build' || args.command == 'prepare' || args.command == 'compile' || args.command == 'run' || args.command === 'clean') {
        // All options without dashes are assumed to be platform names
        args.platforms = args.undashed.slice(1);
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

function cleanArgs(args) {
    var args_to_pass_to_cordova_lib = [];
    for(prop in args) {
        if(_.contains(args_to_pass_to_cordova_lib, prop)) {
            delete args.prop;
        }
    }
    return args;
}

module.exports = {
    init: init,
    parseArguments: parseArguments,
    checkForUpdates: checkForUpdates,
    cleanArgs: cleanArgs
}