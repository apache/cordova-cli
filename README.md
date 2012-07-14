cordova-client
==============

Cordova client allows you to create, build and emulate Cordova projects.

Cordova client uses the platform specific scripts for creating, building and emulating projects. Your projects have to be created using either the platform specific create script or the cordova client master script.

Cordova client supports iOS and Android for now. More platforms will be added soon!

Cordova client requires:

- [nodejs](http://nodejs.org/)
- [iOS SDK](http://developer.apple.com)
- [Android SDK](http://developer.android.com)

Cordova client has been tested on Windows, Linux and Mas OS X.


Using cordova client
====================

Creating projects
-----------------

    cordova create [[platform:[directory]:[package_name]:[project_name]] [platform:[directory]:[package_name]:[project_name]]...|cordova.conf]
<!-- -->

- directory: path to your new Cordova based project
- package_name: following reverse-domain style convention
- project_name: Cordova based project name

When called with no arguments _cordova create_ will generate an _cordova-ios-example_ and _cordova-android-example_ in the current directory

cordova.conf format
-------------------

cordova.conf should be formatted this way:

    platform directory package_name project_name
    platform directory package_name project_name

Default cordova.conf:

    ios ~/Projects/ios-example com.example.cordovaexample CordovaExample
    android ~/Projects/android-example com.example.cordovaexample CordovaExample

Building projects
-----------------

    cordova build [[directory] [directory]...|cordova.conf]

You can call _cordova build_ with no arguments if you are inside a cordova based project. _cordova build_ will just call the _./cordova/debug_ script.


Emulating projects
------------------

    cordova emulate [directory] [directory]...|cordova.conf

Will launch the platform's emulator


Examples:
=========

Creating a sample iOS and android project
-----------------------------------------

    cordova create

this will generate two projects in the current directory: _ios-example_ and _android-example_

Creating a sample iOS project and android project with specific arguments
-------------------------------------------------------------------------
    
    cordova create ios:./my-ios-project:com.example.myiospackage:CordovaExample android:./my-android-project:com.example.myandroidpackage:CordovaActivity

Building projects (platform does not matter)
--------------------------------------------

    cordova build ./ios-example ./android-example

Emulating projects (platform does not matter)
--------------------------------------------

    cordova emulate ./ios-example ./android-example
