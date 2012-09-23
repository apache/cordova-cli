var et = require('elementtree'),
    platforms = require('./../platforms'),
    fs = require('fs');

function config_parser(path) {
    this.path = path;
    this.doc = new et.ElementTree(et.XML(fs.readFileSync(path, 'utf-8')));
}

config_parser.prototype = {
    ls_platforms:function() {
        return this.doc.find('platforms').getchildren().map(function(p) {
            return p.attrib.name;
        });
    },
    add_platform:function(platform) {
        if ((platforms.indexOf(platform) == -1) || this.doc.find('platforms/platform[@name="' + platform + '"]')) return;
        else {
            var p = new et.Element('platform');
            p.attrib.name = platform;
            this.doc.find('platforms').append(p);
            this.update();
        }
    },
    remove_platform:function(platform) {
        if ((platforms.indexOf(platform) == -1) || !(this.doc.find('platforms/platform[@name="' + platform + '"]'))) return;
        else {
            var psEl = this.doc.find('platforms');
            var pEl = psEl.find('platform[@name="' + platform + '"]');
            psEl.remove(null, pEl);
            this.update();
        }
    },
    packageName:function(id) {
        if (id) {
            this.doc.getroot().attrib.id = id;
            this.update();
        } else return this.doc.getroot().attrib.id;
    },
    name:function(name) {
        if (name) {
            this.doc.find('name').text = name;
            this.update();
        } else return this.doc.find('name').text;
    },
    update:function() {
        fs.writeFileSync(this.path, this.doc.write({indent: 4}), 'utf-8');
    }
};

module.exports = config_parser;
