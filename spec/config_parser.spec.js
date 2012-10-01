var cordova = require('../cordova'),
    path = require('path'),
    fs = require('fs'),
    shell = require('shelljs'),
    config_parser = require('../src/config_parser'),
    tempDir = path.join(__dirname, '..', 'temp'),
    et = require('elementtree'),
    xml = path.join(tempDir, 'www', 'config.xml');

describe('config.xml parser', function () {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
        cordova.create(tempDir);
    });

    it('should create an instance based on an xml file', function() {
        var cfg;
        expect(function () {
            cfg = new config_parser(xml);
        }).not.toThrow();
        expect(cfg).toBeDefined();
        expect(cfg.doc).toBeDefined();
    });

    describe('package name / id', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        it('should get the packagename', function() {
            expect(cfg.packageName()).toEqual('io.cordova.hello-cordova');
        });
        it('should allow setting the packagename', function() {
            cfg.packageName('this.is.bat.country');
            expect(cfg.packageName()).toEqual('this.is.bat.country');
        });
        it('should write to disk after setting the packagename', function() {
            cfg.packageName('this.is.bat.country');
            expect(fs.readFileSync(xml, 'utf-8')).toMatch(/id="this\.is\.bat\.country"/);
        });
    });

    describe('app name', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        it('should get the app name', function() {
            expect(cfg.packageName()).toEqual('io.cordova.hello-cordova');
        });
        it('should allow setting the app name', function() {
            cfg.name('this.is.bat.country');
            expect(cfg.name()).toEqual('this.is.bat.country');
        });
        it('should write to disk after setting the name', function() {
            cfg.name('one toke over the line');
            expect(fs.readFileSync(xml, 'utf-8')).toMatch(/<name>one toke over the line<\/name>/);
        });
    });
});
