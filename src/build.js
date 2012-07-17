var cordova_util = require('./util'),
    path = require('path'),
    config_parser = require('./config_parser'),
    fs = require('fs'),
    util = require('util');

module.exports = function build () {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        console.error('Current working directory is not a Cordova-based project.');
        return;
    }

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var cfg = new config_parser(xml);
    var platforms = cfg.ls_platforms();

    // Check if we have projects setup for each platform already.
    platforms.map(function(platform) {
        var dir = path.join(projectRoot, 'platforms', platform);
        try {
            fs.lstatSync(dir);
        } catch(e) {
            // Does not exist.
        }

    });

    var cmd = util.format("%s/cordova/debug", process.cwd());
    exec(cmd, function(err, stderr, stdout) {
        if (err) 
            console.error('An error occurred while building project.', err)
        
        console.log(stdout)
        console.log(stderr)
    });
}
