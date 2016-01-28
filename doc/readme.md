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

#Cordova Command-line-interface (CLI) Reference

##Syntax
    
    cordova command [options]

##Global Commands

These commands are available at all times.    

| Command  | Description
|----------|--------------
| create | Create a project
| help <command> | Get help for a command

##Project Commands

These commands are supported in a valid Cordova project.

| Command      | Description
|--------------|--------------
| info         | Generate project information
| requirements | Checks and print out all the installation requirements for platforms specified
| platform     | Manage project platforms
| plugin       | Manage project plugins
| prepare      | Copy files into platform(s) for building
| compile      | Build platform(s)
| clean        | Cleanup project from build artifacts
| run          | Run project (including prepare && compile)
| serve        | Run project with a local webserver (including prepare)

##Common options

These options appply to all cordova-cli commands.

| Option               | Description
|----------------------|------------------------
| -d or --verbose      | Pipe out more verbose output to your shell. You can also subscribe to `log` and `warn` events if you are consuming `cordova-cli` as a node module by calling `cordova.on('log', function() {})` or `cordova.on('warn', function() {})`.
| -v or --version      | Print out the version of your `cordova-cli` install.
| --no-update-notifier | will disable updates check. Alternatively set `"optOut": true` in `~/.config/configstore/update-notifier-cordova.json` or set `NO_UPDATE_NOTIFIER` environment variable with any value (see details in [update-notifier docs](https://www.npmjs.com/package/update-notifier#user-settings)).
|--nohooks             | suppress executing hooks (taking RegExp hook patterns as parameters)

##Examples
- The following commands will:
    - Create a cordova project in `myApp` directory.
    - Add `cordova-plugin-camera` to the project and `config.xml`.
    - Add `android` platform to the project
    - Check for system requirements for the `android` platform.
    - Build the project for the `android` platform and emit verbose output.
    - Run the project on `android` emulator or device.
    - Build `android` platform using custom signing options.

```
    cordova create myApp org.apache.cordova.myApp myApp
    cordova plugin add cordova-plugin-camera --save
    cordova platform add android --save
    cordova requirements android    
    cordova build android --verbose
    cordova run android
    cordova build android --release -- --keystore="..\android.keystore" --storePassword=android --alias=mykey
```
##cordova create command

###Synopsis

Create the directory structure for the Cordova project in the specified path.

###Syntax

    cordova create path [id [name [config]]] [options] 

| Value | Description   |
|-------|---------------|     
| path  |  Directory which should not already exist. Cordova will create this directory. For more details on the directory structure, see below. |
| id    | _Default_: `io.cordova.hellocordova` <br/>  Reverse domain-style identifier that maps to `id` attirbute of `widget` element in `config.xml`. This can be changed but there may be code generated using this value, such as Java package names. It is recommended that you select an appropriate value.  |
| name  | _Default_: `HelloCordova` <br/> Application's display title that maps `name` element in `config.xml` file. This can be changed but there may be code generated using this value, such as Java class names. The default value is `HelloCordova`, but it is recommended that you select an appropriate value. |
| config | JSON string whose key/values will be included in `<path>`/.cordova/config.json |

###Options

| Option | Description |
|--------|-------------|
| --template |  Use a custom template located locally, in NPM, or GitHub. |
| --copy-from\|--src | _Deprecated_ <br/> Use --template instead. Specifies a directory from which to copy the current Cordova project. |
|--link-to | Symlink to specified `www` directory without creating a copy. |

###Directory structure
A Cordova application built with `cordova-cli` will have the following directory structure:

    myapp/
    |-- config.xml
    |-- hooks/
    |-- merges/
    | | |-- android/
    | | |-- blackberry10/
    | | `-- ios/
    |-- www/                    
    |-- platforms/             
    | |-- android/
    | |-- blackberry10/
    | `-- ios/
    `-- plugins/

#### `config.xml`
Specifies your application configuration allowing you to customize behavior for your file. See also [conifg.xml reference documentation][config.xml ref]
    
#### www/
Contains the project's web artifacts, such as .html, .css and .js files. As a cordova application developer, most of your code and assets will go here. They will be copied on a `cordova prepare` to each platform's www directory. The www source directory is reproduced within each platform's subdirectory, appearing for example in platforms/ios/www or platforms/android/assets/www. Because the CLI constantly copies over files from the source www folder, you should only edit these files and not the ones located under the platforms subdirectories. If you use version control software, you should add this source www folder, along with the merges folder, to your version control system.

#### platforms/
Contains all the source code and build scripts for the platforms that you add to your project. 

**WARNING:** When using the CLI to build your application, you should not edit any files in the /platforms/ directory unless you know what you are doing, or if documentation specifies otherwise. The files in this directory are routinely overwritten when preparing applications for building, or when plugins are reinstalled. 

#### plugins/
Any added plugins will be extracted or copied into this directory. 

#### hooks/
This directory may contains scripts used to customize cordova-cli commands. Any scripts you add to these directories will be executed before and after the commands corresponding to the directory name. Useful for integrating your own build systems or integrating with version control systems.

Refer to [Hooks Guide] for more information.

#### merges/
Platform-specific web assets (HTML, CSS and JavaScript files) are contained within appropriate subfolders in this directory. These are deployed during a `prepare` to the appropriate native directory.  Files placed under `merges/` will override matching files in the `www/` folder for the relevant platform. A quick example, assuming a project structure of:

    merges/
    |-- ios/
    | `-- app.js
    |-- android/
    | `-- android.js
    www/
    `-- app.js

After building the Android and iOS projects, the Android application will contain both `app.js` and `android.js`. However, the iOS application will only contain an `app.js`, and it will be the one from `merges/ios/app.js`, overriding the "common" `app.js` located inside `www/`.

####Version control
It is recommended not to check in `platforms/` and `plugins/` directories into version control as they are considered a build artifact. Instead, you should save the platform/plugin spec in the `config.xml` and they will be downloaded when on the machine when `cordova prepare` is invoked.

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

Manage cordova platforms - allowing you to add, remove, update, list and check for updates. Running commands to add or remove platforms affects the contents of the project's platforms directory. 

###Syntax
```
    cordova {platform | platfoms} [ 
        add <platform-spec> [...] {--save | link=<path> } | 
        {remove | rm}  platform [...] | 
        {list | ls}  | 
        check | 
        save ] 
```
| Sub-command           | Option | Description |
------------------------|-------------|------|
| add `<platform-spec>` [...] |  | Add specified platforms |
|     | --save                   | Save `<platform-spec` into config.xml after installing them using `<engine>` tag |
|     | --link=`<path>`          | When `<platform-spec>` is a local path, links the platform library directly instead of making a copy of it (support varies by platform; useful for platform development)
| remove `<platform>` [...] |    | Remove specified platforms |
|     | --save                   | Delete specified platforms from config.xml after removing them |
| update `platform` [...] |      | Update specified platforms |
|     | --save                   | Updates the version specified in `config.xml` |     
| list |                         | List all installed and available platforms |
| check |                        | List platforms which can be updated by `cordova-cli platform update | 
| save  |                        | Save `<platform-spec>` of all platforms added to config.xml |

### Platform-spec
There are a number of ways to specify a platform:    
    
    <platform-spec> : platform[@version] | path | url[#commit-ish]
    
| Value | Description |
|-----------|-------------|
| platform | Platform name e.g. android, ios, windows etc. to be added to the project. Every release of cordova CLI pins a version for each platform. When no version is specified this version is used to add the platform. |
| version | Major.minor.patch version specifier using semver |
| path |  Path to a directory containing a platform |
| url | Url to a git repository or tarball containing a platform |
| commit-ish | Commit/tag/bramch reference. If none is specified, 'master' is used |

###Supported Platforms

- Android
- iOS
- Windows (8.0, 8.1, 10, Phone 8.1)
- Blackberry10
- Firefox OS
- Ubuntu

###Deprecated Platforms

- Amazon-fireos (use Android platform instead)
- WP8 (use Windows platform instead)

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
- Save versions of all platforms currently added to the project to `config.xml`.
```
    cordova platform save
```

## cordova plugin command
###Synopsis
Manage project plugins

### Syntax
```
    cordova {plugin | plugins} [ 
        add <plugin-spec> [..] {--searchpath=<directory> | --noregistry | --link | --save | --browserify} |
        {remove | rm} {<pluginid> | <name>} --save | 
        {list | ls} |
        search [<keyword>] |
        save |
    ]

```
| Sub-command | Option | Description
|------------------------|-------------|------
| add `<plugin-spec>` [...] | | Add specified plugins
|       |--searchpath `<directory>` | When looking up plugins by ID, look in this directory and each of its subdirectories before hitting the registry. Multiple search paths can be specified. Use ':' as a separator in *nix based systems and ';' for Windows.
|       |--noregistry             | Don't search the registry for plugins.
|       |--link                   | When installing from a local path, creates a symbolic link instead of copying files. The extent to which files are linked varies by platform. Useful for plugin development.
|       |--save                   | Save the `<plugin-spec>` as part of the `plugin` element  into `config.xml`.
|       |--browserify             | Compile plugin JS at build time using browserify instead of runtime.
| remove `<pluginid>|<name>` [...] | Remove plugins with the given IDs/name.
|       |--save                    | Remove the specified plugin from config.xml
|list                           |  | List currently installed plugins
|search `[<keyword>]` [...]     |  | Search http://plugins.cordova.io for plugins matching the keywords
|save                           |  | Save `<plugin-spec` of all plugins currently added to the project                      
   
### Plugin-spec

There are a number of ways to specify a plugin:
```
    <plugin-spec> : pluginID[@version]|directory|url[#commit-ish]
```

| Value       | Description
|-------------|--------------------
| plugin | Plugin id (id of plugin in npm registry or in --searchPath)
| version | Major.minor.patch version specifier using  insemver
| directory | Directory containing plugin.xml
| url | Ur inl to a git repository containing a plugin.xml
| commit-ish | Commit/tag/branch reference. If none is sp inecified, 'master' is used

### Examples
- Add `cordova-plugin-camera` and `cordova-plugin-file` to the project and save it to `config.xml`. Use `../plugins` directory to search for the plugins.
```
    cordova plugin add cordova-plugin-camera cordova-plugin-file --save --searchpath ../plugins
```
- Add `cordova-plugin-camera` with [semver](http://semver.org/) version ^2.0.0 and save it to `config.xml`:    
```    
    cordova plugin add cordova-plugin-camera@^2.0.0 --save
```
- Clone the specified git repo, checkout to tag `2.1.0` and add it to the project. Save the `plugin-spec` to `config.xml`:
```    
    cordova plugin add https://github.com/apache/cordova-plugin-camera.git#2.1.0 --save
```
- Add the plugin from the specified local directory:    
```
    cordova plugin add ../cordova-plugin-camera
```    
- Add the plugin from the specified tarball file:  
```
    cordova plugin add ../cordova-plugin-camera.tgz --save
```
- Remove the plugin from the project and the config.xml:
```
    cordova plugin rm camera --save
```
- List all plugins installed in the project:
```
    cordova plugin ls
```

[Hooks guide]: http://cordova.apache.org/docs/en/latest/guide_appdev_hooks_index.md.html#Hooks%20Guide
[config.xml ref]: 