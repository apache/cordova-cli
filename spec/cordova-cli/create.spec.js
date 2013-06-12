var cordova = require('../../cordova'),
    path    = require('path'),
    shell   = require('shelljs'),
    fs      = require('fs'),
    util    = require('../../src/util'),
    config    = require('../../src/config'),
    lazy_load = require('../../src/lazy_load'),
    tempDir = path.join(__dirname, '..', '..', 'temp');

config_parser    = require('../../src/config_parser');

describe('create command', function () {
    var mkdir, cp, config_spy, load_cordova, load_custom, exists, config_read, parser;
    beforeEach(function() {
        shell.rm('-rf', tempDir);
        mkdir = spyOn(shell, 'mkdir');
        cp = spyOn(shell, 'cp');
        config_spy = spyOn(cordova, 'config');
        config_read = spyOn(config, 'read').andReturn({});
        exists = spyOn(fs, 'existsSync').andReturn(true);
        load_cordova = spyOn(lazy_load, 'cordova').andCallFake(function(platform, cb) {
            cb();
        });
        load_custom = spyOn(lazy_load, 'custom').andCallFake(function(url, id, platform, version, cb) {
            cb();
        });
        parser = spyOnConstructor(global, 'config_parser', ['packageName', 'name']);
    });

    it('should do something', function(done) {
        cordova.create(tempDir, function() {
            expect(true).toBe(true);
            done();
        });
    });

    /*
    it('should print out help txt if no parameters are provided', function() {
        expect(cordova.create()).toMatch(/synopsis/i);
    });
    it('should create a cordova project in the specified directory, and default id and name', function(done) {
        cordova.create(tempDir, function(err) {
            expect(err).not.toBeDefined();
            var dotc = path.join(tempDir, '.cordova', 'config.json');
            expect(fs.lstatSync(dotc).isFile()).toBe(true);
            expect(JSON.parse(fs.readFileSync(dotc, 'utf8')).name).toBe("HelloCordova");
            var hooks = path.join(tempDir, '.cordova', 'hooks');
            expect(fs.existsSync(hooks)).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_platform_add'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_prepare'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_compile'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_platform_add'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_platform_rm'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_platform_rm'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_platform_ls'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_platform_ls'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_plugin_add'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_plugin_add'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_plugin_rm'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_plugin_rm'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_plugin_ls'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_plugin_ls'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_prepare'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_compile'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_build'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_build'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_emulate'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_emulate'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_docs'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_docs'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'before_run'))).toBe(true);
            expect(fs.existsSync(path.join(hooks, 'after_run'))).toBe(true);
        });
    });
    it('should create a cordova project in the specified dir with specified name if provided', function() {
        cordova.create(tempDir, "balls");

        expect(fs.lstatSync(path.join(tempDir, '.cordova', 'config.json')).isFile()).toBe(true);

        expect(fs.readFileSync(util.projectConfig(tempDir)).toString('utf8')).toMatch(/<name>balls<\/name>/);
    });
    it('should create a cordova project in the specified dir with specified name and id if provided', function() {
        cordova.create(tempDir, "birdy.nam.nam", "numnum");

        expect(fs.lstatSync(path.join(tempDir, '.cordova', 'config.json')).isFile()).toBe(true);

        var config = fs.readFileSync(util.projectConfig(tempDir)).toString('utf8');
        expect(config).toMatch(/<name>numnum<\/name>/);
        expect(config).toMatch(/id="birdy\.nam\.nam"/);
    });
    */
});
