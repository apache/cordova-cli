var cordova_util  = require('./util'),
    path          = require('path'),
    exec          = require('child_process').exec,
    wrench        = require('wrench'),
    rmrf          = wrench.rmdirSyncRecursive,
    cpr           = wrench.copyDirSyncRecursive,
    config_parser = require('./config_parser'),
    fs            = require('fs'),
    asyncblock    = require('asyncblock'),
    util          = require('util');

module.exports = function build () {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }

    asyncblock(function(flow) {
        var xml = path.join(projectRoot, 'www', 'config.xml');
        var assets = path.join(projectRoot, 'www');
        var cfg = new config_parser(xml);
        var name = cfg.name();
        var id = cfg.packageName();
        var platforms = cfg.ls_platforms();

        // Iterate over each added platform 
        platforms.map(function(platform) {
            // Figure out paths based on platform
            var assetsPath, js;
            switch (platform) {
                case 'android':
                    assetsPath = path.join(projectRoot, 'platforms', 'android', 'assets', 'www');
                    js = path.join(__dirname, '..', 'lib', 'android', 'framework', 'assets', 'js', 'cordova.android.js');

                    // TODO: drop activity name and package name into
                    // appropriate places in android
                    break;
                case 'ios':
                    assetsPath = path.join(projectRoot, 'platforms', 'ios', 'www');
                    js = path.join(__dirname, '..', 'lib', 'ios', 'CordovaLib', 'javascript', 'cordova.ios.js');

                    // TODO: drop app name and id into
                    // appropriate places in ios
                    break;
            } 

            // Clean out the existing www.
            rmrf(assetsPath);

            // Copy app assets into native package
            cpr(assets, assetsPath);

            // Copy in the appropriate JS
            var jsPath = path.join(assetsPath, 'cordova.js');
            fs.writeFileSync(jsPath, fs.readFileSync(js));

            // shell out to debug command
            var cmd = path.join(projectRoot, 'platforms', platform, 'cordova', 'debug > /dev/null');
            exec(cmd, flow.set({
                key:'debug',
                firstArgIsError:false,
                responseFormat:['err', 'stdout', 'stderr']
            }));
            var buffers = flow.get('debug');
            if (buffers.err) throw 'An error occurred while building the ' + platform + ' project. ' + buffers.err;
        });
    });
};
