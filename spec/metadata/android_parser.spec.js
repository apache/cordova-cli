var android_parser = require('../../src/metadata/android_parser'),
    config_parser = require('../../src/config_parser'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    et = require('elementtree'),
    cfg_path = path.join(__dirname, '..', 'fixtures', 'projects', 'test', 'www', 'config.xml'),
    android_path = path.join(__dirname, '..', 'fixtures', 'projects', 'native', 'android'),
    android_strings = path.join(android_path, 'res', 'values', 'strings.xml'),
    tempDir = path.join(__dirname, '..', '..', 'temp'),
    cordova = require('../../cordova');

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

    describe('update_www method', function() {
        var parser, android_platform;

        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
            android_platform = path.join(tempDir, 'platforms', 'android');
            parser = new android_parser(android_platform);
        });
        afterEach(function() {
            process.chdir(cwd);
        });

        it('should update all www assets', function() {
            var newFile = path.join(tempDir, 'www', 'somescript.js');
            fs.writeFileSync(newFile, 'alert("sup");', 'utf-8');
            parser.update_www();
            expect(fs.existsSync(path.join(android_platform, 'assets', 'www', 'somescript.js'))).toBe(true);
        });
        it('should write out android js to cordova.js', function() {
            parser.update_www();
            expect(fs.readFileSync(path.join(android_platform, 'assets', 'www', 'cordova.js'),'utf-8')).toBe(fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'android', 'framework', 'assets', 'js', 'cordova.android.js'), 'utf-8'));
        });
    });

    describe('update_project method', function() {
        var parser, android_platform, cfg;

        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
            android_platform = path.join(tempDir, 'platforms', 'android');
            parser = new android_parser(android_platform);
            cfg = new config_parser(cfg_path);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should invoke update_www', function() {
            var spyWww = spyOn(parser, 'update_www');
            parser.update_project(cfg);
            expect(spyWww).toHaveBeenCalled();
        });
        it('should invoke update_from_config', function() {
            var spyConfig = spyOn(parser, 'update_from_config');
            parser.update_project(cfg);
            expect(spyConfig).toHaveBeenCalled();
        });
    });
});
