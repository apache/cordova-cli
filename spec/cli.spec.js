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
    cordova = cordova_lib.cordova;

describe("cordova cli", function () {
    beforeEach(function () {
        // Event registration is currently process-global. Since all jasmine
        // tests in a directory run in a single process (and in parallel),
        // logging events registered as a result of the "--verbose" flag in
        // CLI testing below would cause lots of logging messages printed out by other specs.
        spyOn(events, "on");
        // Each call to cli() registers another listener for uncaughtException.
        // This results in a warning when too many of them are registered.
        process.removeAllListeners();
    });

    describe("options", function () {
        describe("version", function () {
            var version = require("../package").version;
            beforeEach(function () {
                spyOn(console, "log");
            });

            it("will spit out the version with -v", function () {
                cli(["node", "cordova", "-v"]);
                expect(console.log).toHaveBeenCalledWith(version);
            });

            it("will spit out the version with --version", function () {
                cli(["node", "cordova", "--version"]);
                expect(console.log).toHaveBeenCalledWith(version);
            });

            it("will spit out the version with -v anywher", function () {
                cli(["node", "cordova", "one", "-v", "three"]);
                expect(console.log).toHaveBeenCalledWith(version);
            });
        });
    });

    describe("project commands other than plugin and platform", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "build").andReturn(Q());
        });

        it("will call command with all arguments passed through", function () {
            cli(["node", "cordova", "build", "blackberry10", "--", "-k", "abcd1234"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({verbose: false, silent: false, platforms: ["blackberry10"], options: ["-k", "abcd1234"], browserify: false});
        });

        it("will consume the first instance of -d", function () {
            cli(["node", "cordova", "-d", "build", "blackberry10", "--", "-k", "abcd1234", "-d"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({verbose: true, silent: false, platforms: ["blackberry10"], options: ["-k", "abcd1234", "-d"], browserify: false});
        });

        it("will consume the first instance of --verbose", function () {
            cli(["node", "cordova", "--verbose", "build", "blackberry10", "--", "-k", "abcd1234", "--verbose"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({verbose: true, silent: false, platforms: ["blackberry10"], options: ["-k", "abcd1234", "--verbose"], browserify: false});
        });

        it("will consume the first instance of either --verbose of -d", function () {
            cli(["node", "cordova", "--verbose", "build", "blackberry10", "--", "-k", "abcd1234", "-d"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({verbose: true, silent: false, platforms: ["blackberry10"], options: ["-k", "abcd1234", "-d"], browserify: false});
        });

        it("will consume the first instance of either --verbose of -d", function () {
            cli(["node", "cordova", "-d", "build", "blackberry10", "--", "-k", "abcd1234", "--verbose"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({verbose: true, silent: false, platforms: ["blackberry10"], options: ["-k", "abcd1234", "--verbose"], browserify: false});
        });

        it("will consume the first instance of --silent", function () {
            cli(["node", "cordova", "--silent", "build", "blackberry10", "--",  "-k", "abcd1234", "--silent"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({verbose: false, silent: true, platforms: ["blackberry10"], options: ["-k", "abcd1234", "--silent"], browserify: false});
        });

    });

    describe("create args", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "create").andReturn(Q());
            spyOn(cordova_lib, "CordovaError");
        });

        it("will allow copy-from with ':' char", function () {
            cli(["node", "cordova", "create", "a", "b" , "c", "--copy-from", "c:\\personalWWW"]);
            expect(cordova.raw.create).toHaveBeenCalledWith("a","b","c", jasmine.any(Object));
        });

        it("will NOT allow copy-from starting with 'http'", function () {
            var threwAnException = false;
            try {
                cli(["node", "cordova", "create", "a", "b" , "c", "--copy-from", "http://www.somesite.com"]);
            }
            catch(e) {
                threwAnException = true;
            }
            expect(cordova_lib.CordovaError).toHaveBeenCalledWith('Only local paths for custom www assets are supported.');
            expect(threwAnException).toBe(true);
        });

        it("will allow link-to with ':' char", function () {
            cli(["node", "cordova", "create", "a", "b" , "c", "--link-to", "c:\\personalWWW"]);
            expect(cordova.raw.create).toHaveBeenCalledWith("a","b","c", jasmine.any(Object));
        });
    });

    describe("plugin", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "plugin").andReturn(Q());
        });

        it("will pass variables", function () {
            cli(["node", "cordova", "plugin", "add", "facebook", "--variable", "FOO=foo"]);
            expect(cordova.raw.plugin).toHaveBeenCalledWith(
                "add",
                ["facebook"],
                jasmine.any(Object)
            );
            var opts = cordova.raw.plugin.calls[0].args[2];
            expect(opts.cli_variables.FOO).toBe('foo');
        });
    });
});
