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
    CordovaError = require('./CordovaError'),
    nopt, // required in try-catch below to print a nice error message if it's not installed.
    _;

module.exports = function CLI(inputArgs) {
    try {
        nopt =  require('nopt');
        _ = require('underscore');
    } catch (e) {
        console.error("Please run npm install from this directory:\n\t" +
                      path.dirname(__dirname));
        process.exit(2);
    }
    var cordova   = require('../cordova');

    // TODO: use Cli from "cordova-lib" module?
    var opts = {
       'debug' : [Number, String],
       'verbose' : Boolean,
       'version' : Boolean,
       'silent' : Boolean,
       'source': path,
       'link': String,
       'searchpath' : [path, Array]
    }, short = { 'src' : ['--source'], 'v': ['--version'], 'd': ['--debug'] };

    var nopt = nopt(opts, short, inputArgs);

    var command = {
        flags: {},
        arguments: [],
        platforms: []
    };
    for (var opt in nopt) {
        if (opt !== 'argv')
            command.flags[opt] = nopt[opt];
    }
    var parsedArgs = nopt.argv.cooked;
    for(var i in parsedArgs) {
        if(parsedArgs[i].substr(0, 1) !== '-')
            command.arguments.push(parsedArgs[i]);
    }

    // when command.options is changed to {}
    // change command.flag to command.options
    // command.flags = command.options

    if (command.flags.version) {
        return console.log(require('../package').version);
    }

    if(command.flags.verbose) {
        command.flags.debug = 7; // highest log level
    } else if(command.flags.silent) {
        command.flags.debug = 0;
    }

    // TODO: map debug string to integer value
    // Add alias of --debug  --> --loglevel
    // ["silent","win","error","warn","info","verbose","silly"]

    if(command.flags.debug >= 7)
        command.flags.verbose = true;
        
    // For BC & tests? ideally verbose would means 'lots' of info
    if(command.flags.debug >= 1)
        command.flags.verbose = true;

    // For CordovaError print only the message without stack trace.
    process.on('uncaughtException', function(err){
        if (err instanceof CordovaError) {
            console.error(err.message);
        } else {
            console.error(err.stack);
        }
        process.exit(1);
    });

    cordova.on('results', console.log);

    if (command.flags.debug) {
        cordova.on('log', console.log);
        cordova.on('warn', console.warn);
        var plugman = require('plugman');
        plugman.on('log', console.log);
        plugman.on('results', console.log);
        plugman.on('warn', console.warn);
    }

    if (command.flags.debug > 5) {
        // Add handlers for verbose logging.
        cordova.on('verbose', console.log);
        require('plugman').on('verbose', console.log);
    }

    if (!command.arguments.length) {
        return cordova.help();
    }

    var cmd = command.arguments[0];
    if (!cordova.hasOwnProperty(cmd)) {
        throw new CordovaError('Cordova does not know ' + cmd + '; try help for a list of all the available commands.');
    }

    if (cmd === "info") {
        return cordova.info();
    }

    // Legacy... to remove eventually, options must never be an array
    function legacyOptions(nopt){
        var opt = [], arg;

        for(var i in nopt.argv.cooked) {
            arg = nopt.argv.cooked[i];
            if(arg === '--debug' || arg === '--verbose' || arg === '--silent')
                continue;
 
             opt.push(arg);
        }
        return opt.slice(1);
    }
    command.options = legacyOptions(nopt);
	command.name = cmd;

    var args = command.arguments;
    if (cmd == 'emulate' || cmd == 'build' || cmd == 'prepare' || cmd == 'compile' || cmd == 'run') {
        // Filter platforms from arguments
        var platforms = require("../platforms");
        var otherArgs = [];
        var otherOpts = [];
        
        command.options.forEach(function(option, index) {
            if (platforms.hasOwnProperty(option)) {
                command.platforms.push(option);
        } else {
                otherOpts.push(option);
                if(option[0] !== '-')
                    otherArgs.push(option);
            }
        });

        command.arguments = [cmd].concat(otherArgs);
        command.options = otherOpts;

        cordova.raw[cmd].call(this, command).done();
    } else if (cmd == 'serve') {
        cordova.raw[cmd].apply(this, command).done();
    } else if (cmd == 'create') {
        var cfg = {};
        // If we got a forth parameter, consider it to be JSON to init the config.
        if (args[4]) {
            cfg = JSON.parse(args[4]);
        }
        var customWww = command.flags.source || command.flags.link;
        if (customWww) {
            if (customWww.indexOf(':') != -1) {
                throw new CordovaError('Only local paths for custom www assets are supported.');
            }
            if (customWww.substr(0,1) === '~') {  // resolve tilde in a naive way.
                customWww = path.join(process.env.HOME,  customWww.substr(1));
            }
            customWww = path.resolve(customWww);
            var wwwCfg = {uri: customWww};
            if (command.flags.link) {
                wwwCfg.link = true;
            }
            cfg.lib = cfg.lib || {};
            cfg.lib.www = wwwCfg;
        }
        // create(dir, id, name, cfg)
        cordova.raw[cmd].call(this, args[1], args[2], args[3], cfg, command).done();
    } else {
        // platform/plugins add/rm [target(s)]
        var subcmd = args[1]; // this has the sub-command, like "add", "ls", "rm" etc.
        var targets = args.slice(2); // this should be an array of targets, be it platforms or plugins
        command.options = command.options.slice(1);

        cordova.raw[cmd].call(this, subcmd, targets, command).done();
    }
};
