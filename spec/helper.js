jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

var shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    android_project = path.join(__dirname, 'fixtures', 'projects', 'native', 'android'),
    bb_project = path.join(__dirname, 'fixtures', 'projects', 'native', 'blackberry');

var orig_exec = shell.exec;

module.exports = {
    enabled:false,
    enable:function() {
        module.exports.enabled = true;
        require('shelljs').exec = function(cmd, opts) {
            // Match various commands to exec
            if (cmd.match(/android.bin.create/)) {
                var r = new RegExp(/android.bin.create"\s"([\/\\\w-_\.]*)"/);
                var dir = r.exec(cmd)[1];
                shell.cp('-r', android_project, path.join(dir, '..'));
                fs.chmodSync(path.join(dir, 'cordova', 'debug'), '754');
                return {code:0};
            } else if (cmd.match(/blackberry.bin.create/)) {
                var r = new RegExp(/blackberry.bin.create"\s"([\/\\\w-_\.]*)"/);
                var dir = r.exec(cmd)[1];
                var platformsDir = path.join(dir, '..');
                shell.cp('-r', bb_project, platformsDir);
                // TODO: will need to handle bb sub-platforms
                shell.mv(path.join(platformsDir, 'blackberry'), path.join(platformsDir, 'blackberry-10'));
                return {code:0};
            }
            // Fire off to original exec
            return orig_exec.apply(null, arguments);
        }
    },
    disable:function() {
        module.exports.enabled = false;
        require('shelljs').exec = orig_exec;
    }
};

if (!module.exports.enabled) {
    module.exports.enable();
}
