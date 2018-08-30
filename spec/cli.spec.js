/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var rewire = require('rewire');
var cli = rewire('../src/cli');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var cordova = cordova_lib.cordova;
var telemetry = require('../src/telemetry');
var path = require('path');
var fs = require('fs');
var logger = require('cordova-common').CordovaLogger.get();

// avoid node complaining of too many event listener added
process.setMaxListeners(0);

describe('cordova cli', function () {
    beforeEach(function () {
        // Event registration is currently process-global. Since all jasmine
        // tests in a directory run in a single process (and in parallel),
        // logging events registered as a result of the "--verbose" flag in
        // CLI testing below would cause lots of logging messages printed out by other specs.

        // This is required so that fake events chaining works (events.on('log').on('verbose')...)
        var FakeEvents = function FakeEvents () {};
        FakeEvents.prototype.on = function fakeOn () {
            return new FakeEvents();
        };

        spyOn(events, 'on').and.returnValue(new FakeEvents());

        // Spy and mute output
        spyOn(logger, 'results');
        spyOn(logger, 'warn');
        spyOn(console, 'log');

        // Prevent accidentally turning telemetry on/off during testing
        telemetry.turnOn = function () {};
        telemetry.turnOff = function () {};
        telemetry.track = function () {};
    });

    describe('options', function () {
        describe('version', function () {
            var version = require('../package').version;

            it('Test#001 : will spit out the version with -v', function (done) {
                cli(['node', 'cordova', '-v'], function () {
                    expect(logger.results.calls.mostRecent().args[0]).toMatch(version);
                    done();
                });
            }, 60000);

            it('Test#002 : will spit out the version with --version', function (done) {
                cli(['node', 'cordova', '--version'], function () {
                    expect(logger.results.calls.mostRecent().args[0]).toMatch(version);
                    done();
                }, 60000);
            });

            it('Test#003 : will spit out the version with -v anywhere', function (done) {
                cli(['node', 'cordova', 'one', '-v', 'three'], function () {
                    expect(logger.results.calls.mostRecent().args[0]).toMatch(version);
                    done();
                });
            }, 60000);
        });
    });

    describe('Test#004 : project commands other than plugin and platform', function () {
        beforeEach(function () {
            spyOn(cordova, 'build').and.returnValue(Promise.resolve());
        });

        it('Test#005 : will call command with all arguments passed through', function (done) {
            cli(['node', 'cordova', 'build', 'blackberry10', '--', '-k', 'abcd1234'], function () {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { argv: ['-k', 'abcd1234'] }, verbose: false, silent: false, browserify: false, fetch: true, nohooks: [ ], searchpath: undefined });
                done();
            });
        }, 60000);

        it('Test#006 : will consume the first instance of -d', function (done) {
            cli(['node', 'cordova', '-d', 'build', 'blackberry10', '--', '-k', 'abcd1234', '-d'], function () {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '-d'] }, verbose: true, silent: false, browserify: false, fetch: true, nohooks: [ ], searchpath: undefined });
                done();
            });
        });

        it('Test#007 : will consume the first instance of --verbose', function (done) {
            cli(['node', 'cordova', '--verbose', 'build', 'blackberry10', '--', '-k', 'abcd1234', '--verbose'], function () {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '--verbose'] }, verbose: true, silent: false, browserify: false, fetch: true, nohooks: [ ], searchpath: undefined });
                done();
            });
        });

        it('Test#008 : will consume the first instance of either --verbose or -d', function (done) {
            cli(['node', 'cordova', '--verbose', 'build', 'blackberry10', '--', '-k', 'abcd1234', '-d'], function () {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '-d'] }, verbose: true, silent: false, browserify: false, fetch: true, nohooks: [ ], searchpath: undefined });
                done();
            });
        });

        it('Test#009 : will consume the first instance of either --verbose or -d', function (done) {
            cli(['node', 'cordova', '-d', 'build', 'blackberry10', '--', '-k', 'abcd1234', '--verbose'], function () {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '--verbose'] }, verbose: true, silent: false, browserify: false, fetch: true, nohooks: [ ], searchpath: undefined });
                done();
            });
        });

        it('Test#010 : will consume the first instance of --silent', function (done) {
            cli(['node', 'cordova', '--silent', 'build', 'blackberry10', '--', '-k', 'abcd1234', '--silent'], function () {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { silent: true, argv: ['-k', 'abcd1234', '--silent'] }, verbose: false, silent: true, browserify: false, fetch: true, nohooks: [ ], searchpath: undefined });
                done();
            });
        });
    });

    describe('create', function () {
        beforeEach(function () {
            spyOn(cordova, 'create').and.returnValue(Promise.resolve());
        });

        it('Test#011 : calls cordova create', function (done) {
            cli(['node', 'cordova', 'create', 'a', 'b', 'c', '--link-to', 'c:\\personalWWW'], function () {
                expect(cordova.create).toHaveBeenCalledWith('a', 'b', 'c', jasmine.any(Object), jasmine.any(Object));
                done();
            });
        });
    });

    describe('plugin', function () {
        beforeEach(function () {
            spyOn(cordova, 'plugin').and.returnValue(Promise.resolve());
        });

        it('Test#012 : will pass variables', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'facebook', '--variable', 'FOO=foo'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['facebook'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.cli_variables.FOO).toBe('foo');
                done();
            });
        });

        it('Test#013 : will  support variables with =', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'facebook', '--variable', 'MOTO=DELTA=WAS=HERE'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['facebook'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.cli_variables.MOTO).toBe('DELTA=WAS=HERE');
                done();
            });
        });

        it('Test#014 : will pass hook patterns to suppress', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'facebook', '--nohooks', 'before_plugin_add'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['facebook'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.nohooks[0]).toBe('before_plugin_add');
                done();
            });
        });

        it('Test #015 : (add) will pass save:true', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'device'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(true);
                done();
            });
        });

        it('Test #016 : (add) will pass save:false', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'device', '--nosave'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(false);
                done();
            });
        });

        it('Test #017: (remove) will pass save:false', function (done) {
            cli(['node', 'cordova', 'plugin', 'remove', 'device', '--nosave'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'remove',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(false);
                done();
            });
        });

        it('Test #018 : (remove) autosave is default and will pass save:true', function (done) {
            cli(['node', 'cordova', 'plugin', 'remove', 'device'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'remove',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(true);
                done();
            });
        });

        it('Test #020 : (add) fetch is true by default and will pass fetch:true', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'device'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.fetch).toBe(true);
                done();
            });
        });

        it('(add) will pass save-exact:true', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'device', '--save-exact'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save_exact).toBe(true);
                done();
            });
        });

        it('Test #021 : (remove) fetch is true by default and will pass fetch:true', function (done) {
            cli(['node', 'cordova', 'plugin', 'remove', 'device'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'remove',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.fetch).toBe(true);
                done();
            });
        });

        it('(add) will pass noprod:true and production:false', function (done) {
            cli(['node', 'cordova', 'plugin', 'add', 'device', '--noprod'], function () {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                var opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.production).toBe(false);
                done();
            });
        });
    });

    describe('telemetry', function () {
        it("Test#023 : skips prompt when user runs 'cordova telemetry X'", function (done) {
            var wasPromptShown = false;
            spyOn(telemetry, 'showPrompt').and.callFake(function () {
                wasPromptShown = true;
            });

            cli(['node', 'cordova', 'telemetry', 'on'], function () {
                cli(['node', 'cordova', 'telemetry', 'off'], function () {
                    expect(wasPromptShown).toBeFalsy();
                    done();
                });
            });
        });

        it("Test#024 : is NOT collected when user runs 'cordova telemetry on' while NOT opted-in", function (done) {
            spyOn(telemetry, 'isOptedIn').and.returnValue(false);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'track');

            cli(['node', 'cordova', 'telemetry', 'on'], function () {
                expect(telemetry.track).not.toHaveBeenCalled();
                done();
            });
        });

        it("Test#025 : is collected when user runs 'cordova telemetry off' while opted-in", function (done) {
            spyOn(telemetry, 'isOptedIn').and.returnValue(true);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'track');

            cli(['node', 'cordova', 'telemetry', 'off'], function () {
                expect(telemetry.track).toHaveBeenCalledWith('telemetry', 'off', 'via-cordova-telemetry-cmd', 'successful');
                done();
            });
        });

        it('Test#026 : tracks platforms/plugins subcommands', function (done) {
            spyOn(telemetry, 'isOptedIn').and.returnValue(true);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(true);
            spyOn(cordova, 'platform').and.returnValue(Promise.resolve());
            spyOn(telemetry, 'track');

            cli(['node', 'cordova', 'platform', 'add', 'ios'], function () {
                expect(telemetry.track).toHaveBeenCalledWith('platform', 'add', 'successful');
                done();
            });
        });

        it('Test#027 : shows prompt if user neither opted in or out yet', function (done) {
            spyOn(cordova, 'prepare').and.returnValue(Promise.resolve());
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(false);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'isNoTelemetryFlag').and.returnValue(false);
            spyOn(telemetry, 'showPrompt').and.returnValue(Promise.resolve(false));

            cli(['node', 'cordova', 'prepare'], function () {
                expect(telemetry.showPrompt).toHaveBeenCalled();
                done();
            });
        });

        // note: we override telemetry timeout here so we don't need to wait 30 seconds
        it('Test#028 : opts-out if prompt times out AND it tracks opt-out', function (done) {
            // Remove any optOut settings that might have been saved
            // ... and force prompt to be shown
            telemetry.clear();
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(false);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'track');

            telemetry.timeoutInSecs = 1;
            cli(['node', 'cordova', '--version'], function () {
                if (process.env.CI) {
                    expect(telemetry.isOptedIn()).toBeTruthy();
                } else {
                    expect(telemetry.isOptedIn()).toBeFalsy();
                }
                expect(telemetry.track).toHaveBeenCalledWith('telemetry', 'off', 'via-cli-prompt-choice', 'successful');
                done();
            });
        });

        it("Test#029 : is NOT collected in CI environments and doesn't prompt", function (done) {
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(true);
            spyOn(telemetry, 'isOptedIn').and.returnValue(true);
            spyOn(telemetry, 'isCI').and.returnValue(true);
            spyOn(telemetry, 'showPrompt');
            spyOn(telemetry, 'track');

            cli(['node', 'cordova', '--version'], function () {
                expect(telemetry.showPrompt).not.toHaveBeenCalled();
                expect(telemetry.track).not.toHaveBeenCalled();
                done();
            });
        });

        it("Test#030 : is NOT collected when --no-telemetry flag found and doesn't prompt", function (done) {
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(false);
            spyOn(telemetry, 'isOptedIn').and.returnValue(true);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'showPrompt');
            spyOn(telemetry, 'track');

            cli(['node', 'cordova', '--version', '--no-telemetry'], function () {
                expect(telemetry.showPrompt).not.toHaveBeenCalled();
                expect(telemetry.track).not.toHaveBeenCalled();
                done();
            });
        });

        it('Test#031 : is NOT collected if user opted out', function (done) {
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(true);
            spyOn(telemetry, 'isOptedIn').and.returnValue(false);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'showPrompt');
            spyOn(telemetry, 'track');

            cli(['node', 'cordova', '--version'], function () {
                expect(telemetry.showPrompt).not.toHaveBeenCalled();
                expect(telemetry.track).not.toHaveBeenCalled();
                done();
            });
        });

        it('Test#032 : is collected if user opted in', function (done) {
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(true);
            spyOn(telemetry, 'isOptedIn').and.returnValue(true);
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'showPrompt');
            spyOn(telemetry, 'track');

            cli(['node', 'cordova', '--version'], function () {
                expect(telemetry.showPrompt).not.toHaveBeenCalled();
                expect(telemetry.track).toHaveBeenCalled();
                done();
            });
        });

        it("Test#033 : track opt-out that happened via 'cordova telemetry off' even if user is NOT opted-in ", function (done) {
            spyOn(telemetry, 'isCI').and.returnValue(false);
            spyOn(telemetry, 'isOptedIn').and.returnValue(false); // same as calling `telemetry.turnOff();`
            spyOn(telemetry, 'hasUserOptedInOrOut').and.returnValue(true);
            spyOn(telemetry, 'track');

            expect(telemetry.isOptedIn()).toBeFalsy();

            cli(['node', 'cordova', 'telemetry', 'off'], function () {
                expect(telemetry.isOptedIn()).toBeFalsy();
                expect(telemetry.track).toHaveBeenCalledWith('telemetry', 'off', 'via-cordova-telemetry-cmd', 'successful');
                done();
            });
        });
    });
});

describe('platform', function () {

    beforeEach(function () {
        spyOn(cordova, 'platform').and.returnValue(Promise.resolve());
        logger.setLevel('error');
    });

    it('Test #034 : (add) autosave is the default setting for platform add', function (done) {
        cli(['node', 'cordova', 'platform', 'add', 'ios'], function () {
            expect(cordova.platform).toHaveBeenCalledWith(
                'add',
                ['ios'],
                jasmine.any(Object)
            );
            var opts = cordova.platform.calls.argsFor(0)[2];
            expect(opts.save).toBe(true);
            done();
        });
    });

    it('Test #035 : (add) platform is not saved when --nosave is passed in', function (done) {
        cli(['node', 'cordova', 'platform', 'add', 'ios', '--nosave'], function () {
            expect(cordova.platform).toHaveBeenCalledWith(
                'add',
                ['ios'],
                jasmine.any(Object)
            );
            var opts = cordova.platform.calls.argsFor(0)[2];
            expect(opts.save).toBe(false);
            done();
        });
    });

    it('Test #036 : (remove) autosave is the default setting for platform remove', function (done) {
        cli(['node', 'cordova', 'platform', 'remove', 'ios'], function () {
            expect(cordova.platform).toHaveBeenCalledWith(
                'remove',
                ['ios'],
                jasmine.any(Object)
            );
            var opts = cordova.platform.calls.argsFor(0)[2];
            expect(opts.save).toBe(true);
            done();
        });
    });

    it('Test #037 : (remove) platform is not removed when --nosave is passed in', function (done) {
        cli(['node', 'cordova', 'platform', 'remove', 'ios', '--nosave'], function () {
            expect(cordova.platform).toHaveBeenCalledWith(
                'remove',
                ['ios'],
                jasmine.any(Object)
            );
            var opts = cordova.platform.calls.argsFor(0)[2];
            expect(opts.save).toBe(false);
            done();
        });
    });

    it('Test #039 : (add) fetch is true by default and will pass fetch:true', function (done) {
        cli(['node', 'cordova', 'platform', 'add', 'device'], function () {
            expect(cordova.platform).toHaveBeenCalledWith(
                'add',
                ['device'],
                jasmine.any(Object)
            );
            var opts = cordova.platform.calls.argsFor(0)[2];
            expect(opts.fetch).toBe(true);
            done();
        });
    });

    it('Test #040 : (remove) fetch is true by default and will pass fetch:true', function (done) {
        cli(['node', 'cordova', 'platform', 'remove', 'device'], function () {
            expect(cordova.platform).toHaveBeenCalledWith(
                'remove',
                ['device'],
                jasmine.any(Object)
            );
            var opts = cordova.platform.calls.argsFor(0)[2];
            expect(opts.fetch).toBe(true);
            done();
        });
    });
});

describe('config', function () {
    var clirevert;
    var confrevert;
    var editorArgs;
    var cordovaConfig = {};
    var confHolder;

    var confMock = {
        set: function (key, value) {
            cordovaConfig[key] = value;
        },
        del: function (key) {
            delete cordovaConfig[key];
        },
        path: function () {
            confHolder = 'Pathcalled';
            return 'some/path/cordova-config.json';
        },
        get: function (key) {
            confHolder = cordovaConfig[key];
            return cordovaConfig[key];
        }
    };

    beforeEach(function () {
        clirevert = cli.__set__('editor', function (path1, cb) {
            editorArgs = path1();
            cb();
        });

        confrevert = cli.__set__('conf', confMock);
        logger.setLevel('error');
        // spyOn(console, 'log');
    });

    afterEach(function () {
        clirevert();
        confrevert();
        confHolder = undefined;
    });

    it('Test#042 : config set autosave is called with true', function (done) {
        cli(['node', 'cordova', 'config', 'set', 'autosave', 'true', '--silent'], function () {
            expect(cordovaConfig.autosave).toBe('true');
            done();
        });
    });

    it('Test#043 : config delete autosave is called', function (done) {
        cli(['node', 'cordova', 'config', 'delete', 'autosave'], function () {
            expect(cordovaConfig.autosave).toBeUndefined();
            done();
        });
    });

    it('Test#044 : config set is called even without value, defaults to true', function (done) {
        cli(['node', 'cordova', 'config', 'set', 'autosave'], function () {
            expect(cordovaConfig.autosave).toBe(true);
            done();
        });
    });

    it('Test #045 : config get is called', function (done) {
        cli(['node', 'cordova', 'config', 'get', 'autosave'], function () {
            expect(confHolder).toBe(true);
            done();
        });
    });

    it('Test #046 : config edit is called', function (done) {
        cli(['node', 'cordova', 'config', 'edit'], function () {
            expect(path.basename(editorArgs)).toEqual('cordova-config.json');
            expect(confHolder).toEqual('Pathcalled');
            done();
        });
    });

    it('Test #047 : config ls is called', function (done) {
        spyOn(fs, 'readFile').and.callFake(function (confPath, cb) {
            confHolder = confPath();
        });

        cli(['node', 'cordova', 'config', 'ls'], function () {
            expect(path.basename(confHolder)).toEqual('cordova-config.json');
            done();
        });
    });

});
