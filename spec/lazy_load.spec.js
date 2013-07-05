var lazy_load = require('../src/lazy_load'),
    config = require('../src/config'),
    util = require('../src/util'),
    shell = require('shelljs'),
    path = require('path'),
    hooker = require('../src/hooker'),
    https = require('follow-redirects').https,
    fs = require('fs'),
    platforms = require('../platforms');

describe('lazy_load module', function() {
    var custom_path;
    beforeEach(function() {
        custom_path = spyOn(config, 'has_custom_path').andReturn(false);
    });
    describe('cordova method (loads stock cordova libs)', function() {
        var custom;
        beforeEach(function() {
            custom = spyOn(lazy_load, 'custom');
        });
        it('should throw if platform is not a stock cordova platform', function() {
            expect(function() {
                lazy_load.cordova('atari');
            }).toThrow('Cordova library "atari" not recognized.');
        });
        it('should invoke lazy_load.custom with appropriate url, platform, and version as specified in platforms manifest', function() {
            lazy_load.cordova('android');
            expect(custom).toHaveBeenCalledWith(platforms.android.url + ';a=snapshot;h=' + platforms.android.version + ';sf=tgz', 'cordova', 'android', platforms.android.version, jasmine.any(Function));
        });
    });

    describe('custom method (loads custom cordova libs)', function() {
        var mkdir, exists, fire, rm, sym;
        beforeEach(function() {
            mkdir = spyOn(shell, 'mkdir');
            rm = spyOn(shell, 'rm');
            sym = spyOn(fs, 'symlinkSync');
            exists = spyOn(fs, 'existsSync').andReturn(false);
            fire = spyOn(hooker, 'fire').andCallFake(function(evt, data, cb) {
                cb();
            });
        });

        it('should callback with no errors and not fire event hooks if library already exists', function(done) {
            exists.andReturn(true);
            lazy_load.custom('some url', 'some id', 'platform X', 'three point five', function(err) {
                expect(err).not.toBeDefined();
                expect(fire).not.toHaveBeenCalled()
                done();
            });
        });
        it('should fire a before_library_download event before it starts downloading a library', function() {
            lazy_load.custom('some url', 'some id', 'platform X', 'three point five');
            expect(fire).toHaveBeenCalledWith('before_library_download', {platform:'platform X', url:'some url', id:'some id', version:'three point five'}, jasmine.any(Function));
        });

        describe('remove URLs for libraries', function() {
            var req, write_stream, http_on;
            beforeEach(function() {
                write_spy = jasmine.createSpy('write stream write');
                write_stream = spyOn(fs, 'createWriteStream').andReturn({
                    write:write_spy
                });
                http_on = jasmine.createSpy('https result on');
                // TODO: jasmien does not support chaning both andCallFake + andReturn...
                req = spyOn(https, 'request').andCallFake(function(opts, cb) {
                    cb({
                        on:http_on
                    });
                }).andReturn({
                    on:function(){},
                   end:function(){}
                });
            });

            it('should call into https request with appopriate url params', function() {
                lazy_load.custom('https://github.com/apache/someplugin', 'random', 'android', '1.0');
                expect(req).toHaveBeenCalledWith({
                    hostname:'github.com',
                    path:'/apache/someplugin'
                }, jasmine.any(Function));
            });
            // TODO: jasmine does not support chaning andCallFake andReturn. Cannot test the below.
            xit('should fire download events as the https request receives data events, and write to a file stream', function() {
                http_on.andCallFake(function(evt, cb) {
                    console.log(evt);
                    if (evt == 'data') {
                        cb('chunk');
                    }
                });
                lazy_load.custom('https://github.com/apache/someplugin', 'random', 'android', '1.0');
                expect(fire).toHaveBeenCalledWith('library_download', {
                    platform:'android',
                    url:'https://github.com/apache/someplugin',
                    id:'random',
                    version:'1.0',
                    chunk:'chunk'
                });
                expect(write_spy).toHaveBeenCalledWith('chunk', 'binary');
            });
        });

        describe('local paths for libraries', function() {
            it('should symlink to local path', function() {
                lazy_load.custom('/some/random/lib', 'id', 'X', 'three point five')
                expect(sym).toHaveBeenCalledWith('/some/random/lib', path.join(util.libDirectory, 'X', 'id', 'three point five'), 'dir');
            });
            it('should fire after hook once done', function() {
                lazy_load.custom('/some/random/lib', 'id', 'X', 'three point five')
                expect(fire).toHaveBeenCalledWith('after_library_download', {platform:'X',url:'/some/random/lib',id:'id',version:'three point five',path:path.join(util.libDirectory, 'X', 'id', 'three point five')}, jasmine.any(Function));
            });
        });
    });

    describe('based_on_config method', function() {
        var cordova, custom;
        beforeEach(function() {
            cordova = spyOn(lazy_load, 'cordova');
            custom = spyOn(lazy_load, 'custom');
        });
        it('should invoke custom if a custom lib is specified', function() {
            var read = spyOn(config, 'read').andReturn({
                lib:{
                    maybe:{
                        uri:'you or eye?',
                        id:'eye dee',
                        version:'four point twenty'
                    }
                }
            });
            var p = '/some/random/custom/path';
            custom_path.andReturn(p);
            lazy_load.based_on_config('yup', 'maybe');
            expect(custom).toHaveBeenCalledWith('you or eye?', 'eye dee', 'maybe', 'four point twenty', undefined);
        });
        it('should invoke cordova if no custom lib is specified', function() {
            lazy_load.based_on_config('yup', 'ios');
            expect(cordova).toHaveBeenCalledWith('ios', undefined);
        });
    });
});
