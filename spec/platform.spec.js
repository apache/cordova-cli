var cordova = require('../cordova'),
    path = require('path'),
    shell = require('shelljs'),
    fs = require('fs'),
    et = require('elementtree'),
    config_parser = require('../src/config_parser'),
    helper = require('./helper'),
    util = require('../src/util'),
    platforms = require('../platforms'),
    tempDir = path.join(__dirname, '..', 'temp');

var cwd = process.cwd();

describe('platform command', function() {
    beforeEach(function() {
        // Make a temp directory
        shell.rm('-rf', tempDir);
        shell.mkdir('-p', tempDir);
    });
    it('should run inside a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        cordova.create(tempDir);

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).not.toThrow();
    });
    it('should not run outside of a Cordova-based project', function() {
        this.after(function() {
            process.chdir(cwd);
        });

        process.chdir(tempDir);

        expect(function() {
            cordova.platform();
        }).toThrow();
    });

    describe('`ls`', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should list out no platforms for a fresh project', function() {
            expect(cordova.platform('ls')).toEqual('No platforms added. Use `cordova platform add <platform>`.');
        });

        it('should list out added platforms in a project', function() {
            var cbtwo = jasmine.createSpy();
            var cb = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "create callback");
            runs(function() {
                expect(cordova.platform('ls')).toEqual('android');
                cordova.platform('add', 'ios', cbtwo);
            });
            waitsFor(function() { return cbtwo.wasCalled; }, "create callback number two");
            runs(function() {
                expect(cordova.platform('ls')).toEqual('android\nios');
            });
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
                    var s = path.join(lib, p + '-bkup');
                    var d = path.join(lib, p);
                    shell.mv(s, d);
                });
            });
            it('should clone down the android library and checkout appropriate tag', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0});
                try {
                    cordova.platform('add', 'android', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0].match(/^git clone.*cordova-android/)).not.toBeNull();
                expect(s.calls[1].args[0].match(/git checkout 47daaaf/)).not.toBeNull();
            });
            it('should clone down the ios library and checkout appropriate tag', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0});

                try {
                    cordova.platform('add', 'ios', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0].match(/^git clone.*cordova-ios/)).not.toBeNull();
                expect(s.calls[1].args[0].match(/git checkout 2.1.0/)).not.toBeNull();
            });
            it('should clone down the blackberry library and checkout appropriate tag', function() {
                var s = spyOn(shell, 'exec').andReturn({code:0});

                try {
                    cordova.platform('add', 'blackberry', function() {});
                } catch(e) {}

                expect(s).toHaveBeenCalled();
                expect(s.calls[0].args[0].match(/^git clone.*cordova-blackberry/)).not.toBeNull();
                expect(s.calls[1].args[0].match(/git checkout 2.1.0/)).not.toBeNull();
            });
            it('should add a basic android project');
            it('should add a basic ios project');
            it('should add a basic blackberry project');
        });

        describe('android', function() {
            it('should add a basic android project', function() {
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', 'android', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add android callback");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'android', 'AndroidManifest.xml'))).toBe(true);
                });
            });
            it('should use the correct application name based on what is in config.xml', function() {
                var cfg_path = path.join(tempDir, 'www', 'config.xml');
                var orig_cfg_contents = fs.readFileSync(cfg_path, 'utf-8');
                this.after(function() {
                    fs.writeFileSync(cfg_path, orig_cfg_contents, 'utf-8');
                });
                var cfg = new config_parser(cfg_path);
                var cb = jasmine.createSpy();

                runs(function() {
                    cfg.name('chim chim');
                    cordova.platform('add', 'android', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add android callback");
                runs(function() {
                    var strings = new et.ElementTree(et.XML(fs.readFileSync(path.join(tempDir, 'platforms', 'android', 'res', 'values', 'strings.xml'), 'utf-8')));
                    var app_name = strings.find('string[@name="app_name"]').text;
                    expect(app_name).toBe('chim chim');
                });
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
            it('should use the correct application name based on what is in config.xml', function() {
                var cfg_path = path.join(tempDir, 'www', 'config.xml');
                var orig_cfg_contents = fs.readFileSync(cfg_path, 'utf-8');
                this.after(function() {
                    fs.writeFileSync(cfg_path, orig_cfg_contents, 'utf-8');
                });
                var cfg = new config_parser(cfg_path);
                var cb = jasmine.createSpy();

                runs(function() {
                    cfg.name('upon closer inspection they appear to be loafers');
                    cordova.platform('add', 'ios', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add ios callback");
                runs(function() {
                    var pbxproj = fs.readFileSync(path.join(tempDir, 'platforms', 'ios', 'upon_closer_inspection_they_appear_to_be_loafers.xcodeproj', 'project.pbxproj'), 'utf-8');
                    expect(pbxproj.match(/PRODUCT_NAME\s*=\s*"upon closer inspection they appear to be loafers"/)[0]).toBe('PRODUCT_NAME = "upon closer inspection they appear to be loafers"');
                });
            });
        });
        describe('blackberry-10', function() {
            it('should add a basic blackberry project', function() {
                var cb = jasmine.createSpy();

                runs(function() {
                    cordova.platform('add', 'blackberry-10', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add blackberry");
                runs(function() {
                    expect(fs.existsSync(path.join(tempDir, 'platforms', 'blackberry-10', 'www'))).toBe(true);
                });
            });
            it('should use the correct application name based on what is in config.xml', function() {
                var cfg_path = path.join(tempDir, 'www', 'config.xml');
                var orig_cfg_contents = fs.readFileSync(cfg_path, 'utf-8');
                this.after(function() {
                    fs.writeFileSync(cfg_path, orig_cfg_contents, 'utf-8');
                });
                var cfg = new config_parser(cfg_path);
                var cb = jasmine.createSpy();

                runs(function() {
                    cfg.name('upon closer inspection they appear to be loafers');
                    cordova.platform('add', 'blackberry-10', cb);
                });
                waitsFor(function() { return cb.wasCalled; }, "platform add blackberry callback");
                runs(function() {
                    var bb_cfg = new config_parser(path.join(tempDir, 'platforms', 'blackberry-10', 'www', 'config.xml'));
                    expect(bb_cfg.name()).toBe(cfg.name());
                });
            });
        });
    });
    describe('remove', function() {
        beforeEach(function() {
            cordova.create(tempDir);
            process.chdir(tempDir);
        });

        afterEach(function() {
            process.chdir(cwd);
        });

        it('should remove a supported and added platform', function() {
            var cb = jasmine.createSpy();
            var cbone = jasmine.createSpy();

            runs(function() {
                cordova.platform('add', 'ios', cbone);
            });
            waitsFor(function() { return cbone.wasCalled; }, "ios create callback");
            runs(function() {
                cordova.platform('add', 'android', cb);
            });
            waitsFor(function() { return cb.wasCalled; }, "android create callback");
            runs(function() {
                cordova.platform('remove', 'android');
                expect(cordova.platform('ls')).toEqual('ios');
            });
        });
    });
});
