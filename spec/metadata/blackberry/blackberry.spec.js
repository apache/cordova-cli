var cordova = require('../../../cordova'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    blackberry_parser = require('../../../src/metadata/blackberry_parser'),
    tempDir = path.join(__dirname, '..', '..', '..', 'temp'),
    fixtures = path.join(__dirname, '..', '..', 'fixtures'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

var cwd = process.cwd();

describe('Test:', function() {

    afterEach(function() {
        process.chdir(cwd);
    });

    describe('\'platform add blackberry\'', function() {
        var sh, cr;
        var fake_reqs_check = function() {
            expect(cr.mostRecentCall.args).toBeDefined();
            cr.mostRecentCall.args[0](false);
        };
        var fake_create = function(a_path) {
            shell.mkdir('-p', path.join(a_path, 'www'));
            fs.writeFileSync(path.join(a_path, 'project.json'), 'hi', 'utf-8');
            shell.cp('-rf', path.join(cordova_project, 'platforms', 'blackberry', 'www', 'config.xml'), path.join(a_path, 'www'));
            sh.mostRecentCall.args[2](0, '');
        };
        beforeEach(function() {
            sh = spyOn(shell, 'exec');
            cr = spyOn(blackberry_parser, 'check_requirements');
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should check requirements when adding', function() {
            cordova.platform('add', 'blackberry');
            expect(blackberry_parser.check_requirements).toHaveBeenCalled();
        });
        it('should shell out to blackberry bin/create', function() {
            cordova.platform('add', 'blackberry');
            fake_reqs_check();
            var shell_cmd = sh.mostRecentCall.args[0];
            var create_cmd = path.join('blackberry', 'bin', 'create');
            expect(shell_cmd).toContain(create_cmd);
        });
        it('should call blackberry_parser\'s update_project', function() {
            spyOn(blackberry_parser.prototype, 'update_project');
            cordova.platform('add', 'blackberry');
            fake_reqs_check();
            fake_create(path.join(tempDir, 'platforms', 'blackberry'));
            expect(blackberry_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'emulate blackberry\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
            spyOn(blackberry_parser.prototype, 'get_cordova_config').andReturn({
                signing_password:'pwd'
            });
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'blackberry'), path.join(tempDir, 'platforms'));
        it('should shell out to run command with a specific target', function() {
            var proj_spy = spyOn(blackberry_parser.prototype, 'update_project');
            spyOn(blackberry_parser.prototype, 'get_all_targets').andReturn([{name:'fakesim',type:'simulator'}]);
            var s = spyOn(require('shelljs'), 'exec');
            cordova.emulate('blackberry');
            proj_spy.mostRecentCall.args[1](); // update_project fake
            expect(s).toHaveBeenCalled();
            var emulate_cmd = 'cordova.run" --target=fakesim -k pwd$';
            expect(s.mostRecentCall.args[0]).toMatch(emulate_cmd);
        });
        it('should call blackberry_parser\'s update_project', function() {
            spyOn(require('shelljs'), 'exec');
            spyOn(blackberry_parser.prototype, 'update_project');
            cordova.emulate('blackberry');
            expect(blackberry_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'compile blackberry\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'blackberry'), path.join(tempDir, 'platforms'));
        it('should shell out to build command', function() {
            var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
            cordova.compile('blackberry');
            expect(s.mostRecentCall.args[0]).toMatch(/blackberry.cordova.build"$/gi);
        });
    });
});
