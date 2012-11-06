var et = require('elementtree'),
    fs = require('fs');

function config_parser(path) {
    this.path = path;
    this.doc = new et.ElementTree(et.XML(fs.readFileSync(path, 'utf-8')));
    this.access = new access(this);
}

config_parser.prototype = {
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

function access(cfg) {
    this.config = cfg;
};

access.prototype = {
    add:function(uri) {
        var el = new et.Element('access');
        el.attrib.origin = uri;
        this.config.doc.getroot().append(el);
        this.config.update();
    },
    remove:function(uri) {
        var self = this;
        var els = [];
        if (uri) els = this.config.doc.findall('access[@origin="' + uri + '"]');
        else els = this.config.doc.findall('access');
        els.forEach(function(a) {
            self.config.doc.getroot().remove(0, a);
        });
        this.config.update();
    },
    get:function() {
        return this.config.doc.findall('access').map(function(a) { return a.attrib.origin; });
    }
};

module.exports = config_parser;
