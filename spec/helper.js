// Override exec for certain commands, to speed execution of tests.
var _exec = require('child_process').exec,
    fs = require('fs'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    cpr = wrench.copyDirSyncRecursive,
    path = require('path'),
    templates = path.join(__dirname, '..', 'templates'),
    www = path.join(templates, 'www');

require('child_process').exec = function(cmd, cb){
    var create_android = new RegExp('android' + path.sep + 'bin' + path.sep + 'create');
    if (create_android.test(cmd)) {
        // It's a create-android-project call. Fake as much of an
        // android project as possible.
        var dir = cmd.substr(cmd.indexOf('"') + 1);
        dir = dir.substr(0, dir.length -1);
        var android = path.join(dir, 'platforms', 'android');
        mkdirp(android);
        var assets = path.join(android, 'assets', 'www');
        mkdirp(assets);
        cpr(www, assets);
        cb();
    } else {
        _exec(cmd, cb);
    }
};
