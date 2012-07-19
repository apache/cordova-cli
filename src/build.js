var cordova_util = require('./util'),
    path = require('path'),
    exec = require('child_process').exec,
    wrench = require('wrench'),
    rmrf = wrench.rmdirSyncRecursive,
    cpr = wrench.copyDirSyncRecursive,
    config_parser = require('./config_parser'),
    fs = require('fs'),
    util = require('util');

module.exports = function build () {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var assets = path.join(projectRoot, 'www');
    var cfg = new config_parser(xml);
    var platforms = cfg.ls_platforms();

    // Iterate over each added platform 
    platforms.map(function(platform) {
        // Copy in latest www assets.
        var assetsPath;
        switch (platform) {
            // First clean out the existing www.
            case 'android':
                assetsPath = path.join(projectRoot, 'platforms', 'android', 'assets', 'www');
                break;
            case 'ios':
                assetsPath = path.join(projectRoot, 'platforms', 'ios', 'www');
                break;
        } 
        rmrf(assetsPath);
        cpr(assets, assetsPath);
        // Copy in the appropriate JS
        var js;
        var jsPath = path.join(assetsPath, 'cordova.js');
        switch (platform) {
            case 'android':
                js = path.join(__dirname, '..', 'lib', 'android', 'framework', 'assets', 'js', 'cordova.android.js');
                break;
            case 'ios':
                js = path.join(__dirname, '..', 'lib', 'ios', 'CordovaLib', 'javascript', 'cordova.ios.js');
                break;
        }
        fs.writeFileSync(jsPath, fs.readFileSync(js));

        // shell out to debug command
        var cmd = path.join(projectRoot, 'platforms', platform, 'cordova', 'debug > /dev/null');
        exec(cmd, function(err, stderr, stdout) {
            if (err) throw 'An error occurred while building the ' + platform + ' project. ' + err;
        });
    });
};
