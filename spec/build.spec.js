var cordova = require('../cordova'),
    et = require('elementtree'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    config_parser = require('../src/config_parser'),
    android_parser = require('../src/metadata/android_parser'),
    ios_parser = require('../src/metadata/ios_parser'),
    blackberry_parser = require('../src/metadata/blackberry_parser'),
    fixtures = path.join(__dirname, 'fixtures'),
    hooks = path.join(fixtures, 'hooks'),
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

        cordova.create(tempDir);
        process.chdir(tempDir);
        cordova.platform('add', 'android', cb);

        var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
        expect(function() {
            cordova.build(buildcb);
        }).not.toThrow();
        expect(s).toHaveBeenCalled();
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
    describe('per platform', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
            shell.rm('-rf', tempDir);
        });
       
        describe('Android', function() {
            beforeEach(function() {
                cordova.platform('add', 'android');
            });

            it('should shell out to debug command on Android', function() {
                var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                cordova.build();
                expect(s.mostRecentCall.args[0].match(/android\/cordova\/debug > \/dev\/null$/)).not.toBeNull();
            });
            it('should call android_parser\'s update_project', function() {
                spyOn(require('shelljs'), 'exec').andReturn({code:0});
                var s = spyOn(android_parser.prototype, 'update_project');
                cordova.build();
                expect(s).toHaveBeenCalled();
            });
        });
        describe('iOS', function() {
            it('should shell out to debug command on iOS', function() {
                var cb = jasmine.createSpy();
                var buildcb = jasmine.createSpy();
                var s;

                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add ios callback');
                runs(function() {
                    s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                    cordova.build(buildcb);
                });
                waitsFor(function() { return buildcb.wasCalled; }, 'ios build');
                runs(function() {
                    expect(s).toHaveBeenCalled();
                    expect(s.mostRecentCall.args[0].match(/ios\/cordova\/debug > \/dev\/null$/)).not.toBeNull();
                });
            });
            it('should call ios_parser\'s update_project', function() {
                var s;
                var cb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios add platform');
                runs(function() {
                    s = spyOn(ios_parser.prototype, 'update_project');
                    cordova.build();
                    expect(s).toHaveBeenCalled();
                });
            });
        });
        describe('BlackBerry', function() {
            it('should shell out to ant command on blackberry-10', function() {
                var buildcb = jasmine.createSpy();
                var cb = jasmine.createSpy();
                var s;

                runs(function() {
                    var t = spyOn(require('prompt'), 'get').andReturn(true);
                    cordova.platform('add', 'blackberry-10', cb);
                    // Fake prompt invoking its callback
                    t.mostRecentCall.args[1](null, {});
                });
                waitsFor(function() { return cb.wasCalled; }, 'platform add blackberry callback');
                runs(function() {
                    s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
                    cordova.build(buildcb);
                });
                waitsFor(function() { return buildcb.wasCalled; }, 'build call', 20000);
                runs(function() {
                    expect(s).toHaveBeenCalled();
                    expect(s.mostRecentCall.args[0].match(/ant -f .*build\.xml qnx load-device/)).not.toBeNull();
                });
            });
            it('should call blackberry_parser\'s update_project', function() {
                var cb = jasmine.createSpy();
                fs.writeFileSync(path.join(tempDir, '.cordova', 'config.json'), JSON.stringify({
                    blackberry:{
                        qnx:{}
                    }
                }), 'utf-8');
                runs(function() {
                    cordova.platform('add', 'blackberry-10', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'bb add platform');
                runs(function() {
                    var s = spyOn(blackberry_parser.prototype, 'update_project');
                    cordova.build();
                    expect(s).toHaveBeenCalled();
                });
            });
        });
    });

    describe('specifying platforms to build', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
        });

        afterEach(function() {
            process.chdir(cwd);
            shell.rm('-rf', tempDir);
        });
        it('should only build the specified platform (array notation)', function() {
            var cb = jasmine.createSpy();
            var buildcb = jasmine.createSpy();
            var s;
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                s = spyOn(shell, 'exec').andReturn({code:0});
                cordova.build(['android'], buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'build android');
            runs(function() {
                expect(s.callCount).toEqual(1);
            });
        });
        it('should only build the specified platform (string notation)', function() {
            var cb = jasmine.createSpy();
            var buildcb = jasmine.createSpy();
            var s;
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                s = spyOn(shell, 'exec').andReturn({code:0});
                cordova.build('android', buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'build android');
            runs(function() {
                expect(s.callCount).toEqual(1);
            });
        });
        it('should handle multiple platforms to be built', function() {
            var cb = jasmine.createSpy();
            var bbcb = jasmine.createSpy();
            var buildcb = jasmine.createSpy();
            var s;
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                var g = spyOn(require('prompt'), 'get');
                cordova.platform('add', 'blackberry-10', bbcb);
                g.mostRecentCall.args[1](null, {}); // fake out prompt io
            });
            waitsFor(function() { return bbcb.wasCalled; }, 'platform add bb');
            runs(function() {
                s = spyOn(shell, 'exec').andReturn({code:0});
                cordova.build(['android','ios'], buildcb);
            });
            waitsFor(function() { return buildcb.wasCalled; }, 'build android+ios');
            runs(function() {
                expect(s.callCount).toEqual(2);
            });
        });
    });

    describe('hooks', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should delegate before hooks to the hooker module');
        it('should delegate after hooks to the hooker module');
    });
});
