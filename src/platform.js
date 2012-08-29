var config_parser = require('./config_parser'),
    cordova_util  = require('./util'),
    util          = require('util'),
    fs            = require('fs'),
    wrench        = require('wrench'),
    rmrf          = wrench.rmdirSyncRecursive,
    exec          = require('child_process').exec,
    path          = require('path'),
    asyncblock    = require('asyncblock');

var repos = {
    ios:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-ios.git',
    android:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-android.git'
};


module.exports = function platform(command, target, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }
    if (arguments.length === 0) command = 'ls';

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var cfg = new config_parser(xml);

    switch(command) {
        case 'ls':
            var platforms = cfg.ls_platforms();
            if (platforms.length) {
                return platforms.join('\n');
            } else return 'No platforms added. Use `cordova platform add <platform>`.';
            break;
        case 'add':
            asyncblock(function(flow) {
                // Add the platform to the config.xml
                cfg.add_platform(target);
                var output = path.join(projectRoot, 'platforms', target);

                // Do we have the cordova library for this platform?
                if (!cordova_util.havePlatformLib(target)) {
                    // Shell out to git.
                    var outPath = path.join(__dirname, '..', 'lib', target);
                    var cmd = util.format('git clone %s %s', repos[target], outPath);

                    console.log('Cloning ' + repos[target] + ', this may take a while...');
                    exec(cmd, flow.set({
                        key:'cloning',
                        firstArgIsError:false,
                        responseFormat:['err', 'stdout', 'stderr']
                    }));
                    var buffers = flow.get('cloning');
                    if (buffers.err) {
                        cfg.remove_platform(target);
                        throw ('An error occured during git-clone of ' + repos[target] + '. ' + buffers.err);
                    }

                    // Check out the right version. Currently: 2.1.0rc1.
                    cmd = util.format('cd "%s" && git checkout 2.1.0rc1', outPath);
                    exec(cmd, flow.set({
                        key:'tagcheckout',
                        firstArgIsError:false,
                        responseFormat:['err', 'stdout', 'stderr']
                    }));
                    buffers = flow.get('tagcheckout');
                    if (buffers.err) {
                        cfg.remove_platform(target);
                        throw ('An error occured during git-checkout of ' + outPath + ' to tag 2.1.0rc1. ' + buffers.err);
                    }
                }

                // Create a platform app using the ./bin/create scripts that exist in each repo.
                // TODO: eventually refactor to allow multiple versions to be created.
                // Check if output dir already exists.
                try {
                    fs.lstatSync(output);
                    // TODO: this platform dir already exists. what do we do?
                } catch(e) {
                    // Doesn't exist, continue.
                    var bin = path.join(__dirname, '..', 'lib', target, 'bin', 'create');
                    var pkg = cfg.packageName();
                    var name = cfg.name().replace(/\W/g,'_');
                    var command = util.format('%s "%s" "%s" "%s"', bin, output, pkg, name);
                    exec(command, flow.set({
                        key:'create',
                        firstArgIsError:false,
                        responseFormat:['err', 'stdout', 'stderr']
                    }));

                    var bfrs = flow.get('create');
                    if (bfrs.err) {
                        cfg.remove_platform(target);
                        throw ('An error occured during creation of ' + target + ' sub-project. ' + bfrs.err);
                    }
                }
                callback();
            });
            break;
        case 'remove':
            // Remove the platform from the config.xml
            cfg.remove_platform(target);

            // Remove the Cordova project for the platform.
            try {
                rmrf(path.join(projectRoot, 'platforms', target));
            } catch(e) {}
            break;
        default:
            throw ('Unrecognized command "' + command + '". Use either `add`, `remove`, or `ls`.');
    }
};
