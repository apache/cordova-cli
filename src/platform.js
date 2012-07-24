var config_parser = require('./config_parser'),
    cordova_util = require('./util'),
    util = require('util'),
    fs = require('fs'),
    wrench = require('wrench'),
    rmrf = wrench.rmdirSyncRecursive,
    exec = require('child_process').exec,
    path = require('path');

var repos = {
    ios:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-ios.git',
    android:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-android.git'
};

// Creates a platform app using the ./bin/create scripts that exist in
// each repo.
// TODO: eventually refactor to allow multiple versions to be created.
// Currently only checks out HEAD.
function create(target, dir, cfg, callback) {
    // Check if it already exists.
    try {
        fs.lstatSync(dir);
    } catch(e) {
        // Doesn't exist, continue.
        var bin = path.join(__dirname, '..', 'lib', target, 'bin', 'create');
        var pkg = cfg.packageName();
        var name = cfg.name().replace(/\W/g,'_');
        var cmd = util.format('%s "%s" "%s" "%s"', bin, dir, pkg, name);
        exec(cmd, function(err, stderr, stdout) {
            if (err) {
                cfg.remove_platform(target);
                throw 'An error occured during creation of ' + target + ' sub-project. ' + err;
            } else if (callback) callback();
        });
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
            // Add the platform to the config.xml
            cfg.add_platform(target);

            var output = path.join(projectRoot, 'platforms', target);

            // Do we have the cordova library for this platform?
            if (!cordova_util.havePlatformLib(target)) {
                // Shell out to git.
                var outPath = path.join(__dirname, '..', 'lib', target);
                var cmd = util.format('git clone %s %s', repos[target], outPath);
                
                // TODO: refactor post-clone hooks
                // make sure we run "make install" if we're cloning ios
                if (target == 'ios') {
                    cmd += ' && cd "' + output + '" && make install';
                }

                console.log('Cloning ' + repos[target] + ', this may take a while...');
                exec(cmd, function(err, stderr, stdout) {
                    if (err) {
                        cfg.remove_platform(target);
                        throw 'An error occured during git-clone of ' + repos[target] + '. ' + err;
                    }
                    create(target, output, cfg, callback);
                });
            } else {
                create(target, output, cfg, callback);
            }
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
            throw 'Unrecognized command "' + command + '". Use either `add`, `remove`, or `ls`.';
    }
};
