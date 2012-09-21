var fs   = require('fs'),
    path = require('path'),
    xcode = require('node-xcode'),
    asyncblock = require('asyncblock'),
    config_parser = require('../config_parser');

module.exports = function ios_parser(project) {
    try {
        this.xcodeproj = fs.readdirSync(project).filter(function(e) { return e.match(/\.xcodeproj$/i); })[0];
    } catch(e) {
        throw 'The provided path is not a Cordova iOS project.';
    }
    this.path = project;
    this.pbxproj = path.join(this.xcodeproj, 'project.pbxproj');
};

module.exports.prototype = {
    update_from_config:function(config) {
        if (config instanceof config_parser) {
        } else throw 'update_from_config requires a config_parser object';

        var name = config.name();

        var proj = new xcode(this.pbxproj);
        asyncblock(function(flow) {
            proj.parse(flow.set({
                key:'parse',
                firstArgIsError:false,
                responseFormat:['err','hash']
            }));
            var parse = flow.get('parse');
            if (parse.err) throw 'An error occured during parsing of project.pbxproj. Start weeping.';
            else {
                proj.updateProductName(name);
                fs.writeFileSync(this.pbxproj, proj.writeSync(), 'utf-8');
            }
        });
    }
};
