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
    });

    describe('add', function() {
    });

    describe('remove', function() {
    });
});
