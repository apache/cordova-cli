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
    var cordova_util  = require('./util'),
        child_process = require('child_process'),
        path          = require('path'),
        fs            = require('fs'),
        _self;

_self = {
    
    getNodeInfo: function( callback ){
        _self.execFunc('node', '--version', function(call){callback("Node version: "+call);});
        },
        
    getCordovaInfo: function( callback ){
        _self.execFunc('cordova', '--version', function(call){callback("Cordova version: "+call);});
        },
        
    getPlatformInfo: function(platform, projectRoot, callback ){
            var command="", args="";
            switch( platform ){
            case "ios":
                _self.execFunc('xcodebuild', '-version', function(call){callback('iOS Platform:\n\n' +call);});
                break;
            case "android":
                _self.execFunc('android', 'list target', function(call){callback('Android Platform:\n\n' +call);});
                break;
            }
        },
        
    execFunc: function(command, args, callback){
            child_process.exec(command + ' ' +args, 
            function (error, stdout, stderr) {
                callback(stdout);
                if (error !== null) {
                    callback('Error performing command: ' + error + "\n" +stderr);
                }
            });
        },
};

module.exports = _self;
