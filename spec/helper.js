// Override exec for certain commands, to speed execution of tests.
var _exec = require('child_process').exec;

require('child_process').exec = function(cmd, cb){
    var space = cmd.indexOf(' ');
    // Just invoke callback for create calls
    if (Array.prototype.slice.call(cmd, space-6, space).join('') == 'create') {
        cb();
    } else {
        _exec(cmd, cb);
    }
};
