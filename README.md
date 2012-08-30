# cordova-client

> Build, deploy and manage [Cordova](http://cordova.io)-based applications.

## Supported Platforms

- iOS
- Android

# Requirements

cordova-client requires [nodejs](http://nodejs.org/).

For every platform that Cordova supports and you want to use with
cordova-client, you will need to install the SDK for that platform. See:

- [iOS SDK](http://developer.apple.com)
- [Android SDK](http://developer.android.com)

cordova-client has been tested on Mas OS X _only_. Sorry.

In it's prototype stages, cordova-client will only work on Cordova
v2.1.0rc1 and above.

# Getting Started

You should (eventually) be able to `npm install cordova-client -g`.
Until then, after you clone this code, run `npm install` from inside this
directory (you may want to run that with `sudo`). After that you will be able to access the client interface
via:

    $ ./bin/cordova

## Creating A Cordova-Based Project

    $ cordova create [directory]
    $ cordova create [directory name]
    $ cordova create [directory id name]

Creates a Cordova application. You can optionally specify just a name
for your application, or both an id (package name or reverse-domain
style id) and a name.

A Cordova application built with cordova-client will have the following
directory structure:

    myApp
    |-.cordova
    |- platforms
    |- plugins
    `- www

- `.cordova`: contains meta-data related to your application
- `platforms`: platforms added to your application will have the native
  application project structures laid out within this directory
- `plugins`: any added plugins will be extracted into this directory
- `www`: your main application assets

From here, you have a Cordova-based project whose state you can
manipulate using the below project-level commands.

## Project-Level Commands

Inside a Cordova-based project, you can use `cordova` with the
`platform`, `plugin`, `build` and `emulate` sub-commands.

### Managing Platforms

#### Listing All Platforms

    $ cordova platform [ls]

Lists out all platforms that the Cordova-based project is currently
being built to.

#### Adding A Platform

    $ cordova platform add [platform]

Adds the platform as a build target for the current Cordova-based
project.

#### Removing A Platform

    $ cordova platform remove [platform]

Removes the platform as a build target from the current Cordova-based
project.

### Building Your Project

    $ cordova build

You can call `cordova build` with no arguments if you are inside a cordova based project. This will compile your app for all platforms added to your Cordova project.

### Emulating Your Project

    $ cordova emulate

Will launch emulators for all platforms added to your
Cordova project.

### Managing Plugins

Plugin integration hinges on:

- You having the plugin code locally on your computer
- The plugin code adheres to the [Cordova Plugin Specification](https://github.com/alunny/cordova-plugin-spec)

#### Listing All Plugins

    $ cordova plugin [ls]

Lists out all plugins added to the current Cordova-based project.

#### Adding A Plugin

    $ cordova plugin add [path-to-plugin]

Adds the platform as a build target for the current Cordova-based
project.

#### Removing A Plugin

    $ cordova plugin remove [plugin]

**NOT IMPLEMENTED!**

# Examples

## Creating a sample project

    $ cordova create ~/src/myNewApp

# Contributing

## Running Tests

    $ npm test

**WARNING**: If you run tests and don't have any sub-directories under
`./lib`, be prepared to see some failing tests as then this project will
start cloning any necessary Cordova libraries (which may take a while).

Also note that the the `spec/helper.js` file contains all of the
mocks/stubs that we override for testing purposes.

## TO-DO

- figure out versioning. for now: 2.1.0 minimum.
- properly extracting info from config.xml
- blackberry support
- windows phone support
