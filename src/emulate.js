var cordova_util = require('./util'),
    path = require('path'),
    shell = require('shelljs'),
    config_parser = require('./config_parser'),
    android_parser = require('./metadata/android_parser'),
    ios_parser = require('./metadata/ios_parser'),
    blackberry_parser = require('./metadata/blackberry_parser'),
    platform = require('./platform'),
    fs = require('fs'),
    n = require('ncallbacks'),
    util = require('util');

function shell_out_to_emulate(root, platform) {
    var cmd = path.join(root, 'platforms', platform, 'cordova', 'emulate');
    // TODO: bad bad bad
    if (platform.indexOf('blackberry') > -1) {
        cmd = 'ant -f ' + path.join(root, 'platforms', platform, 'build.xml') + ' qnx load-simulator';
    }
    var em = shell.exec(cmd, {silent:true});
    if (em.code > 0) throw 'An error occurred while emulating/deploying the ' + platform + ' project.' + em.output;
}

module.exports = function emulate (callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var cfg = new config_parser(xml);
    var platforms = platform('ls');

    if (platforms.length === 0) throw 'No platforms added to this project. Please use `cordova platform add <platform>`.';

    var end = n(platforms.length, function() {
        if (callback) callback();
    });

    // Iterate over each added platform and shell out to debug command
    platforms.forEach(function(platform) {
        var parser, platformPath;
        switch (platform) {
            case 'android':
                platformPath = path.join(projectRoot, 'platforms', 'android');
                parser = new android_parser(platformPath);

                // Update the related platform project from the config
                parser.update_project(cfg);
                shell_out_to_emulate(projectRoot, 'android');
                end();
                break;
            case 'blackberry-10':
                platformPath = path.join(projectRoot, 'platforms', 'blackberry-10');
                parser = new blackberry_parser(platformPath);
                
                // Update the related platform project from the config
                parser.update_project(cfg, function() {
                    // Shell it
                    shell_out_to_emulate(projectRoot, 'blackberry-10');
                    end();
                });
                break;
            case 'ios':
                platformPath = path.join(projectRoot, 'platforms', 'ios');
                js = path.join(__dirname, '..', 'lib', 'ios', 'CordovaLib', 'javascript', 'cordova.ios.js');
                parser = new ios_parser(platformPath);
                // Update the related platform project from the config
                parser.update_project(cfg, function() {
                    shell_out_to_emulate(projectRoot, 'ios');
                    end();
                });
                break;
        }
    });
};

