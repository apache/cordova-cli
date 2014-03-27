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
        callback(_self.execFunc('node', '--version', function(call){callback(call);}));
    },
    
getCordovaInfo: function( callback ){
        callback(_self.execFunc('cordova', '--version', function(call){callback(call);}));
    },
    
getPlatformInfo: function(platform, projectRoot, callback ){
        var command="", args="";
        switch( platform ){
        case "ios":
            _self.execFunc('xcodebuild', '-version', function(call){callback('iOS Platform:\r\r' +call);});
            break;
        case "android":
            _self.execFunc('android', 'list target', function(call){callback('Android Platform:\r\r' +call);});
            break;
        case "blackberry10":
            var bbUtilsPath = path.join(projectRoot, 'platforms', platform, 'cordova'),
            bbBuildPath= path.join(projectRoot, 'platforms', platform, 'build'),
            bbresults="",
            varState;
            //get CORDOVA_BBTOOLS environment variable.
            _self.get_pathEnv( ['blackberry-nativepackager', 'blackberry-deploy'], function (path){
                if(path){
                    //s et CORDOVA_BBTOOLS environment variable.
                    varState = _self.setEnv_Var('CORDOVA_BBTOOLS', path, false);
                    // Get BB10 SDK Version
                    _self.getSDKinfo(bbUtilsPath, function(result){
                        if(result){bbresults+="Blackberry 10 Native SDK version: "+result+"\r";
                            // Get BB10 deployed and stored devices
                            _self.deployedDevices(bbUtilsPath, 'device', false, function(result){
                                if(result){bbresults+="\rBlackberry 10 deployed devices:\r"+result+"\r";
                                    // Get BB10 deployed and stored emulators
                                    _self.deployedDevices(bbUtilsPath, 'emulator', false, function (result){
                                        if(result){bbresults+="\rBlackberry deployed emulator:\r"+result+"\r";
                                            if(!varState){_self.delEnv_Var('CORDOVA_BBTOOLS');}
                                            callback('Blackberry 10 Platform:\r\r' +bbresults);		
                                        }});
                                }});
                        }});
                }
                else{callback("Blackberry 10 Native SDK path not found");}
            });
            break;
        }
    },
    // Execute using a child_process exec, for any async command
execFunc: function(command, args, callback){
        child_process.exec(command + ' ' +args, 
        function (error, stdout, stderr) {
            callback(stdout);
            if (error !== null) {
                callback('Error performing command: ' + error + "\n" +stderr);
            }
        });
    },
    //Uses Library to get Native SDK version
getSDKinfo: function ( utilsPath, callback) {
        _self.execFunc("\"" +path.join(utilsPath,'bb10-ndk-version')+"\"" , '' ,function(output){callback(output);});
    },
    // It explores the json file to get deployed devices or emulators.
deployedDevices: function ( utilsPath, type, flag, callback) {
        var collection="";
        require(path.join(utilsPath,'lib', 'target-utils')).getTargetList( type, flag, function (resultList) {
            if(resultList.length>0){
                for (var t in resultList) {
                    if (resultList.hasOwnProperty(t)) {
                        collection+= resultList[t].name + ' ip: ' + resultList[t].ip+"\r";
                    }
                }
            }else{collection+='No registered emulators or devices\r';}
        });
        callback(collection);
    },
    
    delEnv_Var: function (ENV_VAR){
        delete process.env[ENV_VAR];
    },
    //Sets an environmental variable, determining first if exists or not
    //uses boolean 'override' to decide if override the value or not.
    setEnv_Var: function ( ENV_VAR, value, override) {
        //Check if Env varible exists first
        if(_self.determineEnv_Var(ENV_VAR)){
            console.log("CORDOVA_BBTOOLS env variable is present\r");
            if(override){
                console.log("\rOverriding... ");
                process.env[ENV_VAR] = value;}
            return true;
        }else{ process.env[ENV_VAR] = value; return false;}
    },
    //Determine if an environmental variable exists
    determineEnv_Var: function ( ENV_VAR ){
        if(process.env[ENV_VAR]){
            return true;
        }else{ return false; }
        return false;
    },
    
    get_pathEnv: function (files, callback) {
        
        //Look for files under path
        var check_Files= function(envPath, arrayFiles){
            var checks=0;
            for(var j=0; j < arrayFiles.length; j++){
                if(fs.existsSync(path.join(envPath, arrayFiles[j]))){
                    checks++;
                }
            }
            if(arrayFiles.length === checks){
                return true;
            }
            return false;
        },
        //Look for Blackberry path in System Path
        pathArray=process.env.PATH.split(path.delimiter);
        
        for (var i = 0; i < pathArray.length; i++){
            if(check_Files(pathArray[i],files)){
                callback(pathArray[i]);
            }
        }
    }
};
module.exports = _self;
