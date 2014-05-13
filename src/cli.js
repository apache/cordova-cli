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

var path = require('path'),
    optimist, // required in try-catch below to print a nice error message if it's not installed.
    help = require('./help'),
    _;

module.exports = function CLI(inputArgs) {
    try {
        optimist = require('optimist');
        _ = require('underscore');
    } catch (e) {
        console.error("Please run npm install from this directory:\n\t" +
                      path.dirname(__dirname));
        process.exit(2);
    }
    var cordova_lib = require('cordova-lib'),
        CordovaError = cordova_lib.CordovaError,
        cordova = cordova_lib.cordova,
        plugman = cordova_lib.plugman;

    // If no inputArgs given, use process.argv.
    var tokens;
    if (inputArgs) {
        tokens = inputArgs.slice(2);
    } else {
        tokens = process.argv.slice(2);
    }

    // When changing command line arguments, update doc/help.txt accordingly.
    var args = optimist(tokens)
        .boolean('d')
        .boolean('verbose')
        .boolean('v')
        .boolean('version')
        .boolean('silent')
        .boolean('experimental')
        .string('copy-from')
        .alias('copy-from', 'src')
        .string('link-to')
        .string('searchpath')
        .argv;

    if (args.v || args.version) {
        return console.log(require('../package').version);
    }

    var opts = {
            platforms: [],
            options: [],
            verbose: (args.d || args.verbose),
            silent: args.silent,
        };

    // For CrodovaError print only the message without stack trace.
    process.on('uncaughtException', function(err){
        if (err instanceof CordovaError) {
            console.error(err.message);
        } else {
            console.error(err.stack);
        }
        process.exit(1);
    });

    cordova.on('results', console.log);

    if (!opts.silent) {
        cordova.on('log', console.log);
        cordova.on('warn', console.warn);
        plugman.on('log', console.log);
        plugman.on('results', console.log);
        plugman.on('warn', console.warn);
    } else {
        // Remove the token.
        tokens.splice(tokens.indexOf('--silent'), 1);
    }


    if (opts.verbose) {
        // Add handlers for verbose logging.
        cordova.on('verbose', console.log);
        plugman.on('verbose', console.log);

        //Remove the corresponding token
        if(args.d && args.verbose) {
            tokens.splice(Math.min(tokens.indexOf("-d"), tokens.indexOf("--verbose")), 1);
        } else if (args.d) {
            tokens.splice(tokens.indexOf("-d"), 1);
        } else if (args.verbose) {
            tokens.splice(tokens.indexOf("--verbose"), 1);
        }
    }

    if (opts.experimental) {
        tokens.splice(tokens.indexOf("--experimental"), 1);
    }

    var cmd = tokens && tokens.length ? tokens.splice(0,1) : undefined;
    if (cmd === undefined) {
        return help();
    }

    if (!cordova.hasOwnProperty(cmd)) {
        throw new CordovaError('Cordova does not know ' + cmd + '; try help for a list of all the available commands.');
    }

    if (cmd == 'emulate' || cmd == 'build' || cmd == 'prepare' || cmd == 'compile' || cmd == 'run') {
        // Filter all non-platforms into options
        var platforms = cordova_lib.cordova_platforms;
        tokens.forEach(function(option, index) {
            if (platforms.hasOwnProperty(option)) {
                opts.platforms.push(option);
            } else {
                opts.options.push(option);
            }
        });
        cordova.raw[cmd].call(this, opts).done();
    } else if (cmd == 'serve') {
        cordova.raw[cmd].apply(this, tokens).done();
    } else if (cmd == 'create') {
        var cfg = {};
        // If we got a forth parameter, consider it to be JSON to init the config.
        if (args._[4]) {
            cfg = JSON.parse(args._[4]);
        }
        var customWww = args['copy-from'] || args['link-to'];
        if (customWww) {
            if (customWww.indexOf(':') != -1) {
                throw new CordovaError('Only local paths for custom www assets are supported.');
            }
            if (customWww.substr(0,1) === '~') {  // resolve tilde in a naive way.
                customWww = path.join(process.env.HOME,  customWww.substr(1));
            }
            customWww = path.resolve(customWww);
            var wwwCfg = {uri: customWww};
            if (args['link-to']) {
                wwwCfg.link = true;
            }
            cfg.lib = cfg.lib || {};
            cfg.lib.www = wwwCfg;
        }
        // create(dir, id, name, cfg)
        cordova.raw[cmd].call(this, args._[1], args._[2], args._[3], cfg).done();
    } else if (cmd == 'help') {
        return help();
    } else {
        // platform/plugins add/rm [target(s)]
        var subcommand = tokens[0]; // this has the sub-command, like "add", "ls", "rm" etc.
        var targets = tokens.slice(1); // this should be an array of targets, be it platforms or plugins
        cordova.raw[cmd].call(this, subcommand, targets, { searchpath: args.searchpath }).done();
    }
};
