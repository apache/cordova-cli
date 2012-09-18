var cordova = require('../cordova'),
    path = require('path'),
    fs = require('fs'),
    dot_parser = require('../src/dot_parser'),
    file = path.join(__dirname, 'fixtures', 'projects', 'test', '.cordova');

var original_dot = fs.readFileSync(file, 'utf-8');

describe('dot cordova file parser', function() {
    afterEach(function() {
        fs.writeFileSync(file, original_dot, 'utf-8');
    });

    it("should read a .cordova file", function() {
        var dot;
        expect(function() {
            dot = new dot_parser(file);
        }).not.toThrow();
        expect(dot).toBeDefined();
    });

    describe('get', function() {
        var dot;
        beforeEach(function() {
            dot = new dot_parser(file);
        });

        it("should be able to return app name", function() {
            expect(dot.name()).toBe("test");
        });
        it("should be able to return app id (or package)", function() {
            expect(dot.packageName()).toBe("org.apache.cordova");
        });
        it("should be able to return app platforms", function() {
            var ps = dot.ls_platforms();
            expect(ps[0]).toBe('android');
            expect(ps[1]).toBe('ios');
        });
    });
    describe('set', function() {
        var dot;
        beforeEach(function() {
            dot = new dot_parser(file);
        });

        it("should be able to write app name", function() {
            dot.name('new');
            expect(JSON.parse(fs.readFileSync(file, 'utf-8')).name).toBe('new');
        });
        it("should be able to write app id (or package)", function () {
            dot.packageName('ca.filmaj.app');
            expect(JSON.parse(fs.readFileSync(file, 'utf-8')).id).toBe('ca.filmaj.app');
        });
        it("should be able to add platforms", function() {
            dot.add_platform('blackberry');
            expect(JSON.parse(fs.readFileSync(file, 'utf-8')).platforms.length).toBe(3);
            expect(JSON.parse(fs.readFileSync(file, 'utf-8')).platforms[2]).toBe('blackberry');
        });
        it("should be able to remove platforms", function() {
            dot.remove_platform('ios');
            expect(JSON.parse(fs.readFileSync(file, 'utf-8')).platforms.length).toBe(1);
            expect(JSON.parse(fs.readFileSync(file, 'utf-8')).platforms[0]).toBe('android');
        });
    });
});
