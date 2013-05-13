var cordova = require('../../cordova'),
    shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    cordova_util = require('../../src/util'),
    fixtures = path.join(__dirname, '..', 'fixtures'),
    cordova_project = path.join(fixtures, 'projects', 'cordova');


var cwd = process.cwd();

describe('util command', function() {
    beforeEach(function() {
        process.chdir(cordova_project);
    });
    afterEach(function() {
        process.chdir(cwd);
    });
    describe('listPlatforms', function() {
        it('should not treat a .gitignore file as a platform', function() {
            var gitignore = path.join(cordova_project, 'platforms', '.gitignore');
            fs.writeFileSync(gitignore, 'somethinghere', 'utf-8');
            this.after(function() {
                shell.rm('-f', gitignore);
            });

            var s = spyOn(shell, 'exec');
            var platforms = cordova_util.listPlatforms(cordova_project);
            platforms.forEach(function(platform) {
                expect(platform).not.toMatch(/\.gitignore/);
            }); 
        });
    });
});