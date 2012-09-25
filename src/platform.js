var config_parser = require('./config_parser'),
    cordova_util  = require('./util'),
    util          = require('util'),
    fs            = require('fs'),
    path          = require('path'),
    shell         = require('shelljs'),
    android_parser= require('./metadata/android_parser'),
    ios_parser    = require('./metadata/ios_parser'),
    shell         = require('shelljs');

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
            } else {
                return 'No platforms added. Use `cordova platform add <platform>`.';
            }
            break;
        case 'add':
            var output = path.join(projectRoot, 'platforms', target);

            // If the Cordova library for this platform is missing, get it.
            if (!cordova_util.havePlatformLib(target)) {
                cordova_util.getPlatformLib(target);
            }

            // Create a platform app using the ./bin/create scripts that exist in each repo.
            // TODO: eventually refactor to allow multiple versions to be created.
            // Check if output directory already exists.
            if (fs.existsSync(output)) {
                throw new Error('Platform "' + target + '" already exists' );
            }
            // directory doesn't exist, run platform's create script
            var bin = path.join(__dirname, '..', 'lib', target, 'bin', 'create');
            var pkg = cfg.packageName().replace(/[^\w.]/g,'_');
            var name = cfg.name().replace(/\W/g,'_');
            var command = util.format('"%s" "%s" "%s" "%s"', bin, output, pkg, name);
            var create = shell.exec(command, {silent:true});
            if (create.code > 0) {
                throw new Error('An error occured during creation of ' + target + ' sub-project. ' + create.output);
            }
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
            break;
        case 'remove':
            // Remove the platform from the config.xml
            cfg.remove_platform(target);

            // Remove the Cordova project for the platform.
            try {
                shell.rm('-rf', path.join(projectRoot, 'platforms', target));
            } catch(e) {}
            break;
        default:
            throw ('Unrecognized command "' + command + '". Use either `add`, `remove`, or `ls`.');
    }
};
