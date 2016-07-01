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

var cli = require("../src/cli"),
    Q = require('q'),
    cordova_lib = require('cordova-lib'),
    events = cordova_lib.events,
    cordova = cordova_lib.cordova,
    telemetry = require('../src/telemetry'),
    logger = require('cordova-common').CordovaLogger.get();

//avoid node complaining of too many event listener added
process.setMaxListeners(0);

describe("cordova cli", function () {
    beforeEach(function () {
        // Event registration is currently process-global. Since all jasmine
        // tests in a directory run in a single process (and in parallel),
        // logging events registered as a result of the "--verbose" flag in
        // CLI testing below would cause lots of logging messages printed out by other specs.

        // This is required so that fake events chaining works (events.on('log').on('verbose')...)
        var FakeEvents = function FakeEvents() {};
        FakeEvents.prototype.on = function fakeOn () {
            return new FakeEvents();
        };

        spyOn(events, "on").andReturn(new FakeEvents());

        // Spy and mute output
        spyOn(logger, 'results');
        spyOn(logger, 'warn');
        spyOn(console, 'log');

        // Prevent accidentally turning telemetry on/off during testing
        telemetry.turnOn = function() {};
        telemetry.turnOff = function() {};
        telemetry.track = function() {};
    });

    describe("options", function () {
        describe("version", function () {
            var version = require("../package").version;

            beforeEach(function () {
            });
            
            it("will spit out the version with -v", function (done) {
                cli(["node", "cordova", "-v"], function() {
                    expect(logger.results.mostRecentCall.args[0]).toMatch(version);
                    done();
                });
            });

            it("will spit out the version with --version", function (done) {
                cli(["node", "cordova", "--version"], function () {
                    expect(logger.results.mostRecentCall.args[0]).toMatch(version);
                    done()
                });
            });

            it("will spit out the version with -v anywhere", function (done) {
                cli(["node", "cordova", "one", "-v", "three"], function () {
                    expect(logger.results.mostRecentCall.args[0]).toMatch(version);
                    done();
                });
            });
        });
    });

    describe("project commands other than plugin and platform", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "build").andReturn(Q());
        });

        it("will call command with all arguments passed through", function (done) {
            cli(["node", "cordova", "build", "blackberry10", "--", "-k", "abcd1234"], function () {
                expect(cordova.raw.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { argv: ['-k', 'abcd1234'] }, verbose: false, silent: false, browserify: false, nohooks: [], searchpath: undefined, fetch: false });
                done();
            });
        });

        it("will consume the first instance of -d", function (done) {
            cli(["node", "cordova", "-d", "build", "blackberry10", "--", "-k", "abcd1234", "-d"], function () {
                expect(cordova.raw.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '-d'] }, verbose: true, silent: false, browserify: false, nohooks: [], searchpath: undefined, fetch: false });
                done();
            });
        });

        it("will consume the first instance of --verbose", function (done) {
            cli(["node", "cordova", "--verbose", "build", "blackberry10", "--", "-k", "abcd1234", "--verbose"], function () {
                expect(cordova.raw.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '--verbose'] }, verbose: true, silent: false, browserify: false, nohooks: [], searchpath: undefined, fetch: false });
                done();
            });
        });

        it("will consume the first instance of either --verbose or -d", function (done) {
            cli(["node", "cordova", "--verbose", "build", "blackberry10", "--", "-k", "abcd1234", "-d"], function () {
                expect(cordova.raw.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '-d'] }, verbose: true, silent: false, browserify: false, nohooks: [], searchpath: undefined, fetch: false });
                done();
            });
        });

        it("will consume the first instance of either --verbose or -d", function (done) {
            cli(["node", "cordova", "-d", "build", "blackberry10", "--", "-k", "abcd1234", "--verbose"], function () {
                expect(cordova.raw.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '--verbose'] }, verbose: true, silent: false, browserify: false, nohooks: [], searchpath: undefined, fetch: false });
                done();
            });
        });

        it("will consume the first instance of --silent", function (done) {
            cli(["node", "cordova", "--silent", "build", "blackberry10", "--", "-k", "abcd1234", "--silent"], function () {
                expect(cordova.raw.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { silent: true, argv: ['-k', 'abcd1234', '--silent'] }, verbose: false, silent: true, browserify: false, nohooks: [], searchpath: undefined, fetch: false });
                done();
            });
        });
    });

    describe("create", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "create").andReturn(Q());
            spyOn(cordova_lib, "CordovaError");
        });

        it("calls cordova raw create", function (done) {
            cli(["node", "cordova", "create", "a", "b", "c", "--link-to", "c:\\personalWWW"], function () {
                expect(cordova.raw.create).toHaveBeenCalledWith("a", "b", "c", jasmine.any(Object), jasmine.any(Object));
                done();
            });
        });
    });

    describe("plugin", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "plugin").andReturn(Q());
        });

        it("will pass variables", function (done) {
            cli(["node", "cordova", "plugin", "add", "facebook", "--variable", "FOO=foo"], function () {
                expect(cordova.raw.plugin).toHaveBeenCalledWith(
                    "add",
                    ["facebook"],
                    jasmine.any(Object)
                );
                var opts = cordova.raw.plugin.calls[0].args[2];
                expect(opts.cli_variables.FOO).toBe('foo');
                done();
            });
        });

        it("will  support variables with =", function (done) {
            cli(["node", "cordova", "plugin", "add", "facebook", "--variable", "MOTO=DELTA=WAS=HERE"], function () {
                expect(cordova.raw.plugin).toHaveBeenCalledWith(
                    "add",
                    ["facebook"],
                    jasmine.any(Object)
                );
                var opts = cordova.raw.plugin.calls[0].args[2];
                expect(opts.cli_variables.MOTO).toBe('DELTA=WAS=HERE');
                done();
            });
        });

        it("will pass hook patterns to suppress", function (done) {
            cli(["node", "cordova", "plugin", "add", "facebook", "--nohooks", "before_plugin_add"], function () {
                expect(cordova.raw.plugin).toHaveBeenCalledWith(
                    "add",
                    ["facebook"],
                    jasmine.any(Object)
                );
                var opts = cordova.raw.plugin.calls[0].args[2];
                expect(opts.nohooks[0]).toBe("before_plugin_add");
                done();
            });
        });

    });
    
    describe("telemetry", function() {
       it("skips prompt when user runs 'cordova telemetry X'", function(done) {
           var wasPromptShown = false;
           spyOn(telemetry, "showPrompt").andCallFake(function () {
               wasPromptShown = true;
           });

           cli(["node", "cordova", "telemetry", "on"], function () {
               cli(["node", "cordova", "telemetry", "off"], function () {
                   expect(wasPromptShown).toBeFalsy();
                   done();
               });
           });         
       });
       
       it("is NOT collected when user runs 'cordova telemetry on' while NOT opted-in", function(done) {
           spyOn(telemetry, "isOptedIn").andReturn(false);
           spyOn(telemetry, "isCI").andReturn(false);
           
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "telemetry", "on"], function () {
               expect(telemetry.track).not.toHaveBeenCalled();
               done();
           });
       });
       
       it("is collected when user runs 'cordova telemetry off' while opted-in", function(done) {
           spyOn(telemetry, "isOptedIn").andReturn(true);
           spyOn(telemetry, "isCI").andReturn(false);
           
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "telemetry", "off"], function () {
               expect(telemetry.track).toHaveBeenCalledWith("telemetry", "off", "via-cordova-telemetry-cmd", "successful");
               done();
           });
       });
       
       it("tracks platforms/plugins subcommands", function(done) {
           spyOn(telemetry, "isOptedIn").andReturn(true);
           spyOn(telemetry, "isCI").andReturn(false);
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(true);
           spyOn(cordova.raw, "platform").andReturn(Q());
           
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "platform", "add", "ios"], function () {
               expect(telemetry.track).toHaveBeenCalledWith("platform", "add", "successful");
               done();
           });
       });
       
       it("shows prompt if user neither opted in or out yet", function(done) {
           spyOn(cordova.raw, "prepare").andReturn(Q());
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(false);
           
           spyOn(telemetry, "isCI").andReturn(false);
           spyOn(telemetry, "isNoTelemetryFlag").andReturn(false);
           spyOn(telemetry, "showPrompt").andReturn(Q(false));
           
           cli(["node", "cordova", "prepare"], function () {
               expect(telemetry.showPrompt).toHaveBeenCalled();
               done();
           });
       });

       // ToDO: Figure out a way to modify default timeout
       // ... Timeout overriding isn't working anymore due to a bug with jasmine-node
       xit("opts-out if prompt times out AND it tracks opt-out", function(done) {
           // Remove any optOut settings that might have been saved
           // ... and force prompt to be shown
           telemetry.clear();
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(false);
           spyOn(telemetry, "isCI").andReturn(false);
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "--version"], function () {
               expect(telemetry.isOptedIn()).toBeFalsy();
               expect(telemetry.track).toHaveBeenCalledWith("telemetry", "off", "via-cli-prompt-choice", "successful");
               done();
           });
       }/*, 45000*/);
       
       it("is NOT collected in CI environments and doesn't prompt", function(done) {
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(true);
           spyOn(telemetry, "isOptedIn").andReturn(true);
           spyOn(telemetry, "isCI").andReturn(true);
           
           spyOn(telemetry, "showPrompt");
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "--version"], function () {
               expect(telemetry.showPrompt).not.toHaveBeenCalled();
               expect(telemetry.track).not.toHaveBeenCalled();
               done();
           });
       });
       
       it("is NOT collected when --no-telemetry flag found and doesn't prompt", function(done) {
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(false);
           spyOn(telemetry, "isOptedIn").andReturn(true);
           spyOn(telemetry, "isCI").andReturn(false);
           
           spyOn(telemetry, "showPrompt");
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "--version", "--no-telemetry"], function () {
               expect(telemetry.showPrompt).not.toHaveBeenCalled();
               expect(telemetry.track).not.toHaveBeenCalled();
               done();
           });
       });
       
       it("is NOT collected if user opted out", function(done) {
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(true);
           spyOn(telemetry, "isOptedIn").andReturn(false);
           spyOn(telemetry, "isCI").andReturn(false);
           
           spyOn(telemetry, "showPrompt");
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "--version"], function () {
               expect(telemetry.showPrompt).not.toHaveBeenCalled();
               expect(telemetry.track).not.toHaveBeenCalled();
               done();
           });
       });
       
       it("is collected if user opted in", function(done) {
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(true);
           spyOn(telemetry, "isOptedIn").andReturn(true);
           spyOn(telemetry, "isCI").andReturn(false);
           
           spyOn(telemetry, "showPrompt");
           spyOn(telemetry, "track");
           
           cli(["node", "cordova", "--version"], function () {
               expect(telemetry.showPrompt).not.toHaveBeenCalled();
               expect(telemetry.track).toHaveBeenCalled();
               done();
           });
       });
       
       it("track opt-out that happened via 'cordova telemetry off' even if user is NOT opted-in ", function(done) {
           spyOn(telemetry, "isCI").andReturn(false);
           spyOn(telemetry, "isOptedIn").andReturn(false); // same as calling `telemetry.turnOff();`
           spyOn(telemetry, "hasUserOptedInOrOut").andReturn(true);
           spyOn(telemetry, "track");

           expect(telemetry.isOptedIn()).toBeFalsy();

           cli(["node", "cordova", "telemetry", "off"], function () {
               expect(telemetry.isOptedIn()).toBeFalsy();
               expect(telemetry.track).toHaveBeenCalledWith("telemetry", "off", "via-cordova-telemetry-cmd", "successful");
               done();
           });
       });
    });
});
