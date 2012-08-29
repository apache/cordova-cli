var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp');

describe('platform command', function() {
    beforeEach(function() {
        // Make a temp directory
        try { rmrf(tempDir); } catch(e) {}
        mkdirp(tempDir);
    });

    it('should run inside a Cordova-based project', function() {
        var cwd = process.cwd();
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
        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).toThrow();
    });

    describe('`ls`', function() {
        var cwd = process.cwd();

        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should list out no platforms for a fresh project', function() {
            process.chdir(tempDir);

            expect(cordova.platform('ls')).toEqual('No platforms added. Use `cordova platform add <platform>`.');
        });

        it('should list out added platforms in a project', function() {
            var cb = jasmine.createSpy().andCallFake(function() {
                var cbtwo = jasmine.createSpy().andCallFake(function() {
                    expect(cordova.platform('ls')).toEqual('android\nios');
                });
                runs(function() {
                    expect(cordova.platform('ls')).toEqual('android');
                    cordova.platform('add', 'ios', cbtwo);
                });
                waitsFor(function() { return cbtwo.wasCalled; }, "create callback number two");
            });

            process.chdir(tempDir);
            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "create callback");
        });
    });

    describe('remove', function() {
        var cwd = process.cwd();

        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should remove a supported and added platform', function() {
            var cb = jasmine.createSpy().andCallFake(function() {
                cordova.platform('remove', 'android');
                expect(cordova.platform('ls')).toEqual('ios');
            });
            var cbone = jasmine.createSpy().andCallFake(function() {
                cordova.platform('add', 'android', cb);
                waitsFor(function() { return cb.wasCalled; }, "android create callback");
            });

            process.chdir(tempDir);
            runs(function() {
                cordova.platform('add', 'ios', cbone);
            });
            waitsFor(function() { return cbone.wasCalled; }, "ios create callback");
        });
    });
});
