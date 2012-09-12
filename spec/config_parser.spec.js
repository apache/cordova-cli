var cordova = require('../cordova'),
    wrench = require('wrench'),
    mkdirp = wrench.mkdirSyncRecursive,
    path = require('path'),
    rmrf = wrench.rmdirSyncRecursive,
    fs = require('fs'),
    config_parser = require('../src/config_parser'),
    tempDir = path.join(__dirname, '..', 'temp'),
    et = require('elementtree'),
    xml = path.join(tempDir, 'www', 'config.xml');

describe('config.xml parser', function () {
    beforeEach(function() {
        // Make a temp directory
        try { rmrf(tempDir); } catch(e) {}
        mkdirp(tempDir);
        cordova.create(tempDir);
    });

    it('should create an instance based on an xml file', function() {
        var cfg;
        expect(function () {
            cfg = new config_parser(xml);
        }).not.toThrow();
        expect(cfg).toBeDefined();
        expect(cfg.doc).toBeDefined();
    });

    describe('package name / id', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        it('should get the packagename', function() {
            expect(cfg.packageName()).toEqual('io.cordova.hello-cordova');
        });
        it('should allow setting the packagename', function() {
            cfg.packageName('this.is.bat.country');
            expect(cfg.packageName()).toEqual('this.is.bat.country');
        });
        it('should write to disk after setting the packagename', function() {
            cfg.packageName('this.is.bat.country');
            expect(fs.readFileSync(xml, 'utf-8')).toMatch(/id="this\.is\.bat\.country"/);
        });
    });

    describe('app name', function() {
        var cfg;

        beforeEach(function() {
            cfg = new config_parser(xml);
        });

        it('should get the app name', function() {
            expect(cfg.packageName()).toEqual('io.cordova.hello-cordova');
        });
        it('should allow setting the app name', function() {
            cfg.name('this.is.bat.country');
            expect(cfg.name()).toEqual('this.is.bat.country');
        });
        it('should write to disk after setting the name', function() {
            cfg.name('one toke over the line');
            expect(fs.readFileSync(xml, 'utf-8')).toMatch(/<name>one toke over the line<\/name>/);
        });
    });

    describe('platforms', function() {
        describe('ls command', function() {
            it('should return an empty array if there are no platforms specified in the document', function() {
                var cfg = new config_parser(xml);

                expect(cfg.ls_platforms().length).toBe(0);
            });
            it('should return a populated array if there are platforms specified in the document', function() {
                var doc = new et.ElementTree(et.XML(fs.readFileSync(xml, 'utf-8')));
                var p = new et.Element('platform');
                p.attrib.name = 'android';
                doc.find('platforms').append(p);
                fs.writeFileSync(xml, doc.write(), 'utf-8');

                var cfg = new config_parser(xml);
                expect(cfg.ls_platforms().length).toBe(1);
                expect(cfg.ls_platforms()[0]).toEqual('android');
            });
        });

        describe('add command', function() {
            it('should add a platform element to the platforms element', function() {
                var cfg = new config_parser(xml);
                cfg.add_platform('android');
                
                var doc = new et.ElementTree(et.XML(fs.readFileSync(xml, 'utf-8')));
                expect(doc.find('platforms').getchildren()[0].attrib.name).toEqual('android');
            });
            it('should ignore existing platforms', function() {
                var cfg = new config_parser(xml);
                cfg.add_platform('android');
                cfg.add_platform('android');
                
                var doc = new et.ElementTree(et.XML(fs.readFileSync(xml, 'utf-8')));
                expect(doc.find('platforms').getchildren().length).toEqual(1);
            });
            it('should ignore garbage platforms', function() {
                var cfg = new config_parser(xml);
                cfg.add_platform('bat country');
                
                var doc = new et.ElementTree(et.XML(fs.readFileSync(xml, 'utf-8')));
                expect(doc.find('platforms').getchildren().length).toEqual(0);
            });
        });

        describe('remove command', function() {
            it('should remove a platform element from the platforms element', function() {
                var cfg = new config_parser(xml);
                cfg.add_platform('ios');

                cfg.remove_platform('ios');

                var doc = new et.ElementTree(et.XML(fs.readFileSync(xml, 'utf-8')));
                expect(doc.find('platforms').getchildren().length).toEqual(0);
            });
        });
    });
});
