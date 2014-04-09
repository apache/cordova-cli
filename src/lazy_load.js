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
    npmconf       = require('npmconf'),
    events        = require('./events'),
    request       = require('request'),
    config        = require('./config'),
    hooker        = require('./hooker'),
    zlib          = require('zlib'),
    tar           = require('tar'),
    URL           = require('url'),
    Q             = require('q'),
    util          = require('./util'),
    stubplatform  = {
        url    : undefined,
        version: undefined,
        altplatform: undefined,
        subdirectory: ""
    };

function mixin(mixin, to) {
    Object.getOwnPropertyNames(mixin).forEach(function (prop) {
        if (Object.hasOwnProperty.call(mixin, prop)) {
            Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(mixin, prop));
        }
    });
    return to;
}

module.exports = {
    // Returns a promise for the path to the lazy-loaded directory.
    cordova:function lazy_load(platform) {
        var mixed_platforms = mixin(platforms, {}),
            plat;
        if (!(platform in platforms)) {
            return Q.reject(new Error('Cordova library "' + platform + '" not recognized.'));
        }
        plat = mixed_platforms[platform];
        plat.url = plat.url + ';a=snapshot;h=' + plat.version + ';sf=tgz';
        plat.id = 'cordova';
        return module.exports.custom(mixed_platforms, platform);
    },
    // Returns a promise for the path to the lazy-loaded directory.
    custom:function(platforms, platform) {
        var plat;
        var id;
        var uri;
        var url;
        var version;
        var subdir;
        var platdir;
        var download_dir;
        var tmp_dir;
        var lib_dir;
        var isUri;
        if (!(platform in platforms)) {
            return Q.reject(new Error('Cordova library "' + platform + '" not recognized.'));
        }

        plat = mixin(platforms[platform], stubplatform);
        version = plat.version;
        url = plat.url
        id = plat.id;
        subdir = plat.subdirectory;
        platdir = plat.altplatform || platform;
        // Return early for already-cached remote URL, or for local URLs.
        uri = URL.parse(url);
        isUri = uri.protocol && uri.protocol[1] != ':'; // second part of conditional is for awesome windows support. fuuu windows
        if (isUri) {
            download_dir = path.join(util.libDirectory, platdir, id, version);
            lib_dir = path.join(download_dir, subdir);
            if (fs.existsSync(download_dir)) {
                events.emit('verbose', id + ' library for "' + platform + '" already exists. No need to download. Continuing.');
                return Q(lib_dir);
            }
        } else {
            // Local path.
            lib_dir = path.join(url, subdir);
            return Q(lib_dir);
        }
        return hooker.fire('before_library_download', {
            platform:platform,
            url:url,
            id:id,
            version:version
        }).then(function() {
            var uri = URL.parse(url);
            var d = Q.defer();
            npmconf.load(function(err, conf) {
                // Check if NPM proxy settings are set. If so, include them in the request() call.
                var proxy;
                if (uri.protocol == 'https:') {
                    proxy = conf.get('https-proxy');
                } else if (uri.protocol == 'http:') {
                    proxy = conf.get('proxy');
                }

                // Create a tmp dir. Using /tmp is a problem because it's often on a different partition and sehll.mv()
                // fails in this case with "EXDEV, cross-device link not permitted".
                tmp_subidr = 'tmp_' + id + '_' + process.pid + '_' + (new Date).valueOf();
                tmp_dir = path.join(util.libDirectory, 'tmp', tmp_subidr);
                shell.rm('-rf', tmp_dir);
                shell.mkdir('-p', tmp_dir);

                var size = 0;
                var request_options = {url:url};
                if (proxy) {
                    request_options.proxy = proxy;
                }
                events.emit('verbose', 'Requesting ' + JSON.stringify(request_options) + '...');
                events.emit('log', 'Downloading ' + id + ' library for ' + platform + '...');
                var req = request.get(request_options, function(err, res, body) {
                    if (err) {
                        shell.rm('-rf', tmp_dir);
                        d.reject(err);
                    } else if (res.statusCode != 200) {
                        shell.rm('-rf', tmp_dir);
                        d.reject(new Error('HTTP error ' + res.statusCode + ' retrieving version ' + version + ' of ' + id + ' for ' + platform));
                    } else {
                        size = body.length;
                    }
                });

                req.pipe(zlib.createUnzip())
                .pipe(tar.Extract({path:tmp_dir}))
                .on('error', function(err) {
                    shell.rm('-rf', tmp_dir);
                    d.reject(err);
                })
                .on('end', function() {
                    events.emit('verbose', 'Downloaded, unzipped and extracted ' + size + ' byte response.');
                    events.emit('log', 'Download complete');
                    var entries = fs.readdirSync(tmp_dir);
                    var entry = path.join(tmp_dir, entries[0]);
                    shell.mkdir('-p', download_dir);
                    shell.mv('-f', path.join(entry, (platform=='blackberry10'?'blackberry10':''), '*'), download_dir);
                    shell.rm('-rf', tmp_dir);
                    d.resolve(hooker.fire('after_library_download', {
                        platform:platform,
                        url:url,
                        id:id,
                        version:version,
                        path: lib_dir,
                        size:size,
                        symlink:false
                    }));
                });
            });
            return d.promise.then(function () { return lib_dir; });
        });
    },
    // Returns a promise for the path to the lazy-loaded directory.
    based_on_config:function(project_root, platform) {
        var custom_path = config.has_custom_path(project_root, platform);
        if (custom_path) {
            var dot_file = config.read(project_root),
                mixed_platforms = mixin(platforms, {});
            mixed_platforms[platform] = mixin(dot_file.lib && dot_file.lib[platform] || {}, mixed_platforms[platform] || {})
            return module.exports.custom(mixed_platforms, platform);
        } else {
            return module.exports.cordova(platform);
        }
    }
};
