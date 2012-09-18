var cordova = require('../cordova'),
    wrench  = require('wrench'),
    mkdirp  = wrench.mkdirSyncRecursive,
    path    = require('path'),
    rmrf    = wrench.rmdirSyncRecursive,
    fs      = require('fs'),
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
        var dotc = path.join(tempDir, '.cordova');
        expect(fs.lstatSync(dotc).isFile()).toBe(true);
        expect(JSON.parse(fs.readFileSync(dotc, 'utf8')).name).toBe("Hello Cordova");
    });
    it('should throw if the directory is already a cordova project', function() {
        mkdirp(path.join(tempDir, '.cordova'));
        
        expect(function() {
            cordova.create(tempDir);
        }).toThrow();
    });
    it('should create a cordova project in the specified dir with specified name if provided', function() {
        cordova.create(tempDir, "balls");

        expect(fs.lstatSync(path.join(tempDir, '.cordova')).isFile()).toBe(true);

        expect(fs.readFileSync(path.join(tempDir, 'www', 'config.xml')).toString('utf8')).toMatch(/<name>balls<\/name>/);
    });
    it('should create a cordova project in the specified dir with specified name and id if provided', function() {
        cordova.create(tempDir, "birdy.nam.nam", "numnum");

        expect(fs.lstatSync(path.join(tempDir, '.cordova')).isFile()).toBe(true);

        var config = fs.readFileSync(path.join(tempDir, 'www', 'config.xml')).toString('utf8');
        expect(config).toMatch(/<name>numnum<\/name>/);
        expect(config).toMatch(/id="birdy\.nam\.nam"/);
    });
});
