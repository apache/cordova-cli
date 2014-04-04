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
    help          = require('./help'),
    events        = require('./events'),
    config        = require('./config'),
    lazy_load     = require('./lazy_load'),
    Q             = require('q'),
    CordovaError  = require('./CordovaError'),
    ConfigParser = require('./ConfigParser'),
    util          = require('./util');

var DEFAULT_NAME = "HelloCordova",
    DEFAULT_ID   = "io.cordova.hellocordova";

/**
 * Usage:
 * @dir - directory where the project will be created. Required.
 * @id - app id. Optional, default is DEFAULT_ID.
 * @name - app name. Optional, default is DEFAULT_NAME.
 * @cfg - extra config to be saved in .cordova/config.json
 **/
// Returns a promise.
module.exports = function create (dir, id, name, cfg) {
    if (!dir ) {
        return Q(help());
    }

    // Massage parameters
    if (typeof cfg == 'string') {
        cfg = JSON.parse(cfg);
    }
    cfg = cfg || {};
    id = id || cfg.id || DEFAULT_ID;
    name = name || cfg.name || DEFAULT_NAME;

    // Make absolute.
    dir = path.resolve(dir);

    events.emit('log', 'Creating a new cordova project with name "' + name + '" and id "' + id + '" at location "' + dir + '"');

    var www_dir = path.join(dir, 'www');

    // dir must be either empty or not exist at all.

    // dir must be either empty except for .cordova config file or not exist at all..
    var sanedircontents = function (d) {
        var contents = fs.readdirSync(d);
        if (contents.length == 0) {
            return true;
        } else if (contents.length == 1) {
            if (contents[0] == '.cordova') {
                return true;
            }
        }
        return false;
    }

    if (fs.existsSync(dir) && !sanedircontents(dir)) {
        return Q.reject(new CordovaError('Path already exists and is not empty: ' + dir));
    }

    // Read / Write .cordova/config.json file if necessary.
    var config_json = config(dir, cfg);

    var p;
    var symlink = false; // Whether to symlink the www dir instead of copying.
    if (config_json.lib && config_json.lib.www) {
        events.emit('log', 'Using custom www assets from '+config_json.lib.www.uri);
        // TODO (kamrik): extend lazy_load for retrieval without caching to allow net urls for --src.
        var www_version = config_json.lib.www.version || 'not_versioned';
        var www_id = config_json.lib.www.id || 'dummy_id';
        symlink  = !!config_json.lib.www.link;
        if ( www_dir.indexOf(path.resolve(config_json.lib.www.uri)) === 0 ) {
            throw new CordovaError(
                'Project must not be created inside the www assets dir.' +
                '\n    project dir:\t' + dir +
                '\n    www assets dir:\t' + config_json.lib.www.uri
            );
        }
        if(symlink) {
            p = Q(config_json.lib.www.uri);
            events.emit('verbose', 'Symlinking custom www assets into "' + www_dir + '"');
        } else {
            p = lazy_load.custom(config_json.lib.www.uri, www_id, 'www', www_version)
            .then(function(d) {
                events.emit('verbose', 'Copying custom www assets into "' + www_dir + '"');
                return d;
            });
        }
    } else {
        // Nope, so use stock cordova-hello-world-app one.
        events.emit('verbose', 'Using stock cordova hello-world application.');
        p = lazy_load.cordova('www')
        .then(function(d) {
            events.emit('verbose', 'Copying stock Cordova www assets into "' + www_dir + '"');
            return d;
        });
    }

    return p.then(function(www_lib) {
        if (!fs.existsSync(www_lib)) {
            throw new CordovaError('Could not find directory: '+www_lib);
        }
        // Keep going into child "www" folder if exists in stock app package.
        while (fs.existsSync(path.join(www_lib, 'www'))) {
            www_lib = path.join(www_lib, 'www');
        }

        var dirAlreadyExisted = fs.existsSync(dir);
        if (!dirAlreadyExisted) {
            shell.mkdir(dir);
        }
        if (symlink) {
            try {
                fs.symlinkSync(www_lib, www_dir, 'dir');
            } catch (e) {
                if (!dirAlreadyExisted) {
                    fs.rmdirSync(dir);
                }
                if (process.platform.slice(0, 3) == 'win' && e.code == 'EPERM')  {
                    throw new CordovaError('Symlinks on Windows require Administrator privileges');
                }
                throw e;
            }
        } else {
            shell.mkdir(www_dir);
            shell.cp('-rf', path.join(www_lib, '*'), www_dir);
        }

        // Create basic project structure.
        shell.mkdir(path.join(dir, 'platforms'));
        shell.mkdir(path.join(dir, 'merges'));
        shell.mkdir(path.join(dir, 'plugins'));
        shell.mkdir(path.join(dir, 'hooks'));

        // Add hooks README.md
        shell.cp(path.join(__dirname, '..', 'templates', 'hooks-README.md'), path.join(dir, 'hooks', 'README.md'));

        var configPath = util.projectConfig(dir);
        // Add template config.xml for apps that are missing it
        if (!fs.existsSync(configPath)) {
            var template_config_xml = path.join(__dirname, '..', 'templates', 'config.xml');
            shell.cp(template_config_xml, configPath);
            // Write out id and name to config.xml
            var config = new ConfigParser(configPath);
            config.setPackageName(id);
            config.setName(name);
            config.write();
        }
    });
};
