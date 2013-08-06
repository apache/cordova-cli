var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    util = require('../src/util');

var cwd = process.cwd();
var project_dir = path.join('spec','fixtures', 'projects', 'cordova');

describe('info flag', function(){
    var is_cordova, exec = {};
    beforeEach(function() {
        is_cordova = spyOn(util, 'isCordova').andReturn(project_dir);
    });

    describe('failure', function() {
        it('should not run outside of a Cordova-based project by calling util.isCordova', function() {
            is_cordova.andReturn(false);
            expect(function() {
                cordova.info();
                expect(is_cordova).toHaveBeenCalled();
            }).toThrow('Current working directory is not a Cordova-based project.');
        });
    });

    describe('success', function() {
        it('should run inside a Cordova-based project by calling util.isCordova', function() {
            cordova.info();
            expect(is_cordova).toHaveBeenCalled();
        });
    });

    it('should emit a results event with info contents', function(done) {
        this.after(function() {
            cordova.removeAllListeners('results');
        });
        cordova.on('results', function(h) {
            expect(h).toMatch(/info/gi);
            done();
        });
        cordova.info();
    });
});
