var fs         = require('fs'),
    path       = require('path'),
    util       = require('util'),
    shell      = require('shelljs');

var repos = {
    ios:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-ios.git',
    android:'https://git-wip-us.apache.org/repos/asf/incubator-cordova-android.git'
};

module.exports = {
    // Runs up the directory chain looking for a .cordova directory.
    // IF it is found we are in a Cordova project.
    // If not.. we're not.
    isCordova: function isCordova(dir) {
        if (dir) {
            var contents = fs.readdirSync(dir);
            if (contents && contents.length && (contents.indexOf('.cordova') > -1)) {
                return dir;
            } else {
                var parent = path.join(dir, '..');
                if (parent && parent.length > 1) {
                    return isCordova(parent);
                } else return false;
            }
        } else return false;
    },
    // Determines whether the library has a copy of the specified
    // Cordova implementation
    havePlatformLib: function havePlatformLib(platform) {
        var dir = path.join(__dirname, '..', 'lib', platform);
        return fs.existsSync(dir);
    },
    /**
     * checkout a platform from the git repo
     * @param target string platform to get (enum of 'ios' or 'android' for now)
     * @throws Javascript Error on failure
     */
    getPlatformLib: function getPlatformLib(target) {
        // verify platform is supported
        if (!repos[target]) {
            throw new Error('platform "' + target + '" not found.');
        }

        // verify git command line is available
        if (!shell.which('git')) {
            throw new Error('"git" command not found.');
        }

        // specify which project tag to check out. minimum tag is 2.1.0rc1
        var cordova_lib_tag = '2.1.0';
        if (target == 'android') {
            // FIXME: android hack. 2.1.0 tag messed up the create script
            cordova_lib_tag = '47daaaf';
        }

        // Shell out to git.
        var outPath = path.join(__dirname, '..', 'lib', target);
        var cmd = util.format('git clone %s "%s"', repos[target], outPath);

        console.log('Cloning ' + repos[target] + ', this may take a while...');
        var clone = shell.exec(cmd, {silent:true});
        if (clone.code > 0) {
            throw ('An error occured during git-clone of ' + repos[target] + '. ' + clone.output);
        }

        // Check out the right version.
        cmd = util.format('cd "%s" && git checkout %s', outPath, cordova_lib_tag);
        var checkout = shell.exec(cmd, {silent:true});
        if (checkout.code > 0) {
            throw ('An error occured during git-checkout of ' + outPath + ' to tag ' + cordova_lib_tag + '. ' + checkout.output);
        }
    }
};
