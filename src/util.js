var fs         = require('fs'),
    path       = require('path'),
    util       = require('util'),
    request    = require('request'),
    n          = require('ncallbacks'),
    shell      = require('shelljs'),
    unzip      = require('unzip'),
    platforms  = require('../platforms');

var cordova_lib_tag = '2.3.0';
var libs_path = path.join(__dirname, '..', 'lib')
var lib_path = path.join(libs_path, 'cordova-' + cordova_lib_tag);
var archive_path = path.join(libs_path, 'cordova-' + cordova_lib_tag + '-src.zip');
var root_url = 'http://apache.org/dist/cordova/cordova-' + cordova_lib_tag + '-src.zip';

function chmod(path) {
    shell.exec('chmod +x "' + path + '"', {silent:true});
}

module.exports = {
    libDirectory:lib_path,
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
    // Cordova implementation at the current proper version
    havePlatformLib: function havePlatformLib(platform) {
        if (module.exports.haveCordovaLib()) {
            var dir = path.join(lib_path, 'cordova-' + platform);
            if (fs.existsSync(dir)) return true;
            else return false;
        } else return false;
    },
    haveCordovaLib: function haveCordovaLib() {
        if (fs.existsSync(lib_path)) return true;
        else return false;
    },
    /**
     * checkout a platform from the git repo
     * @param target string platform to get (enum of 'ios' or 'android' for now)
     * @throws Javascript Error on failure
     */
    getPlatformLib: function getPlatformLib(target, callback) {
        // verify platform is supported
        if (platforms.indexOf(target) == -1) {
            throw new Error('platform "' + target + '" not found.');
        }

        function movePlatform() {
        }

        if (!module.exports.haveCordovaLib()) {
            module.exports.getCordovaLib(movePlatform);
        } else {
            movePlatform();
        }
    },
    extractCordovaLib:function(callback) {
        console.log('Extracting cordova...');
        var end = n(platforms.length, function() {
            if (callback) callback();
        });

        fs.createReadStream(archive_path).pipe(unzip.Extract({ path: libs_path })).on('close', function() {
        // Extract each platform lib too
            platforms.forEach(function(platform) {
                var archive = path.join(lib_path, 'cordova-' + platform + '.zip');
                var out_path = path.join(lib_path, 'cordova-' + platform);
                shell.mkdir('-p', out_path);
                fs.createReadStream(archive).pipe(unzip.Extract({ path:out_path  })).on('close', function() {
                    var platform_path = path.join(lib_path, 'cordova-' + platform);

                    // chmod the create file
                    var create = path.join(platform_path, 'bin', 'create');
                    chmod(create);
                    // chmod executable scripts 
                    if (platform == 'ios') {
                        chmod(path.join(platform_path, 'bin', 'replaces'));
                        chmod(path.join(platform_path, 'bin', 'update_cordova_subproject'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'project', 'cordova', 'build'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'project', 'cordova', 'run'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'project', 'cordova', 'release'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'project', 'cordova', 'emulate'));
                    } else if (platform == 'android') {
                        chmod(path.join(platform_path, 'bin', 'templates', 'cordova', 'cordova'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'cordova', 'build'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'cordova', 'run'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'cordova', 'clean'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'cordova', 'release'));
                    } else if (platform == 'blackberry') {
                        chmod(path.join(platform_path, 'bin', 'templates', 'cordova', 'debug'));
                        chmod(path.join(platform_path, 'bin', 'templates', 'cordova', 'emulate'));
                    }
                    end();
                });
            });
        });
    },
    getCordovaLib:function (callback) {
        if (!fs.existsSync(archive_path)) {
            shell.mkdir('-p', libs_path);
            console.log('Downloading cordova-' + cordova_lib_tag + ', this may take a while...');
            request.get(root_url, function(err) {
                if (err) throw ('Error during cordova download!');
                module.exports.extractCordovaLib(callback);
            }).pipe(fs.createWriteStream(archive_path));
        } else {
            module.exports.extractCordovaLib(callback);
        }
    }
};
