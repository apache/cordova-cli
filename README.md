# cordova-client

> The command line tool to build, deploy and manage [Cordova](http://cordova.io)-based applications.

# Requirements

* [nodejs](http://nodejs.org/)
* [git](https://help.github.com/articles/set-up-git)
* SDKs for every platform you wish to support
  - [BlackBerry WebWorks SDK](http://developer.blackberry.com)
  - [iOS SDK](http://developer.apple.com)
  - [Android SDK](http://developer.android.com) - **NOTE** This tool
    will not work unless you have the absolute latest updates for all
    Android SDK components.

cordova-client has been tested on Mas OS X and Linux.

In it's prototype stages, cordova-client will only work on Cordova
v2.1.0.

# Install

```
npm install -g cordova
```

# Getting Started

cordova-client has a single global `create` command that creates new cordova projects into a specified directory. Once you create a project, `cd` into it and you can execute a variety of project-level commands. Completely inspired by git's interface.

## Global Command

- `create <directory> [<id> [<name>]]` create a new cordova project with optional name and id (package name, reverse-domain style)

## Project Commands

- `platform [ls | list]` list all platforms the project will build to
- `platform add <platform>` add a platform as a build target for the project
- `platform [rm | remove] <platform>` removes a platform as a build target for the project
- `plugin [ls | list]` list all plugins added to the project
- `plugin add <path-to-plugin>` add a plugin to the project
- `plugin [rm | remove] <plugin-name>` remove an added plugin
- `build [<platform> [<platform> [...]]]` compile the app and deploy to a connected + compatible device. With no parameters builds for all platforms added to the project, otherwise builds for the specified platforms
- `emulate [<platform> [<platform> [...]]]` launch emulators and deploy app to them. With no parameters emulates for all platforms added to the project, otherwise emulates for the specified platforms


## File and Directory Structure
A Cordova application built with cordova-client will have the following
directory structure:

    myApp/
    |-.cordova/
    |- platforms/
    |- plugins/
    `- www/

### .cordova/
This file identifies a tree as a cordova project. Simple configuration information is stored in here (such as BlackBerry environment variables).

Commands other than `create` operate against the project directory itself, rather than the current directory - a search up the current directory's parents is made to find the project directory. Thus, any command (other than `create`) can be used from any subdirectory whose parent is a cordova project directory (same as git).

### platforms/
Platforms added to your application will have the native
 application project structures laid out within this directory.

### plugins/
Any added plugins will be extracted or copied into this directory.

### www/
Contains the project's web artifacts, such as .html, .css and .js files. These are your main application assets. The config.xml file within this directory is very important; read on to the next section!

#### Your Blanket: www/config.xml 

This file is what you should be editing to modify your application's metadata. Any time you run any cordova-client commands, the tool will look at the contents of `config.xml` and use all relevant info from this file to define native application information. cordova-client supports changing your application's data via the following elements inside the `config.xml` file:

- The user-facing name can be modified via the contents of the `<name>` element.

# Examples

## Creating a new cordova project
This example shows how to create a project from scratch named KewlApp with iOS and Android platform support, and includes a plugin named Kewlio. The project will live in ~/MyProjects/KewlApp

```
cordova create ~/KewlApp KewlApp

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

## Managing Plugins

Plugin integration hinges on:

- You having the plugin code locally on your computer
- The plugin code adheres to the [Cordova Plugin Specification](https://github.com/alunny/cordova-plugin-spec)


## TO-DO + Issues

Please check [cordova-client on GitHub](http://github.com/filmaj/cordova-client).

## Contributors

A big thank you to all people who have made this project possible. For a list of people involved, please see the `package.json` file.
