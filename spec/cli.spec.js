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

const path = require('path');
const rewire = require('rewire');
const { events, cordova } = require('cordova-lib');
const telemetry = require('../src/telemetry');

describe('cordova cli', () => {
    let cli, logger;

    beforeEach(() => {
        cli = rewire('../src/cli');

        // Event registration is currently process-global. Since all jasmine
        // tests in a directory run in a single process (and in parallel),
        // logging events registered as a result of the "--verbose" flag in
        // CLI testing below would cause lots of logging messages printed out by other specs.

        // Prevent listeners from piling up
        spyOn(process, 'on');
        events.removeAllListeners();

        // Spy and mute output
        logger = jasmine.createSpyObj('logger', [
            'subscribe', 'setLevel', 'results', 'warn'
        ]);
        cli.__set__({ logger });
        spyOn(console, 'log');

        // Prevent accidentally turning telemetry on/off during testing
        spyOn(telemetry, 'track');
        spyOn(telemetry, 'turnOn');
        spyOn(telemetry, 'turnOff');
        spyOn(telemetry, 'showPrompt').and.returnValue(Promise.resolve());
    });

    describe('options', () => {
        describe('version', () => {
            const version = require('../package').version;

            it('Test#001 : will spit out the version with -v', () => {
                return cli(['node', 'cordova', '-v']).then(() => {
                    expect(logger.results.calls.mostRecent().args[0]).toMatch(version);
                });
            }, 60000);

            it('Test#002 : will spit out the version with --version', () => {
                return cli(['node', 'cordova', '--version']).then(() => {
                    expect(logger.results.calls.mostRecent().args[0]).toMatch(version);
                });
            }, 60000);

            it('Test#003 : will spit out the version with -v anywhere', () => {
                return cli(['node', 'cordova', 'one', '-v', 'three']).then(() => {
                    expect(logger.results.calls.mostRecent().args[0]).toMatch(version);
                });
            }, 60000);
        });
    });

    describe('build', () => {
        beforeEach(() => {
            spyOn(cordova, 'build').and.returnValue(Promise.resolve());
        });

        it('Test#005 : will call command with all arguments passed through', () => {
            return cli(['node', 'cordova', 'build', 'blackberry10', '--', '-k', 'abcd1234']).then(() => {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { argv: ['-k', 'abcd1234'] }, verbose: false, silent: false, nohooks: [], searchpath: undefined });
            });
        }, 60000);

        it('Test#006 : will consume the first instance of -d', () => {
            return cli(['node', 'cordova', '-d', 'build', 'blackberry10', '--', '-k', 'abcd1234', '-d']).then(() => {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '-d'] }, verbose: true, silent: false, nohooks: [], searchpath: undefined });
            });
        });

        it('Test#007 : will consume the first instance of --verbose', () => {
            return cli(['node', 'cordova', '--verbose', 'build', 'blackberry10', '--', '-k', 'abcd1234', '--verbose']).then(() => {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '--verbose'] }, verbose: true, silent: false, nohooks: [], searchpath: undefined });
            });
        });

        it('Test#008 : will consume the first instance of either --verbose or -d', () => {
            return cli(['node', 'cordova', '--verbose', 'build', 'blackberry10', '--', '-k', 'abcd1234', '-d']).then(() => {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '-d'] }, verbose: true, silent: false, nohooks: [], searchpath: undefined });
            });
        });

        it('Test#009 : will consume the first instance of either --verbose or -d', () => {
            return cli(['node', 'cordova', '-d', 'build', 'blackberry10', '--', '-k', 'abcd1234', '--verbose']).then(() => {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { verbose: true, argv: ['-k', 'abcd1234', '--verbose'] }, verbose: true, silent: false, nohooks: [], searchpath: undefined });
            });
        });

        it('Test#010 : will consume the first instance of --silent', () => {
            return cli(['node', 'cordova', '--silent', 'build', 'blackberry10', '--', '-k', 'abcd1234', '--silent']).then(() => {
                expect(cordova.build).toHaveBeenCalledWith({ platforms: ['blackberry10'], options: { silent: true, argv: ['-k', 'abcd1234', '--silent'] }, verbose: false, silent: true, nohooks: [], searchpath: undefined });
            });
        });
    });

    describe('create', () => {
        beforeEach(() => {
            cli.__set__({
                cordovaCreate: jasmine.createSpy('cordovaCreate').and.resolveTo()
            });
        });

        it('Test#011 : calls cordova create', async () => {
            const dest = 'a';
            const opts = { id: 'b', name: 'c', template: '../my-template' };
            await cli(['node', 'cordova', 'create', dest, opts.id, opts.name, '--template', opts.template]);

            expect(cli.__get__('cordovaCreate')).toHaveBeenCalledWith(
                dest, jasmine.objectContaining(opts)
            );
        });
    });

    describe('plugin', () => {
        beforeEach(() => {
            spyOn(cordova, 'plugin').and.returnValue(Promise.resolve());
        });

        it('Test#012 : will pass variables', () => {
            return cli(['node', 'cordova', 'plugin', 'add', 'facebook', '--variable', 'FOO=foo']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['facebook'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.cli_variables.FOO).toBe('foo');
            });
        });

        it('Test#013 : will  support variables with =', () => {
            return cli(['node', 'cordova', 'plugin', 'add', 'facebook', '--variable', 'MOTO=DELTA=WAS=HERE']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['facebook'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.cli_variables.MOTO).toBe('DELTA=WAS=HERE');
            });
        });

        it('Test#014 : will pass hook patterns to suppress', () => {
            return cli(['node', 'cordova', 'plugin', 'add', 'facebook', '--nohooks', 'before_plugin_add']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['facebook'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.nohooks[0]).toBe('before_plugin_add');
            });
        });

        it('Test #015 : (add) will pass save:true', () => {
            return cli(['node', 'cordova', 'plugin', 'add', 'device']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(true);
            });
        });

        it('Test #016 : (add) will pass save:false', () => {
            return cli(['node', 'cordova', 'plugin', 'add', 'device', '--nosave']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(false);
            });
        });

        it('Test #017: (remove) will pass save:false', () => {
            return cli(['node', 'cordova', 'plugin', 'remove', 'device', '--nosave']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'remove',
                    ['device'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(false);
            });
        });

        it('Test #018 : (remove) autosave is default and will pass save:true', () => {
            return cli(['node', 'cordova', 'plugin', 'remove', 'device']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'remove',
                    ['device'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save).toBe(true);
            });
        });

        it('(add) will pass save-exact:true', () => {
            return cli(['node', 'cordova', 'plugin', 'add', 'device', '--save-exact']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.save_exact).toBe(true);
            });
        });

        it('(add) will pass noprod:true and production:false', () => {
            return cli(['node', 'cordova', 'plugin', 'add', 'device', '--noprod']).then(() => {
                expect(cordova.plugin).toHaveBeenCalledWith(
                    'add',
                    ['device'],
                    jasmine.any(Object)
                );
                const opts = cordova.plugin.calls.argsFor(0)[2];
                expect(opts.production).toBe(false);
            });
        });
    });

    describe('telemetry', () => {
        const Insight = require('insight');
        let isOptedOut;

        beforeEach(() => {
            // Allow testing if we _really_ would send tracking requests
            telemetry.track.and.callThrough();
            telemetry.turnOn.and.callThrough();
            telemetry.turnOff.and.callThrough();
            spyOn(Insight.prototype, 'track').and.callThrough();
            spyOn(Insight.prototype, '_save');
            spyOnProperty(Insight.prototype, 'optOut', 'get')
                .and.callFake(() => isOptedOut);
            spyOnProperty(Insight.prototype, 'optOut', 'set')
                .and.callFake(x => { isOptedOut = x; });

            // Set a normal opted-in user as default
            spyOn(telemetry, 'isCI').and.returnValue(false);
            isOptedOut = false;
        });

        it("Test#023 : skips prompt when user runs 'cordova telemetry X'", () => {
            isOptedOut = undefined;

            return Promise.resolve()
                .then(_ => cli(['node', 'cordova', 'telemetry', 'on']))
                .then(_ => cli(['node', 'cordova', 'telemetry', 'off']))
                .then(() => {
                    expect(telemetry.showPrompt).not.toHaveBeenCalled();
                });
        });

        it("Test#024 : is NOT collected when user runs 'cordova telemetry on' while NOT opted-in", () => {
            isOptedOut = true;

            return cli(['node', 'cordova', 'telemetry', 'on']).then(() => {
                expect(Insight.prototype.track).not.toHaveBeenCalled();
            });
        });

        it("Test#025 : is collected when user runs 'cordova telemetry off' while opted-in", () => {
            return cli(['node', 'cordova', 'telemetry', 'off']).then(() => {
                expect(telemetry.track).toHaveBeenCalledWith('telemetry', 'off', 'via-cordova-telemetry-cmd', 'successful');
                expect(Insight.prototype.track).toHaveBeenCalled();
                expect(Insight.prototype._save).toHaveBeenCalled();
            });
        });

        it('Test#026 : tracks platforms/plugins subcommands', () => {
            spyOn(cordova, 'platform').and.returnValue(Promise.resolve());

            return cli(['node', 'cordova', 'platform', 'add', 'ios']).then(() => {
                expect(telemetry.track).toHaveBeenCalledWith('platform', 'add', 'successful');
                expect(Insight.prototype.track).toHaveBeenCalled();
                expect(Insight.prototype._save).toHaveBeenCalled();
            });
        });

        it('Test#027 : shows prompt if user neither opted in or out yet', () => {
            isOptedOut = undefined;
            spyOn(cordova, 'prepare').and.returnValue(Promise.resolve());

            return cli(['node', 'cordova', 'prepare']).then(() => {
                expect(telemetry.showPrompt).toHaveBeenCalled();
            });
        });

        it('Test#029 : is NOT collected in CI environments', () => {
            telemetry.isCI.and.returnValue(true);

            return cli(['node', 'cordova', '--version']).then(() => {
                expect(telemetry.track).not.toHaveBeenCalled();
            });
        });

        it("Test#030 : is NOT collected when --no-telemetry flag found and doesn't prompt", () => {
            isOptedOut = undefined;

            return cli(['node', 'cordova', '--version', '--no-telemetry']).then(() => {
                expect(telemetry.showPrompt).not.toHaveBeenCalled();
                expect(Insight.prototype.track).not.toHaveBeenCalled();
            });
        });

        it("Test#033 : track opt-out that happened via 'cordova telemetry off' even if user is NOT opted-in ", () => {
            isOptedOut = true;

            return cli(['node', 'cordova', 'telemetry', 'off']).then(() => {
                expect(telemetry.isOptedIn()).toBeFalsy();
                expect(telemetry.track).toHaveBeenCalledWith('telemetry', 'off', 'via-cordova-telemetry-cmd', 'successful');
                expect(Insight.prototype.track).toHaveBeenCalled();
                expect(Insight.prototype._save).toHaveBeenCalled();
            });
        });
    });

    describe('platform', () => {
        beforeEach(() => {
            spyOn(cordova, 'platform').and.returnValue(Promise.resolve());
        });

        it('Test #034 : (add) autosave is the default setting for platform add', () => {
            return cli(['node', 'cordova', 'platform', 'add', 'ios']).then(() => {
                expect(cordova.platform).toHaveBeenCalledWith(
                    'add',
                    ['ios'],
                    jasmine.any(Object)
                );
                const opts = cordova.platform.calls.argsFor(0)[2];
                expect(opts.save).toBe(true);
            });
        });

        it('Test #035 : (add) platform is not saved when --nosave is passed in', () => {
            return cli(['node', 'cordova', 'platform', 'add', 'ios', '--nosave']).then(() => {
                expect(cordova.platform).toHaveBeenCalledWith(
                    'add',
                    ['ios'],
                    jasmine.any(Object)
                );
                const opts = cordova.platform.calls.argsFor(0)[2];
                expect(opts.save).toBe(false);
            });
        });

        it('Test #036 : (remove) autosave is the default setting for platform remove', () => {
            return cli(['node', 'cordova', 'platform', 'remove', 'ios']).then(() => {
                expect(cordova.platform).toHaveBeenCalledWith(
                    'remove',
                    ['ios'],
                    jasmine.any(Object)
                );
                const opts = cordova.platform.calls.argsFor(0)[2];
                expect(opts.save).toBe(true);
            });
        });

        it('Test #037 : (remove) platform is not removed when --nosave is passed in', () => {
            return cli(['node', 'cordova', 'platform', 'remove', 'ios', '--nosave']).then(() => {
                expect(cordova.platform).toHaveBeenCalledWith(
                    'remove',
                    ['ios'],
                    jasmine.any(Object)
                );
                const opts = cordova.platform.calls.argsFor(0)[2];
                expect(opts.save).toBe(false);
            });
        });
    });

    describe('config', () => {
        let clirevert, confrevert, editorArgs, confHolder;
        const cordovaConfig = {};

        const confMock = {
            all: cordovaConfig,
            set (key, value) {
                cordovaConfig[key] = value;
            },
            del (key) {
                delete cordovaConfig[key];
            },
            path () {
                confHolder = 'Pathcalled';
                return 'some/path/cordova-config.json';
            },
            get (key) {
                confHolder = cordovaConfig[key];
                return cordovaConfig[key];
            }
        };

        beforeEach(() => {
            clirevert = cli.__set__('editor', (path1, cb) => {
                editorArgs = path1();
                cb();
            });

            confrevert = cli.__set__('conf', confMock);
        });

        afterEach(() => {
            clirevert();
            confrevert();
            confHolder = undefined;
        });

        it('Test#042 : config set is called with true', () => {
            return cli(['node', 'cordova', 'config', 'set', 'foo', 'true', '--silent']).then(() => {
                expect(cordovaConfig.foo).toBe('true');
            });
        });

        it('Test#043 : config delete is called', () => {
            return cli(['node', 'cordova', 'config', 'delete', 'foo']).then(() => {
                expect(cordovaConfig.foo).toBeUndefined();
            });
        });

        it('Test#044 : config set is called even without value, defaults to true', () => {
            return cli(['node', 'cordova', 'config', 'set', 'foo']).then(() => {
                expect(cordovaConfig.foo).toBe(true);
            });
        });

        it('Test #045 : config get is called', () => {
            return cli(['node', 'cordova', 'config', 'get', 'foo']).then(() => {
                expect(confHolder).toBe(true);
            });
        });

        it('Test #046 : config edit is called', () => {
            return cli(['node', 'cordova', 'config', 'edit']).then(() => {
                expect(path.basename(editorArgs)).toEqual('cordova-config.json');
                expect(confHolder).toEqual('Pathcalled');
            });
        });

        it('Test #047 : config ls is called', () => {
            const expectedOutput = JSON.stringify(cordovaConfig, null, 4);

            return cli(['node', 'cordova', 'config', 'ls']).then(() => {
                expect(logger.results).toHaveBeenCalledWith(expectedOutput);
            });
        });
    });

    describe('requirements', () => {
        beforeEach(() => {
            spyOn(cordova, 'requirements').and.returnValue(Promise.resolve({ browser: [] }));
        });

        it('should succeed on browser as the platform argument to the requirement check method.', () => {
            return cli(['node', 'cordova', 'requirements', 'browser']).then(() => {
                expect(cordova.requirements).toHaveBeenCalledWith(['browser']);
            });
        });
    });

    describe('node requirement', () => {
        it('should warn users about unsupported node version', () => {
            cli.__set__('NODE_VERSION', 'v6.1.0');
            cli.__set__('NODE_VERSION_DEPRECATING_RANGE', null);
            cli.__set__('NODE_VERSION_REQUIREMENT', '>=8');

            return cli(['node', 'cordova']).then(() => {
                const errorMsg = logger.warn.calls.allArgs().toString();
                expect(errorMsg).toMatch(/Node.js v6.1.0 is no longer supported./);
            });
        });

        it('should not warn users about unsupported node version', () => {
            cli.__set__('NODE_VERSION', 'v8.0.0');
            cli.__set__('NODE_VERSION_DEPRECATING_RANGE', null);
            cli.__set__('NODE_VERSION_REQUIREMENT', '>=8');

            return cli(['node', 'cordova']).then(() => {
                const errorMsg = logger.warn.calls.allArgs().toString();
                expect(errorMsg).not.toMatch(/Node.js v6.1.0 is no longer supported./);
            });
        });

        it('should warn users about deprecated node version', () => {
            cli.__set__('NODE_VERSION', 'v8.0.0');
            cli.__set__('NODE_VERSION_DEPRECATING_RANGE', '<10');
            cli.__set__('NODE_VERSION_REQUIREMENT', '>=8');

            return cli(['node', 'cordova']).then(() => {
                const errorMsg = logger.warn.calls.allArgs().toString();
                expect(errorMsg).toMatch(/Node.js v8.0.0 has been deprecated./);
            });
        });

        it('should warn users about deprecated node version', () => {
            cli.__set__('NODE_VERSION', 'v10.0.0');
            cli.__set__('NODE_VERSION_DEPRECATING_RANGE', '<10');
            cli.__set__('NODE_VERSION_REQUIREMENT', '>=8');

            return cli(['node', 'cordova']).then(() => {
                const errorMsg = logger.warn.calls.allArgs().toString();
                expect(errorMsg).not.toMatch(/Node.js v8.0.0 has been deprecated./);
            });
        });
    });
});
