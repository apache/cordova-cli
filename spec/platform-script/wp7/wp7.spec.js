var cordova = require('../../../cordova'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    wp7_parser = require('../../../src/metadata/wp7_parser'),
    tempDir = path.join(__dirname, '..', '..', '..', 'temp'),
    fixtures = path.join(__dirname, '..', '..', 'fixtures'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

var cwd = process.cwd();

describe('Test:', function() {
    afterEach(function() {
        process.chdir(cwd);
    });

    describe('\'platform add wp7\'', function() {
        var sh, cr;
        var fake_reqs_check = function() {
            expect(cr.mostRecentCall.args).toBeDefined();
            cr.mostRecentCall.args[0](false);
        };
        var fake_create = function(a_path) {
            shell.mkdir('-p', a_path);
            fs.writeFileSync(path.join(a_path, 'wp7Project.csproj'), 'hi', 'utf-8');
            fs.writeFileSync(path.join(a_path, 'wp7Project.sln'), 'hi', 'utf-8');
            sh.mostRecentCall.args[2](0, '');
        };
        beforeEach(function() {
            sh = spyOn(shell, 'exec');
            cr = spyOn(wp7_parser, 'check_requirements');
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should shell out to wp7 /bin/create', function() {
            cordova.platform('add', 'wp7');
            fake_reqs_check();
            var shell_cmd = sh.mostRecentCall.args[0];
            var create_cmd = path.join('wp7', 'bin', 'create');
            expect(shell_cmd).toContain(create_cmd);
        });
        it('should call wp7_parser\'s update_project', function() {
            spyOn(wp7_parser.prototype, 'update_project');
            cordova.platform('add', 'wp7');
            fake_reqs_check();
            fake_create(path.join(tempDir, 'platforms', 'wp7'));
            expect(wp7_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'emulate wp7\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'wp7'), path.join(tempDir, 'platforms'));
        it('should shell out to run command on wp7', function() {
            var proj_spy = spyOn(wp7_parser.prototype, 'update_project');
            var s = spyOn(require('shelljs'), 'exec');
            cordova.emulate('wp7');
            proj_spy.mostRecentCall.args[1](); // update_project fake
            expect(s).toHaveBeenCalled();
            var emulate_cmd = path.join('wp7', 'cordova', 'run');
            expect(s.mostRecentCall.args[0]).toContain(emulate_cmd);
        });
        it('should call wp7_parser\'s update_project', function() {
            spyOn(require('shelljs'), 'exec');
            spyOn(wp7_parser.prototype, 'update_project');
            cordova.emulate('wp7');
            expect(wp7_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'compile wp7\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'wp7'), path.join(tempDir, 'platforms'));
        it('should shell out to build command', function() {
            var build_cmd = path.join('wp7', 'cordova', 'build');
            var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
            cordova.compile('wp7');
            expect(s.mostRecentCall.args[0]).toContain(build_cmd);
        });
    });
});