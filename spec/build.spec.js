var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp');

var cwd = process.cwd();

describe('build command', function() {
    beforeEach(function() {
        // Make a temp directory
        try { rmrf(tempDir); } catch(e) {}
        mkdirp(tempDir);
    });

    it('should not run inside a Cordova-based project with no added platforms', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);
        process.chdir(tempDir);
        expect(function() {
            cordova.build();
        }).toThrow();
    });
    
    it('should run inside a Cordova-based project with at least one added platform', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        var buildcb = jasmine.createSpy();
        var cb = jasmine.createSpy();

        runs(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android', cb);
        });
        waitsFor(function() { return cb.wasCalled; }, 'platform add android callback');

        runs(function() {
            expect(function() {
                cordova.build(buildcb);
            }).not.toThrow();
        });
        waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);
    });
    
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.build();
        }).toThrow();
    });
    describe('should shell out to the debug command and create a binary', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });
        it('on Android', function() {
            var buildcb = jasmine.createSpy();
            var cb = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add android callback');

            runs(function() {
                cordova.build(buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);
            runs(function() {
                var binaryPath = path.join(tempDir, 'platforms','android','bin');
                // Check that "bin" dir of android native proj has at
                // least one file ennding in ".apk"
                expect(fs.readdirSync(binaryPath)
                  .filter(function(e) {
                    return e.indexOf('.apk', e.length - 4) !== -1;
                  }).length > 0).toBe(true);
            });
        });
        it('on iOS', function() {
            var buildcb = jasmine.createSpy();
            var cb = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios callback');
            runs(function() {
                cordova.build(buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);
            runs(function() {
                var binaryPath = path.join(tempDir, 'platforms','ios','build');
                expect(fs.existsSync(binaryPath)).toBe(true);

                var appPath = path.join(binaryPath,"Hello_Cordova.app");
                expect(fs.existsSync(appPath)).toBe(true);
            });
        });
    });

    describe('should interpolate config.xml app metadata', function() {
        describe('into Android builds', function() {
          it('should interpolate app name');
        });
        describe('into iOS builds', function() {
          it('should interpolate app name');
        });
    });
});
