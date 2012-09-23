var fs         = require('fs'),
    path       = require('path'),
    util       = require('util'),
    exec       = require('child_process').exec;

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
     * @param flow I/O object to handle synchronous sys calls
     * @throws Javascript Error on failure
     */
    getPlatformLib: function getPlatformLib(target, flow) {
        if (!repos[target]) {
            // TODO: this is really a pretty terrible pattern because it kills 
            //       excecution immediately and prevents cleanup routines. However,
            //       I don't want to just spew a stack trace to the user either. 
            console.error('platform "' + target + '" not found.');
            process.exit(1);
        }
        // specify which project tag to check out. minimum tag is 2.1.0rc1
        var cordova_lib_tag = '2.1.0';

        // Shell out to git.
        var outPath = path.join(__dirname, '..', 'lib', target);
        var cmd = util.format('git clone %s "%s"', repos[target], outPath);

        console.log('Cloning ' + repos[target] + ', this may take a while...');
        exec(cmd, flow.set({
            key:'cloning',
            firstArgIsError:false,
            responseFormat:['err', 'stdout', 'stderr']
        }));
        var buffers = flow.get('cloning');
        if (buffers.err) {
            throw ('An error occured during git-clone of ' + repos[target] + '. ' + buffers.err);
        }

        // Check out the right version.
        cmd = util.format('cd "%s" && git checkout %s', outPath, cordova_lib_tag);
        exec(cmd, flow.set({
            key:'tagcheckout',
            firstArgIsError:false,
            responseFormat:['err', 'stdout', 'stderr']
        }));
        buffers = flow.get('tagcheckout');
        if (buffers.err) {
            throw ('An error occured during git-checkout of ' + outPath + ' to tag ' + cordova_lib_tag + '. ' + buffers.err);
        }
    }
};
