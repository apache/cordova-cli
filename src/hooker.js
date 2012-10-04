var shell = require('shelljs'),
    util  = require('./util'),
    fs    = require('fs'),
    path  = require('path');

module.exports = function hooker(root) {
    var r = util.isCordova(root);
    if (!r) throw "Not a Cordova project, can't use hooks.";
    else this.root = r;
}

module.exports.prototype = {
    fire:function fire(hook) {
        var dir = path.join(this.root, '.cordova', 'hooks', hook);
        if (!(fs.existsSync(dir))) throw 'Unrecognized hook "' + hook + '".';
        var contents = fs.readdirSync(dir);
        contents.forEach(function(script) {
            var status = shell.exec(path.join(dir, script));
            if (status.code != 0) throw 'Script "' + path.basename(script) + '"' + 'in the ' + hook + ' hook exited with non-zero status code. Aborting.';
        });
        return true;
    }
}
