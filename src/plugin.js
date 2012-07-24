var cordova_util = require('./util'),
    util = require('util'),
    wrench = require('wrench'),
    cpr = wrench.copyDirSyncRecursive,
    fs = require('fs'),
    path = require('path'),
    config_parser = require('./config_parser'),
    exec = require('child_process').exec,
    ls = fs.readdirSync;

module.exports = function plugin(command, target, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }
    if (arguments.length === 0) command = 'ls';

    // Grab config info for the project
    var xml = path.join(projectRoot, 'www', 'config.xml');
    var projectWww = path.join(projectRoot, 'www');
    var cfg = new config_parser(xml);
    var platforms = cfg.ls_platforms();

    // Massage plugin name / path
    var pluginPath = path.join(projectRoot, 'plugins');
    var plugins = ls(pluginPath);
    var targetName = target.substr(target.lastIndexOf('/') + 1);
    if (targetName[targetName.length-1] == '/') targetName = targetName.substr(0, targetName.length-1);

    switch(command) {
        case 'ls':
            if (plugins.length) {
                return plugins.join('\n');
            } else return 'No plugins added. Use `cordova plugin add <plugin>`.';
            break;
        case 'add':
            // Check if we already have the plugin.
            if (plugins.indexOf(targetName) > -1) {
                throw 'Plugin "' + targetName + '" already added to project.';
            }
            
            // Check if the plugin has a plugin.xml in the root of the
            // specified dir.
            var pluginContents = ls(target);
            if (pluginContents.indexOf('plugin.xml') == -1) {
                throw 'Plugin "' + targetName + '" does not have a plugin.xml in the root. Plugin must support the Cordova Plugin Specification: https://github.com/alunny/cordova-plugin-spec';
            }

            // Iterate over all platforms in the project and install the
            // plugin.
            var cli = path.join(__dirname, '..', 'node_modules', 'pluginstall', 'cli.js');
            platforms.forEach(function(platform) {
                var cmd = util.format('%s %s "%s" "%s"', cli, platform, path.join(projectRoot, 'platforms', platform), target);
                exec(cmd, function(err, stderr, stdout) {
                    if (err) {
                        console.error(stderr);
                        throw 'An error occured during plugin installation. ' + err;
                    }
                });
            });
            
            // Add the plugin web assets to the www folder as well
            // TODO: assumption that web assets go under www folder
            // inside plugin dir; instead should read plugin.xml
            var pluginWww = path.join(target, 'www');
            var wwwContents = ls(pluginWww);
            wwwContents.forEach(function(asset) {
                asset = path.resolve(path.join(pluginWww, asset));
                var info = fs.lstatSync(asset);
                var name = asset.substr(asset.lastIndexOf('/')+1);
                var wwwPath = path.join(projectWww, name);
                if (info.isDirectory()) {
                    cpr(asset, wwwPath);
                } else {
                    fs.writeFileSync(wwwPath, fs.readFileSync(asset));
                }
            });

            break;
        case 'remove':
            throw 'Plugin removal not supported yet! sadface';
        default:
            throw 'Unrecognized command "' + command + '". Use either `add`, `remove`, or `ls`.';
    }
};
