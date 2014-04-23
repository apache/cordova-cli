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
     
    /*
    A utility funciton to help output the information needed
    when submitting a help request.
    Outputs to a file
     */
var cordova_util = require('./util'),
    path         = require('path'),
    fs           = require('fs'),
    Q            = require('q'),
    info_utils   = require('./info-utils');


module.exports = function info() {
    //Get projectRoot
    var projectRoot = cordova_util.cdProjectRoot(),output = "";
    if (!projectRoot) {
        return Q.reject(new Error('Current working directory is not a Cordova-based project.'));
    }

    //Array of functions, Q.allSettled
    console.log("Collecting Data...\n\n");
    return Q.allSettled([
            //Get Node version
            info_utils.getNodeInfo(),
            //Get Cordova version
            info_utils.getCordovaInfo(),
            //Get project config.xml file using ano
             getProjectConfig(projectRoot),
            //Get list of plugins
            listPlugins(projectRoot), 
            //Get Platforms information
            getPlatforms(projectRoot)
        ]).then(function (promises) {
        promises.forEach(function (p) {
            output += (function () {
                return p.state === "fulfilled" ? p.value + "\n\n" : p.state === "rejected" ? p.reason + "\n\n" : "Still working"
            }
                ());
        });
        print_SaveMsg(projectRoot, output);
    });
};

function print_SaveMsg(projectRoot, data) {
    console.info(data);
    fs.writeFile(path.join(projectRoot, "info.txt"), data, "utf-8", function (err) {
        if (err)
            throw err;
    });
}

function getPlatforms(projectRoot) {
    var platforms = cordova_util.listPlatforms(projectRoot),
        promises  = [];

    if (platforms.length) {
        platforms.forEach(function (platform) {
            var deferred = Q.defer();
            deferred.resolve(info_utils.getPlatformInfo(platform, projectRoot));
            promises.push(deferred.promise);
        });
    } else {
        var deferred = Q.defer()
            deferred.reject("No Platforms Currently Installed");
        promises.push(deferred.promise);
    }

    return Q.all(promises)
}

function listPlugins(projectRoot) {
    var pluginPath = path.join(projectRoot, "plugins"),
        plugins    = cordova_util.findPlugins(pluginPath),
        deferred   = Q.defer();

    if (!plugins.length) {
        deferred.reject("No Plugins Currently Installed");
    } else {
        deferred.resolve("Plugins: \n\n" + plugins);
    }
    return deferred.promise
}

function getProjectConfig(projectRoot) {
    var deferred = Q.defer();

    if (!fs.existsSync(projectRoot)  ) {
        deferred.reject("Config.xml file not found");
    } else {
        deferred.resolve("Config.xml file: \n\n" + (fs.readFileSync(cordova_util.projectConfig(projectRoot), "utf-8")));
    }
    return deferred.promise
}
