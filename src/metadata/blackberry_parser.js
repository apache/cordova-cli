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
        this.xml.packageName(config.packageName());
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

        self.update_from_config(cfg);
        self.update_www();
        self.update_overrides();
        self.update_staging();
        util.deleteSvnFolders(this.www_dir());

        // Do we have BB config?
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        if (dot.blackberry === undefined || dot.blackberry.qnx === undefined) {
            this.get_blackberry_environment(function() {
                // Update project.properties
                self.write_project_properties();

                if (callback) callback();
            });
            return;
        }
        // Write out config stuff to project.properties file
        this.write_project_properties();
        if (callback) callback();
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

        var finalWww = path.join(this.path, 'finalwww');
        shell.mkdir('-p', finalWww);

        // replace stock bb app contents with app contents. 
        // to keep:
        //        - config.xml
        //        - cordova.js
        //        - ext*
        //        - plugins.xml
        //        - res
        shell.cp('-f', path.join(platformWww, 'config.xml'), finalWww);
        shell.cp('-f', path.join(platformWww, 'cordova-*.js'), finalWww);
        shell.cp('-f', path.join(platformWww, 'plugins.xml'), finalWww);
        shell.cp('-rf', path.join(platformWww, 'ext*'), finalWww);
        shell.cp('-rf', path.join(platformWww, 'res'), finalWww);

        // Copy everything over from platform-agnostic www.
        shell.cp('-rf', path.join(www, '*'), finalWww);

        // Delete the old platform www, and move the final project over
        shell.rm('-rf', platformWww);
        shell.mv(finalWww, platformWww);

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
        // TODO: eventually support all blackberry sub-platforms
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
    },
    get_blackberry_environment:function(callback) {
        // TODO: add other blackberry sub-platforms
        var projectRoot = util.isCordova(this.path);
        var dotFile = path.join(projectRoot, '.cordova', 'config.json');
        var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
        // Let's save relevant BB SDK + signing info to .cordova/config.json
        console.log('Looks like we need some of your BlackBerry development environment information. We\'ll just ask you a few questions and we\'ll be on our way to building.');
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
            if (err) throw new Error('Error during BlackBerry environment config retrieval');
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
            console.log('Perfect! If you need to change any of these properties, just edit the .cordova/config.json file in the root of your cordova project.');
            if (callback) callback();
        });
    }
};
