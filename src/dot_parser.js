var fs = require('fs');

function dot_parser(path) {
    this.path = path;
    this.json = JSON.parse(fs.readFileSync(path, 'utf-8'));
}

dot_parser.prototype = {
    ls_platforms:function() {
        return this.json.platforms;
    },
    add_platform:function(platform) {
        if (this.json.platforms.indexOf(platform) > -1) return;
        else {
            this.json.platforms.push(platform);
            this.update();
        }
    },
    remove_platform:function(platform) {
        if (this.json.platforms.indexOf(platform) == -1) return;
        else {
            this.json.platforms.splice(this.json.platforms.indexOf(platform), 1);
            this.update();
        }
    },
    packageName:function(id) {
        if (id) {
            this.json.id = id;
            this.update();
        } else return this.json.id;
    },
    name:function(name) {
        if (name) {
            this.json.name = name;
            this.update();
        } else return this.json.name;
    },
    update:function() {
        fs.writeFileSync(this.path, JSON.stringify(this.json), 'utf-8');
    }
};

module.exports = dot_parser;
