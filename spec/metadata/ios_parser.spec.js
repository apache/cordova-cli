var ios_parser = require('../../src/metadata/ios_parser'),
    config_parser = require('../../src/config_parser'),
    path = require('path'),
    fs = require('fs'),
    cfg_path = path.join(__dirname, '..', 'fixtures', 'projects', 'test', 'www', 'config.xml'),
    ios_path = path.join(__dirname, '..', 'fixtures', 'projects', 'native', 'ios'),
    ios_pbx = path.join(ios_path, 'balls.xcodeproj', 'project.pbxproj');

var cwd = process.cwd();

var original_pbx = fs.readFileSync(ios_pbx, 'utf-8');

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
        });
        it('should throw an exception if a non config_parser object is passed into it', function() {
            expect(function() {
                project.update_from_config({});
            }).toThrow();
        });
        it('should update the application name properly', function() {
            var cb = jasmine.createSpy();
            this.after(function() {
                fs.writeFileSync(ios_pbx, original_pbx, 'utf-8');
            });

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
        it('should update the application package name properly');
    });
});
