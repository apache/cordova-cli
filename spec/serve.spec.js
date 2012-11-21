var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    request = require('request'),
    fs = require('fs'),
    util = require('../src/util'),
    hooker = require('../src/hooker'),
    tempDir = path.join(__dirname, '..', 'temp'),
    http = require('http'),
    android_parser = require('../src/metadata/android_parser'),
    ios_parser = require('../src/metadata/ios_parser'),
    blackberry_parser = require('../src/metadata/blackberry_parser');

var cwd = process.cwd();

describe('serve command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.serve('android');
        }).toThrow();
    });


    describe('`serve`', function() {
        var payloads = {
            android: 'This is the Android test file.',
            ios: 'This is the iOS test file.'
        };

        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            cordova.platform('add', 'android');
            cordova.platform('add', 'ios');

            // Write testing HTML files into the directory.
            fs.writeFileSync(path.join(tempDir, 'platforms', 'android', 'assets', 'www', 'test.html'), payloads.android);
            fs.writeFileSync(path.join(tempDir, 'platforms', 'ios', 'www', 'test.html'), payloads.ios);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        function test_serve(platform, path, expectedContents, port) {
            return function() {
                var ret;
                runs(function() {
                    ret = port ? cordova.serve(platform, port) : cordova.serve(platform);
                });

                waitsFor(function() {
                    return ret.server;
                }, 'the server should start', 1000);

                var done, errorCB;
                runs(function() {
                    expect(ret.server).toBeDefined();
                    errorCB = jasmine.createSpy();
                    http.get({
                        host: 'localhost',
                        port: port || 8000,
                        path: path
                    }).on('response', function(res) {
                        var response = '';
                        res.on('data', function(data) {
                            response += data;
                        });
                        res.on('end', function() {
                            expect(res.statusCode).toEqual(200);
                            expect(response).toEqual(expectedContents);
                            done = true;
                        });
                    }).on('error', errorCB);
                });

                waitsFor(function() {
                    return done;
                }, 'the HTTP request should complete', 1000);

                runs(function() {
                    expect(done).toBeTruthy();
                    expect(errorCB).not.toHaveBeenCalled();

                    ret.server.close();
                });
            };
        };

        it('should serve from top-level www if the file exists there', function() {
            var payload = 'This is test file.';
            fs.writeFileSync(path.join(tempDir, 'www', 'test.html'), payload);
            test_serve('android', '/test.html', payload)();
        });

        it('should fall back to assets/www on Android', test_serve('android', '/test.html', payloads.android));
        it('should fall back to www on iOS', test_serve('ios', '/test.html', payloads.ios));

        it('should honour a custom port setting', test_serve('android', '/test.html', payloads.android, 9001));
    });
});

/*

        describe('without any libraries cloned', function() {
            var lib = path.join(__dirname, '..', 'lib');
            var libs = fs.readdirSync(lib);
            
            beforeEach(function() {
                libs.forEach(function(p) {
                    var s = path.join(lib, p);
                    var d = path.join(lib, p + '-bkup');
                    shell.mv(s, d);
                });
            });
            afterEach(function() {
                libs.forEach(function(p) {
                    var s = path.join(lib, p + '-bkup', '*');
                    var d = path.join(lib, p);
                    shell.mkdir(d);
                    shell.mv(s, d);
                    shell.rm('-rf', path.join(lib, p + '-bkup'));
                });
            });
            it('should download the android library', function() {
                var s = spyOn(request, 'get');
                try {
                    cordova.platform('add', 'android', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0]).toMatch(/cordova-android\/zipball/);
            });
            it('should download the ios library', function() {
                var s = spyOn(request, 'get');
                try {
                    cordova.platform('add', 'ios', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0]).toMatch(/cordova-ios\/zipball/);
            });
            it('should download the blackberry library', function() {
                var s = spyOn(request, 'get');
                try {
                    cordova.platform('add', 'blackberry', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0]).toMatch(/cordova-blackberry-webworks\/zipball/);
            });
            it('should add a basic android project');
            it('should add a basic ios project');
            it('should add a basic blackberry project');
        });

        describe('android', function() {
            it('should add a basic android project', function() {
                cordova.platform('add', 'android');
                expect(fs.existsSync(path.join(tempDir, 'platforms', 'android', 'AndroidManifest.xml'))).toBe(true);
            });
            it('should call android_parser\'s update_project', function() {
                var s = spyOn(android_parser.prototype, 'update_project');
                cordova.platform('add', 'android');
                expect(s).toHaveBeenCalled();
            });
        });
        describe('ios', function() {
            it('should add a basic ios project', function() {
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add ios callback");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'ios', 'www'))).toBe(true);
                });
            });
            it('should call ios_parser\'s update_project', function() {
                var s = spyOn(ios_parser.prototype, 'update_project');
                cordova.platform('add', 'ios');
                expect(s).toHaveBeenCalled();
            });
            it('should error out if user does not have xcode 4.5 or above installed', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0,output:'Xcode 4.2.1'});
                expect(function() {
                    cordova.platform('add', 'ios');
                }).toThrow();
            });
            it('should error out if user does not have xcode installed at all', function() {
                var s = spyOn(shell, 'exec').andReturn({code:1});
                expect(function() {
                    cordova.platform('add', 'ios');
                }).toThrow();
            });
        });
        describe('blackberry-10', function() {
            it('should add a basic blackberry project', function() {
                var cb = jasmine.createSpy();
                var s = spyOn(require('prompt'), 'get').andReturn(true);

                runs(function() {
                    cordova.platform('add', 'blackberry-10', cb);
                    s.mostRecentCall.args[1](null, {}); // fake out prompt
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add blackberry");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'blackberry-10', 'www'))).toBe(true);
                });
            });
            it('should call blackberry_parser\'s update_project', function() {
                var s = spyOn(blackberry_parser.prototype, 'update_project');
                cordova.platform('add', 'blackberry-10');
                expect(s).toHaveBeenCalled();
            });
        });
        it('should handle multiple platforms', function() {
            var cb = jasmine.createSpy();
            runs(function() {
                cordova.platform('add', ['android', 'ios'], cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "platform add ios+android callback");
            runs(function() {
                expect(fs.existsSync(path.join(tempDir, 'platforms', 'android', 'AndroidManifest.xml'))).toBe(true);
                expect(fs.existsSync(path.join(tempDir, 'platforms', 'ios', 'www'))).toBe(true);
            });
        });
    });

    var removing_tests = function(_invocation) {
        return function() {
            beforeEach(function() {
                cordova.create(tempDir);
                process.chdir(tempDir);
            });

            afterEach(function() {
                process.chdir(cwd);
            });

            it('should remove a supported and added platform', function() {
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', ['android', 'ios'], cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "android+ios platfomr add callback");
                runs(function() {
                    cordova.platform(_invocation, 'android');
                    expect(cordova.platform('ls').length).toEqual(1);
                    expect(cordova.platform('ls')[0]).toEqual('ios');
                });
            });
            it('should be able to remove multiple platforms', function() {
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', ['android', 'ios'], cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "android+ios platfomr add callback");
                runs(function() {
                    cordova.platform(_invocation, ['android','ios']);
                    expect(cordova.platform('ls').length).toEqual(0);
                });
            });
        };
    };
    describe('`rm`', removing_tests('rm'));
    describe('`remove`', removing_tests('remove'));

    describe('hooks', function() {
        var s;
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
            s = spyOn(hooker.prototype, 'fire').andReturn(true);
        });
        afterEach(function() {
            process.chdir(cwd);
            shell.rm('-rf', tempDir);
        });

        describe('list (ls) hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform();
                expect(s).toHaveBeenCalledWith('before_platform_ls');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform();
                expect(s).toHaveBeenCalledWith('after_platform_ls');
            });
        });
        describe('remove (rm) hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform('rm', 'android');
                expect(s).toHaveBeenCalledWith('before_platform_rm');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform('rm', 'android');
                expect(s).toHaveBeenCalledWith('after_platform_rm');
            });
        });
        describe('add hooks', function() {
            it('should fire before hooks through the hooker module', function() {
                cordova.platform('add', 'android');
                expect(s).toHaveBeenCalledWith('before_platform_add');
            });
            it('should fire after hooks through the hooker module', function() {
                cordova.platform('add', 'android');
                expect(s).toHaveBeenCalledWith('after_platform_add');
            });
        });
    });
});
*/
