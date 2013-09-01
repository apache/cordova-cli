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
    shell         = require('shelljs'),
    util          = require('../util'),
    config_parser = require('../config_parser'),
    events        = require('../events'),
    config        = require('../config');

module.exports = function blackberry_parser(project) {
    if (!fs.existsSync(path.join(project, 'www'))) {
        throw new Error('The provided path "' + project + '" is not a Cordova BlackBerry10 project.');
    }
    this.path = project;
    this.config_path = path.join(this.path, 'www', 'config.xml');
};

module.exports.check_requirements = function(project_root, callback) {
    var lib_path = path.join(util.libDirectory, 'blackberry10', 'cordova', require('../../platforms').blackberry10.version);
    shell.exec(path.join(lib_path, 'bin', 'check_reqs'), {silent:true, async:true}, function(code, output) {
        if (code != 0) {
            callback(output);
        } else {
            callback(false);
        }
    });
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw new Error('update_from_config requires a config_parser object');

        this.xml = new util.config_parser(this.config_path);
        this.xml.name(config.name());
        events.emit('log', 'Wrote out BlackBerry application name to "' + config.name() + '"');
        this.xml.packageName(config.packageName());
        events.emit('log', 'Wrote out BlackBerry package name to "' + config.packageName() + '"');
        this.xml.version(config.version());
        events.emit('log', 'Wrote out BlackBerry version to "' + config.version() + '"');
        var self = this;
        var xmlDoc = this.xml.doc;
        var xmlDocRoot = xmlDoc.getroot();
        xmlDocRoot.attrib['xmlns:rim'] = "http://www.blackberry.com/ns/widgets";
        if (xmlDoc.findall('content').length == 0) {
            xmlDocRoot.append(new et.Element ('content', {src: "index.html"}));
        }
        xmlDoc.findall ('*').forEach(function (node) {
            var nodeName = node.tag;
            if (nodeName == 'preference' && node.attrib.name == 'orientation') {
                var orientation = node.attrib.value;
                if (orientation != 'portrait' && orientation != 'landscape')
                    orientation = 'auto';
    			// http://developer.blackberry.com/html5/documentation/param_element.html
				var feature = new et.Element('feature', {id: "blackberry.app"});
				xmlDocRoot.append(feature);
				feature.append(new et.Element ('param', {
					name: 'orientation',
					value: orientation
				}));
				// http://developer.blackberry.com/html5/documentation/rim_orientation_element_1594186_11.html
				xmlDocRoot.append(new et.Element ('rim:orientation', {mode: orientation}));

				return;
			}
			if (nodeName != 'icon' && nodeName != 'gap:splash')
				return;
			if (node.attrib['gap:platform'] != 'blackberry') {
				xmlDocRoot.remove(0, node);
			} else if (nodeName == 'gap:splash') {
				var el = new et.Element('rim:splash');
				for (var attr in node.attrib) {
					el.attrib[attr] = node.attrib[attr];
				}
				xmlDocRoot.append(el);
                xmlDocRoot.remove(0, node);
			}
		});

        this.xml.update();
    },
    update_project:function(cfg, callback) {
        var self = this;

        self.update_www();

        try {
            self.update_from_config(cfg);
        } catch(e) {
            if (callback) callback(e);
            else throw e;
            return;
        }

        self.update_overrides();
        self.update_staging();
        util.deleteSvnFolders(this.www_dir());
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
        // remove the stock www folder
        shell.rm('-rf', this.www_dir());

        // copy over project www assets
        shell.cp('-rf', www, this.path);

        var custom_path = config.has_custom_path(projectRoot, 'blackberry10');
        var lib_path = path.join(util.libDirectory, 'blackberry10', 'cordova', require('../../platforms').blackberry10.version);
        if (custom_path) lib_path = custom_path;
        // add cordova.js
        shell.cp('-f', path.join(lib_path, 'javascript', 'cordova.blackberry10.js'), path.join(this.www_dir(), 'cordova.js'));
    },

    // update the overrides folder into the www folder
    update_overrides:function() {
        var projectRoot = util.isCordova(this.path);
        var merges_path = path.join(util.appDir(projectRoot), 'merges', 'blackberry10');
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
    }
};
