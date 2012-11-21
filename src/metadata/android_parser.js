var fs   = require('fs'),
    path = require('path'),
    et = require('elementtree'),
    util = require('../util'),
    shell = require('shelljs'),
    config_parser = require('../config_parser');

module.exports = function android_parser(project) {
    if (!fs.existsSync(path.join(project, 'AndroidManifest.xml'))) {
        throw 'The provided path is not an Android project.';
    }
    this.path = project;
    this.strings = path.join(this.path, 'res', 'values', 'strings.xml');
    this.manifest = path.join(this.path, 'AndroidManifest.xml');
    this.android_config = path.join(this.path, 'res', 'xml', 'config.xml');
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw 'update_from_config requires a config_parser object';

        // Update app name by editing res/values/strings.xml
        var name = config.name();
        var strings = new et.ElementTree(et.XML(fs.readFileSync(this.strings, 'utf-8')));
        strings.find('string[@name="app_name"]').text = name;
        fs.writeFileSync(this.strings, strings.write({indent: 4}), 'utf-8');

        // Update package name by changing the AndroidManifest id and moving the entry class around to the proper package directory
        var manifest = new et.ElementTree(et.XML(fs.readFileSync(this.manifest, 'utf-8')));
        var pkg = config.packageName();
        var orig_pkg = manifest.getroot().attrib.package;
        manifest.getroot().attrib.package = pkg;
        fs.writeFileSync(this.manifest, manifest.write({indent: 4}), 'utf-8');
        var orig_pkgDir = path.join(this.path, 'src', path.join.apply(null, orig_pkg.split('.')));
        var orig_java_class = fs.readdirSync(orig_pkgDir)[0];
        var pkgDir = path.join(this.path, 'src', path.join.apply(null, pkg.split('.')));
        shell.mkdir('-p', pkgDir);
        var orig_javs = path.join(orig_pkgDir, orig_java_class);
        var new_javs = path.join(pkgDir, orig_java_class);
        var javs_contents = fs.readFileSync(orig_javs, 'utf-8');
        javs_contents = javs_contents.replace(/package [\w\.]*;/, 'package ' + pkg + ';');
        fs.writeFileSync(new_javs, javs_contents, 'utf-8');

        // Update whitelist by changing res/xml/config.xml
        var android_cfg_xml = new config_parser(this.android_config);
        // clean out all existing access elements first
        android_cfg_xml.access.remove();
        // add only the ones specified in the www/config.xml file
        config.access.get().forEach(function(uri) {
            android_cfg_xml.access.add(uri);
        });
    },

    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.path, 'assets', 'www');
    },

    update_www:function() {
        var projectRoot = util.isCordova(process.cwd());
        var www = path.join(projectRoot, 'www');
        var platformWww = path.join(this.path, 'assets');
        shell.cp('-rf', www, platformWww);
        var jsPath = path.join(__dirname, '..', '..', 'lib', 'android', 'framework', 'assets', 'js', 'cordova.android.js');
        fs.writeFileSync(path.join(platformWww, 'www', 'cordova.js'), fs.readFileSync(jsPath, 'utf-8'), 'utf-8');
    },
    update_project:function(cfg) {
        this.update_from_config(cfg);
        this.update_www();
    }
};

