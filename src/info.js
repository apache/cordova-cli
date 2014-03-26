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
	output;
	
	delLog(projectRoot);
	//Get Node info
	info_utils.getNodeInfo(function (result){
		if( result ){
			print_SaveMsg(projectRoot, "Node version: "+ result);
			//Get Cordova version
			info_utils.getCordovaInfo(function (result){
				if( result ){print_SaveMsg(projectRoot,"Cordova version: "+ result );
					// Get config.xml file
					fs.readFile(cordova_util.projectConfig(projectRoot) , 'utf-8' , function ( err , result ){
						if(err) {print_SaveMsg(projectRoot,"Error reading config.xml file"+ err);}
						print_SaveMsg(projectRoot,'Config.xml File: \r'+ result +'\r\r\r');
						print_SaveMsg(projectRoot,'Plugins: \r' + doPlugins( projectRoot ) +'\r\r\r');
						//Get platforms info
						doPlatforms(projectRoot, function (result){
							if( result ){
								print_SaveMsg(projectRoot,result);
							}
						});
					});
				}
			});
		}
	});

	return Q();
};

function delLog(projectRoot){
	fs.unlink(path.join(projectRoot,'info.txt'), function (err) {
		if (err) throw err;
		writeLog(projectRoot, '');
	});
}
function writeLog (projectRoot, data){
	//Successfully deleted, writing new one
	fs.writeFile(path.join(projectRoot,'info.txt'), data, 'utf-8', function (err) {
		if (err) throw err;
	});
}
function print_SaveMsg(projectRoot, data){
	console.log(data);
	appendLog(projectRoot,data)
	
}
function appendLog(projectRoot, data){

	fs.appendFile(path.join(projectRoot,'info.txt'), data, 'utf-8', function (err) {
		if (err) throw err;
	});

}

function doPlatforms( projectRoot, result){
	var platforms = cordova_util.listPlatforms(projectRoot);
	if( platforms.length ) {
		for(var i=0; i<platforms.length; i++){
			info_utils.getPlatformInfo( platforms[ i ], projectRoot, function(callback){
				result(callback);
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
