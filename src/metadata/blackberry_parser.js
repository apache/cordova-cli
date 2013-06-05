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
    events        = require('../events'),
    config_parser = require('../config_parser');

module.exports = function blackberry_parser(project) {
    if (!fs.existsSync(path.join(project, 'project.properties')) || !fs.existsSync(path.join(project, 'build.xml'))) {
        throw new Error('The provided path "' + project + '" is not a Cordova BlackBerry WebWorks project.');
    }
    this.path = project;
    this.config_path = path.join(this.path, 'www', 'config.xml');
    this.xml = new config_parser(this.config_path);
};

module.exports.check_requirements = function(callback) {
    // TODO: below, we ask for users to fill out SDK paths, etc. into config.json. Android requires the sdk path be on the PATH. Which to choose? 
    callback(false);
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw new Error('update_from_config requires a config_parser object');

        this.xml.name(config.name());
        events.emit('log', 'Wrote out BlackBerry application name to "' + config.name() + '"');
        this.xml.packageName(config.packageName());
        events.emit('log', 'Wrote out BlackBerry package name to "' + config.packageName() + '"');
        this.xml.access.remove();
        var self = this;
        this.xml.doc.findall('access').forEach(function(a) {
            self.xml.doc.getroot().remove(0, a);
        });
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
            events.emit('warn', 'WARNING! Missing BlackBerry configuration file.');
            this.get_blackberry_environment(function() {
                // Update project.properties
                self.write_project_properties();

                if (callback) callback();
            });
        } else {
            // Write out config stuff to project.properties file
            this.write_project_properties();
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

        // add cordova.js
        shell.cp('-f', path.join(util.libDirectory, 'cordova-blackberry', 'javascript', 'cordova.blackberry.js'), path.join(this.www_dir(), 'cordova.js'));

        // add webworks ext directories
        shell.cp('-rf', path.join(util.libDirectory, 'cordova-blackberry', 'framework', 'ext*'), this.www_dir());

        // add config.xml
        // @TODO should use project www/config.xml but it must use BBWP elements
        shell.cp('-f', path.join(util.libDirectory, 'cordova-blackberry', 'bin', 'templates', 'project', 'www', 'config.xml'), this.www_dir());

        // add res/
        // @TODO remove this when config.xml is generalized
        shell.cp('-rf', path.join(util.libDirectory, 'cordova-blackberry', 'bin', 'templates', 'project', 'www', 'res'), this.www_dir());
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

    write_project_properties:function() {
        var projectRoot = util.isCordova(this.path);

        var projFile = path.join(this.path, 'project.properties');
        var props = fs.readFileSync(projFile, 'utf-8');

        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));

        props = props.replace(/qnx\.bbwp\.dir=.*\n/, 'qnx.bbwp.dir=' + dot.blackberry.qnx.bbwp + '\n');
        props = props.replace(/qnx\.sigtool\.password=.*\n/, 'qnx.sigtool.password=' + dot.blackberry.qnx.signing_password + '\n');
        props = props.replace(/qnx\.device\.ip=.*\n/, 'qnx.device.ip=' + dot.blackberry.qnx.device_ip + '\n');
        props = props.replace(/qnx\.device\.password=.*\n/, 'qnx.device.password=' + dot.blackberry.qnx.device_password + '\n');
        props = props.replace(/qnx\.sim\.ip=.*\n/, 'qnx.sim.ip=' + dot.blackberry.qnx.sim_ip + '\n');
        props = props.replace(/qnx\.sim\.password=.*\n/, 'qnx.sim.password=' + dot.blackberry.qnx.sim_password + '\n');
        fs.writeFileSync(projFile, props, 'utf-8');
        events.emit('log', 'Wrote out BlackBerry 10 configuration file to "' + projFile + '"');
    },
    get_blackberry_environment:function(callback) {
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        // Let's save relevant BB SDK + signing info to .cordova/config.json
        events.emit('log', 'Prompting for BlackBerry 10 configuration information...');
        prompt.start();
        prompt.get([{
            name:'bbwp',
            required:true,
            description:'Enter the full path to your BB10 bbwp executable'
        },{
            name:'signing_password',
            required:true,
            description:'Enter your BlackBerry signing password',
            hidden:true
        },{
            name:'device_ip',
            description:'Enter the IP to your BB10 device'
        },{
            name:'device_password',
            description:'Enter the password for your BB10 device'
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
                dot.blackberry.qnx.bbwp = results.bbwp;
                dot.blackberry.qnx.signing_password = results.signing_password;
                dot.blackberry.qnx.device_ip = results.device_ip;
                dot.blackberry.qnx.device_password = results.device_password;
                dot.blackberry.qnx.sim_ip = results.sim_ip;
                dot.blackberry.qnx.sim_password = results.sim_password;
                fs.writeFileSync(dotFile, JSON.stringify(dot), 'utf-8');
                events.emit('log', 'Wrote out BlackBerry 10 configuration file to "' + dotFile + '"');
                if (callback) callback();
            }
        });
    }
};
