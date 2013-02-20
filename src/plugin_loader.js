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

var path            = require('path'),
    fs              = require('fs'),
    shell           = require('shelljs'),
    ls              = fs.readdirSync,
    cordova_util    = require('./util'),
    util            = require('util'),
    android_parser= require('./metadata/android_parser'),
    blackberry_parser= require('./metadata/blackberry_parser'),
    ios_parser    = require('./metadata/ios_parser'),
    et              = require('elementtree');


// Called during cordova prepare.
// Sets up each plugin's Javascript code to be loaded properly.
module.exports = function plugin_loader(platform) {
    // Process:
    // - List all plugins in plugins/.
    // - Load and parse their plugin.xml files.
    // - Skip those without support for this platform.
    // - Build a list of all their js-modules, and platform-specific js-modules.
    // - For each js-module (general first, then platform):
    //   - Generate JS code to load it.
    //   - For each <clobbers>, <merges> or <runs>, generate JS code to perform it.
    //   - Copy the file, having slapped the cordova.define onto it on the way.
    // - Append all of this code to the platform's cordova.js

    var projectRoot = cordova_util.isCordova(process.cwd());
    var plugins_dir = path.join(projectRoot, 'plugins');
    var plugins = ls(plugins_dir);


    // Placed at the top of cordova.js to delay onDeviceReady until all the plugins
    // are actually loaded. This is a temporary hack that can be removed once this
    // prototype is rolled into the main code.
    var topJS = 'window.__onPluginsLoadedHack = true;\n';

    // The main injected JS, used to inject <script> tags.
    var js = '';

    // The last part of the injected JS, which runs after all plugins are loaded and
    // registers the clobbers, merges and runs.
    var lateJS = '';

    // Add the callback function.
    js += 'var mapper = cordova.require("cordova/modulemapper");\n';
    js += 'var scriptCounter = 0;\n';
    js += 'var scriptCallback = function() {\n';
    js += 'scriptCounter--;\n';
    js += 'if (scriptCounter == 0) { scriptsLoaded(); } };\n';

    // <script> tag injection function
    js += 'function injectScript(path) {\n';
        js += 'scriptCounter++;\n';
        js += 'var script = document.createElement("script");\n';
        js += 'script.onload = scriptCallback;\n';
        js += 'script.src = path;\n';
        js += 'document.querySelector("head").appendChild(script);\n';
    js += '}\n\n';


    // Acquire the platform's parser.
    var parser;
    switch(platform) {
        case 'android':
            parser = new android_parser(path.join(projectRoot, 'platforms', 'android'));
            break;
        case 'ios':
            parser = new ios_parser(path.join(projectRoot, 'platforms', 'ios'));
            break;
        case 'blackberry':
            parser = new blackberry_parser(path.join(projectRoot, 'platforms', 'blackberry'));
            break;
    }

    plugins && plugins.forEach(function(plugin) {
        var pluginDir = path.join(projectRoot, 'plugins', plugin);
        var xml = new et.ElementTree(et.XML(fs.readFileSync(path.join(pluginDir, 'plugin.xml'), 'utf-8')));

        var plugin_id = xml.getroot().attrib.id;

        // And then add the plugins dir to the platform's www.
        var platformPluginsDir = path.join(parser.www_dir(), 'plugins');
        shell.mkdir('-p', platformPluginsDir);

        var generalModules = xml.findall('./js-module');
        var platformTag = xml.find(util.format('./platform[@name="%s"]', platform));
        if (!platformTag) {
            return; // Skip plugins that don't support this platform.
        }

        var platformModules = platformTag.findall('./js-module');
        generalModules = generalModules || [];
        var allModules = generalModules.concat(platformModules);


        allModules.forEach(function(module) {
            // Copy the plugin's files into the www directory.
            var dirname = module.attrib.src;
            var lastSlash = dirname.lastIndexOf('/');
            if (lastSlash >= 0) {
                dirname = dirname.substring(0, lastSlash);
            }

            shell.mkdir('-p', path.join(platformPluginsDir, plugin_id, dirname));

            // Read in the file, prepend the cordova.define, and write it back out.
            var moduleName = plugin_id + '.';
            if (module.attrib.name) {
                moduleName += module.attrib.name;
            } else {
                var result = module.attrib.src.match(/([^\/]+)\.js/);
                moduleName += result[1];
            }

            var scriptContent = fs.readFileSync(path.join(pluginDir, module.attrib.src), 'utf-8');
            scriptContent = 'cordova.define("' + moduleName + '", function(require, exports, module) {' + scriptContent + '});\n';
            fs.writeFileSync(path.join(platformPluginsDir, plugin_id, module.attrib.src), scriptContent, 'utf-8');

            // Prepare the injected Javascript code.
            var jsFile = path.join('plugins', plugin_id, module.attrib.src);
            js += 'injectScript("' + jsFile + '");\n';

            // Loop over the children, injecting clobber, merge and run code for each.
            module.getchildren().forEach(function(child) {
                if (child.tag.toLowerCase() == 'clobbers') {
                    lateJS += 'mapper.clobbers("' + moduleName + '", "' + child.attrib.target + '");\n';
                } else if (child.tag.toLowerCase() == 'merges') {
                    lateJS += 'mapper.merges("' + moduleName + '", "' + child.attrib.target + '");\n';
                } else if (child.tag.toLowerCase() == 'runs') {
                    lateJS += 'cordova.require("' + moduleName + '");\n';
                }
            });
            lateJS += '\n\n\n';
        });
    });

    // Last step in lateJS that runs after the <script> tags have all loaded and
    // all modules are properly clobbered: fire onPluginsReady event.
    lateJS += 'cordova.require("cordova/channel").onPluginsReady.fire();\n';

    // Wrap lateJS into scriptsLoaded(), which will be called after the last <script>
    // has finished loading.
    lateJS = 'function scriptsLoaded() {\n' + lateJS + '\n}\n';

    // Now write the generated JS to the platform's cordova.js
    var cordovaJSPath = path.join(parser.www_dir(), 'cordova.js');
    var cordovaJS = fs.readFileSync(cordovaJSPath, 'utf-8');
    cordovaJS = topJS + cordovaJS + '(function() { ' + js + lateJS + '})();';
    fs.writeFileSync(cordovaJSPath, cordovaJS, 'utf-8');
};


