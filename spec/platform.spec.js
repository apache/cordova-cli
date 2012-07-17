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
        spyOn(console, 'error');
        spyOn(console, 'log');

        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);

        process.chdir(tempDir);

        cordova.platform();

        expect(console.log).toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });
    it('should not run outside of a Cordova-based project', function() {
        spyOn(console, 'error');
        spyOn(console, 'log');

        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        cordova.platform();

        expect(console.log).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    describe('ls', function() {
        var cwd = process.cwd();

        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should list out no platforms for a fresh project', function() {
            spyOn(console, 'error');
            spyOn(console, 'log');

            process.chdir(tempDir);
            cordova.platform('ls');

            expect(console.error).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('No platforms added. Use `cordova platforms add <platform>`.');
        });

        it('should list out added platforms in a project', function() {
            spyOn(console, 'error');
            spyOn(console, 'log');

            process.chdir(tempDir);
            cordova.platform('add', 'android');
            cordova.platform('ls');

            expect(console.error).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('android');
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
            spyOn(console, 'error');
            spyOn(console, 'log');

            process.chdir(tempDir);
            cordova.platform('add', 'android');
            cordova.platform('ls');

            expect(console.error).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('android');
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
            spyOn(console, 'error');
            spyOn(console, 'log');

            process.chdir(tempDir);
            cordova.platform('add', 'android');
            cordova.platform('remove', 'android');

            cordova.platform('ls');

            expect(console.error).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('No platforms added. Use `cordova platforms add <platform>`.');
        });
    });
});
