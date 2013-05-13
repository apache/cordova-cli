var cordova = require('../../../cordova'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    wp8_parser = require('../../../src/metadata/wp8_parser'),
    tempDir = path.join(__dirname, '..', '..', '..', 'temp'),
    fixtures = path.join(__dirname, '..', '..', 'fixtures'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

var cwd = process.cwd();

describe('Test:', function() {
    afterEach(function() {
        process.chdir(cwd);
    });

    describe('\'platform add wp8\'', function() {
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
            cr = spyOn(wp8_parser, 'check_requirements');
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should shell out to wp8 /bin/create', function() {
            cordova.platform('add', 'wp8');
            fake_reqs_check();
            var shell_cmd = sh.mostRecentCall.args[0];
            var create_cmd = path.join('wp8', 'bin', 'create');
            expect(shell_cmd).toContain(create_cmd);
        });
        it('should call wp8_parser\'s update_project', function() {
            spyOn(wp8_parser.prototype, 'update_project');
            cordova.platform('add', 'wp8');
            fake_reqs_check();
            fake_create(path.join(tempDir, 'platforms', 'wp8'));
            expect(wp8_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'emulate wp8\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'wp8'), path.join(tempDir, 'platforms'));
        it('should shell out to run command on wp8', function() {
            var proj_spy = spyOn(wp8_parser.prototype, 'update_project');
            var s = spyOn(require('shelljs'), 'exec');
            cordova.emulate('wp8');
            proj_spy.mostRecentCall.args[1](); // update_project fake
            expect(s).toHaveBeenCalled();
            var emulate_cmd = path.join('wp8', 'cordova', 'run');
            expect(s.mostRecentCall.args[0]).toContain(emulate_cmd);
        });
        it('should call wp8_parser\'s update_project', function() {
            spyOn(require('shelljs'), 'exec');
            spyOn(wp8_parser.prototype, 'update_project');
            cordova.emulate('wp8');
            expect(wp8_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'compile wp8\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'wp8'), path.join(tempDir, 'platforms'));
        it('should shell out to build command', function() {
            var build_cmd = path.join('wp8', 'cordova', 'build');
            var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
            cordova.compile('wp8');
            expect(s.mostRecentCall.args[0]).toContain(build_cmd);
        });
    });
});