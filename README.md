# cordova-client

> The command line tool to build, deploy and manage [Cordova](http://cordova.io)-based applications.


# Requirements

* [nodejs](http://nodejs.org/)
* [git](https://help.github.com/articles/set-up-git)
* SDKs for every platform you wish to support
  - [iOS SDK](http://developer.apple.com)
  - [Android SDK](http://developer.android.com) - **NOTE** This tool
    will not work unless you have the absolute latest updates for all
    Android SDK components.

cordova-client has been tested on Mas OS X _only_. Sorry.

In it's prototype stages, cordova-client will only work on Cordova
v2.1.0rc1 and above.

# Install

Eventually this will be available via npm. For now you must install manually:

```
git clone https://github.com/filmaj/cordova-client.git
cd cordova-client
sudo npm install -g
```

the -g flag installs cordova globally, so you can access the tool via `cordova`


## Subcommands

format | description 
:------------ | :-------------
`create <directory> [<id> [<name>]]` | create a new cordova project with optional name and id
`platform ls` | list all platforms the project will build
`platform add <platform>` | add a platform as a build target for the project
`platform remove <platform>` | removes a platform as a build target for the project
`plugin ls` | list all plugins added to the project
`plugin add <path-to-plugin>` | add a plugin to the project
`plugin remove <plugin>` | **NOT IMPLEMENTED!**
`build` | compile the app for all platforms added to the project
`emulate` | launch emulators for all platforms added to the project


## File and Directory Structure
A Cordova application built with cordova-client will have the following
directory structure:

    myApp/
    |-.cordova/
    |- platforms/
    |- plugins/
    `- www/

### .cordova/
The .cordova directory contains the project's baked-in plugins and platforms, and meta-data used by the rest of the commands. The root project directory has a .cordova directory inside of it, and that directory identifies the parent as a cordova project. Project directories may not be nested. A Cordova project directory is recognized as such when it has a .cordova directory.  This data is generated when calling `cordova create`. It's modified when adding/removing platforms or plugins to the project.


Commands other than `create` operate against the project directory itself, rather than the current directory - a search up the current directory's parents is made to find the project directory. Thus, any command (other than `create`) can be used from any subdirectory whose parent is a cordova project directory (same as git).

### platforms/ and plugins/
platforms added to your application will have the native
 application project structures laid out within this directory
  
Additional platforms and projects can be installed, and removed, with the cordova platform/plugin add/remove subcommands. The add versions of these subcommands take a URI as a parameter. If the URI does not contain a protocol/scheme, it's assumed to be a 'baked in' platform/plugin. Otherwise, it's assumed to be a URL to a gzipped tar archive of the platform/plugin, in the shape of an npm package.

Platforms and projects are expected to be "CommonJS packages" (loosely), similar to the way npm packages are structured. The main requirement is that there be a package.json file available in the 'root directory' of the archive. The package.json file will contain additional meta-data for platforms and plugins, including pointers to such things as native code that needs to be compiled/linked/added to the application during a build.

#### platforms/
platforms added to your application will have the native
 application project structures laid out within this directory

#### plugins/
any added plugins will be extracted into this directory

### www/
Contains the project's web artifacts, such as .html, .css and .js files. These are your main application assets.


# Examples

## Creating a new cordova project
This example shows how to create a project from scratch named KewlApp with iOS and Android platform support, and includes a plugin named Kewlio. The project will live in ~/MyProjects/KewlApp

```
cordova create ~/KewlApp

cd ~/KewlApp

cordova platform add ios

cordova platform add android

cordova plugin add http://example.org/Kewlio-1.2.3.tar.gz

cordova build 
```

The directory structure of KewlApp now looks like this:

    KewlApp/
    |- .cordova/
    |- platforms/
       |- android/
       |  `- …
       `- ios/
          `- …
    |- plugins/
       `- Kewlio/
    `- www/
       `- index.html

# Contributing

## Running Tests

    npm test

**WARNING**: If you run tests and don't have any sub-directories under
`./lib`, be prepared to see some failing tests as then this project will
start cloning any necessary Cordova libraries (which may take a while).

## Managing Plugins

Plugin integration hinges on:

- You having the plugin code locally on your computer
- The plugin code adheres to the [Cordova Plugin Specification](https://github.com/alunny/cordova-plugin-spec)


## TO-DO

- installing only supported platforms for the app vs. the plugin (and
  vice-versa)
- npm package
- bootstrapping the tests
- properly extracting info from config.xml
- checking SDK compatibility
- blackberry support
- windows phone support
- testing on machines other than Mac OS X
- figure out versioning. for now: 2.1.0 minimum

### Bash Completions

It would be useful to support Bash command-line completions, in the [same manner as git](http://en.newinstance.it/2010/05/23/git-autocompletion-and-enhanced-bash-prompt/). Completions on subcommands, plugins, platforms, files, etc.

- it would be useful
- it would force us into some consistency to maintain an easy completion script

### Random Notes
posted to the mailing list by BrianL

yah. there is tonnes of prior art for this stuff. I will update the wiki but quickly, this was stable: [https://github.com/brianleroux/Cordova/tree/b816aacfb7583174be9f44f71dc32c8465d1319]()

then other things happened. Those scripts ended up in the mainline projects. The idea was a standard package format for a project and upgrading would consist only of swapping out the bin directory. The scripts would live local the project avoiding version hell between releases.

This new thinking is different. We now think the native project as it were should host its own scripts. Upgrading not a consideration. Maybe it should be. You're thinking of a master global script, which is cool and something I've always wanted, but the version thing needs to be considered. perhaps not an issue between releases if the native project (the target of www) deals with the version itself...

cordova-client internally depends on pluginstall, a tool written by Andrew Lunny to support installing plugins for the iOS and Android platforms [https://github.com/alunny/pluginstall]()
