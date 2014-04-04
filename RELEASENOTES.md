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
# Cordova-cli Release Notes

### 3.4.0-0.1.3 (Mar 3, 2014)
* Update to plugman v0.20.2

### 3.4.0-0.1.2 (Feb 28, 2014)
* Update to plugman v0.20.1

### 3.4.0-0.1.1 (Feb 26, 2014)
* Update to plugman v0.20.0
* CB-5647 Remove concept of .staging dir. Install directly to www/
* CB-5299 Speed up prepare by using plugman's new reapply_global_munge()
* Refactored config_parser.js to simply both it and its tests.
* CB-6076 Make "Generating config.xml from defaults" a verbose log
* CB-5181 Use spawn helper for all sub-shelling.
* CB-6049, CB-5181 Enable stdio for build sub-commands and hooks

## 3.4.0-0.1.0 (Feb 14, 2014)
* CB-5638 Clean-up: remove unreachable info case from function
* CB-5937 Add "platform check" command: Shows platforms that are out of date
* CB-5634 Minor refactoring + tests for Android's orientation preference.
* CB-5634 Set Android orientation from config.xml
* Upleveled amazon_fireos_parser. Making it at par with android_parser.js
* CB-5947 Throw when trying to create project inside custom www.
* CB-4153 Update help.txt about --source -> --copy-from

## 3.3.1-0.3.1 (Jan 31, 2014)
* CB-4153 Rename --source and --link flags to --copy-from and --link-to

## 3.3.1-0.3.0 (Jan 30, 2014)
* Updated plugman dependency to 0.19.0
* CB-5913 Fail more gracefully on Windows when symlinks fail.
* Fix isWindows check in util.js to support win64
* CB-5907 Make `cordova update` get version from platform's version script
* CB-3612 Don't pass --device to "run" command by default.
* CB-5493 lazy_load now downloads to a temp dir and then moves.
* CB-5782 Hide stack trace for explicitly handled error conditions
* CB-5590 Have config.xml version map to CFBundleShortVersionString instead of CFBundleVersion
* CB-5299 Cache pbxproj to avoid re-parsing it for each plugin.
* CB-5813 Fix missing quotes on update and ls commands
* CB-5808 Fix lazy_load stripping off windows drive letters
* Expose util.isCordova as cordova.findProjectRoot()
* Allow lazy_load libs to work without an id and version for local paths.
* Add an option to config.js to not write config.json during create.
* Update node-xcode dependency to 0.6.6

## 3.3.1-0.2.0 (Jan 15, 2014)
* CB-5006 Add --searchpath to "plugin add" so that installing by ID will search local paths before hitting the registry.
* CB-4153 Add --src & --link to cordova create.
* CB-5687 Make cordova commands work when CWD is inside of a symlink'ed www/
* CB-4910 Default config.xml to the root instead of within www/
* CB-5764 Move hooks/ to top-level instead of under .cordova
* CB-5763 Don't create .cordova/ by default
* CB-4871 Reduced package size significantly.
* CB-4976 Don't use ~/.cordova/lib for local directory
* CB-5777 Fix "platform update" not updating cordova.js
* CB-5728 Files in merges must remain intact when removing platform

## 3.3.0-0.1.0
* CB-5347 Handle dangling platform symlink in cordova platform add
* Added deprecation notice about wp7
* updated plugman version to 0.17.0
* CB-5573 relies on stderr content and error codes to detect a problem with xcode installation.
* CB-4382 Pass cli arguments to project-level hooks
* CB-5362 blackberry parser: support local cordova-blackberry
* CB-5345 Add pre_package event for windows8 parser.

## 3.2.0-0.4.0

* Make sure errors during prepare are reported
* CB-5031 Add CLI help text for platform update and plugin search
* CB-5298 Remove redundant requirements check for iOS and Android. The bin/create scripts check.
* windows8. fixes version number parsing logic
* CB-4472 Remove <preference> from template config.xml

## 3.2.0-0.3.0

* CB-5501 fix blackberry10 platform
* [android] fixing failing android parser spec tests
* [android] call out to platform check_req script

## 3.2.0-0.2.0

* CB-5485 fixed issue with use of cordova cli api

## 3.2.0-0.1.0

* add the output of the plugman results to the console
* CB-5363 Improve config_json error reporting
* CB-5364 config_parser - check for null element text
* Fix issue not finding platform script when in subdir - check platforms which have subdir
* CB-5377 serve: should only indicate listening when it is
* CB-5368 Cordova serve deflate content breaks IE
* Change cordova serve's project.json to include etags.
* CB-5280 Update serve's help text to remove platform arguments
* CB-5364 config_parser - handle duplicates with children and text when merging
* CB-5320 Document avoiding sudo
* CB-4400: cd to project root in most cordova commands.
* CB-5063: Revert to copying cordova.js before user www dir
* fix 3 failing tests for windows8 and wp8 and add assertions for wp7 too.
* Adding instructions for installing on master.
* CB-5063: Keep cordova.js in platform_www to avoid copying it from lib.
* CB-5307: Remove references to Callback and Incubator
* tests were failing attempting to match lib/dir and lib\\dir on windows
* CB-5183 WP7/8 lib path is not correctly resolved by CLI (additional changes)
* CB-5283 Improved cordova serve message to be more descriptive
* [CB-4866] Execute hooks in ascending order of any leading numbers
* [CB-5143] Locate the actual Android app .java file much more carefully.
* Cleaning up wp7+8 parsers' use of promises. Fix tests.
* serve: Fix doRoot() not being called & remove duplicated table.
* serve: provide basic entry point
* Code style (indentation)
* Wait for the pre_package event to finish, or the update_csproj function might give unexpected results
* Add pre_package event to wp8 project
* readability + code quality in wp7+8 parsers
* CB-5183 WP7/8 custom_path is not correctly resolved by CLI
* [CB-4994] Update xcode dependency to handle Xcode 5 capabilities.
* [CB-5220] "An error occurred" is missing an "A" ...


## 3.1.0-0.2.0

* increased version of plugman to 0.14.0 in package.json
* CB-5187: remove unused var os_platform
* CB:5187 on node  windows broken compile, emulate, run
* [CB-4976] Don't symlink into ~/.cordova/lib for local libs
* [CB-5142] improve grammar of emulate description
* [CB-5147] emulate needs a space before error message
* CB-5125 add tests for chil process spawn
* CB-5125: replace child process exec with spawn
* CB-4748: Fail quickly if dir passed to cordova create is not empty.
* CB-5106: removed flood of cp error messages when running tests
* CB-5106:[wp7] fixed broken wp7 tests
* CB-5106:[win8] fixed tests for windows 8
* Using .find to grab visualelements instead
* CB-5066: fixed issue with visual elements not being referenced correctly
* windows8: remove debug console.log
* windows8: fixed project parser issue, and updated tests
* Update tests for commit d1c8024: update_project() should not call update_www() directly
* begin firefoxos tests
* CB-5066: dealing with windows8 issues
* config.xml helper function is used, removed error merge of wp folder.
* CB-5066: continuing merge of windows 8 stuff
* CB-5066: merged in windows 8 support into master from cordova-3.1.x
* config.xml helper function is used, removed error merge of wp folder.
* CB-5066: continuing merge of windows 8 stuff
* CB-5066: merged in windows 8 support into master from cordova-3.1.x
* CB-2234 Add 'cordova info' command
* CB-4774: Copy www assets before running plugin prepare
* cordova help should return a Q. fixes CB-5070
* updated to a version greater than our latest version on npm
* added not about platform+os restrictions
* added myself as a contributor, CB-5042 added info on windows8
* CB-5067: added exception incase no platform level config.xml or defaults.xml exisit
* added temp config path for ffos, fixed wp8 config_xml function
* [CB-4774] Updated prepare flow to make platform config.xml a build output   - Adds a new method to
* CB-5032: clarify the help text
* [CB-4621] Updating run and emulate commands to always provide default options
* Log requests in cordova serve
* Make cordova serve ignore dot files.
* CB-4957: added fix for FFOS
* Update "cordova serve" to work with promises refactoring
* [CB-4774] Display proper error if cordova prepare run not in project dir.
* Fixes a bug where cordova prepare bombs on a config missing a content element   - Changes an undefi
* Bumping elementtree version to 0.1.5 to match plugman and support namespaced xml elements
* Fix cli.js tests broken by --silent change.
* [CB-4877]: Add basic logging, --silent flag.
* Fix busted test.
* First pass
* [CB-4883]: Graceful handling of lazy loading errors.
* reapplied change to add event mid build to allow mods to www folder pre_package  aka 775e969f9cc27a
* Remove two debugger; lines that snuck in.
* [CB-4604] Execute hooks directly (not .bat files) cross-platform
* Refactor to use Q.js promises in place of callbacks everywhere.
* [CB-4837]: Version 3.0.10. Depends on Plugman 0.12.x.
* Add missing license headers
* Update repo versions to 3.1.0-rc1
* Add `cordova update foo` command, with tests. [CB-4777]
* Add version numbers to `platform ls` output.
* [CB-4545] support for merges directory on both wp7 & wp8
* Rename CHANGELOG.md -> RELEASENOTES.md
* Fix expectation for platform ls test, for firefoxos
* Fix platforms.js: firefoxos.parser
* CB:4657 added ffos support to cli
* CB-4657: added staging_dir function to ff parser
* add default manifest properties for firefox os platform
* make the firefoxos parser actually build the project
* change firefoxos link to tarball
* add firefox platform
* [CB-4797] Fix a crash on undefined platform in path.
* [CB-4797] Add missing return statement in cordova serve
* Fix broken tests due to lazy requiring change.
* [CB-4797] Change `serve` command to serve platforms keyed off of path component.
* [CB-4793] Lazily require modules in some places.
* [CB-4325] Run platform installs in serial instead of in parallel
* Version updated to 3.0.10-dev

## 3.0.10

Important note: This version targets Cordova version 3.1.0-rc1.

### Notable

- You can now `cordova platform update <platform>`, which calls the platform's update script. Android, iOS, WP7 and WP8 have update scripts. Please give this a try and report any problems!

### Features

- `platform ls` now shows the version of each installed platform.
- `merges` are now supported on WP7+8.
- `serve` now serves from `http://myhost.com/ios/www`, `/android/www`, etc., serving all platforms at once.
- Speed significantly improved by importing modules only on demand. `prepare` is much faster, `platform ls` more than 10x faster.
- Now with Firefox OS!

### Bugfixes

- Corner cases in `serve`.


## 3.0.9

### Features

- `platform ls` now shows both installed and available-to-install platforms. [CB-3904](https://issues.apache.org/jira/browse/CB-3904)

### Bugfixes

- Plugins are now installed serially across all installed platforms, rather than in parallel. This avoids race conditions in dependency installation. [CB-4184](https://issues.apache.org/jira/browse/CB-4184)
- (WP8) All files from project www dir are now copied into the binary, not the top-level www. This means merges and plugin assets are correctly handled.


### 3.4.1-0.1.0 (Apr 03, 2014)
* updated to use iOS 3.4.1
* CB-6377 Fix up superspawn's cmd fallback when there is a space in the args
* CB-6377 Remove windowsVerbatimArguments from superspawn
* CB-6344 Fix spy to return a default platform JSON instead of an empty object
* CB-6382 platform list: sort output
* CB-6377 Handle spaces in paths for cmd related scripts
* CB-6292 Add a callback-based API for cordova info (in addition to promise API)
* CB-6292 Revert commits that add explicit callbacks to APIs
* CB-6322 Simplify platforms/platform code for platform specifics
* README.md: Getting Started guides link was broke. Fix.
* Make "cmd" executed more readable.
* CB-6141 Fix Windows 8 tests
* Use smarter BOM-skipping logic when parsing XML.
* CB-6357 platform check - install each platform to determine working + version number
* CB-6357 platform: provide exports for functions
* CB-6357 platform: Refactor into distinct functions
* CB-6338 Improve error for missing template
* CB-6337 Print nice error when cordova-cli hits various expected things
* This closes #147
* CB-6267 Windows8. Apply BackgroundColor from config.xml
* CB-6338 Improve error for missing template
* CB-6030 - Automatically increment port for serve when default is in use
* CB-6337 Print nice error when cordova-cli hits various expected things
* CB-6323 Fix harmless typo in superspawn (cmd -> c)
* CB-6323 Fix superspawn's resolve function on windows (was very broken)
* CB-6306 Error creating project when path to project includes spaces
* Tweak error message when hooks fail (wasn't showing correct command)
* [CB-6296] callback/promise interface implemented
* [CB-6293] additional tests for run command
* [CB-6292] tests for build function's dual return method
* updated jasmine dependency for timing
* CB-6211 'cordova info' command fixed for Windows platform
* Fix prepare command from hiding failures.
* Fix ConfigParser.getPreference error + tests
* CB-6209 Uplevel changes from android_parser to amazon_fireos_parser Added orientation related config changes from android_parser.
* CB-6147 Enable CLI and Plugman with npm shrinkwrap
* When searchpath is specified in config and CLI, merge them.
* Add --searchpath to help.txt
* Fix node-style-callbacks form of the CLI api not passing through results.
