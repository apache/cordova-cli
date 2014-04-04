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
        path          = require('path'),
        fs            = require('fs'),
        child_process = require('child_process'),
        Q             = require('q'),
        info_utils 	  = require('./info-utils');

/*
        A utility funciton to help output the information needed
        when submitting a help request.
        Outputs to a file
    */
module.exports = function info() {
    //Get projectRoot 
    var projectRoot = cordova_util.cdProjectRoot(),
    output="";
    if (!projectRoot) {
        return Q.reject( new Error('Current working directory is not a Cordova-based project.') );
    }

    //Array of functions, Q.allSettled
    return Q.allSettled([ (function (){
        console.log("Collecting Data...");
        //Get Node version
        return (Q.denodeify (info_utils.getNodeInfo)());
    }()), (function (){
        //Get Cordova version
        return (Q.denodeify (info_utils.getCordovaInfo)());
    }()), (function (){
        //Get project config.xml file
        return 'Config.xml File: \n\n'+ (fs.readFileSync(cordova_util.projectConfig(projectRoot), 'utf-8')) +'\n\n\n'
    }()), (function (){
        //Get list of plugins
        return 'Plugins: \n\n' + doPlugins( projectRoot ) +'\n\n\n';
    }()), (function (){
        //Get Platforms information
        return (Q.denodeify (doPlatforms)(projectRoot));
    }())]).then(function (promises){
        promises.forEach( function(p){
            output += (function (){ return p.state==='fulfilled' ? p.value : p.state==='rejected' ? p.reason : 'Still working' }() );
        });
        print_SaveMsg(projectRoot, output);
    });
};

function print_SaveMsg(projectRoot, data){
    console.info(data);
    fs.writeFile(path.join(projectRoot,'info.txt'), data, 'utf-8', function (err) {
        if (err) throw err;
    });
}

function doPlatforms( projectRoot, result){
    var platforms = cordova_util.listPlatforms(projectRoot), summary = "", t=0;
    if( platforms.length ) {
        for(var i=0; i<platforms.length; i++){
            info_utils.getPlatformInfo( platforms[ i ], projectRoot, function(callback){
                summary += callback;
                t++;
                if(t === platforms.length){result(summary);}
            });
        }
    }
    else {
        result("No Platforms Currently Installed");
    }
}

function doPlugins( projectRoot ){
    var pluginPath = path.join(projectRoot, 'plugins'),
    plugins = cordova_util.findPlugins(pluginPath);

    if( !plugins.length ) {
        return "No Plugins Currently Installed";
    } else {
        return plugins;
    }
}
