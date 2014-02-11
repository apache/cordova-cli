
var cli = require('../cordova'),
    nopt = require('nopt'),
    plugman = require('plugman');

var known_opts = {
    'verbose' : Boolean,
    'debug' : Number
}, shortHands = { 'd' : ['--debug'] };

var opt = nopt(known_opts, shortHands);
var mapNames = {
    'verbose' : 7,
    'info'    : 6,
    'notice'  : 5,
    'warn'    : 4,
    'error'   : 3
}

if(opt.verbose)
    opt.debug = 7;

if(opt.debug) {
    for(var i in mapNames) {
        if(mapNames[i] <= opt.debug) {
            cli.on(i, console.log);
            plugman.on(i, console.log);
        }
    }

    if(opt.debug >= 6) {
        cli.on('log', console.log);
        plugman.on('log', console.log);
    }
}

module.exports = {};
