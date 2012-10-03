var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    et = require('elementtree'),
    config_parser = require('../src/config_parser'),
    helper = require('./helper'),
    util = require('../src/util'),
    platforms = require('../platforms'),
    tempDir = path.join(__dirname, '..', 'temp');

// globals for crazy spy hax
android_parser = require('../src/metadata/android_parser');
ios_parser = require('../src/metadata/ios_parser');
blackberry_parser = require('../src/metadata/blackberry_parser');

var cwd = process.cwd();

describe('platform command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });
    it('should run inside a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).toThrow();
    });

    var listing_tests = function(_invocation) {
        return function() {
            beforeEach(function() {
                cordova.create(tempDir);
                process.chdir(tempDir);
            });

            afterEach(function() {
                process.chdir(cwd);
            });

            it('should list out no platforms for a fresh project', function() {
                expect(cordova.platform(_invocation).length).toEqual(0);
            });

            it('should list out added platforms in a project', function() {
                var cbtwo = jasmine.createSpy();
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', 'android', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "create callback");
                runs(function() {
                    expect(cordova.platform(_invocation)[0]).toEqual('android');
                    cordova.platform('add', 'ios', cbtwo);
                });
                waitsFor(function() { return cbtwo.wasCalled; }, "create callback number two");
                runs(function() {
                    expect(cordova.platform(_invocation)[1]).toEqual('ios');
                });
            });
        };
    };
    describe('`ls`', listing_tests('ls'));
    describe('`list`', listing_tests('list'));

    describe('`add`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        describe('without any libraries cloned', function() {
            var lib = path.join(__dirname, '..', 'lib');
            var libs = fs.readdirSync(lib);
            
            beforeEach(function() {
                libs.forEach(function(p) {
                    var s = path.join(lib, p);
                    var d = path.join(lib, p + '-bkup');
                    shell.mv(s, d);
                });
            });
            afterEach(function() {
                libs.forEach(function(p) {
                    var s = path.join(lib, p + '-bkup');
                    var d = path.join(lib, p);
                    shell.mv(s, d);
                });
            });
            it('should clone down the android library and checkout appropriate tag', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0});
                try {
                    cordova.platform('add', 'android', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0].match(/^git clone.*cordova-android/)).not.toBeNull();
                expect(s.calls[1].args[0].match(/git checkout 47daaaf/)).not.toBeNull();
            });
            it('should clone down the ios library and checkout appropriate tag', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0});

                try {
                    cordova.platform('add', 'ios', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0].match(/^git clone.*cordova-ios/)).not.toBeNull();
                expect(s.calls[1].args[0].match(/git checkout 2.1.0/)).not.toBeNull();
            });
            it('should clone down the blackberry library and checkout appropriate tag', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0});

                try {
                    cordova.platform('add', 'blackberry', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0].match(/^git clone.*cordova-blackberry/)).not.toBeNull();
                expect(s.calls[1].args[0].match(/git checkout 2.1.0/)).not.toBeNull();
            });
            it('should add a basic android project');
            it('should add a basic ios project');
            it('should add a basic blackberry project');
        });

        describe('android', function() {
            it('should add a basic android project', function() {
                cordova.platform('add', 'android');
                expect(fs.existsSync(path.join(tempDir, 'platforms', 'android', 'AndroidManifest.xml'))).toBe(true);
            });
            it('should call android_parser\'s update_project', function() {
                var s = spyOn(android_parser.prototype, 'update_project');
                cordova.platform('add', 'android');
                expect(s).toHaveBeenCalled();
            });
        });
        describe('ios', function() {
            it('should add a basic ios project', function() {
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add ios callback");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'ios', 'www'))).toBe(true);
                });
            });
            it('should call ios_parser\'s update_project', function() {
                var s = spyOn(ios_parser.prototype, 'update_project');
                cordova.platform('add', 'ios');
                expect(s).toHaveBeenCalled();
            });
        });
        describe('blackberry-10', function() {
            it('should add a basic blackberry project', function() {
                var cb = jasmine.createSpy();
                var s = spyOn(require('prompt'), 'get').andReturn(true);

                runs(function() {
                    cordova.platform('add', 'blackberry-10', cb);
                    s.mostRecentCall.args[1](null, {}); // fake out prompt
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add blackberry");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'blackberry-10', 'www'))).toBe(true);
                });
            });
            it('should call blackberry_parser\'s update_project', function() {
                var s = spyOn(blackberry_parser.prototype, 'update_project');
                cordova.platform('add', 'blackberry-10');
                expect(s).toHaveBeenCalled();
            });
        });
    });

    var removing_tests = function(_invocation) {
        return function() {
            beforeEach(function() {
                cordova.create(tempDir);
                process.chdir(tempDir);
            });

            afterEach(function() {
                process.chdir(cwd);
            });

            it('should remove a supported and added platform', function() {
                var cb = jasmine.createSpy();
                var cbone = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', 'ios', cbone);
                });
                waitsFor(function() { return cbone.wasCalled; }, "ios create callback");
                runs(function() {
                    cordova.platform('add', 'android', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "android create callback");
                runs(function() {
                    cordova.platform(_invocation, 'android');
                    expect(cordova.platform('ls').length).toEqual(1);
                    expect(cordova.platform('ls')[0]).toEqual('ios');
                });
            });
        };
    };
    describe('`rm`', removing_tests('rm'));
    describe('`remove`', removing_tests('remove'));
});
