var fs         = require('fs'),
    path       = require('path'),
    util       = require('util'),
    request    = require('request'),
    admzip     = require('adm-zip'),
    shell      = require('shelljs');

var repos = {
    ios:'https://github.com/apache/incubator-cordova-ios/',
    android:'https://github.com/apache/incubator-cordova-android/',
    blackberry:'https://github.com/apache/incubator-cordova-blackberry-webworks/'
};

function chmod(path) {
    shell.exec('chmod +x "' + path + '"', {silent:true});
}

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
    havePlatformLib: function havePlatformLib(platform, callback) {
        var dir = path.join(__dirname, '..', 'lib', module.exports.underlyingLib(platform));
        return fs.existsSync(dir);
    },
    /**
     * checkout a platform from the git repo
     * @param target string platform to get (enum of 'ios' or 'android' for now)
     * @throws Javascript Error on failure
     */
    getPlatformLib: function getPlatformLib(target, callback) {
        // verify platform is supported
        target = module.exports.underlyingLib(target);
        if (!repos[target]) {
            throw new Error('platform "' + target + '" not found.');
        }

        // specify which project tag to check out. minimum tag is 2.2.0rc1
        var cordova_lib_tag = '2.2.0rc1';

        var outPath = path.join(__dirname, '..', 'lib', target);
        shell.mkdir('-p', outPath);

        var tempPath = path.join(__dirname, '..', 'temp');
        shell.mkdir('-p', tempPath);

        var tempFile = path.join(tempPath, target + '-' + cordova_lib_tag + '.zip');

        console.log('Downloading ' + target + ' library, this may take a while...');
        request.get(repos[target] + 'zipball/' + cordova_lib_tag, function(err) {
            if (err) throw ('Error during download of ' + target + 'library.');
            var zip = new admzip(tempFile);
            var extractPoint = path.join(tempPath, target);
            zip.extractAllTo(extractPoint);
            var tempDir = path.join(extractPoint, fs.readdirSync(extractPoint)[0]);
            shell.mv('-f', path.join(tempDir, '*'), outPath);

            // chmod the create file
            var create = path.join(outPath, 'bin', 'create');
            chmod(create);

            // chmod debug+emulate
            if (target == 'ios') {
                chmod(path.join(outPath, 'bin', 'replaces'));
                chmod(path.join(outPath, 'bin', 'update_cordova_subproject'));
                chmod(path.join(outPath, 'bin', 'templates', 'project', 'cordova', 'debug'));
                chmod(path.join(outPath, 'bin', 'templates', 'project', 'cordova', 'emulate'));
            } else if (target == 'android') {
                chmod(path.join(outPath, 'bin', 'templates', 'cordova', 'cordova'));
                chmod(path.join(outPath, 'bin', 'templates', 'cordova', 'debug'));
                chmod(path.join(outPath, 'bin', 'templates', 'cordova', 'emulate'));
            } else if (target == 'blackberry') {
                chmod(path.join(outPath, 'bin', 'templates', 'cordova', 'debug'));
                chmod(path.join(outPath, 'bin', 'templates', 'cordova', 'emulate'));
            }

            // Clean up
            shell.rm('-rf', tempFile);
            shell.rm('-rf', extractPoint);

            // Callback
            if (callback) callback();
        }).pipe(fs.createWriteStream(tempFile));
    },
    underlyingLib:function underlyingLib(name) {
        var pos = name.indexOf('-');
        if (pos > -1) {
            name = name.substr(0, pos);
        }
        return name;
    }
};
