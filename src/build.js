var cordova_util  = require('./util'),
    path          = require('path'),
    config_parser = require('./config_parser'),
    fs            = require('fs'),
    shell         = require('shelljs'),
    et            = require('elementtree'),
    android_parser= require('./metadata/android_parser'),
    ios_parser    = require('./metadata/ios_parser'),
    n             = require('ncallbacks'),
    util          = require('util');

function shell_out_to_debug(projectRoot, platform,  www_target, js) {
    // Clean out the existing www.
    shell.rm('-rf', path.join(www_target, 'www'));

    // Copy app assets into native package
    shell.cp('-r', path.join(projectRoot, 'www'), www_target);

    // Copy in the appropriate JS
    var jsPath = path.join(www_target, 'cordova.js');
    fs.writeFileSync(jsPath, fs.readFileSync(js));

    // shell out to debug command
    var cmd = path.join(projectRoot, 'platforms', platform, 'cordova', 'debug > /dev/null');
    var response = shell.exec(cmd, {silent:true});
    if (response.code > 0) throw 'An error occurred while building the ' + platform + ' project. ' + response.output;
}

module.exports = function build (callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var assets = path.join(projectRoot, 'www');
    var cfg = new config_parser(xml);
    var platforms = cfg.ls_platforms();

    if (platforms.length === 0) throw 'No platforms added to this project. Please use `cordova platform add <platform>`.';

    var end = n(platforms.length, function() {
        if (callback) callback();
    });

    // Iterate over each added platform 
    platforms.forEach(function(platform) {
        // Figure out paths based on platform
        var assetsPath, js, parser;
        switch (platform) {
            case 'android':
                assetsPath = path.join(projectRoot, 'platforms', 'android', 'assets');
                js = path.join(__dirname, '..', 'lib', 'android', 'framework', 'assets', 'js', 'cordova.android.js');
                parser = new android_parser(path.join(projectRoot, 'platforms', 'android'));
                // Update the related platform project from the config
                parser.update_from_config(cfg);
                shell_out_to_debug(projectRoot, 'android', assetsPath, js);
                end();
                break;
            case 'ios':
                assetsPath = path.join(projectRoot, 'platforms', 'ios');
                js = path.join(__dirname, '..', 'lib', 'ios', 'CordovaLib', 'javascript', 'cordova.ios.js');
                parser = new ios_parser(path.join(projectRoot, 'platforms', 'ios'));
                // Update the related platform project from the config
                parser.update_from_config(cfg, function() {
                    shell_out_to_debug(projectRoot, 'ios', assetsPath, js);
                    end();
                });
                break;
        }

    });
};
