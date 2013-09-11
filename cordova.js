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
var cordova_events = require('./src/events');
var addModuleProperty = require('./src/util').addModuleProperty;

var off = function() {
    cordova_events.removeListener.apply(cordova_events, arguments);
};

var emit = function() {
    cordova_events.emit.apply(cordova_events, arguments);
};

exports = module.exports = {
    on:        function() {
        cordova_events.on.apply(cordova_events, arguments);
    },
    off:       off,
    removeListener:off,
    removeAllListeners:function() {
        cordova_events.removeAllListeners.apply(cordova_events, arguments);
    },
    emit:      emit,
    trigger:   emit,
};

addModuleProperty(module, 'prepare', './src/prepare');
addModuleProperty(module, 'build', './src/build');
addModuleProperty(module, 'help', './src/help');
addModuleProperty(module, 'config', './src/config');
addModuleProperty(module, 'create', './src/create');
addModuleProperty(module, 'ripple', './src/ripple');
addModuleProperty(module, 'emulate', './src/emulate');
addModuleProperty(module, 'plugin', './src/plugin');
addModuleProperty(module, 'plugins', './src/plugin');
addModuleProperty(module, 'serve', './src/serve');
addModuleProperty(module, 'platform', './src/platform');
addModuleProperty(module, 'platforms', './src/platform');
addModuleProperty(module, 'compile', './src/compile');
addModuleProperty(module, 'run', './src/run');


