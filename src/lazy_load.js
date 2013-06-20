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
    config        = require('./config'),
    hooker        = require('./hooker'),
    https         = require('follow-redirects').https,
    zlib          = require('zlib'),
    tar           = require('tar'),
    URL           = require('url'),
    util          = require('./util');

module.exports = {
    cordova:function lazy_load(platform, callback) {
        if (!(platform in platforms)) {
            var err = new Error('Cordova library "' + platform + '" not recognized.');
            if (callback) return callback(err);
            else throw err;
        }

        var url = platforms[platform].url + ';a=snapshot;h=' + platforms[platform].version + ';sf=tgz';
        module.exports.custom(url, 'cordova', platform, platforms[platform].version, function(err) {
            if (err) {
                if (callback) return callback(err);
                else throw err;
            } else {
                if (callback) callback();
            }
        });
    },
    custom:function(url, id, platform, version, callback) {
        var id_dir = path.join(util.libDirectory, platform, id);
        shell.mkdir('-p', id_dir);
        var download_dir = path.join(id_dir, version);
        if (fs.existsSync(download_dir)) {
            events.emit('log', id + ' library for "' + platform + '" already exists. No need to download. Continuing.');
            if (callback) return callback();
        }
        hooker.fire('before_library_download', {
            platform:platform,
            url:url,
            id:id,
            version:version
        }, function() {
            var uri = URL.parse(url);
            if (uri.protocol) {
                shell.mkdir(download_dir);
                // assuming its remote
                var filename = path.join(download_dir, id+'-'+platform+'-'+version+'.tar.gz');
                if (fs.existsSync(filename)) {
                    shell.rm(filename);
                }
                var req_opts = {
                    hostname: uri.hostname,
                    path: uri.path
                };
                events.emit('log', 'Requesting ' + url + '...');
                // TODO: may not be an https request..
                var req = https.request(req_opts, function(res) {
                    var downloadfile = fs.createWriteStream(filename, {'flags': 'a'});

                    res.on('data', function(chunk){
                        downloadfile.write(chunk, 'binary');
                        hooker.fire('library_download', {
                            platform:platform,
                            url:url,
                            id:id,
                            version:version,
                            chunk:chunk
                        });
                    });

                    res.on('end', function(){
                        downloadfile.end();
                        var payload_size = fs.statSync(filename).size;
                        events.emit('log', 'Download complete. Extracting...');
                        var tar_path = path.join(download_dir, id+'-'+platform+'-'+version+'.tar');
                        var tarfile = fs.createWriteStream(tar_path);
                        tarfile.on('error', function(err) {
                            if (callback) callback(err);
                            else throw err;
                        });
                        tarfile.on('finish', function() {
                            shell.rm(filename);
                            fs.createReadStream(tar_path)
                                .pipe(tar.Extract({ path: download_dir }))
                                .on("error", function (err) {
                                    if (callback) callback(err);
                                    else throw err;
                                })
                                .on("end", function () {
                                    shell.rm(tar_path);
                                    // move contents out of extracted dir
                                    var entries = fs.readdirSync(download_dir);
                                    var entry = path.join(download_dir, entries[0]);
                                    shell.mv('-f', path.join(entry, (platform=='blackberry'?'blackberry10':''), '*'), download_dir);
                                    shell.rm('-rf', entry);
                                    hooker.fire('after_library_download', {
                                        platform:platform,
                                        url:url,
                                        id:id,
                                        version:version,
                                        path:download_dir,
                                        size:payload_size
                                    }, function() {
                                        if (callback) callback();
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
            } else {
                // local path
                // symlink instead of copying
                fs.symlinkSync(uri.path, download_dir, 'dir');
                hooker.fire('after_library_download', {
                    platform:platform,
                    url:url,
                    id:id,
                    version:version,
                    path:download_dir
                }, function() {
                    if (callback) callback();
                });
            }
        });
    },
    based_on_config:function(project_root, platform, callback) {
        var custom_path = config.has_custom_path(project_root, platform);
        if (custom_path) {
            var dot_file = config.read(project_root);
            module.exports.custom(dot_file.lib[platform].uri, dot_file.lib[platform].id, platform, dot_file.lib[platform].version, callback);
        } else {
            module.exports.cordova(platform, callback);
        }
    }
};
