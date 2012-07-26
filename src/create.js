var wrench        = require('wrench'),
    path          = require('path'),
    fs            = require('fs'),
    help          = require('./help'),
    config_parser = require('./config_parser'),
    mkdirp        = wrench.mkdirSyncRecursive,
    cpr           = wrench.copyDirSyncRecursive;

var DEFAULT_NAME = "Hello Cordova",
    DEFAULT_ID   = "io.cordova.hello-cordova";

/**
 * Usage:
 * create(dir) - creates in the specified directory
 * create(dir, name) - as above, but with specified name
 * create(dir, id, name) - you get the gist
 **/
module.exports = function create (dir, id, name) {
    if (dir === undefined) {
        return help();
    }

    // Massage parameters a bit.
    if (id && name === undefined) {
        name = id;
        id = undefined;
    }
    id = id || DEFAULT_ID;
    name = name || DEFAULT_NAME;

    if (!(dir && (dir[0] == '~' || dir[0] == '/'))) {
        dir = dir ? path.join(process.cwd(), dir) : process.cwd();
    }

    var dotCordova = path.join(dir, '.cordova');

    // Check for existing cordova project
    if (fs.existsSync(dotCordova)) {
        throw 'Cordova project already exists at ' + dir + ', aborting.';
    }

    // Create basic project structure.
    mkdirp(path.join(dir, 'platforms'));
    mkdirp(path.join(dir, 'plugins'));
    mkdirp(path.join(dir, 'www'));

    fs.writeFileSync(dotCordova, 'do or do not. there is no try.');

    // Copy in base template
    cpr(path.join(__dirname, '..', 'templates', 'www'), path.join(dir, 'www'));

    // Write out id and name to config.xml
    var configPath = path.join(dir, 'www', 'config.xml');
    var config = new config_parser(configPath);
    config.packageName(id);
    config.name(name);
};
