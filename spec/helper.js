jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

var shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    android_project = path.join(__dirname, 'fixtures', 'projects', 'native', 'android'),
    wrench = require('wrench'),
    cpr = wrench.copyDirSyncRecursive;

var orig_exec = shell.exec;

shell.exec = function(cmd, opts) {
    // Match various commands to exec
    if (cmd.match(/android.bin.create/)) {
        var r = new RegExp(/android.bin.create"\s"([\/\\\w-_\.]*)"/);
        var dir = r.exec(cmd)[1];
        cpr(android_project, dir);
        fs.chmodSync(path.join(dir, 'cordova', 'debug'), '754');
        return {code:0};
    }
    // Fire off to original exec
    return orig_exec.apply(null, arguments);
}
