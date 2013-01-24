/**
 * BOOTSTRAP
 * Runs through any bs to make sure the libraries and tests are good to go.
 **/

var util      = require('./src/util'),
    path      = require('path'),
    shell     = require('shelljs'),
    platforms = require('./platforms');

var android = path.join(__dirname, 'lib', 'cordova-android', 'framework');

// Update cordova-android based on local sdk
shell.exec('cd ' + android + ' && android update project -p . -t android-17', {silent:true, async:true}, function(code, output) {
    if (code > 0) {
        console.error('ERROR! Could not configure Android properties. Are you sure you have the Android SDK installed and the tools available on your PATH? (make sure you can run `android` from your command-line). Error output to follow:');
        console.error(output);
        process.exit(1);
    } else {
        // Create native projects using bin/create
        var tempDir = path.join(__dirname, 'spec', 'fixtures', 'projects', 'native');
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);

        platforms.forEach(function(platform) {
            var fix_path = path.join(tempDir, platform + '_fixture');
            var create = path.join(util.libDirectory, 'cordova-' + platform, 'bin', 'create'); 
            console.log('Creating cordova-' + platform + ' project using live project lib for tests...');
            var cmd = create + ' "' + fix_path + '" org.apache.cordova.cordovaExample cordovaExample';
            if (platform == 'blackberry') cmd = create + ' "' + fix_path + '" cordovaExample';
            var create_result = shell.exec(cmd, {silent:true});
            if (create_result.code > 0) throw ('Could not create a native ' + platform + ' project test fixture: ' + create_result.output);
            console.log('.. complete.');
        });
    }
});

