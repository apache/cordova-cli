var helpers = require('./helpers'),
    path = require('path'),
    fs = require('fs'),
    shell = require('shelljs'),
    Q = require('q'),
    config = require('../src/config'),
    events = require('../src/events'),
    util = require('../src/util'),
    cordova = require('../cordova');


// TODO (kamrik): what's the right place for such utility funcs? Is this an ok way to do this in JS?
// crossConcat(['x', 'y'], ['1', '2', '3'])
// -> [ 'x1', 'x2', 'x3', 'y1', 'y2', 'y3']
var crossConcat = function(a, b, delimiter){
    var result = [];
    if (typeof delimiter == 'undefined') {
        delimiter = '';
    }
    for (var i = 0; i < a.length; i++) {
        for (var j = 0; j < b.length; j++) {
            result.push(a[i] + delimiter + b[j]);
        }
    }
    return result;
};


var tmpDir = helpers.tmpDir();
var appName = 'TestCreate';
var appId = 'io.cordova.' + appName.toLocaleLowerCase();
var project = path.join(tmpDir, appName);
var cordovaDir = path.join(project, '.cordova');
var extraConfig = {
      lib: {
        www: {
          uri: path.join(__dirname, 'fixtures', 'base', 'www'),
          version: "testCordovaCreate",
          id: appName
        }
      }
    };

describe('create end-to-end', function() {

    beforeEach(function() {
        shell.rm('-rf', path.join(tmpDir, '*'));
    });
    afterEach(function() {
        shell.rm('-rf', path.join(tmpDir, '*'));
    });

    var results;
    events.on('results', function(res) { results = res; });

    it('should successfully run', function(done) {
        console.log(process.cwd());
        // Call cordova create with no args, should return help.
        cordova.raw.create().then(function() {
            expect(results).toMatch(/synopsis/gi);
        }).then(function() {
            // Create a real project
            return cordova.raw.create(project, appId, appName, extraConfig);
        }).then(function() {
            // Check if top level dirs exist.
            var dirs = ['.cordova', 'platforms', 'merges', 'plugins', 'www'];
            dirs.forEach(function(d) {
                expect(path.join(project, d)).toExist();
            });

            // Check if hook dirs exist.
            var hooksDir = path.join(project, '.cordova', 'hooks');
            dirs = crossConcat(['platform', 'plugin'], ['add', 'rm', 'ls'], '_');
            dirs = dirs.concat(['build', 'compile', 'docs', 'emulate', 'prepare', 'run']);
            dirs = crossConcat(['before', 'after'], dirs, '_');
            dirs.forEach(function(d) {
                expect(path.join(hooksDir, d)).toExist();
            });

            // Check if config files exist.
            expect(path.join(cordovaDir, 'config.json')).toExist();
            expect(path.join(project, 'www', 'config.xml')).toExist();

            // Check contents of config.json
            var cfg = config.read(project);
            expect(cfg.id).toEqual(appId);
            expect(cfg.name).toEqual(appName);
            expect(cfg.lib.www.id).toEqual(appName);

            // Check that www/config.xml was updated.
            var configXml = new util.config_parser(path.join(project, 'www', 'config.xml'));
            expect(configXml.packageName()).toEqual(appId);

            // TODO (kamrik): check somehow that we got the right config.cml from the fixture and not some place else.
            // expect(configXml.name()).toEqual('TestBase');
        }).fail(function(err) {
            console.log(err);
            expect(err).toBeUndefined();
        }).fin(done);
    });
});
