var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp');

describe('create command', function () {
    beforeEach(function() {
        // Make a temp directory
        try { rmrf(tempDir); } catch(e) {}
        mkdirp(tempDir);
    });

    it('should print out help txt if no directory is provided', function() {
        var cwd = process.cwd();
        this.after(function() {
            process.chdir(cwd);
        });
        process.chdir(tempDir);
        expect(cordova.create()).toMatch(/synopsis/i);
    });
    it('should create a cordova project in the specified directory if parameter is provided', function() {
        cordova.create(tempDir);
        expect(fs.lstatSync(path.join(tempDir, '.cordova')).isDirectory()).toBe(true);
    });
    it('should warn if the directory is already a cordova project', function() {
        spyOn(console, 'error');

        var cb = jasmine.createSpy();

        mkdirp(path.join(tempDir, '.cordova'));

        cordova.create(tempDir);

        expect(console.error).toHaveBeenCalled();
    });
});
