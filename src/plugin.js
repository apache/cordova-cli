var cordova_util  = require('./util'),
    util          = require('util'),
    wrench        = require('wrench'),
    cpr           = wrench.copyDirSyncRecursive,
    fs            = require('fs'),
    path          = require('path'),
    config_parser = require('./config_parser'),
    plugin_parser = require('./plugin_parser'),
    exec          = require('child_process').exec,
    asyncblock    = require('asyncblock'),
    ls            = fs.readdirSync;

module.exports = function plugin(command, target, callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }
    if (arguments.length === 0) command = 'ls';

    var projectWww = path.join(projectRoot, 'www');

    // Grab config info for the project
    var xml = path.join(projectWww, 'config.xml');
    var cfg = new config_parser(xml);
    var platforms = cfg.ls_platforms();

    // Massage plugin name / path
    var pluginPath, plugins, targetName;
    pluginPath = path.join(projectRoot, 'plugins');
    plugins = ls(pluginPath);
    if (target) { 
        targetName = target.substr(target.lastIndexOf('/') + 1);
        if (targetName[targetName.length-1] == '/') targetName = targetName.substr(0, targetName.length-1);
    }

    switch(command) {
        case 'ls':
            if (plugins.length) {
                return plugins.join('\n');
            } else return 'No plugins added. Use `cordova plugin add <plugin>`.';
            break;
        case 'add':
            if (platforms.length === 0) {
                throw 'You need at least one platform added to your app. Use `cordova platform add <platform>`.';
            }
            // Check if we already have the plugin.
            // TODO edge case: if a new platform is added, then you want
            // to re-add the plugin to the new platform.
            if (plugins.indexOf(targetName) > -1) {
                throw 'Plugin "' + targetName + '" already added to project.';
            }
            
            // Check if the plugin has a plugin.xml in the root of the
            // specified dir.
            var pluginContents = ls(target);
            if (pluginContents.indexOf('plugin.xml') == -1) {
                throw 'Plugin "' + targetName + '" does not have a plugin.xml in the root. Plugin must support the Cordova Plugin Specification: https://github.com/alunny/cordova-plugin-spec';
            }

            // Check if there is at least one match between plugin
            // supported platforms and app platforms
            var pluginXml = new plugin_parser(path.join(target, 'plugin.xml'));
            var intersection = pluginXml.platforms.filter(function(e) {
                if (platforms.indexOf(e) == -1) return false;
                else return true;
            });
            if (intersection.length === 0) {
                throw 'Plugin "' + targetName + '" does not support any of your application\'s platforms. Plugin platforms: ' + pluginXml.platforms.join(', ') + '; your application\'s platforms: ' + platforms.join(', ');
            }

            var pluginWww = path.join(target, 'www');
            var wwwContents = ls(pluginWww);
            var cli = path.join(__dirname, '..', 'node_modules', 'pluginstall', 'cli.js');

            asyncblock(function(flow) {
                // Iterate over all matchin app-plugin platforms in the project and install the
                // plugin.
                intersection.forEach(function(platform) {
                    var cmd = util.format('%s %s "%s" "%s"', cli, platform, path.join(projectRoot, 'platforms', platform), target);
                    var key = 'pluginstall-' + platform;
                    exec(cmd, flow.set({
                      key:key,
                      firstArgIsError:false,
                      responseFormat:['err', 'stdout', 'stderr']
                    }));
                    var buffers = flow.get(key);
                    if (buffers.err) throw 'An error occured during plugin installation for ' + platform + '. ' + buffers.err;
                });
                
                // Add the plugin web assets to the www folder as well
                // TODO: assumption that web assets go under www folder
                // inside plugin dir; instead should read plugin.xml
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

                // Finally copy the plugin into the project
                cpr(target, path.join(pluginPath, targetName));

                if (callback) callback();
            });

            break;
        case 'remove':
            // TODO: remove plugin. requires pluginstall to
            // support removal.
            throw 'Plugin removal not supported yet! sadface';
        default:
            throw 'Unrecognized command "' + command + '". Use either `add`, `remove`, or `ls`.';
    }
};
