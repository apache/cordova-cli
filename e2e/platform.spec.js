
var helpers = require('./helpers'),
    path = require('path'),
    fs = require('fs'),
    shell = require('shelljs'),
    cordova = require('../cordova');

var tmpDir = helpers.tmpDir();
var baseProject = path.join(__dirname, 'fixtures', 'base');
var project = path.join(tmpDir, 'project');

describe('platform end-to-end', function() {

    // The flows we want to test are add, rm, list, and upgrade.
    // They should run the appropriate hooks.
    // They should fail when not inside a Cordova project.
    // These tests deliberately have no beforeEach and afterEach that are cleaning things up.
    describe('`add`', function() {
        it('should successfully run', function(done) {
            shell.cp('-R', baseProject, project);
            shell.cd(project);

            // Mock the lazy-loader's download function to point at the fake bin/create script.

            // Install the recommended platform.
            cordova.raw.platform('add', [helpers.testPlatform]).then(

