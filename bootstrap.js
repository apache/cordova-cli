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
    create    = require('./src/create'),
    a_parser  = require('./src/metadata/android_parser'),
    b_parser  = require('./src/metadata/blackberry_parser'),
    i_parser  = require('./src/metadata/ios_parser'),
    path      = require('path'),
    shell     = require('shelljs'),
    platforms = require('./platforms');

// Library requirements checkers
var min_reqs = {
    "android":a_parser.check_requirements,
    "ios":i_parser.check_requirements,
    "blackberry":b_parser.check_requirements
}

// Create native projects using bin/create
var projectFixtures = path.join(__dirname, 'spec', 'fixtures', 'projects');
var tempDir = path.join(projectFixtures, 'native');
shell.rm('-rf', tempDir);
shell.mkdir('-p', tempDir);

// Also create a standard cordova project for tests
var cordovaDir = path.join(projectFixtures, 'cordova');
shell.rm('-rf', cordovaDir);
create(cordovaDir);
var platformsDir = path.join(cordovaDir, 'platforms');

platforms.forEach(function(platform) {
    min_reqs[platform](function(err) {
        if (err) {
            console.error('WARNING: Your system does not meet requirements to create ' + platform + 'projects. See error output below.');
            console.error(err);
            console.error('SKIPPING ' + platform + ' bootstrap.');
        } else {
            console.log('SUCCESS: Minimum requirements for ' + platform + ' met.');
            var fix_path = path.join(tempDir, platform + '_fixture');
            var create = path.join(util.libDirectory, 'cordova-' + platform, 'bin', 'create'); 
            console.log('BOOTSTRAPPING ' + platform + '...');
            var cmd = create + ' "' + fix_path + '" org.apache.cordova.cordovaExample cordovaExample';
            if (platform == 'blackberry') cmd = create + ' "' + fix_path + '" cordovaExample';
            shell.exec(cmd, {silent:true, async:true}, function(code, output) {
                if (code > 0) {
                    console.error('ERROR! Could not create a native ' + platform + ' project test fixture. See below for error output.');
                    console.error(output);
                } else {
                    var platformDir = path.join(platformsDir, platform);
                    shell.mkdir('-p', platformDir);
                    shell.cp('-rf', path.join(fix_path, '*'), platformDir); 
                    console.log('SUCCESS: ' + platform + ' ready to rock!');
                }
            });
        }
    });
});
