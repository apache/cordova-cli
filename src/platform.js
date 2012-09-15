var config_parser = require('./config_parser'),
    cordova_util  = require('./util'),
    util          = require('util'),
    fs            = require('fs'),
    wrench        = require('wrench'),
    rmrf          = wrench.rmdirSyncRecursive,
    exec          = require('child_process').exec,
    path          = require('path'),
    android_parser= require('./metadata/android_parser'),
    ios_parser    = require('./metadata/ios_parser'),
    asyncblock    = require('asyncblock');

var repos = {
    ios:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-ios.git',
    android:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-android.git'
};

/**
 * checkout a platform from the git repo
 * @param target string platform to get (enum of 'ios' or 'android' for now)
 * @param cfg project configuration object
 * @param flow I/O object to handle synchronous sys calls
 * @throws Javascript Error on failure
 */
function get_platform_lib(target, cfg, flow) {
    if (!repos[target]) {
        // TODO: this is really a pretty terrible pattern because it kills 
        //       excecution immediately and prevents cleanup routines. However,
        //       I don't want to just spew a stack trace to the user either. 
        console.error('platform "' + target + '" not found.');
        process.exit(1);
    }
    // specify which project tag to check out. minimum tag is 2.1.0rc1
    var cordova_lib_tag = '2.1.0';

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

    // Check out the right version.
    cmd = util.format('cd "%s" && git checkout %s', outPath, cordova_lib_tag);
    exec(cmd, flow.set({
        key:'tagcheckout',
        firstArgIsError:false,
        responseFormat:['err', 'stdout', 'stderr']
    }));
    buffers = flow.get('tagcheckout');
    if (buffers.err) {
        cfg.remove_platform(target);
        throw ('An error occured during git-checkout of ' + outPath + ' to tag ' + cordova_lib_tag + '. ' + buffers.err);
    }
}

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
                var output = path.join(projectRoot, 'platforms', target);

                // If the Cordova library for this platform is missing, get it.
                if (!cordova_util.havePlatformLib(target)) {
                    get_platform_lib(target, cfg, flow);
                }

                // Create a platform app using the ./bin/create scripts that exist in each repo.
                // TODO: eventually refactor to allow multiple versions to be created.
                // Check if output directory already exists.
                if (fs.existsSync(output)) {
                    throw 'Platform "' + target + '" already exists' 
                } else {
                    // directory doesn't exist, run platform's create script
                    var bin = path.join(__dirname, '..', 'lib', target, 'bin', 'create');
                    var pkg = cfg.packageName().replace(/[^\w.]/g,'_');
                    var name = cfg.name().replace(/\W/g,'_');
                    var command = util.format('"%s" "%s" "%s" "%s"', bin, output, pkg, name);
                    child = exec(command, flow.set({
                        key:'create',
                        firstArgIsError:false,
                        responseFormat:['err', 'stdout', 'stderr']
                    }));
                    var bfrs = flow.get('create');
                    if (bfrs.err) {
                        throw ('An error occured during creation of ' + target + ' sub-project. ' + bfrs.err);
                    } else {
                        cfg.add_platform(target);
                        switch(target) {
                            case 'android':
                                var android = new android_parser(output);
                                android.update_from_config(cfg);
                                if (callback) callback();
                                break;
                            case 'ios':
                                var ios = new ios_parser(output);
                                ios.update_from_config(cfg, callback);
                                break;
                        }
                    }
                }
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
