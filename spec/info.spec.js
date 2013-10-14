var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    util = require('../src/util');

var cwd = process.cwd();
var project_dir = path.join('spec','fixtures', 'projects', 'cordova');

describe('info flag', function(){
    var is_cordova,
        writeFileSync,
        shellSpy,
        exec = {},
        done = false;

    function infoPromise( f ) {
        f.then( function() { done = true; }, function(err) { done = err; } );
    }

    beforeEach(function() {
        is_cordova = spyOn(util, 'isCordova').andReturn(project_dir);
        writeFileSync = spyOn( fs, 'writeFileSync' );
        shellSpy = spyOn( shell, 'exec' ).andReturn( "" );
        done = false;
    });

    it('should not run outside of a Cordova-based project by calling util.isCordova', function() {
        is_cordova.andReturn(false);
        runs(function() {
            infoPromise( cordova.info() );
        });
        waitsFor(function() { return done; }, 'platform promise never resolved', 500);
        runs(function() {
            expect( done ).toEqual( new Error( 'Current working directory is not a Cordova-based project.' ) );
        });
    });

    it('should run inside a Cordova-based project by calling util.isCordova', function() {
        runs(function() {
            infoPromise( cordova.info() );
        });
        waitsFor(function() { return done; }, 'platform promise never resolved', 500);
        runs(function() {
            expect( done ).toBe( true );
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
