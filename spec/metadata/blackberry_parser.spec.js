var blackberry_parser = require('../../src/metadata/blackberry_parser'),
    config_parser = require('../../src/config_parser'),
    path = require('path'),
    fs = require('fs'),
    cfg_path = path.join(__dirname, '..', 'fixtures', 'projects', 'test', 'www', 'config.xml'),
    blackberry_path = path.join(__dirname, '..', 'fixtures', 'projects', 'native', 'blackberry'),
    blackberry_config = path.join(blackberry_path, 'www', 'config.xml');

var cwd = process.cwd();

var original_config = fs.readFileSync(blackberry_config, 'utf-8');

describe('blackberry project parser', function() {
    it('should throw an exception with a path that is not a native blackberry project', function() {
        expect(function() {
            var project = new blackberry_parser(cwd);
        }).toThrow();
    });
    it('should accept a proper native blackberry project path as construction parameter', function() {
        var project;
        expect(function() {
            project = new blackberry_parser(blackberry_path);
        }).not.toThrow();
        expect(project).toBeDefined();
    });

    describe('update_from_config method', function() {
        var project, config;

        beforeEach(function() {
            project = new blackberry_parser(blackberry_path);
            config = new config_parser(cfg_path);
        });
        afterEach(function() {
            fs.writeFileSync(blackberry_config, original_config, 'utf-8');
        });
        it('should throw an exception if a non config_parser object is passed into it', function() {
            expect(function() {
                project.update_from_config({});
            }).toThrow();
        });
        it('should update the application name properly', function() {
            config.name('bond. james bond.');
            project.update_from_config(config);

            var bb_cfg = new config_parser(blackberry_config);

            expect(bb_cfg.name()).toBe('bond. james bond.');
        });
        it('should update the application package name properly');
    });
});
