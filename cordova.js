var fs        = require('fs')
,   path      = require('path')
,   util      = require('util')
,   exec      = require('child_process').exec
,   platforms = ['ios', 'android']
,   dist      = process.env.CORDOVA_HOME != undefined ? process.env.CORDOVA_HOME : path.join(__dirname, 'lib', 'cordova-1.9.0')

/*
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
*/
module.exports = {

    help: function help (code) {
        console.error("usage:  cordova create [platform:[directory]:[package_name]:[project_name]]...|[cordova.conf]");
        console.error("\tcordova build directory directory...|cordova.conf");
        console.error("\tcordova emulate directory directory...|cordova.conf");
        process.exit(code);
    }
    ,
    create: function create (platform, package, name) {
        var args = [].slice.call(arguments)
        ,   projectPath = path.join(process.cwd(), name)

        if (args.length != 3) {
            console.error('Invalid number of arguments.')
            process.exit(1)
        }
        
        exec(util.format("%s/lib/%s/bin/create %s %s %s", dist, platform, projectPath, package, name), function(err, stdout, stderr) {
            if (err) {
                console.error('An error occurred while creating project!', err)
            } 
            else {
                console.log( platform + ' project successfully created.')
            }
        })
    }
    ,
    build: function build() {
        console.log(util.format("%s/cordova/debug ", directory));
        spawn(util.format("%s/cordova/debug", directory), [], function(code) {
            if(code != 0) {
                console.error("An error occurred while building project");
            }
        });
    }
    ,
    emulate: function emulate() {
        console.log(util.format("%s/cordova/emulate ", directory));
        spawn(util.format("%s/cordova/emulate", directory), [], function(code) {
            if(code != 0) {
                console.error("An error occurred while emulating project");
            }
        });
   }
   // end of module defn
}
