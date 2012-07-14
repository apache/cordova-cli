var fs = require('fs'),
    util = require('util'),
    spawn = require('child_process').spawn;

var platforms = ['ios', 'android'];
var actions = ['create', 'build', 'emulate'];
var action = 'create';

// TODO: implement reading/writing cordova.conf

function usage(code) {
    console.error("usage:  cordova create [platform:[directory]:[package_name]:[project_name]]...|[cordova.conf]");
    console.error("\tcordova build directory directory...|cordova.conf");
    console.error("\tcordova emulate directory directory...|cordova.conf");
    process.exit(code);
}

function run(action, platform, directory, options) {
   switch(action) {
        case 'create':
            // if used with the cordova distribution
            if(!fs.exists(directory + '/lib/' + platform)) {
                // if used without the cordova distribution. Reads CORDOVA_HOME env variable 
                if(process.env.CORDOVA_HOME) {
                    directory = process.env.CORDOVA_HOME;
                } else {
                    console.error('Could not find Cordova distribution directory');
                    console.error('Point CORDOVA_HOME to your phonegap distribution path');
                    process.exit(3);
                }
            }
            console.log(util.format("%s/lib/%s/bin/create ", directory, platform) + options.join(' '));
            spawn(util.format("%s/lib/%s/bin/create", directory, platform), options, function(code) {
                if(code != 0) {
                    console.error("An error occurred while creating project");
                } else {
                    console.log(platform+" project successfully created");
                }
            });
        break;
        case 'build':
            console.log(util.format("%s/cordova/debug ", directory));
            spawn(util.format("%s/cordova/debug", directory), [], function(code) {
                if(code != 0) {
                    console.error("An error occurred while building project");
                }
            });
        break;
        case 'emulate':
            console.log(util.format("%s/cordova/emulate ", directory));
            spawn(util.format("%s/cordova/emulate", directory), [], function(code) {
                if(code != 0) {
                    console.error("An error occurred while emulating project");
                }
            });
        break;
        default: 
            usage(5);
   }
}

function processArguments() {
    process.argv.forEach(function(val, index, array) {
        // this is either the cordova distribution/client directory for the create actions
        // OR the cordova-generated project directory for all other actions
        var directory = __dirname + '/..';
        
        // XXX remove this
        // console.log(index + ': '+ val);
        
        // action is required: create, build, emulate
        if(index == 2) {
            if(actions.indexOf(val) == -1) {
                usage(2);
            }
            action = val;
            // default: we create one project per platform
            if(array.length == 3 && action == 'create') {
                platforms.forEach(function(val, index, array) {
                    platform = val;
                    run(action, platform, directory, [platform+'-example']);
                });
            } 
            if(array.length == 3 && action != 'create') {
                usage(4);
            }
        }
        // other arguments such as: platform:directory:package:project_name
        // OR directory... only in the case of an existing cordova project
        if(index > 2) {
            var options = val.split(':');

            var platform = options[0];
            // if it is not a platform we consider it to be a directory
            if(platforms.indexOf(platform) == -1 && action != 'create') {
                directory = platform;
                run(action, null, directory, []);
            } 
            if(platforms.indexOf(platform) != -1 && action == 'create') {
                run(action, platform, directory, options.slice(1));
            }
        }
    });
}

