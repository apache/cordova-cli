var ios_parser = require('../../src/metadata/ios_parser'),
    config_parser = require('../../src/config_parser'),
    cordova = require('../../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    cfg_path = path.join(__dirname, '..', 'fixtures', 'projects', 'test', 'www', 'config.xml'),
    ios_path = path.join(__dirname, '..', 'fixtures', 'projects', 'native', 'ios'),
    tempDir = path.join(__dirname, '..', '..', 'temp'),
    ios_plist = path.join(ios_path, 'balls', 'balls-Info.plist'),
    ios_pbx = path.join(ios_path, 'balls.xcodeproj', 'project.pbxproj'),
    cordova_plist = path.join(ios_path, 'balls', 'Cordova.plist');

var cwd = process.cwd();

var original_pbx = fs.readFileSync(ios_pbx, 'utf-8');
var original_plist = fs.readFileSync(ios_plist, 'utf-8');
var original_config = fs.readFileSync(cfg_path, 'utf-8');
var orig_cordova = fs.readFileSync(cordova_plist, 'utf-8');

describe('ios project parser', function() {
    it('should throw an exception with a path that is not a native ios project', function() {
        expect(function() {
            var project = new ios_parser(cwd);
        }).toThrow();
    });
    it('should accept a proper native ios project path as construction parameter', function() {
        var project;
        expect(function() {
            project = new ios_parser(ios_path);
        }).not.toThrow();
        expect(project).toBeDefined();
    });

    describe('update_from_config method', function() {
        var project, config;

        beforeEach(function() {
            project = new ios_parser(ios_path);
            config = new config_parser(cfg_path);
        });
        afterEach(function() {
            fs.writeFileSync(ios_pbx, original_pbx, 'utf-8');
            fs.writeFileSync(cordova_plist, orig_cordova, 'utf-8');
            fs.writeFileSync(ios_plist, original_plist, 'utf-8');
            fs.writeFileSync(cfg_path, original_config, 'utf-8');
        });
        it('should throw an exception if a non config_parser object is passed into it', function() {
            expect(function() {
                project.update_from_config({});
            }).toThrow();
        });
        it('should update the application name properly', function() {
            var cb = jasmine.createSpy();

            runs(function() {
                config.name('bond. james bond.');
                project.update_from_config(config, cb);
            });

            waitsFor(function() { return cb.wasCalled; }, "update_from_config callback");

            runs(function() {
                var pbx_contents = fs.readFileSync(ios_pbx, 'utf-8');
                expect(pbx_contents.match(/PRODUCT_NAME\s*=\s*"bond. james bond."/)[0]).toBe('PRODUCT_NAME = "bond. james bond."');
            });
        });
        it('should update the application package name (bundle identifier) properly', function() {
            var cb = jasmine.createSpy();

            runs(function() {
                config.packageName('ca.filmaj.dewd');
                project.update_from_config(config, cb);
            });

            waitsFor(function() { return cb.wasCalled; }, "update_from_config callback");

            runs(function() {
                var plist_contents = fs.readFileSync(ios_plist, 'utf-8');
                expect(plist_contents).toMatch(/<string>ca.filmaj.dewd/);
            });
        });
        it('should update the externalhosts whitelist properly', function() {
            var cb = jasmine.createSpy();

            runs(function() {
                project.update_from_config(config, cb);
            });

            waitsFor(function() { return cb.wasCalled; }, "update_from_config callback");

            runs(function() {
                var plist_contents = fs.readFileSync(cordova_plist, 'utf-8');
                expect(plist_contents).toMatch(/<key>ExternalHosts<\/key>\s*<array>\s*<string>\*<\/string>/);
            });
        });
    });

    describe('update_www method', function() {
        var parser, ios_platform = path.join(tempDir, 'platforms', 'ios');

        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });

        it('should update all www assets', function() {
            var cb = jasmine.createSpy();
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                parser = new ios_parser(ios_platform);
                var newFile = path.join(tempDir, 'www', 'somescript.js');
                fs.writeFileSync(newFile, 'alert("sup");', 'utf-8');
                parser.update_www();
                expect(fs.existsSync(path.join(ios_platform, 'www', 'somescript.js'))).toBe(true);
            });
        });
        it('should write out ios js to cordova.js', function() {
            var cb = jasmine.createSpy();
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                parser = new ios_parser(ios_platform);
                parser.update_www();
                expect(fs.readFileSync(path.join(ios_platform, 'www', 'cordova.js'),'utf-8')).toBe(fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'ios', 'bin', 'templates', 'project', 'www', 'cordova-2.2.0.js'), 'utf-8'));
            });
        });
    });

    describe('update_project method', function() {
        var parser, ios_platform, cfg;

        beforeEach(function() {
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should invoke update_www', function() {
            var cb = jasmine.createSpy();
            var updatecb = jasmine.createSpy();
            var spyWww;
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                ios_platform = path.join(tempDir, 'platforms', 'ios');
                parser = new ios_parser(ios_platform);
                cfg = new config_parser(cfg_path);
                spyWww = spyOn(parser, 'update_www');
                parser.update_project(cfg, updatecb);
            });
            waitsFor(function() { return updatecb.wasCalled; }, 'update project callback');
            runs(function() {
                expect(spyWww).toHaveBeenCalled();
            });
        });
        it('should invoke update_from_config', function() {
            var cb = jasmine.createSpy();
            var updatecb = jasmine.createSpy();
            var spyConfig;
            ios_platform = path.join(tempDir, 'platforms', 'ios');
            runs(function() {
                cordova.platform('add', 'ios', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, 'platform add ios');
            runs(function() {
                parser = new ios_parser(ios_platform);
                cfg = new config_parser(cfg_path);
                spyConfig = spyOn(parser, 'update_from_config');
                parser.update_project(cfg, updatecb);
                expect(spyConfig).toHaveBeenCalled();
            });
        });
    });
});
