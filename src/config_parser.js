var et = require('elementtree'),
    platforms = require('./../platforms'),
    fs = require('fs');

function config_parser(xmlPath) {
    this.path = xmlPath;
    this.doc = new et.ElementTree(et.XML(fs.readFileSync(xmlPath, 'utf-8')));
}

config_parser.prototype = {
    ls_platforms:function() {
        return this.doc.find('platforms').getchildren().map(function(p) {
            return p.attrib['name'];
        });
    },
    add_platform:function(platform) {
        if ((platforms.indexOf(platform) == -1) || this.doc.find('platforms/platform[@name="' + platform + '"]')) return;
        else {
            var p = new et.Element('platform');
            p.attrib['name'] = platform;
            this.doc.find('platforms').append(p);
            fs.writeFileSync(this.path, this.doc.write(), 'utf-8');
        }
    },
    remove_platform:function(platform) {
        if ((platforms.indexOf(platform) == -1) || !(this.doc.find('platforms/platform[@name="' + platform + '"]'))) return;
        else {
            var psEl = this.doc.find('platforms');
            var pEl = psEl.find('platform[@name="' + platform + '"]');
            psEl.remove(null, pEl);
            fs.writeFileSync(this.path, this.doc.write(), 'utf-8');
        }
    },
    packageName:function() {
        return this.doc.getroot().attrib.id;
    },
    name:function() {
        return this.doc.find('name').text;
    }
};

module.exports = config_parser;
