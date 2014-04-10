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
var lazy_load = require('../src/lazy_load'),
    config = require('../src/config'),
    util = require('../src/util'),
    shell = require('shelljs'),
    npmconf = require('npmconf');
    path = require('path'),
    hooker = require('../src/hooker'),
    request = require('request'),
    fs = require('fs'),
    Q = require('q'),
    platforms = require('../platforms');

describe('lazy_load module', function() {
    var custom_path;
    beforeEach(function() {
        custom_path = spyOn(config, 'has_custom_path').andReturn(false);
        fakeLazyLoad = function(id, platform, version) {
            if (platform == 'wp7' || platform == 'wp8') {
                return Q(path.join('lib', 'wp', id, version, platform));
            } else {
                return Q(path.join('lib', platform, id, version, platforms[platform] && platforms[platform].subdirectory ? platforms[platform].subdirectory : ''));
            }
        };
    });
    describe('cordova method (loads stock cordova libs)', function() {
        var custom;
        beforeEach(function() {
            custom = spyOn(lazy_load, 'custom').andReturn(Q(path.join('lib','dir')));
        });
        it('should throw if platform is not a stock cordova platform', function(done) {
            lazy_load.cordova('atari').then(function() {
                expect('this call').toEqual('to fail');
            }, function(err) {
                expect(err).toEqual(new Error('Cordova library "atari" not recognized.'));
            }).fin(done);
        });
        it('should invoke lazy_load.custom with appropriate url, platform, and version as specified in platforms manifest', function(done) {
            var url = platforms.android.url + ';a=snapshot;h=' + platforms.android.version + ';sf=tgz';
            custom.andCallFake(function (platforms, platform) {
                expect(platform).toEqual('android');
                expect(platforms[platform].url).toEqual(url);
                expect(platforms[platform].id).toEqual('cordova');
                return fakeLazyLoad(platforms[platform].id, platform, platforms[platform].version);
            });
            lazy_load.cordova('android').then(function(dir) {
                expect(custom).toHaveBeenCalled();
                expect(dir).toBeDefined();
                done();
            });
        });
    });

    describe('custom method (loads custom cordova libs)', function() {
        var exists, fire, rm;
        beforeEach(function() {
            spyOn(shell, 'mkdir');
            rm = spyOn(shell, 'rm');
            mv = spyOn(shell, 'mv');
            exists = spyOn(fs, 'existsSync').andReturn(false);
            readdir = spyOn(fs, 'readdirSync').andReturn(['somefile.txt']);
            fire = spyOn(hooker, 'fire').andReturn(Q());
        });

        it('should callback with no errors and not fire event hooks if library already exists', function(done) {
            exists.andReturn(true);
            var mock_platforms = {
                'platform X': {
                    id: 'some id',
                    url: 'http://some remote url',
                    version: 'three point five'
                }
            };
            lazy_load.custom(mock_platforms, 'platform X').then(function() {
                expect(fire).not.toHaveBeenCalled()
            }, function(err) {
                expect(err).not.toBeDefined();
            }).fin(done);
        });
        it('should callback with no errors and fire event hooks even if library already exists if the lib url is a local dir', function(done) {
            exists.andReturn(true);
            var mock_platforms = {
                'platform X': {
                    id: 'some id',
                    url: 'some local dir',
                    version: 'three point six'
                }
            };
            lazy_load.custom(mock_platforms, 'platform X').then(function() {
                expect(fire).not.toHaveBeenCalled()
            }, function(err) {
                expect(err).not.toBeDefined();
            }).fin(done);
        });

        describe('remote URLs for libraries', function() {
            var npmConfProxy;
            var req,
                load_spy,
                events = {},
                fakeRequest = {
                    on: jasmine.createSpy().andCallFake(function(event, cb) {
                        events[event] = cb;
                        return fakeRequest;
                    }),
                    pipe: jasmine.createSpy().andCallFake(function() { return fakeRequest; })
                };
            beforeEach(function() {
                npmConfProxy = null;
                events = {};
                fakeRequest.on.reset();
                fakeRequest.pipe.reset();
                req = spyOn(request, 'get').andCallFake(function() {
                    // Fire the 'end' event shortly.
                    setTimeout(function() {
                        events['end']();
                    }, 10);
                    return fakeRequest;
                });
                load_spy = spyOn(npmconf, 'load').andCallFake(function(cb) { cb(null, { get: function() { return npmConfProxy }}); });
            });

            it('should call request with appropriate url params', function(done) {
                var url = 'https://github.com/apache/someplugin';
                var with_android_platform = {
                    'android': {
                        id: 'random',
                        url: url,
                        version: '1.0'
                    }
                };
                lazy_load.custom(with_android_platform, 'android').then(function() {
                    expect(req).toHaveBeenCalledWith({
                        url:url
                    }, jasmine.any(Function));
                }, function(err) {
                    expect(err).not.toBeDefined();
                }).fin(done);
            });
            it('should take into account https-proxy npm configuration var if exists for https:// calls', function(done) {
                var proxy = 'https://somelocalproxy.com';
                npmConfProxy = proxy;
                var url = 'https://github.com/apache/someplugin';
                var with_android_platform = {
                    'android': {
                        id: 'random',
                        url: url,
                        version: '1.0'
                    }
                };
                lazy_load.custom(with_android_platform, 'android').then(function() {
                    expect(req).toHaveBeenCalledWith({
                        url:url,
                        proxy:proxy
                    }, jasmine.any(Function));
                }, function(err) {
                    expect(err).not.toBeDefined();
                }).fin(done);
            });
            it('should take into account proxy npm config var if exists for http:// calls', function(done) {
                var proxy = 'http://somelocalproxy.com';
                npmConfProxy = proxy;
                var url = 'http://github.com/apache/someplugin';
                var with_android_platform = {
                    'android': {
                        id: 'random',
                        url: url,
                        version: '1.0'
                    }
                };
                lazy_load.custom(with_android_platform, 'android').then(function() {
                    expect(req).toHaveBeenCalledWith({
                        url:url,
                        proxy:proxy
                    }, jasmine.any(Function));
                }, function(err) {
                    expect(err).not.toBeDefined();
                }).fin(done);
            });
        });

        describe('local paths for libraries', function() {
            it('should return the local path, no symlink', function(done) {
                var mock_platforms = {
                    'X': {
                        id: 'id',
                        url: '/some/random/lib',
                        version: 'three point eight'
                    }
                };
                lazy_load.custom(mock_platforms, 'X').then(function(dir) {
                    expect(dir).toEqual('/some/random/lib');
                }, function(err) {
                    expect(err).toBeUndefined();
                }).fin(done);
            });
            it('should not file download hook', function(done) {
                var mock_platforms = {
                    'X': {
                        id: 'id',
                        url: '/some/random/lib',
                        version: 'three point nine'
                    }
                };
                lazy_load.custom(mock_platforms, 'X').then(function() {
                    expect(fire).not.toHaveBeenCalledWith('after_library_download', {platform:'X',url:'/some/random/lib',id:'id',version:'three point nine',path:'/some/random/lib', symlink:false});
                }, function(err) {
                    expect(err).toBeUndefined();
                }).fin(done);
            });
        });
    });

    describe('based_on_config method', function() {
        var cordova, custom;
        beforeEach(function() {
            cordova = spyOn(lazy_load, 'cordova').andReturn(Q());
            custom = spyOn(lazy_load, 'custom').andReturn(Q());
        });
        it('should invoke custom if a custom lib is specified', function(done) {
            var read = spyOn(config, 'read').andReturn({
                lib:{
                    maybe:{
                        url:'you or eye?',
                        id:'eye dee',
                        version:'four point twenty'
                    }
                }
            });
            var p = '/some/random/custom/path';
            custom_path.andReturn(p);
            custom.andCallFake(function (platforms, platform) {
                expect(platform).toEqual('maybe');
                expect(platforms[platform].url).toEqual('you or eye?');
                expect(platforms[platform].id).toEqual('eye dee');
                expect(platforms[platform].version).toEqual('four point twenty');
                return fakeLazyLoad(platforms[platform].id, platform, platforms[platform].version);
            });
            lazy_load.based_on_config('yup', 'maybe').then(function() {
                expect(custom).toHaveBeenCalled();
            }, function(err) {
                expect(err).toBeUndefined();
            }).fin(done);
        });
        it('should invoke cordova if no custom lib is specified', function(done) {
            lazy_load.based_on_config('yup', 'ios').then(function() {
                expect(cordova).toHaveBeenCalledWith('ios');
            }, function(err) {
                expect(err).toBeUndefined();
            }).fin(done);
        });
    });
});
