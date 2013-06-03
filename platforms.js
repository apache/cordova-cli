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

module.exports = {
    'ios' : {
        parser : require('./src/metadata/ios_parser'),
        url    : 'https://git-wip-us.apache.org/repos/asf/cordova-ios.git'
    }, 
    'android' : {
        parser : require('./src/metadata/android_parser'),
        url    : 'https://git-wip-us.apache.org/repos/asf/cordova-ios.git'
    }, 
    'wp7' : {
        parser : require('./src/metadata/wp7_parser'),
        url    : 'https://git-wip-us.apache.org/repos/asf/cordova-wp7.git'
    },
    'wp8' : {
        parser : require('./src/metadata/wp8_parser'),
        url    : 'https://git-wip-us.apache.org/repos/asf/cordova-wp8.git'
    }/*,
    blackberry : {
        parser : require('./metadata/blackberry_parser'),
        url    : 'https://git-wip-us.apache.org/repos/asf/cordova-blackberry.git'
    }*/
};
