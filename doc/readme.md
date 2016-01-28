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

##cordova create command

###Synopsis

Create a Cordova project

###Syntax

    cordova create path [id [name [config]]] [options] 

| Value | Description   |
|-------|---------------|     
| path |  Directory which should not already exist. Cordova will create this directory. Its `www` subdirectory houses your application's home page, along with various resources under `css`, `js`, and `img`, which follow common web development file-naming conventions. These assets will be stored on the device's local filesystem, not served remotely. The `config.xml` file contains important metadata needed to generate and distribute the application.|
| id   | _Default_: `io.cordova.hellocordova` <br/>  Reverse domain-style identifier that maps to `id` attirbute of `widget` element in `config.xml`. This can be changed but there may be code generated using this value, such as Java package names. It is recommended that you select an appropriate value. |
| name | _Default_: `HelloCordova` <br/> Application's display title that maps `name` element in `config.xml` file. This can be changed but there may be code generated using this value, such as Java class names. The default value is `HelloCordova`, but it is recommended that you select an appropriate value. |
| config | JSON string whose key/values will be included in `<path>`/.cordova/config.json |

###Options

| Option | Description |
|--------|-------------|
| --template |  Use a custom template located locally, in NPM, or GitHub. |
| --copy-from\|--src | _Deprecated_ <br/> Use --template instead. Specifies a directory from which to copy the current Cordova project. |
|--link-to | Symlink to specified `www` directory without creating a copy. |

###Example

- Create a Cordova project in `myapp` directory using the specified ID and display name.
```
    cordova create myapp com.mycompany.myteam.myapp MyApp
```
- Create a Cordova project with a symlink to an existing `www` directory. This can be useful if you have a custom build process or existing web assets that you want to use in your Cordova app:
```
    cordova create myapp --link-to=../www
```

##cordova platform command

###Synopsis

Manage cordova platforms - allowing you to add, remove, update, list and check for updates.

###Syntax

    cordova platform <command> [options]

| Sub-command           | Option | Description |
------------------------|-------------|------|
| add `plat-spec` [...] |  | Add specified platforms |
| | --save | Save specified platforms into config.xml after installing them |
| | --link | When `plat-spec` is a local path, links the platform library directly instead of making a copy of it (support varies by platform; useful for platform development)
| remove `platform` [...] | | Remove specified platforms |
| | --save | Delete specified platforms from config.xml after removing them |     
| list | | List all installed and available platforms |
| check |  | List platforms which can be updated by `cordova-cli platform update | 

    
    plat-spec : platform[@version] | path | url[#commit-ish]
    
| Value | Description |
|-----------|-------------|
| platform | Platform name e.g. android, ios, windows etc. to be added to the project. Every release of cordova CLI pins a version for each platform. When no version is specified this version is used to add the platform. |
| version | Major.minor.patch version specifier using semver |
| path |  Path to a directory containing a platform |
| url | Url to a git repository or tarball containing a platform |
| commit-ish | Commit/tag/bramch reference. If none is specified, 'master' is used |
    
###Aliases

    platforms -> platform
    rm -> remove
    ls -> list

###Examples
- Add pinned version of the `android` and `ios` platform and save the downloaded version to `config.xml`:
``` 
    cordova platform add android ios --save
```    
- Add `android` platform with [semver](http://semver.org/) version ^5.0.0 and save it to `config.xml`:   
```     
    cordova platform add android@^5.0.0 --save
```   
- Add platform by cloning the specified git repo and checkout to the `4.0.0` tag:
```    
    cordova platform add https://github.com/myfork/cordova-android.git#4.0.0
```    
- Add platform using a local directory named `android`:
```
    cordova platform add ../android
```   
- Add platform using the specified tarball:
```
    cordova platform add ../cordova-android.tgz
```    
- Remove `android` platform from the project and from `config.xml`:
```    
    cordova platform rm android --save
``` 
- List available and installed platforms with version numbers. This is useful to find version numbers when reporting issues:
``` 
    cordova platform ls
```

## cordova plugin command
 
 
