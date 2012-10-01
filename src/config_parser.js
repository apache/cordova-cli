var et = require('elementtree'),
    fs = require('fs');

function config_parser(path) {
    this.path = path;
    this.doc = new et.ElementTree(et.XML(fs.readFileSync(path, 'utf-8')));
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

module.exports = config_parser;
