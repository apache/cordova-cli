
var helpers = require('./helpers'),
    path = require('path'),
    fs = require('fs'),
    shell = require('shelljs'),
    platforms = require('../platforms'),
    child_process = require('child_process'),
    config = require('../src/config'),
    Q = require('q'),
    events = require('../src/events'),
    cordova = require('../cordova');

var tmpDir = helpers.tmpDir();
var project = path.join(tmpDir, 'project');

var platformParser = platforms[helpers.testPlatform].parser;

describe('platform end-to-end', function() {

    beforeEach(function() {
        shell.rm('-rf', path.join(tmpDir, '*'));
    });
    afterEach(function() {
        shell.rm('-rf', path.join(tmpDir, '*'));
    });

    // The flows we want to test are add, rm, list, and upgrade.
    // They should run the appropriate hooks.
    // They should fail when not inside a Cordova project.
    // These tests deliberately have no beforeEach and afterEach that are cleaning things up.
    it('should successfully run', function(done) {
        // cp then mv because we need to copy everything, but that means it'll copy the whole directory.
        // Using /* doesn't work because of hidden files.
        shell.cp('-R', path.join(__dirname, 'fixtures', 'base'), tmpDir);
        shell.mv(path.join(tmpDir, 'base'), project);
        process.chdir(project);

        // Now we load the config.json in the newly created project and edit the target platform's lib entry
        // to point at the fixture version. This is necessary so that cordova.prepare can find cordova.js there.
        var c = config.read(project);
        c.lib[helpers.testPlatform].uri = path.join(__dirname, 'fixtures', 'platforms', helpers.testPlatform + '-lib');
        config.write(project, c);

        // The config.json in the fixture project points at fake "local" paths.
        // Since it's not a URL, the lazy-loader will just return the junk path.
        // The platform logic will call the platformParser.check_requirements, which we mock,
        // and then call the bin/check_reqs and bin/create scripts from it.
        // We're mocking out shell.exec() as well, to capture that.
        var check_reqs = spyOn(platformParser, 'check_requirements').andReturn(Q());
        var exec = spyOn(child_process, 'exec').andCallFake(function(cmd, opts, cb) {
            if (!cb) cb = opts;
            // This is a call to the bin/create script, so do the copy ourselves.
            shell.cp('-R', path.join(__dirname, 'fixtures', 'platforms', 'android'), path.join(project, 'platforms'));
            cb(null, '', '');
        });

        var results;
        events.on('results', function(res) { results = res; });

        // Install the recommended platform.
        console.log(process.cwd());
        cordova.raw.platform('list').then(function() {
            var installed = results.match(/Installed platforms: (.*)/);
            expect(installed).toBeDefined();
            expect(installed[1].indexOf(helpers.testPlatform)).toBe(-1);
        }).then(function() {
            return cordova.raw.platform('add', [helpers.testPlatform]);
        }).then(function() {
            // Now the platform add has finished.
            expect(path.join(project, 'platforms', helpers.testPlatform)).toExist();
            expect(path.join(project, 'merges', helpers.testPlatform)).toExist();
            expect(path.join(project, 'platforms', helpers.testPlatform, 'cordova')).toExist();
        }).then(function() {
            return cordova.raw.platform('list');
        }).then(function() {
            var installed = results.match(/Installed platforms: (.*)/);
            expect(installed).toBeDefined();
            expect(installed[1].indexOf(helpers.testPlatform)).toBeGreaterThan(-1);
        }).fail(function(err) {
            console.log(err);
            expect(err).toBeUndefined();
        }).fin(done);
    });
});

