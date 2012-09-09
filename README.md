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
- [Android SDK](http://developer.android.com) - **NOTE** MAKE SURE YOU
  HAVE THE LATEST _EVERYTHING_ !!!!!

> MikeR: would be nice to elaborate on what "everything" means. And why it's important…has it resulted in breakage? If so, what are some clues this might be the cause?


> MikeR: possible to determine if SDKs are present, with compatible versions, and provide descriptive errors if missing?
> 

cordova-client has been tested on Mas OS X _only_. Sorry.

In it's prototype stages, cordova-client will only work on Cordova
v2.1.0rc1 and above.



# Getting Started

Eventually this will be available via npm but for now you must install manually:

```
clone https://github.com/filmaj/cordova-client.git
cd cordova-client
sudo npm install
```

You will be able to access the client interface
via: ``` $ ./bin/cordova```

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


subcommand | description 
------------ | -------------
`init` | initialize the current directory as a cordova project 
`create [directory] --id --name` | create a new cordova project with optional name and id
`platform [ls]` | list all platforms the project will build
`platform add [platform]` | add a platform as a build target for the project
`platform remove [platform]` | removes a platform as a build target for the project
`build` | compile the app for all platforms added to the project
`emulate` | launch emulators for all platforms added to the project
`plugin [ls]` | list all plugins added to the project
`plugin add [path-to-plugin]` | add a plugin to the project
`plugin remove [plugin]` | **NOT IMPLEMENTED!**


### Managing Plugins

Plugin integration hinges on:

- You having the plugin code locally on your computer
- The plugin code adheres to the [Cordova Plugin Specification](https://github.com/alunny/cordova-plugin-spec)




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

- installing only supported platforms for the app vs. the plugin (and
  vice-versa).
- figure out versioning. for now: 2.1.0 minimum.
- properly extracting info from config.xml
- blackberry support
- windows phone support
