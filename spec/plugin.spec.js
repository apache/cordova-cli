var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    tempDir = path.join(__dirname, '..', 'temp'),
    fixturesDir = path.join(__dirname, 'fixtures'),
    testPlugin = path.join(fixturesDir, 'plugins', 'test'),
    androidPlugin = path.join(fixturesDir, 'plugins', 'android');

var cwd = process.cwd();

describe('plugin command', function() {
    beforeEach(function() {
        // Make a temp directory
        try { rmrf(tempDir); } catch(e) {}
        mkdirp(tempDir);
    });

    it('should run inside a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);

        process.chdir(tempDir);

        expect(function() {
            cordova.plugin();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.plugin();
        }).toThrow();
    });

    describe('`ls`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should list out no plugins for a fresh project', function() {
            process.chdir(tempDir);

            expect(cordova.plugin('ls')).toEqual('No plugins added. Use `cordova plugin add <plugin>`.');
        });
    });

    describe('`add`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });
        describe('failure', function() {
            it('should throw if your app has no platforms added', function() {
                expect(function() {
                    cordova.plugin('add', testPlugin);
                }).toThrow('You need at least one platform added to your app. Use `cordova platform add <platform>`.');
            });
            it('should throw if plugin does not support any app platforms', function() {
                var cb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    expect(function() {
                        cordova.plugin('add', androidPlugin);
                    }).toThrow('Plugin "android" does not support any of your application\'s platforms. Plugin platforms: android; your application\'s platforms: ios');
                });
            });
            it('should throw if plugin is already added to project', function() {
                var cb = jasmine.createSpy();
                var pluginCb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    cordova.plugin('add', testPlugin, pluginCb);
                });
                waitsFor(function() { return pluginCb.wasCalled; }, 'test plugin add');
                runs(function() {
                    expect(function() {
                        cordova.plugin('add', testPlugin, pluginCb);
                    }).toThrow('Plugin "test" already added to project.');
                });
            });
            it('should throw if plugin www assets collide with existing project www assets', function() {
            });
            it('should throw if plugin does not have a plugin.xml', function() {
                var cb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    expect(function() {
                        cordova.plugin('add', fixturesDir);
                    }).toThrow('Plugin "fixtures" does not have a plugin.xml in the root. Plugin must support the Cordova Plugin Specification: https://github.com/alunny/cordova-plugin-spec');
                });
            });
        });
        describe('success', function() {
            it('should add plugin www assets to project www folder', function() {
                var cb = jasmine.createSpy();
                var pluginCb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    cordova.plugin('add', testPlugin, pluginCb);
                });
                waitsFor(function() { return pluginCb.wasCalled; }, 'test plugin add');
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'www', 'test.js'))).toBe(true);
                });
            });
            it('should add the full plugin to the plugins directory', function() {
                var cb = jasmine.createSpy();
                var pluginCb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    cordova.plugin('add', testPlugin, pluginCb);
                });
                waitsFor(function() { return pluginCb.wasCalled; }, 'test plugin add');
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'plugins', 'test'))).toBe(true);
                });
            });
            describe('on Android', function() {
                it('should properly change any imports of ".R" to match the app\'s package name', function() {
                    
                });
            });
        });
    });

    describe('`remove`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });
        describe('failure', function() {
            it('should throw if your app has no platforms added', function() {
                expect(function() {
                    cordova.plugin('remove', testPlugin);
                }).toThrow('You need at least one platform added to your app. Use `cordova platform add <platform>`.');
            });
            it('should throw if plugin is not added to project', function() {
                var cb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    expect(function() {
                        cordova.plugin('remove', 'test', function() {});
                    }).toThrow('Plugin "test" not added to project.');
                });
            });
        });
        describe('success', function() {
            it('should remove plugin www assets from project www folder', function() {
                var cb = jasmine.createSpy();
                var pluginCb = jasmine.createSpy();
                var removeCb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    cordova.plugin('add', testPlugin, pluginCb);
                });
                waitsFor(function() { return pluginCb.wasCalled; }, 'test plugin add');
                runs(function() {
                    cordova.plugin('remove', 'test', removeCb);
                });
                waitsFor(function() { return removeCb.wasCalled; }, 'test plugin remove');
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'www', 'test.js'))).toBe(false);
                });
            });
            it('should remove the full plugin from the plugins directory', function() {
                var cb = jasmine.createSpy();
                var pluginCb = jasmine.createSpy();
                var removeCb = jasmine.createSpy();
                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, 'ios platform add');
                runs(function() {
                    cordova.plugin('add', testPlugin, pluginCb);
                });
                waitsFor(function() { return pluginCb.wasCalled; }, 'test plugin add');
                runs(function() {
                    cordova.plugin('remove', 'test', removeCb);
                });
                waitsFor(function() { return removeCb.wasCalled; }, 'test plugin remove');
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'plugins', 'test'))).toBe(false);
                });
            });
        });
    });
});

