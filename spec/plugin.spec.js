var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp'),
    fixturesDir = path.join(__dirname, 'fixtures'),
    testPlugin = path.join(fixturesDir, 'plugins', 'test');

describe('plugin command', function() {
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
            cordova.plugin();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.plugin();
        }).toThrow();
    });

    describe('ls', function() {
        var cwd = process.cwd();

        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should list out no plugins for a fresh project', function() {
            process.chdir(tempDir);

            expect(cordova.plugin('ls')).toEqual('No plugins added. Use `cordova plugin add <plugin>`.');
        });

        it('should list out added plugins in a project', function() {
            var cb = jasmine.createSpy().andCallFake(function() {
                expect(cordova.plugin('ls')).toEqual('android');
            });

            process.chdir(tempDir);
            runs(function() {
                cordova.plugin('add', '', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "create callback", 17500);
        });
    });

    describe('add', function() {
        var cwd = process.cwd();

        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should add a supported platform', function() {
            var cb = jasmine.createSpy().andCallFake(function() {
                expect(cordova.platform('ls')).toEqual('android');
            });

            process.chdir(tempDir);
            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "create callback", 17500);
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
                expect(cordova.platform('ls')).toEqual('No platforms added. Use `cordova platform add <platform>`.');
            });

            process.chdir(tempDir);
            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "create callback", 17500);
        });
    });
});

