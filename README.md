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

#### Your Blanket: www/config.xml 

This file is what you should be editing to modify your application's metadata. Any time you run any cordova-client commands, the tool will look at the contents of `config.xml` and use all relevant info from this file to define native application information. cordova-client supports changing your application's data via the following elements inside the `config.xml` file:

- The user-facing name can be modified via the contents of the `<name>` element.

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


## TO-DO + Issues

Please check [cordova-client on GitHub](http://github.com/filmaj/cordova-client).

### Bash Completions

It would be useful to support Bash command-line completions, in the [same manner as git](http://en.newinstance.it/2010/05/23/git-autocompletion-and-enhanced-bash-prompt/). Completions on subcommands, plugins, platforms, files, etc.

- it would be useful
- it would force us into some consistency to maintain an easy completion script

