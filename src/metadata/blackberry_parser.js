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
var fs            = require('fs'),
    path          = require('path'),
    et            = require('elementtree'),
    prompt        = require('prompt'),
    shell         = require('shelljs'),
    util          = require('../util'),
    config_parser = require('../config_parser'),
    events        = require('../events'),
    config        = require('../config');

module.exports = function blackberry_parser(project) {
    if (!fs.existsSync(path.join(project, 'project.json')) || !fs.existsSync(path.join(project, 'www'))) {
        throw new Error('The provided path "' + project + '" is not a Cordova BlackBerry10 project.');
    }
    this.path = project;
    this.config_path = path.join(this.path, 'www', 'config.xml');
    this.xml = new util.config_parser(this.config_path);
};

module.exports.check_requirements = function(project_root, callback) {
    if (process.env && process.env.QNX_HOST) {
        callback(false);
    } else {
        callback('The BB10NDK environment variable QNX_HOST is missing. Make sure you run `source <path to bb10ndk>/bbndk-env.sh`. Even better, add `source`ing that script to your .bash_profile or equivalent so you don\'t have to do it manually every time.');
    }
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw new Error('update_from_config requires a config_parser object');

        this.xml.name(config.name());
        events.emit('log', 'Wrote out BlackBerry application name to "' + config.name() + '"');
        this.xml.packageName(config.packageName());
        events.emit('log', 'Wrote out BlackBerry package name to "' + config.packageName() + '"');
        this.xml.version(config.version());
        events.emit('log', 'Wrote out BlackBerry version to "' + config.version() + '"');
        this.xml.access.remove();
        var self = this;
        config.access.get().forEach(function(uri) {
            var el = new et.Element('access');
            el.attrib.uri = uri;
            el.attrib.subdomains = 'true';
            self.xml.doc.getroot().append(el);
        });
        this.xml.update();
    },
    update_project:function(cfg, callback) {
        var self = this;

        try {
            self.update_from_config(cfg);
        } catch(e) {
            if (callback) callback(e);
            else throw e;
            return;
        }
        self.update_www();
        self.update_overrides();
        self.update_staging();
        util.deleteSvnFolders(this.www_dir());

        // Do we have BB config?
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        if (dot.blackberry === undefined || dot.blackberry.qnx === undefined) {
            events.emit('warn', 'WARNING! Missing BlackBerry 10 configuration file, prompting for information...');
            this.get_blackberry_environment(function() {
                self.write_blackberry_environment();
                if (callback) callback();
            });
        } else {
            self.write_blackberry_environment();
            if (callback) callback();
        }
    },

    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.path, 'www');
    },

    staging_dir: function() {
        return path.join(this.path, '.staging', 'www');
    },

    config_xml:function(){
        return this.config_path;
    },

    update_www:function() {
        var projectRoot = util.isCordova(this.path);
        var www = util.projectWww(projectRoot);
        var platformWww = this.www_dir();
        // remove the stock www folder
        shell.rm('-rf', this.www_dir());

        // copy over project www assets
        shell.cp('-rf', www, this.path);

        var custom_path = config.has_custom_path(projectRoot, 'blackberry');
        var lib_path = path.join(util.libDirectory, 'blackberry', 'cordova', require('../../platforms').blackberry.version);
        if (custom_path) lib_path = custom_path;
        // add cordova.js
        shell.cp('-f', path.join(lib_path, 'javascript', 'cordova.blackberry10.js'), path.join(this.www_dir(), 'cordova.js'));

        // add webworks ext directories
        shell.cp('-rf', path.join(lib_path, 'framework', 'ext*'), this.www_dir());

        // add config.xml
        // @TODO should use project www/config.xml but it must use BBWP elements
        shell.cp('-f', path.join(lib_path, 'bin', 'templates', 'project', 'www', 'config.xml'), this.www_dir());

        // add res/
        // @TODO remove this when config.xml is generalized
        shell.cp('-rf', path.join(lib_path, 'bin', 'templates', 'project', 'www', 'res'), this.www_dir());
    },

    // update the overrides folder into the www folder
    update_overrides:function() {
        var projectRoot = util.isCordova(this.path);
        var merges_path = path.join(util.appDir(projectRoot), 'merges', 'blackberry');
        if (fs.existsSync(merges_path)) {
            var overrides = path.join(merges_path, '*');
            shell.cp('-rf', overrides, this.www_dir());
        }
    },

    // update the overrides folder into the www folder
    update_staging:function() {
        var projectRoot = util.isCordova(this.path);
        if (fs.existsSync(this.staging_dir())) {
            var staging = path.join(this.staging_dir(), '*');
            shell.cp('-rf', staging, this.www_dir());
        }
    },
    get_cordova_config:function() {
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        return dot.blackberry.qnx;
    },
    get_blackberry_environment:function(callback) {
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        // Let's save relevant BB SDK + signing info to .cordova/config.json
        events.emit('log', 'Prompting for BlackBerry 10 configuration information...');
        prompt.start();
        prompt.get([{
            name:'signing_password',
            required:true,
            description:'Enter your BlackBerry 10 signing/keystore password',
            hidden:true
        },{
            name:'device_name',
            description:'Enter a name for your BB10 device'
        },{
            name:'device_ip',
            description:'Enter the IP to your BB10 device'
        },{
            name:'device_password',
            description:'Enter the password for your BB10 device'
        },{
            name:'device_pin',
            description:'Enter the PIN for your BB10 device (under Settings->About->Hardware)'
        },{
            name:'sim_name',
            description:'Enter a name for your BB10 simulator'
        },{
            name:'sim_ip',
            description:'Enter the IP to your BB10 simulator'
        },{
            name:'sim_password',
            description:'Enter the password for your BB10 simulator'
        }
        ], function(err, results) {
            if (err) {
                if (callback) callback(err);
                else throw err;
            } else {
                // Write out .cordova/config.json file
                if (dot.blackberry === undefined) dot.blackberry = {};
                if (dot.blackberry.qnx === undefined) dot.blackberry.qnx = {};
                dot.blackberry.qnx.signing_password = results.signing_password;
                dot.blackberry.qnx.device_ip = results.device_ip;
                dot.blackberry.qnx.device_name = results.device_name;
                dot.blackberry.qnx.device_password = results.device_password;
                dot.blackberry.qnx.device_pin = results.device_pin;
                dot.blackberry.qnx.sim_ip = results.sim_ip;
                dot.blackberry.qnx.sim_name = results.sim_name;
                dot.blackberry.qnx.sim_password = results.sim_password;
                fs.writeFileSync(dotFile, JSON.stringify(dot), 'utf-8');
                events.emit('log', 'Wrote out BlackBerry 10 configuration file to "' + dotFile + '"');
                if (callback) callback();
            }
        });
    },
    write_blackberry_environment:function() {
        var projectRoot = util.isCordova(this.path);
        // Write it out to project.json as well
        var project_json_file = path.join(projectRoot, 'platforms', 'blackberry', 'project.json');
        var proj_json = JSON.parse(fs.readFileSync(project_json_file,'utf-8'));

        // write out stuff to the project.json if user specified it
        var bb_config = this.get_cordova_config();
        if (bb_config.device_name && bb_config.device_ip && bb_config.device_password && bb_config.device_pin) {
            proj_json.targets[bb_config.device_name] = {
                ip:bb_config.device_ip,
                type:"device",
                password:bb_config.device_password,
                pin:bb_config.device_pin
            };
            proj_json.defaultTarget = bb_config.device_name;
            events.emit('log', 'Wrote out BlackBerry 10 device information to ' + project_json_file);
        }
        if (bb_config.sim_name && bb_config.sim_ip && bb_config.sim_password) {
            proj_json.targets[bb_config.sim_name] = {
                ip:bb_config.sim_ip,
                type:"simulator",
                password:bb_config.sim_password
            };
            events.emit('log', 'Wrote out BlackBerry 10 simulator information to ' + project_json_file);
        }
        fs.writeFileSync(project_json_file, JSON.stringify(proj_json), 'utf-8');
    },
    get_all_targets:function() {
        var json_file = path.join(this.path, 'project.json');
        var json = JSON.parse(fs.readFileSync(json_file, 'utf-8'));
        var targets = [];
        Object.keys(json.targets).forEach(function(target) {
            var t = json.targets[target];
            t.name = target;
            targets.push(t);
        });
        return targets;
    },
    get_device_targets:function() {
        return this.get_all_targets().filter(function(t) {
            return t.type == 'device';
        });
    },
    get_simulator_targets:function() {
        return this.get_all_targets().filter(function(t) {
            return t.type == 'simulator';
        });
    },
    has_device_target:function() {
        return this.get_device_targets().length > 0;
    },
    has_simulator_target:function() {
        return this.get_simulator_targets().length > 0;
    }
};
