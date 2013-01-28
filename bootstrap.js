/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
 **
 * BOOTSTRAP
 * Runs through any bs to make sure the libraries and tests are good to go.
 **/

var util      = require('./src/util'),
    path      = require('path'),
    shell     = require('shelljs'),
    platforms = require('./platforms');

var cmd = 'android update project -p ' + path.join(__dirname, 'lib', 'cordova-android', 'framework') + ' -t android-17';
shell.exec(cmd, {async:true}, function(code, output) {
    if (code > 0) {
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
