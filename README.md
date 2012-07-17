# cordova-client

> Build, deploy and manage [Cordova](http://cordova.io)-based applications.

## Supported Platforms

- iOS
- Android
- BlackBerry

# Requirements

Cordova client requires [nodejs](http://nodejs.org/).

For every platform that Cordova supports and you want to use with
cordova-client, you will need to install the SDK for that platform. See:

- [iOS SDK](http://developer.apple.com)
- [Android SDK](http://developer.android.com)
- [BlackBerry WebWorks SDK](http://developer.blackberry.com)

Cordova client has been tested on Windows, Linux and Mas OS X.

# Getting Started

You should (eventually) be able to `npm install cordova-client -g`.
Until then, after you clone this code, run `npm install` from inside this
directory. After that you will be able to access the client interface
via:

    $ ./bin/cordova

## Creating A Cordova-Based Project

    $ cordova create [directory]

Creates a Cordova application. When called with no arguments, `cordova create` will generate a Cordova-based project in the current directory.

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

Removes the platform as a build target from the current Cordova-based
project.


### Building Your Project

    $ cordova build [platform]

You can call `cordova build` with no arguments if you are inside a cordova based project. This will compile your app for all platforms added to your Cordova project.

### Emulating Your Project

    $ cordova emulate [platform]

Will compile and launch your app on all platforms added to your
Cordova project. You can optionally specify a specific platform to
launch for.


# Examples

## Creating a sample project

    $ cordova create
