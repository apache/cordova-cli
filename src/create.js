var wrench = require('wrench'),
    path = require('path'),
    fs = require('fs'),
    help = require('./help'),
    mkdirp = wrench.mkdirSyncRecursive,
    cpr = wrench.copyDirSyncRecursive;

module.exports = function create (dir) {
    if (dir === undefined) {
        return help();
    }

    if (dir && (dir[0] == '~' || dir[0] == '/')) {
    } else {
        dir = dir ? path.join(process.cwd(), dir) : process.cwd();
    }

    // Check for existing cordova project
    if (fs.existsSync(path.join(dir, '.cordova'))) {
        throw 'Cordova project already exists at ' + dir + ', aborting.';
    }

    // Create basic project structure.
    mkdirp(path.join(dir, '.cordova'));
    mkdirp(path.join(dir, 'platforms'));
    mkdirp(path.join(dir, 'plugins'));
    mkdirp(path.join(dir, 'www'));

    // Copy in base template
    cpr(path.join(__dirname, '..', 'templates', 'www'), path.join(dir, 'www'));
};
