var cordova = require('../cordova'),
    et = require('elementtree'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    config_parser = require('../src/config_parser'),
    tempDir = path.join(__dirname, '..', 'temp');

var cwd = process.cwd();

describe('build command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
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
            var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
            expect(function() {
                cordova.build(buildcb);
            }).not.toThrow();
            expect(s).toHaveBeenCalled();
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
    describe('binary creation', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });
        it('should shell out to debug command on Android', function() {
            var buildcb = jasmine.createSpy();
            var cb = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add android callback');

            runs(function() {
                var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                cordova.build(buildcb);
                expect(s.mostRecentCall.args[0].match(/android\/cordova\/debug > \/dev\/null$/)).not.toBeNull();
            });
        });
        it('should shelll out to debug command on iOS', function() {
            var buildcb = jasmine.createSpy();
            var cb = jasmine.createSpy();
            var s;

            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios callback');
            runs(function() {
                s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                cordova.build(buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);
            runs(function() {
                expect(s).toHaveBeenCalled();
                expect(s.mostRecentCall.args[0].match(/ios\/cordova\/debug > \/dev\/null$/)).not.toBeNull();
            });
        });
    });

    describe('before each run it should interpolate config.xml app metadata', function() {
        var cfg;
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        describe('into Android builds', function() {
            it('should interpolate app name', function () {
                var buildcb = jasmine.createSpy();
                var cb = jasmine.createSpy();
                var newName = "devil ether", s;

                runs(function() {
                    cordova.platform('add', 'android', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add android callback');

                runs(function() {
                    // intercept call to ./cordova/debug to speed things up
                    s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                    cfg = new config_parser(path.join(tempDir, 'www', 'config.xml'));
                    cfg.name(newName); // set a new name in the config.xml
                    cordova.build(buildcb);
                });
                waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);

                runs(function() {
                    var strings = path.join(tempDir, 'platforms', 'android', 'res', 'values', 'strings.xml');
                    var doc = new et.ElementTree(et.XML(fs.readFileSync(strings, 'utf-8')));
                    expect(doc.find('string[@name="app_name"]').text).toBe('devil ether');
                });
            });
            it('should interpolate package name');
        });
        describe('into iOS builds', function() {
            it('should interpolate app name', function() {
                var buildcb = jasmine.createSpy();
                var cb = jasmine.createSpy();
                var newName = "i keep getting older, they stay the same age", s;

                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add ios callback');

                runs(function() {
                    // intercept call to ./cordova/debug to speed things up
                    s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                    cfg = new config_parser(path.join(tempDir, 'www', 'config.xml'));
                    cfg.name(newName); // set a new name in the config.xml
                    cordova.build(buildcb);
                });
                waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);

                runs(function() {
                    var pbxproj = path.join(tempDir, 'platforms', 'ios', 'Hello_Cordova.xcodeproj', 'project.pbxproj');
                    expect(fs.readFileSync(pbxproj, 'utf-8').match(/PRODUCT_NAME\s*=\s*"i keep getting older, they stay the same age"/)).not.toBeNull();
                });
            });
            it('should interpolate package name');
        });
    });
});
