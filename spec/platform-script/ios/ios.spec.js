var cordova = require('../../../cordova'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    ios_parser = require('../../../src/metadata/ios_parser'),
    tempDir = path.join(__dirname, '..', '..', '..', 'temp'),
    fixtures = path.join(__dirname, '..', '..', 'fixtures'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

var cwd = process.cwd();

describe('Test:', function() {
    afterEach(function() {
        process.chdir(cwd);
    });

    describe('\'platform add ios\'', function() {
        var sh, cr;
        var fake_reqs_check = function() {
            cr.mostRecentCall.args[0](false);
        };
        var fake_create = function(a_path) {
            shell.mkdir('-p', a_path);
            fs.writeFileSync(path.join(a_path, 'poo.xcodeproj'), 'hi', 'utf-8');
            shell.mkdir('-p', path.join(a_path, 'poo'));
            shell.cp(path.join(cordova_project, 'www', 'config.xml'), path.join(a_path, 'poo', 'config.xml'));
            sh.mostRecentCall.args[2](0, '');
        };
        beforeEach(function() {
            sh = spyOn(shell, 'exec');
            cr = spyOn(ios_parser, 'check_requirements');
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should shell out to ios /bin/create', function() {
            cordova.platform('add', 'ios');
            fake_reqs_check();
            var shell_cmd = sh.mostRecentCall.args[0];
            var create_cmd = path.join('ios', 'bin', 'create');
            expect(shell_cmd).toContain(create_cmd);
        });
        it('should call ios_parser\'s update_project', function() {
            spyOn(ios_parser.prototype, 'update_project');
            cordova.platform('add', 'ios');
            fake_reqs_check();
            fake_create(path.join(tempDir, 'platforms', 'ios'));
            expect(ios_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'emulate ios\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'ios'), path.join(tempDir, 'platforms'));
        it('should shell out to run command on ios', function() {
            var proj_spy = spyOn(ios_parser.prototype, 'update_project');
            var s = spyOn(require('shelljs'), 'exec');
            cordova.emulate('ios');
            proj_spy.mostRecentCall.args[1](); // update_project fake
            expect(s).toHaveBeenCalled();
            var emulate_cmd = path.join('ios', 'cordova', 'run');
            expect(s.mostRecentCall.args[0]).toContain(emulate_cmd);
        });
        it('should call ios_parser\'s update_project', function() {
            spyOn(require('shelljs'), 'exec');
            spyOn(ios_parser.prototype, 'update_project');
            cordova.emulate('ios');
            expect(ios_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'compile ios\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'ios'), path.join(tempDir, 'platforms'));
        it('should shell out to build command', function() {
            var build_cmd = path.join('ios', 'cordova', 'build');
            var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
            cordova.compile('ios');
            expect(s.mostRecentCall.args[0]).toContain(build_cmd);
        });
    });
});