var fs   = require('fs'),
    path = require('path'),
    xcode = require('xcode'),
    util = require('../util'),
    shell = require('shelljs'),
    plist = require('plist'),
    et = require('elementtree'),
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
    this.config = new config_parser(path.join(this.cordovaproj, 'config.xml'));
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
        var info_contents = plist.build(infoPlist);
        info_contents = info_contents.replace(/<string>\s*<\/string>/,'<string></string>');
        fs.writeFileSync(plistFile, info_contents, 'utf-8');

        // Update whitelist
        var self = this;
        this.config.doc.findall('access').forEach(function(a) {
            self.config.doc.getroot().remove(0, a);
        });
        config.access.get().forEach(function(uri) {
            var el = new et.Element('access');
            el.attrib.origin = uri;
            self.config.doc.getroot().append(el);
        });
        this.config.update();
        
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

    // Returns the platform-specific www directory.
    www_dir:function() {
        return path.join(this.path, 'www');
    },

    update_www:function() {
        var projectRoot = util.isCordova(process.cwd());
        var www = path.join(projectRoot, 'www');
        shell.cp('-rf', www, this.path);
        //shell.cp('-f', path.join(www, 'config.xml'), path.join(this.cordovaproj, 'config.xml'));
        var project_www = path.join(this.path, 'www');
        var js = fs.readdirSync(project_www).filter(function(e) { return e.match(/\.js$/i); })[0];
        shell.mv('-f', path.join(project_www, js), path.join(project_www, 'cordova.js'));
    },
    update_project:function(cfg, callback) {
        var self = this;
        this.update_from_config(cfg, function() {
            self.update_www();
            if (callback) callback();
        });
    }
};
