var android_parser = require('../../src/metadata/android_parser'),
    config_parser = require('../../src/config_parser'),
    path = require('path'),
    fs = require('fs'),
    et = require('elementtree'),
    cfg_path = path.join(__dirname, '..', 'fixtures', 'projects', 'test', 'www', 'config.xml'),
    android_path = path.join(__dirname, '..', 'fixtures', 'projects', 'native', 'android'),
    android_strings = path.join(android_path, 'res', 'values', 'strings.xml');

var cwd = process.cwd();

var original_strings = fs.readFileSync(android_strings, 'utf-8');

describe('android project parser', function() {
    it('should throw an exception with a path that is not a native android project', function() {
        expect(function() {
            var project = new android_parser(cwd);
        }).toThrow();
    });
    it('should accept a proper native android project path as construction parameter', function() {
        var project;
        expect(function() {
            project = new android_parser(android_path);
        }).not.toThrow();
        expect(project).toBeDefined();
    });

    describe('update_from_config method', function() {
        var project, config;

        beforeEach(function() {
            project = new android_parser(android_path);
            config = new config_parser(cfg_path);
        });
        afterEach(function() {
            fs.writeFileSync(android_strings, original_strings, 'utf-8');
        });
        it('should throw an exception if a non config_parser object is passed into it', function() {
            expect(function() {
                project.update_from_config({});
            }).toThrow();
        });
        it('should update the application name properly', function() {
            config.name('bond. james bond.');
            project.update_from_config(config);

            var strings = new et.ElementTree(et.XML(fs.readFileSync(android_strings, 'utf-8')));
            var app_name = strings.find('string[@name="app_name"]').text;

            expect(app_name).toBe('bond. james bond.');
        });
        it('should update the application package name properly');
    });
});
