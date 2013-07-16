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
    request       = require('request'),
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
                shell.mkdir('-p', download_dir);
                events.emit('log', 'Requesting ' + url + '...');
                var size = 0;
                request.get({uri:url}, function(err, req, body) { size = body.length; })
                    .pipe(zlib.createUnzip())
                    .pipe(tar.Extract({path:download_dir}))
                    .on('error', function(err) {
                        if (callback) callback(err);
                        else throw err;
                    })
                    .on('end', function() {
                        events.emit('log', 'Downloaded, unzipped and extracted ' + size + ' byte response.');
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
                            size:size,
                            symlink:false
                        }, function() {
                            if (callback) callback();
                        });
                });
            } else {
                // local path
                // symlink instead of copying
                fs.symlinkSync(uri.path, download_dir, 'dir');
                hooker.fire('after_library_download', {
                    platform:platform,
                    url:url,
                    id:id,
                    version:version,
                    path:download_dir,
                    symlink:true
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
