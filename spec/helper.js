jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

var cp = require('child_process'),
    path = require('path'),
    fs = require('fs'),
    android_project = path.join(__dirname, 'fixtures', 'projects', 'native', 'android'),
    wrench = require('wrench'),
    cpr = wrench.copyDirSyncRecursive;

var orig_exec = cp.exec;

cp.exec = function(cmd, cb) {
    // Match various commands to exec
    if (cmd.match(/android.bin.create/)) {
        var r = new RegExp(/android.bin.create"\s"([\/\\\w-_\.]*)"/);
        var dir = r.exec(cmd)[1];
        cpr(android_project, dir);
        fs.chmodSync(path.join(dir, 'cordova', 'debug'), '754');
        cb();
        return;
    }
    // Fire off to original exec
    orig_exec.apply(null, arguments);
}
