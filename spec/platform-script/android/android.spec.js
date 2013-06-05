var cordova = require('../../../cordova'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    android_parser = require('../../../src/metadata/android_parser'),
    tempDir = path.join(__dirname, '..', '..', '..', 'temp'),
    fixtures = path.join(__dirname, '..', '..', 'fixtures'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');

var cwd = process.cwd();

describe('Test:', function() {
    afterEach(function() {
        process.chdir(cwd);
    });

    describe('\'platform add android\'', function() {
        var sh, cr;
        var fake_reqs_check = function() {
            expect(cr.mostRecentCall.args).toBeDefined();
            cr.mostRecentCall.args[0](false);
        };
        var fake_create = function(a_path) {
            shell.mkdir('-p', a_path);
            fs.writeFileSync(path.join(a_path, 'AndroidManifest.xml'), 'hi', 'utf-8');
            sh.mostRecentCall.args[2](0, '');
        };
        beforeEach(function() {
            sh = spyOn(shell, 'exec');
            cr = spyOn(android_parser, 'check_requirements');
            shell.rm('-rf', tempDir);
            cordova.create(tempDir);
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        it('should shell out to android /bin/create', function() {
            cordova.platform('add', 'android');
            fake_reqs_check();
            var shell_cmd = sh.mostRecentCall.args[0];
            var create_cmd = path.join('android', 'bin', 'create');
            expect(shell_cmd).toContain(create_cmd);
        });
        it('should call android_parser\'s update_project', function() {
            spyOn(android_parser.prototype, 'update_project');
            cordova.platform('add', 'android');
            fake_reqs_check();
            fake_create(path.join(tempDir, 'platforms', 'android'));
            expect(android_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'emulate android\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'android'), path.join(tempDir, 'platforms'));
        it('should call android_parser\'s update_project', function() {
            spyOn(require('shelljs'), 'exec');
            spyOn(android_parser.prototype, 'update_project');
            cordova.emulate('android');
            expect(android_parser.prototype.update_project).toHaveBeenCalled();
        });
    });

    describe('\'compile android\'', function() {
        beforeEach(function() {
            process.chdir(tempDir);
        });
        afterEach(function() {
            process.chdir(cwd);
        });
        shell.rm('-rf', tempDir);
        cordova.create(tempDir);
        shell.cp('-rf', path.join(cordova_project, 'platforms', 'android'), path.join(tempDir, 'platforms'));
        it('should shell out to build command', function() {
            var build_cmd = path.join('android', 'cordova', 'build');
            var s = spyOn(require('shelljs'), 'exec').andReturn({code:0});
            cordova.compile('android');
            expect(s.mostRecentCall.args[0]).toContain(build_cmd);
        });
    });
});
