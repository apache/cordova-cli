var platform = require('./src/platform'),
    n = require('ncallbacks'),
    path = require('path'),
    shell = require('shelljs'),
    platforms = require('./platforms');

var specs = [];
var supported = [];

// stupid bs, jasmine-node cant accept multiple directories /facepalm
var tmp = path.join(__dirname, 'spec_tmp');
shell.rm('-rf', tmp);
shell.mkdir('-p', path.join(tmp, 'platform-script'));
shell.cp('-r', path.join(__dirname, 'spec', 'fixtures'), tmp);

var end = n(platforms.length, function() {
    console.log('Testing core cli and following platforms: ' + supported.join(', '));
    var cmd = path.join(__dirname, 'node_modules', 'jasmine-node', 'bin', 'jasmine-node') + ' --color ' + tmp;
    specs.forEach(function(s) { 
        var p = path.join(__dirname, s);
        shell.cp('-r', p, path.join(tmp, 'platform-script'));
    });
    shell.cp('-r', path.join(__dirname, 'spec', 'cordova-cli'), tmp);
    shell.exec(cmd, {async:true, silent:false}, function(code, output) {
    });
});
console.log('Determining which platforms to run tests for...');
platforms.forEach(function(p) {
    platform.supports(p, function(e) {
        if (e) {
        } else {
            specs.push('spec/platform-script/' + p);
            supported.push(p);
        }
        end();
    });
});
