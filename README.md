<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
[![Build status](https://ci.appveyor.com/api/projects/status/github/apache/cordova-cli?branch=master)](https://ci.appveyor.com/project/ApacheSoftwareFoundation/cordova-cli)
[![Build Status](https://travis-ci.org/apache/cordova-cli.svg?branch=master)](https://travis-ci.org/apache/cordova-cli)

# Cordova CLI

> The command line tool to build, deploy and manage [Cordova](http://cordova.apache.org)-based applications.

[Apache Cordova](http://cordova.apache.org) allows for building native mobile applications using HTML, CSS and JavaScript. 
This tool helps with management of multi-platform Cordova applications as well as Cordova plugin integration.

# Installation
In your command-line on Windows:    
```bash    
    c:\> npm install -g cordova
```    
    
In your terminal on Mac OS X/Linux:
```bash    
    $sudo npm install -g cordova
```

# Creating a new Cordova project
This simple example demonstrates how Cordova CLI can be used to create a `myApp` project with the `camera` plugin and run it for `android` platform:

```bash
    cordova create myApp com.myCompany.myApp myApp
    cd myApp
    cordova plugin add cordova-plugin-camera --save
    cordova platform add android --save
    cordova requirements android    
    cordova build android --verbose
    cordova run android
```

# Docs
- [Overview of Cordova]
- [Create your first Cordova app] guide
- [Full reference docs for Cordova CLI][Reference docs] has details of commands to add platforms, add plugins, build, package, and sign your HTML, JS apps. 
- Cordova allows you to build apps for a number of platforms. Learn more about our [Supported platforms].
- [Project directory structure] documents the details of the directory structure created by Cordova CLI.

# Contributing
Cordova is an open source Apache project and contributors are needed to keep this project moving forward. Learn more on 
[how to contribute on our website][contribute]. 

# TO-DO + Issues

If you find issues with this tool, please follow our guidelines for [reporting issues]. 
We do not use github issue system as an Apache project, we have a JIRA issue management system which covers over 30+ cli, platform, 
plugin repos in the Cordova project. Use the "CLI" component for Cordova CLI issues. However, most of the 
functionality of Cordova CLI is implemented in cordova-lib npm module. You can also use "CordovaLib" component to file issues.

[Overview of Cordova]: http://cordova.apache.org/docs/en/latest/guide/overview/
[Create your first Cordova app]: http://cordova.apache.org/docs/en/latest/guide/cli/index.html
[Reference docs]: http://cordova.apache.org/docs/en/latest/cordova-cli/index.html
[Supported platforms]: http://cordova.apache.org/docs/en/latest/guide/support/index.html
[Project directory structure]: http://cordova.apache.org/docs/en/latest/cordova-cli/index.html#directory-structure
[Contribute]: http://cordova.apache.org/contribute/
[Reporting issues]: http://cordova.apache.org/contribute/issues.html
