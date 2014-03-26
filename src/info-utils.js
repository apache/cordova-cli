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
var superspawn    = require('./superspawn'),
    Q             = require('q'),
    _self;

_self = {
    getNodeInfo : function () {
        return _self.execSpawn("node", "--version", "Node version: ", "Error retrieving Node version: ");
    },
    getCordovaInfo : function () {
        return _self.execSpawn("Cordova", "--version", "Cordova version: ", "Error retrieving Cordova version: ");
    },
    getPlatformInfo : function (platform, projectRoot) {
        switch (platform) {
        case "ios":
            return _self.execSpawn("xcodebuild", "-version", "iOS platform:\n\n", "Error retrieving iOS platform information: ");
            break;
        case "android":
            return _self.execSpawn("android list target", "", "Android platform:\n\n", "Error retrieving Android platform information: ");
            break;
        }
    },
    // Execute using a child_process exec, for any async command
    execSpawn : function (command, args, resultMsg, errorMsg) {
        return Q.when(superspawn.spawn(command, args), function (result) {
            return resultMsg + result;
        }, function (error) {
            return errorMsg + error;
        });
    }
};

module.exports = _self;
