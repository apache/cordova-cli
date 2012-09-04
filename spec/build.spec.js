var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp');

describe('build command', function() {
    beforeEach(function() {
        // Make a temp directory
        try { rmrf(tempDir); } catch(e) {}
        mkdirp(tempDir);
    });

    it('should not run inside a Cordova-based project with no added platforms', function() {
        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);
        process.chdir(tempDir);
        expect(function() {
            cordova.build();
        }).toThrow();
    });
    /*
    it('should run inside a Cordova-based project with at least one added platform', function() {
        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });

        var buildcb = jasmine.createSpy();
        var cb = jasmine.createSpy().andCallFake(function() {
            runs(function() {
                expect(function() {
                    console.log('running build');
                    cordova.build(buildcb);
                }).not.toThrow();
            });
            waitsFor(function() { return buildcb.wasCalled; });
        });

        runs(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android', cb);
        });
        waitsFor(function() { return cb.wasCalled; }, 'platform add android callback');
    });
    
    it('should not run outside of a Cordova-based project', function() {
        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.build();
        }).toThrow();
    });
    it('should shell out to the debug command for each platform', function() {
        // TODO how to test this?
    });

    describe('should interpolate config.xml', function() {
        describe('into Android builds', function() {
        });
        describe('into iOS builds', function() {
        });
    }); */
});
