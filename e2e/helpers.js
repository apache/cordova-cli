
var path = require('path'),
    shell = require('shelljs'),
    os = require('os');

module.exports.tmpDir = function() {
    var dir = path.join(os.tmpdir(), 'e2e-test');
    shell.mkdir('-p', dir);
    return dir;
};

// Returns the platform that should be used for testing on this host platform.
var host = os.platform();
if (host.match(/win/)) {
    module.exports.testPlatform = 'wp8';
} else if (host.match(/darwin/)) {
    module.exports.testPlatform = 'ios';
} else {
    module.exports.testPlatform = 'android';
}

