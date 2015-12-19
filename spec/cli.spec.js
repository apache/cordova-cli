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
        spyOn(console, 'log');
    });

    describe("options", function () {
        describe("version", function () {
            var version = require("../package").version;

            beforeEach(function () {
            });

            it("will spit out the version with -v", function () {
                cli(["node", "cordova", "-v"]);
                expect(console.log.mostRecentCall.args[0]).toMatch(version);
            });

            it("will spit out the version with --version", function () {
                cli(["node", "cordova", "--version"]);
                expect(console.log.mostRecentCall.args[0]).toMatch(version);
            });

            it("will spit out the version with -v anywhere", function () {
                cli(["node", "cordova", "one", "-v", "three"]);
                expect(console.log.mostRecentCall.args[0]).toMatch(version);
            });
        });
    });

    describe("project commands other than plugin and platform", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "build").andReturn(Q());
        });

        it("will call command with all arguments passed through", function () {
            cli(["node", "cordova", "build", "blackberry10", "--", "-k", "abcd1234"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({ platforms : [ 'blackberry10' ], options : { argv : [ '-k', 'abcd1234' ] }, verbose : false, silent : false, browserify : false, searchpath : undefined });
        });

        it("will consume the first instance of -d", function () {
            cli(["node", "cordova", "-d", "build", "blackberry10", "--", "-k", "abcd1234", "-d"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({ platforms : [ 'blackberry10' ], options : { verbose : true, argv : [ '-k', 'abcd1234', '-d' ] }, verbose : true, silent : false, browserify : false, searchpath : undefined });
        });

        it("will consume the first instance of --verbose", function () {
            cli(["node", "cordova", "--verbose", "build", "blackberry10", "--", "-k", "abcd1234", "--verbose"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({ platforms : [ 'blackberry10' ], options : { verbose : true, argv : [ '-k', 'abcd1234', '--verbose' ] }, verbose : true, silent : false, browserify : false, searchpath : undefined });
        });

        it("will consume the first instance of either --verbose of -d", function () {
            cli(["node", "cordova", "--verbose", "build", "blackberry10", "--", "-k", "abcd1234", "-d"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({ platforms : [ 'blackberry10' ], options : { verbose : true, argv : [ '-k', 'abcd1234', '-d' ] }, verbose : true, silent : false, browserify : false, searchpath : undefined });
        });

        it("will consume the first instance of either --verbose of -d", function () {
            cli(["node", "cordova", "-d", "build", "blackberry10", "--", "-k", "abcd1234", "--verbose"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({ platforms : [ 'blackberry10' ], options : { verbose : true, argv : [ '-k', 'abcd1234', '--verbose' ] }, verbose : true, silent : false, browserify : false, searchpath : undefined });
        });

        it("will consume the first instance of --silent", function () {
            cli(["node", "cordova", "--silent", "build", "blackberry10", "--",  "-k", "abcd1234", "--silent"]);
            expect(cordova.raw.build).toHaveBeenCalledWith({ platforms : [ 'blackberry10' ], options : { silent : true, argv : [ '-k', 'abcd1234', '--silent' ] }, verbose : false, silent : true, browserify : false, searchpath : undefined });
        });

    });

    describe("create", function () {
        beforeEach(function () {
            spyOn(cordova.raw, "create").andReturn(Q());
            spyOn(cordova_lib, "CordovaError");
        });

        it("calls cordova raw create", function () {
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

          it("will  support variables with =", function () {
            cli(["node", "cordova", "plugin", "add", "facebook", "--variable", "MOTO=DELTA=WAS=HERE"]);
            expect(cordova.raw.plugin).toHaveBeenCalledWith(
                "add",
                ["facebook"],
                jasmine.any(Object)
            );
            var opts = cordova.raw.plugin.calls[0].args[2];
            expect(opts.cli_variables.MOTO).toBe('DELTA=WAS=HERE');
        });

        it("will pass hook patterns to suppress", function () {
            cli(["node", "cordova", "plugin", "add", "facebook", "--nohooks", "before_plugin_add"]);
            expect(cordova.raw.plugin).toHaveBeenCalledWith(
                "add",
                ["facebook"],
                jasmine.any(Object)
            );
            var opts = cordova.raw.plugin.calls[0].args[2];
            expect(opts.nohooks[0]).toBe("before_plugin_add");
        });

    });
});
