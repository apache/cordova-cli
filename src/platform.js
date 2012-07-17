var config_parser = require('./config_parser'),
    util = require('./util'),
    path = require('path');

module.exports = function platform(command, target) {
    var projectRoot = util.isCordova(process.cwd());

    if (!projectRoot) {
        console.error('Current working directory is not a Cordova-based project.');
        return;
    }
    if (arguments.length === 0) command = 'ls';

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var cfg = new config_parser(xml);

    switch(command) {
        case 'ls':
            var platforms = cfg.ls_platforms();
            if (platforms.length) {
                platforms.map(function(p) {
                    console.log(p);
                });
            } else console.log('No platforms added. Use `cordova platforms add <platform>`.');
            break;
        case 'add':
            cfg.add_platform(target);
            break;
        case 'remove':
            cfg.remove_platform(target);
            break;
        default:
            console.error('Unrecognized command "' + command + '". Use either `add`, `remove`, or `ls`.');
            break;
    }
};
