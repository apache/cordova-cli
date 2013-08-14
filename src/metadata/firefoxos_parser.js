var path = require('path');

module.exports = function firefoxos_parser(project) {
    this.path = project;
};

module.exports.check_requirements = function(project_root, callback) {
    callback(false);
};

module.exports.prototype = {
    www_dir: function() {
        return path.join(this.path, 'www');
    },

    update_project: function(cfg, callback) {
        callback();
    }
};
