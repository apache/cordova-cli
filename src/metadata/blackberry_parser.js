var fs   = require('fs'),
    path = require('path'),
    et = require('elementtree'),
    config_parser = require('../config_parser');

module.exports = function blackberry_parser(project) {
    if (!fs.existsSync(path.join(project, 'project.properties')) || !fs.existsSync(path.join(project, 'build.xml'))) {
        throw 'The provided path is not a Cordova BlackBerry WebWorks project.';
    }
    this.path = project;
    this.xml = new config_parser(path.join(this.path, 'www', 'config.xml'));
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw 'update_from_config requires a config_parser object';

        this.xml.name(config.name());
    }
};
