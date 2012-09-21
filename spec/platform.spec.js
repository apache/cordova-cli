var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    et = require('elementtree'),
    config_parser = require('../src/config_parser'),
    tempDir = path.join(__dirname, '..', 'temp');

var cwd = process.cwd();

describe('platform command', function() {
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
            // TODO!
            it('should clone down and checkout the correct android library');
            it('should clone down and checkout the correct ios library');
            it('should add a basic android project');
            it('should add a basic ios project');
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
