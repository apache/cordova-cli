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
*/
var path          = require('path'),
    fs            = require('fs'),
    shell         = require('shelljs'),
    platforms     = require('../platforms'),
    events        = require('./events'),
    glob          = require('glob'),
    https         = require('follow-redirects').https,
    zlib          = require('zlib'),
    tar           = require('tar'),
    util          = require('./util');

/**
 * Usage:
 **/
module.exports = function lazy_load(platform, callback) {
    if (!(platform in platforms)) {
        var err = new Error('platform "' + platform + '" not recognized.');
        if (callback) return callback(err);
        else throw err;
    }

    if (util.has_platform_lib(platform)) {
        events.emit('log', 'Platform library for "' + platform + '" already exists. No need to download. Continuing.');
        return (callback ? callback() : true);
    } else {
        // TODO: hook in before_library_dl event
        var url = platforms[platform].url + ';a=snapshot;h=' + util.cordovaTag + ';sf=tgz';
        var filename = path.join(util.libDirectory, 'cordova-' + platform + '-' + util.cordovaTag + '.tar.gz');
        var req_opts = {
            hostname: 'git-wip-us.apache.org',
            path: '/repos/asf?p=cordova-' + platform + '.git;a=snapshot;h=' + util.cordovaTag + ';sf=tgz'
        };
        events.emit('log', 'Requesting ' + req_opts.hostname + req_opts.path + '...');
        var req = https.request(req_opts, function(res) {
            var downloadfile = fs.createWriteStream(filename, {'flags': 'a'});

            res.on('data', function(chunk){
                // TODO: hook in progress event
                downloadfile.write(chunk, 'binary');
                events.emit('log', 'Wrote ' + chunk.length + ' bytes...');
            });

            res.on('end', function(){
                // TODO: hook in end event
                downloadfile.end();
                events.emit('log', 'Download complete. Extracting...');
                var tar_path = path.join(util.libDirectory, 'cordova-' + platform + '-' + util.cordovaTag + '.tar');
                var tarfile = fs.createWriteStream(tar_path);
                tarfile.on('error', function(err) {
                    if (callback) callback(err);
                    else throw err;
                });
                tarfile.on('finish', function() {
                    shell.rm(filename);
                    fs.createReadStream(tar_path)
                        .pipe(tar.Extract({ path: util.libDirectory }))
                        .on("error", function (err) {
                            if (callback) callback(err);
                            else throw err;
                        })
                        .on("end", function () {
                            shell.rm(tar_path);
                            // rename the extracted dir to remove the trailing SHA
                            glob(path.join(util.libDirectory, 'cordova-' + platform + '-' + util.cordovaTag + '-*'), function(err, entries) {
                                if (err) {
                                    if (callback) return callback(err);
                                    else throw err;
                                } else {
                                    var entry = entries[0];
                                    var final_dir = path.join(util.libDirectory, 'cordova-' + platform + '-' + util.cordovaTag);
                                    shell.mkdir(final_dir);
                                    shell.mv('-f', path.join(entry, (platform=='blackberry'?'blackberry10':''), '*'), final_dir);
                                    shell.rm('-rf', entry);
                                    if (callback) callback();
                                }
                            });
                        });
                });
                fs.createReadStream(filename)
                    .pipe(zlib.createUnzip())
                    .pipe(tarfile);
            });
        });
        req.on('error', function(err) {
            if (callback) return callback(err);
            else throw err;
        });
        req.end();
    }
};
