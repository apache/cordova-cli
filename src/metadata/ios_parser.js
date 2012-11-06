var fs   = require('fs'),
    path = require('path'),
    xcode = require('xcode'),
    util = require('../util'),
    shell = require('shelljs'),
    plist = require('plist'),
    config_parser = require('../config_parser');

module.exports = function ios_parser(project) {
    try {
        var xcodeproj_dir = fs.readdirSync(project).filter(function(e) { return e.match(/\.xcodeproj$/i); })[0];
        if (!xcodeproj_dir) throw 'The provided path is not a Cordova iOS project.';
        this.xcodeproj = path.join(project, xcodeproj_dir);
        this.originalName = this.xcodeproj.substring(this.xcodeproj.lastIndexOf('/'), this.xcodeproj.indexOf('.xcodeproj'));
        this.cordovaproj = path.join(project, this.originalName);
    } catch(e) {
        throw 'The provided path is not a Cordova iOS project.';
    }
    this.path = project;
    this.pbxproj = path.join(this.xcodeproj, 'project.pbxproj');
};
module.exports.prototype = {
    update_from_config:function(config, callback) {
        if (config instanceof config_parser) {
        } else throw 'update_from_config requires a config_parser object';

        var name = config.name();
        var pkg = config.packageName();

        // Update package id (bundle id)
        var plistFile = path.join(this.cordovaproj, this.originalName + '-Info.plist');
        var infoPlist = plist.parseFileSync(plistFile);
        infoPlist['CFBundleIdentifier'] = pkg;
        fs.writeFileSync(plistFile, plist.build(infoPlist), 'utf-8');

        // Update whitelist
        var cordovaPlist = path.join(this.cordovaproj, 'Cordova.plist');
        var contents = plist.parseFileSync(cordovaPlist);
        var whitelist = config.access.get();
        contents['ExternalHosts'] = whitelist;
        fs.writeFileSync(cordovaPlist, plist.build(contents), 'utf-8');

        // Update product name
        var proj = new xcode.project(this.pbxproj);
        var parser = this;
        proj.parse(function(err,hash) {
            if (err) throw 'An error occured during parsing of project.pbxproj. Start weeping.';
            else {
                proj.updateProductName(name);
                fs.writeFileSync(parser.pbxproj, proj.writeSync(), 'utf-8');
                if (callback) callback();
            }
        });
    },
    update_www:function() {
        var projectRoot = util.isCordova(process.cwd());
        var www = path.join(projectRoot, 'www');
        shell.cp('-rf', www, this.path);
        var jsPath = path.join(__dirname, '..', '..', 'lib', 'ios', 'bin', 'templates', 'project', 'www', 'cordova-2.2.0.js');
        fs.writeFileSync(path.join(this.path, 'www', 'cordova.js'), fs.readFileSync(jsPath, 'utf-8'), 'utf-8');
    },
    update_project:function(cfg, callback) {
        var self = this;
        this.update_from_config(cfg, function() {
            self.update_www();
            if (callback) callback();
        });
    }
};
