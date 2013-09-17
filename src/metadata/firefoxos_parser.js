var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var util = require('../util');
var config_parser = require('../config_parser');
var config = require('../config');

module.exports = function firefoxos_parser(project) {
    this.path = project;
};

module.exports.check_requirements = function(project_root, callback) {
    callback(false);
};

module.exports.prototype = {
    update_from_config: function(config, callback) {
        if (!(config instanceof config_parser)) {
            var err = new Error('update_from_config requires a config_parser object');
            if (callback) {
                callback(err);
                return;
            }
            else {
                throw err;
            }
        }

        var name = config.name();
        var pkg = config.packageName();
        var version = config.version();

        var manifestPath = path.join(this.www_dir(), 'manifest.webapp');
        var manifest;

        if(fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath));
        }
        else {
            manifest = {
                launch_path: "/index.html",
                installs_allowed_from: ["*"]
            };
        }

        manifest.version = version;
        manifest.name = name;
        manifest.pkgName = pkg;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest));

        if(callback) {
            callback();
        }
    },

    www_dir: function() {
        return path.join(this.path, 'www');
    },

    staging_dir: function() {
        return path.join(this.path, '.staging', 'www');
    },

    update_www: function() {
        var projectRoot = util.isCordova(this.path);
        var projectWww = util.projectWww(projectRoot);
        var platformWww = this.www_dir();

        shell.rm('-rf', platformWww);
        shell.cp('-rf', projectWww, this.path);

        var customPath = config.has_custom_path(projectRoot, 'firefoxos');
        var libPath = (customPath ?
                       customPath :
                       path.join(util.libDirectory, 'firefoxos', 'cordova',
                                 require('../../platforms').ios.version));
        shell.cp('-f',
                 path.join(libPath, 'cordova-lib', 'cordova.js'),
                 path.join(platformWww, 'cordova.js'));
    },

    update_overrides: function() {
        var projectRoot = util.isCordova(this.path);
        var mergesPath = path.join(util.appDir(projectRoot), 'merges', 'firefoxos');
        if(fs.existsSync(mergesPath)) {
            var overrides = path.join(mergesPath, '*');
            shell.cp('-rf', overrides, this.www_dir());
        }
    },

    update_staging: function() {
        var projectRoot = util.isCordova(this.path);
        var stagingDir = this.staging_dir();

        if(fs.existsSync(stagingDir)) {
            shell.cp('-rf',
                     path.join(stagingDir, '*'),
                     this.www_dir());
        }
    },

    update_project: function(cfg, callback) {
        this.update_www();

        this.update_from_config(cfg, function(err) {
            if(err) {
                if(callback) {
                    callback(err);
                }
                else {
                    throw err;
                }
            } else {
                this.update_overrides();
                this.update_staging();
                util.deleteSvnFolders(this.www_dir());

                if(callback) {
                    callback();
                }
            }
        }.bind(this));
    }
};
