var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp');

var cwd = process.cwd();

describe('platform command', function() {
    beforeEach(function() {
        // Make a temp directory
        try { rmrf(tempDir); } catch(e) {}
        mkdirp(tempDir);
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

    describe('`ls`', function() {
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
            var cbtwo = jasmine.createSpy();
            var cb = jasmine.createSpy();

            process.chdir(tempDir);
            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "create callback");
            runs(function() {
                expect(cordova.platform('ls')).toEqual('android');
                cordova.platform('add', 'ios', cbtwo);
            });
            waitsFor(function() { return cbtwo.wasCalled; }, "create callback number two");
            runs(function() {
                expect(cordova.platform('ls')).toEqual('android\nios');
            });
        });
    });

    describe('`add`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        describe('without any libraries cloned', function() {
            it('should clone down and checkout the correct android library');
            it('should clone down and checkout the correct ios library');
            it('should add a basic android project');
            it('should add a basic ios project');
        });

        describe('android', function() {
            it('should add a basic android project', function() {
                var cb = jasmine.createSpy();

                process.chdir(tempDir);
                runs(function() {
                    cordova.platform('add', 'android', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add android callback");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'android', 'AndroidManifest.xml'))).toBe(true);
                });
            });
        });

        describe('ios', function() {
            it('should add a basic ios project', function() {
                var cb = jasmine.createSpy();

                process.chdir(tempDir);
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add ios callback");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'ios', 'www'))).toBe(true);
                });
            });
        });
    });

    describe('remove', function() {
        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should remove a supported and added platform', function() {
            var cb = jasmine.createSpy();
            var cbone = jasmine.createSpy();

            process.chdir(tempDir);
            runs(function() {
                cordova.platform('add', 'ios', cbone);
            });
            waitsFor(function() { return cbone.wasCalled; }, "ios create callback");
            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "android create callback");
            runs(function() {
                cordova.platform('remove', 'android');
                expect(cordova.platform('ls')).toEqual('ios');
            });
        });
    });
});
