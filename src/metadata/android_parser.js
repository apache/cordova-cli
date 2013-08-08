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
var fs             = require('fs'),
    path           = require('path'),
    et             = require('elementtree'),
    util           = require('../util'),
    events         = require('../events'),
    shell          = require('shelljs'),
    project_config = require('../config'),
    config_parser  = require('../config_parser'),
    imagemagick    = require('imagemagick');

var default_prefs = {
    "useBrowserHistory":"true",
    "exit-on-suspend":"false"
};

module.exports = function android_parser(project) {
    if (!fs.existsSync(path.join(project, 'AndroidManifest.xml'))) {
        throw new Error('The provided path "' + project + '" is not an Android project.');
    }
    this.path = project;
    this.strings = path.join(this.path, 'res', 'values', 'strings.xml');
    this.manifest = path.join(this.path, 'AndroidManifest.xml');
    this.android_config = path.join(this.path, 'res', 'xml', 'config.xml');
};

module.exports.check_requirements = function(project_root, callback) {
    events.emit('log', 'Checking Android requirements...');
    var command = 'android list target';
    events.emit('log', 'Running "' + command + '" (output to follow)');
    shell.exec(command, {silent:true, async:true}, function(code, output) {
        events.emit('log', output);
        if (code != 0) {
            callback('The command `android` failed. Make sure you have the latest Android SDK installed, and the `android` command (inside the tools/ folder) added to your path. Output: ' + output);
        } else {
            if (output.indexOf('android-17') == -1) {
                callback('Please install Android target 17 (the Android 4.2 SDK). Make sure you have the latest Android tools installed as well. Run `android` from your command-line to install/update any missing SDKs or tools.');
            } else {
                var custom_path = project_config.has_custom_path(project_root, 'android');
                var framework_path;
                if (custom_path) {
                    framework_path = path.resolve(path.join(custom_path, 'framework'));
                } else {
                    framework_path = path.join(util.libDirectory, 'android', 'cordova', require('../../platforms').android.version, 'framework');
                }
                var cmd = 'android update project -p "' + framework_path  + '" -t android-17';
                events.emit('log', 'Running "' + cmd + '" (output to follow)...');
                shell.exec(cmd, {silent:true, async:true}, function(code, output) {
                    events.emit('log', output);
                    if (code != 0) {
                        callback('Error updating the Cordova library to work with your Android environment. Command run: "' + cmd + '", output: ' + output);
                    } else {
                        callback(false);
                    }
                });
            }
        }
    });
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw new Error('update_from_config requires a config_parser object');

        // Update app name by editing res/values/strings.xml
        var name = config.name();
        var strings = new et.ElementTree(et.XML(fs.readFileSync(this.strings, 'utf-8')));
        strings.find('string[@name="app_name"]').text = name;
        fs.writeFileSync(this.strings, strings.write({indent: 4}), 'utf-8');
        events.emit('log', 'Wrote out Android application name to "' + name + '"');

        var manifest = new et.ElementTree(et.XML(fs.readFileSync(this.manifest, 'utf-8')));
        // Update the version by changing the AndroidManifest android:versionName
        var version = config.version();
        manifest.getroot().attrib["android:versionName"] = version;

        // Update package name by changing the AndroidManifest id and moving the entry class around to the proper package directory
        var pkg = config.packageName();
        pkg = pkg.replace(/-/g, '_'); // Java packages cannot support dashes
        var orig_pkg = manifest.getroot().attrib.package;
        manifest.getroot().attrib.package = pkg;

        // Write out AndroidManifest.xml
        fs.writeFileSync(this.manifest, manifest.write({indent: 4}), 'utf-8');
        
        var orig_pkgDir = path.join(this.path, 'src', path.join.apply(null, orig_pkg.split('.')));
        var orig_java_class = fs.readdirSync(orig_pkgDir).filter(function(f) {return f.indexOf('.svn') == -1;})[0];
        var pkgDir = path.join(this.path, 'src', path.join.apply(null, pkg.split('.')));
        shell.mkdir('-p', pkgDir);
        var orig_javs = path.join(orig_pkgDir, orig_java_class);
        var new_javs = path.join(pkgDir, orig_java_class);
        var javs_contents = fs.readFileSync(orig_javs, 'utf-8');
        javs_contents = javs_contents.replace(/package [\w\.]*;/, 'package ' + pkg + ';');
        events.emit('log', 'Wrote out Android package name to "' + pkg + '"');
        fs.writeFileSync(new_javs, javs_contents, 'utf-8');

        // Update whitelist by changing res/xml/config.xml
        var android_cfg_xml = new util.config_parser(this.android_config);
        // clean out all existing access elements first
        android_cfg_xml.access.remove();
        // add only the ones specified in the app/config.xml file
        config.access.get().forEach(function(uri) {
            android_cfg_xml.access.add(uri);
        });
        
        // Update preferences
        android_cfg_xml.preference.remove();
        var prefs = config.preference.get();
        // write out defaults, unless user has specifically overrode it
        for (var p in default_prefs) if (default_prefs.hasOwnProperty(p)) {
            var override = prefs.filter(function(pref) { return pref.name == p; });
            var value = default_prefs[p];
            if (override.length) {
                // override exists
                value = override[0].value;
                // remove from prefs list so we dont write it out again below
                prefs = prefs.filter(function(pref) { return pref.name != p });
            }
            android_cfg_xml.preference.add({
                name:p,
                value:value
            });
        }
        prefs.forEach(function(pref) {
            android_cfg_xml.preference.add({
                name:pref.name,
                value:pref.value
            });
        });
    },

    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.path, 'assets', 'www');
    },

    staging_dir: function() {
        return path.join(this.path, '.staging', 'www');
    },

    config_xml:function(){
        return this.android_config;
    },

    update_www:function() {
        var projectRoot = util.isCordova(this.path);
        var www = util.projectWww(projectRoot);
        var platformWww = path.join(this.path, 'assets');
        // remove stock platform assets
        shell.rm('-rf', this.www_dir());
        // copy over all app www assets
        shell.cp('-rf', www, platformWww);

        // write out android lib's cordova.js
        var custom_path = project_config.has_custom_path(projectRoot, 'android');
        var jsPath;
        if (custom_path) {
            jsPath = path.resolve(path.join(custom_path, 'framework', 'assets', 'www', 'cordova.js'));
        } else {
            jsPath = path.join(util.libDirectory, 'android', 'cordova', require('../../platforms').android.version, 'framework', 'assets', 'www', 'cordova.js');
        }
        fs.writeFileSync(path.join(this.www_dir(), 'cordova.js'), fs.readFileSync(jsPath, 'utf-8'), 'utf-8');
    },

    // update the overrides folder into the www folder
    update_overrides:function() {
        var projectRoot = util.isCordova(this.path);
        var merges_path = path.join(util.appDir(projectRoot), 'merges', 'android');
        if (fs.existsSync(merges_path)) {
            var overrides = path.join(merges_path, '*');
            shell.cp('-rf', overrides, this.www_dir());
        }
    },

    // update the overrides folder into the www folder
    update_staging:function() {
        if (fs.existsSync(this.staging_dir())) {
            var staging = path.join(this.staging_dir(), '*');
            shell.cp('-rf', staging, this.www_dir());
        }
    },

    copy_resources:function(cfg) {
        this.copy_splashes(cfg);
        this.copy_icons(cfg);
    },

    get_source_asset:function(assets, orientation) {
        var idx, asset;
        for (idx in assets) {
            asset = assets[idx];
            if (asset.attrib['gap:platform'] == 'source' && asset.attrib['gap:orientation'] == orientation) {
                return asset;
            }
        }
        return false;
    },

    hasImageMagick: function(callback) {
        var exec = require('child_process').exec,
            child;

        child = exec('which convert', function(error, stdout, stderr) {
            callback(error);
        });
    },

    generate_assets:function(assets, sizeMapping, skip, cfg) {
        var self = this;
        this.hasImageMagick(function(error) {
            if (error) {
                return events.emit('log', 'ImageMagick convert utility missing');
            }
            self.generate_assets_raw('portrait', assets, sizeMapping, skip, cfg);
            self.generate_assets_raw('landscape', assets, sizeMapping, skip, cfg);
        });
    },

    generate_assets_raw: function(orientation, assets, sizeMapping, skip, cfg) {
        var www = path.dirname(cfg.path),
            sourceImage,
            dest,
            width,
            height;

        sourceImage = this.get_source_asset(assets, orientation);

        if (!sourceImage)
            return events.emit('log', ('Could not find Android source image for ' + orientation).red);

        sourceImage = path.join(www, sourceImage.attrib.src);

        if (!fs.existsSync(sourceImage))
            return events.emit('log', sourceImage + ' does not exist!');

        for (key in sizeMapping) {
            dest = path.join(this.path, sizeMapping[key].dest);
            if (skip.indexOf(dest) !== -1)
                continue;

            width = sizeMapping[key].width;
            height = sizeMapping[key].height;

            if (sizeMapping[key].orientation != orientation)
                continue;

            events.emit('log', 'Generating Android asset '.yellow + dest + ' from ' + sourceImage + ' [' + width + 'x' + height + ']');

            imagemagick.resize({
                srcPath: sourceImage,
                dstPath: dest,
                width: width,
                height: height,
                format: 'png'
            }, function(err, stdout, stderr) {
                if (err) {
                    events.emit('log', 'Error generating image, is imagemagick installed?');
                    events.emit('log', stderr);
                }
            });

        }
    },

    copy_splashes:function(cfg) {
        var projectRoot = util.isCordova(this.path),
            splashes = cfg.doc.getroot().findall('.//splash'),
            www = path.dirname(cfg.path),
            splash,
            dest,
            copied = [],
            sizeMapping = {
                'ldpi': {dest: 'res/drawable-ldpi/ic_launcher.png', width: '200', height: '320', orientation: 'portrait'},
                'mdpi': {dest: 'res/drawable-mdpi/ic_launcher.png', width: '320', height: '480', orientation: 'portrait'},
                'hdpi': {dest: 'res/drawable-hdpi/ic_launcher.png', width: '480', height: '800', orientation: 'portrait'},
                'xhdpi': {dest: 'res/drawable-xhdpi/ic_launcher.png', width: '720' , height: '1280', orientation: 'portrait'},
            };

        for (idx in splashes) {
            splash = splashes[idx];

            if (splash.attrib['gap:platform'] != 'android')
               continue;

            if (!sizeMapping[splash.attrib.density])
               continue;

            dest = path.join(this.path, sizeMapping[splash.attrib.density].dest);

            events.emit('log', 'Copying Android splash '.green + path.join(www, splash.attrib.src) + ' to ' + dest);
            shell.cp('-f', path.join(www, splash.attrib.src), dest);
            copied.push(dest);
        }

        this.generate_assets(splashes, sizeMapping, copied, cfg);
    },

    copy_icons:function(cfg) {
        var projectRoot = util.isCordova(this.path),
            icons = cfg.doc.getroot().findall('.//icon'),
            www = path.dirname(cfg.path),
            icon,
            dest,
            copied = [],
            sizeMapping = {
                'ldpi': {dest: 'res/drawable-ldpi/icon.png', width: '36', height: '36' , orientation: 'portrait'},
                'mdpi': {dest: 'res/drawable-mdpi/icon.png', width: '48', height: '48', orientation: 'portrait'},
                'hdpi': {dest: 'res/drawable-hdpi/icon.png', width: '72', height: '72', orientation: 'portrait'},
                'xhdpi': {dest: 'res/drawable-xhdpi/icon.png', width: '96', height: '96', orientation: 'portrait'}
            };

        for (idx in icons) {
            icon = icons[idx];

            if (icon.attrib['gap:platform'] != 'android')
               continue;

            if (!sizeMapping[icon.attrib.density])
               continue;

            dest = path.join(this.path, sizeMapping[icon.attrib.density].dest);
            events.emit('log', 'Copying Android icon '.green + path.join(www, icon.attrib.src) + ' to ' + dest);
            shell.cp('-f', path.join(www, icon.attrib.src), dest);
            copied.push(dest);
        }

        this.generate_assets(icons, sizeMapping, copied, cfg);
    },

    fix_android:function(cfg) {
        var androidJavaPath = cfg.packageName(),
            source,
            lines,
            idx,
            line,
            newLines;

        androidJavaPath = androidJavaPath.split('.');
        androidJavaPath.unshift('src');
        androidJavaPath.unshift(this.path);
        androidJavaPath.push(cfg.name() + '.java');
        androidJavaPath = path.join.apply(path, androidJavaPath);

        source = fs.readFileSync(androidJavaPath, 'utf8');

        if (source.indexOf('splashscreen') !== -1)
            return;

        lines = source.split(/\r\n|\r|\n/);
        newLines = [];

        for (idx in lines) {
            line = lines[idx];
            if (line.indexOf('.loadUrl') !== -1 && !line.match(/\s*\/\//)) {
                newLines.push('        super.setIntegerProperty("splashscreen", R.drawable.ic_launcher);')
            }
            newLines.push(line);
        }

        source = newLines.join("\n");
        fs.writeFileSync(androidJavaPath, source, 'utf8');
    },

    update_project:function(cfg, callback) {
        var platformWww = path.join(this.path, 'assets');
        try {
            this.update_from_config(cfg);
        } catch(e) {
            if (callback) callback(e);
            else throw e;
            return;
        }
        this.update_www();
        this.update_overrides();
        this.update_staging();
        this.copy_resources(cfg);
        this.fix_android(cfg);
        // delete any .svn folders copied over
        util.deleteSvnFolders(platformWww);
        if (callback) callback();
    }
};

