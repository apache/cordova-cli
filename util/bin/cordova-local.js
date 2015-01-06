#! /usr/bin/env node

var path = require('path'),
    findup,
    nopt,
    shelljs;

function init() {
    try {
        findup-sync = require('findup-sync');
        shelljs = require('shelljs');
        nopt = require('nopt');
    } catch (e) {
        console.error(
            'Please run npm install from this directory:\n\t' +
            path.dirname(__dirname)
        );
        process.exit(2);
    }
};

var cordovapath;

var knownOpts =
    { 'inclglobal' : Boolean
    };

init();

var options = nopt(knownOpts, process.argv);

cordovapath = findup('node_modules/cordova/bin/cordova');
if (!cordovapath) {
    console.log('Could not find a local cordova install.');
    if (options.inclglobal) {
        console.log('Attempting to use a global installation.');
        cordovapath = 'cordova';
    }
}
var args = process.argv.slice(2).join(' ');
if (cordovapath) {
    shelljs.exec(cordovapath + ' ' + args);
}
