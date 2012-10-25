var config_parser = require('./config_parser'),
    cordova_util  = require('./util'),
    util          = require('util'),
    fs            = require('fs'),
    path          = require('path'),
    android_parser= require('./metadata/android_parser'),
    blackberry_parser= require('./metadata/blackberry_parser'),
    ios_parser    = require('./metadata/ios_parser'),
    hooker        = require('./hooker'),
    n             = require('ncallbacks'),
    semver        = require('semver'),
    shell         = require('shelljs');

module.exports = function platform(command, targets, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }

    var hooks = new hooker(projectRoot), end;

    if (arguments.length === 0) command = 'ls';
    if (targets) {
        if (!(targets instanceof Array)) targets = [targets];
        end = n(targets.length, function() {
            if (callback) callback();
        });
    }

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var cfg = new config_parser(xml);

    switch(command) {
        case 'ls':
        case 'list':
            // TODO before+after hooks here are awkward
            hooks.fire('before_platform_ls');
            hooks.fire('after_platform_ls');
            return fs.readdirSync(path.join(projectRoot, 'platforms'));
            break;
        case 'add':
            targets.forEach(function(target) {
                hooks.fire('before_platform_add');
                var output = path.join(projectRoot, 'platforms', target);

                var shell_to_cordova = function() {
                    if (target == 'ios') {
                        // Check xcode + version.
                        var xcode = shell.exec('xcodebuild -version', {silent:true});
                        if (xcode.code != 0) throw 'Xcode is not installed. Cannot add iOS platform.';
                        var xc_version = xcode.output.split('\n')[0].split(' ')[1];
                        var MIN_XCODE_VERSION = '4.5.x';
                        if (semver.lt(xc_version, MIN_XCODE_VERSION)) throw ('Xcode version installed is too old. Minimum: ' + MIN_XCODE_VERSION + ', yours: ' + xc_version);
                    }
                    // Create a platform app using the ./bin/create scripts that exist in each repo.
                    // TODO: eventually refactor to allow multiple versions to be created.
                    // Check if output directory already exists.
                    if (fs.existsSync(output)) {
                        throw new Error('Platform "' + target + '" already exists' );
                    }

                    // Run platform's create script
                    var bin = path.join(__dirname, '..', 'lib', cordova_util.underlyingLib(target), 'bin', 'create');
                    var pkg = cfg.packageName().replace(/[^\w.]/g,'_');
                    var name = cfg.name().replace(/\W/g,'_');
                    var command = util.format('"%s" "%s" "%s" "%s"', bin, output, (cordova_util.underlyingLib(target)=='blackberry'?name:pkg), name);

                    var create = shell.exec(command, {silent:true});
                    if (create.code > 0) {
                        throw new Error('An error occured during creation of ' + target + ' sub-project. ' + create.output);
                    }

                    switch(cordova_util.underlyingLib(target)) {
                        case 'android':
                            var android = new android_parser(output);
                            android.update_project(cfg);
                            hooks.fire('after_platform_add');
                            end();
                            break;
                        case 'ios':
                            var ios = new ios_parser(output);
                            ios.update_project(cfg, function() {
                                hooks.fire('after_platform_add');
                                end();
                            });
                            break;
                        case 'blackberry':
                            var bb = new blackberry_parser(output);
                            bb.update_project(cfg, function() {
                                hooks.fire('after_platform_add');
                                end();
                            });
                            break;
                    }
                };

                // If the Cordova library for this platform is missing, get it.
                if (!cordova_util.havePlatformLib(target)) {
                    cordova_util.getPlatformLib(target, shell_to_cordova);
                } else shell_to_cordova();
            });
            break;
        case 'rm':
        case 'remove':
            targets.forEach(function(target) {
                hooks.fire('before_platform_rm');
                shell.rm('-rf', path.join(projectRoot, 'platforms', target));
                hooks.fire('after_platform_rm');
            });
            break;
        default:
            throw ('Unrecognized command "' + command + '". Use either `add`, `remove`, or `list`.');
    }
};
