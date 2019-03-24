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

### 9.0.0 (Mar 20, 2019)

* [GH-414](https://github.com/apache/cordova-cli/pull/414) Cordova CLI Release Preparation (Cordova 9)
  * **Bumped Dependencies**
    * `cordova-lib@^9.0.0`
    * `cordova-common@^3.1.0`
    * `editor@^1.0.0` (Prepended `^` only)
    * `loud-rejection@^2.0.0`
  * **Bumped Dev Dependencies**
    * `jasmine@^3.3.1`
    * `eslint-plugin-promise@^4.0.1`
    * `eslint-plugin-node@^8.0.1`
    * `eslint-plugin-import@^2.16.0`
    * `eslint-config-standard@^12.0.0`
    * `eslint-config-semistandard@^13.0.0`
    * `eslint@^5.15.2`
  * Fix `logger[level]` spy in Jasmine
* [GH-397](https://github.com/apache/cordova-cli/pull/397) Update Node.js Deprecation Notice Message
* Add or update GitHub pull request and issue template
* [GH-395](https://github.com/apache/cordova-cli/pull/395) Fix typo: "esecially" to especially
* [GH-364](https://github.com/apache/cordova-cli/pull/364) Fix spec label for build tests
* [GH-344](https://github.com/apache/cordova-cli/pull/344) Check that `bin/cordova` works on Travis CI
* [CB-13740](https://issues.apache.org/jira/browse/CB-13740) gracefully handle platforms that don't pass back requirements to check
* [GH-327](https://github.com/apache/cordova-cli/pull/327) Stub telemetry calls during all tests
* [GH-322](https://github.com/apache/cordova-cli/pull/322) Remove support for `fetch` option
* [GH-321](https://github.com/apache/cordova-cli/pull/321) Remove support for `browserify`
* [GH-317](https://github.com/apache/cordova-cli/pull/317) cli.spec: Telemetry-Related Improvements
* [GH-316](https://github.com/apache/cordova-cli/pull/316) Remove `callback` parameter of main CLI function
* [GH-298](https://github.com/apache/cordova-cli/pull/298) Remove support for deprecated `--copy-from`
* [GH-298](https://github.com/apache/cordova-cli/pull/298) Cleanup code calling `cordova-create`

### 8.1.1 (Sep 27, 2018)
* [GH-339](https://github.com/apache/cordova-cli/issues/339) Fix bin/cordova on Node.js 4
* [GH-337](https://github.com/apache/cordova-cli/issues/337) Revert messing with transitive dependencies in `npm-shrinkwrap.json` (re-introduces a _low-severity_ `npm audit` warning)

### 8.1.0 (Sep 24, 2018)
* README.md fixes
* [GH-295](https://github.com/apache/cordova-cli/pull/GH-295) Proper error code and message when failing
* [GH-296](https://github.com/apache/cordova-cli/pull/GH-296) Remove leftover makeshift benchmarking code
* [GH-296](https://github.com/apache/cordova-cli/pull/GH-296) Use multi-line comment for license headers
* [CB-13772](https://issues.apache.org/jira/browse/CB-13772) print version numbers correctly in cordova requirements [GH-291](https://github.com/apache/cordova-cli/pull/291)
* [GH-307](https://github.com/apache/cordova-cli/pull/GH-307) Remove outdated docs translations
* [GH-306](https://github.com/apache/cordova-cli/pull/GH-306) Remove mentions of 'cordova plugin search' from docs
* [GH-312](https://github.com/apache/cordova-cli/pull/GH-312) Update ESLint and fix linting errors
* [GH-312](https://github.com/apache/cordova-cli/pull/GH-312) Update dependencies
* [GH-300](https://github.com/apache/cordova-cli/issues/300) Update `insight` to resolve `npm audit` warning

### 8.0.0 (Dec 14, 2017)
* [CB-13055](https://issues.apache.org/jira/browse/CB-13055): removed `--nofetch` flag
* Use native Promises instead of `Q`
* [CB-12853](https://issues.apache.org/jira/browse/CB-12853): re-check version before notifying.
* [CB-13501](https://issues.apache.org/jira/browse/CB-13501): updated to include node 8 to tests

### 7.1.0 (Oct 04, 2017)
* [CB-13303](https://issues.apache.org/jira/browse/CB-13303) added `--noprod` and `--production` flags as options, `--noprod` turns off our auto adding of `--production` flag
* [CB-13353](https://issues.apache.org/jira/browse/CB-13353) added `--save-exact` flag to cli and unit test
* [CB-12895](https://issues.apache.org/jira/browse/CB-12895) Added `eslint` and removed `jshint`
* [CB-12862](https://issues.apache.org/jira/browse/CB-12862) Added `searchpath` as a config option
* [CB-12762](https://issues.apache.org/jira/browse/CB-12762) point `package.json` repo items to github mirrors instead of apache repos site
* [CB-12693](https://issues.apache.org/jira/browse/CB-12693) Included examples for `Browserify`, `fetch`, and `autosave` and include options with a more detailed description.
* [CB-12901](https://issues.apache.org/jira/browse/CB-12901) removed `.raw` from `cordova-lib` calls

### 7.0.1 (May 08, 2017)
* [CB-12769](https://issues.apache.org/jira/browse/CB-12769): Updated `cordova-lib` dependency to 7.0.1.

### 7.0.0 (May 02, 2017)
* [CB-12570](https://issues.apache.org/jira/browse/CB-12570): `cordova-fetch` is true by default. Use `--nofetch` flag to fetch platforms and plugins using old fetching logic.
* [CB-12665](https://issues.apache.org/jira/browse/CB-12665): removed `engineStrict` as it is no longer supported
* [CB-11982](https://issues.apache.org/jira/browse/CB-11982): added `edit` and `ls` to `cordova config`
* [CB-11982](https://issues.apache.org/jira/browse/CB-11982): added new `cordova config` command that `sets`, `gets`, and `deletes` global enviroment variables.
* [CB-12008](https://issues.apache.org/jira/browse/CB-12008): updated docs to reflect new autosave changes and removed variables missed due to rebase
* [CB-12008](https://issues.apache.org/jira/browse/CB-12008): made autosave the default for platform and plugin add/remove
* [CB-11977](https://issues.apache.org/jira/browse/CB-11977): removed support for `node 0.x`

### 6.5.0 (Jan 17, 2017)
* [CB-12018](https://issues.apache.org/jira/browse/CB-12018) : updated tests to function with `jasmine` instead of `jasmine-node`

### 6.4.0 (Oct 21, 2016)
* [CB-12039](https://issues.apache.org/jira/browse/CB-12039) updated `cordova-lib` to `6.4.0`
* [CB-11976](https://issues.apache.org/jira/browse/CB-11976) Updated `package.json` engine key
* [CB-11976](https://issues.apache.org/jira/browse/CB-11976) Add deprecated node version warning for 0.x
* Add github pull request template
* [CB-11607](https://issues.apache.org/jira/browse/CB-11607) breakout `cordova-create` from `cordova-lib`
*  [CB-11623](https://issues.apache.org/jira/browse/CB-11623) added back linking
* Document cli - cordova plugin save
* [CB-11023](https://issues.apache.org/jira/browse/CB-11023) Add doc for conflicting plugins

### 6.3.1 (Aug 09, 2016)
* [CB-11685](https://issues.apache.org/jira/browse/CB-11685) Updated cordova-lib dependency to 6.3.1

### 6.3.0 (Jul 12, 2016)
* [CB-11412](https://issues.apache.org/jira/browse/CB-11412) removed link-to, aliased copy-from to template
* [CB-11349](https://issues.apache.org/jira/browse/CB-11349) passing --fetch to create
* [CB-11284](https://issues.apache.org/jira/browse/CB-11284) Telemetry: Track platforms/plugins subcommands(add/rm/etc...)
* [CB-11262](https://issues.apache.org/jira/browse/CB-11262) Add a warning about prerelease lib/cli usage
* [CB-11263](https://issues.apache.org/jira/browse/CB-11263) 'cordova telemetry help' should display help text

### 6.2.0 (May 12, 2016)
* [Telemetry](https://github.com/apache/cordova-cli/pull/247) Added telemetry to cordova-cli to collect data for data driven development
* [CB-11250](https://issues.apache.org/jira/browse/CB-11250) Fix CLI tests verifying the version
* [CB-9858](https://issues.apache.org/jira/browse/CB-9858) added `--fetch` option
* [CB-10986](https://issues.apache.org/jira/browse/CB-10986) Adding note about scoped npm packages for plugins
* [CB-11042](https://issues.apache.org/jira/browse/CB-11042) Add cordova run option to skip prepare
* [CB-10062](https://issues.apache.org/jira/browse/CB-10062) Error: `EACCES: permission denied - update-notifier-cordova.json`
* [CB-10679](https://issues.apache.org/jira/browse/CB-10679) Documenting how the CLI chooses plugin versions

### 6.1.1 (Mar 29, 2016)
* [CB-10980](https://issues.apache.org/jira/browse/CB-10980) Updated cordova-lib dependency to 6.1.1

### 6.1.0 (Mar 17, 2016)
* [CB-10902](https://issues.apache.org/jira/browse/CB-10902) Updated cordova-lib dependency to 6.1.0
* Simplify cordova CLI readme
* [CB-10860](https://issues.apache.org/jira/browse/CB-10860) avoid node complaining of too many event listener added when running tests
* Fix readme.md - directory structure
* [CB-10673](https://issues.apache.org/jira/browse/CB-10673) add `plugin add --force` option.
* Add Travis CI badge
* Specify valid `SPDX` license in `package.json`
* [CB-10748](https://issues.apache.org/jira/browse/CB-10748) Use `cordova-common.CordovaLogger` in CLI
* Adding and fixing some whitespace in CLI docs.
* [CB-10348](https://issues.apache.org/jira/browse/CB-10348) Update formatting of CLI reference readme
* [CB-10348](https://issues.apache.org/jira/browse/CB-10348) CLI reference readme
* [CB-10482](https://issues.apache.org/jira/browse/CB-10482) Remove references to **windows8** from cordova-lib/cli
* [CB-10348](https://issues.apache.org/jira/browse/CB-10348) CLI doc output tweaks
* Update help docs - add examples and make them consistent

### 6.0.0 (Jan 25, 2016)
* [CB-10424](https://issues.apache.org/jira/browse/CB-10424) Updated cordova-lib dependency to 6.0.0
* Remove browserify from experimental flags list
* [CB-8455](https://issues.apache.org/jira/browse/CB-8455) Added `--nohooks` option.
* [CB-9964](https://issues.apache.org/jira/browse/CB-9964) Added `--template` support to `cordova create`
* Removing the `--usegit` flag from `cordova platform`. Recommended method is to use `cordova platform add git_url#branch`
* [CB-9836](https://issues.apache.org/jira/browse/CB-9836) Add `.gitattributes` to prevent `CRLF` line endings in repos
* Message about deprecating **amazon-fireos** for **Fire OS 5.0+** devices. 2015 onwards **FireOS** devices should use **android** platform only.
* add **JIRA** issue tracker link.

### 5.4.1 (Nov 19, 2015)
* [CB-10049](https://issues.apache.org/jira/browse/CB-10049) updated cordova-lib dependency to 5.4.1

### 5.4.0 (Oct 30, 2015)
* [CB-9903](https://issues.apache.org/jira/browse/CB-9903) update cordova-lib dependency to 5.4.0
* [CB-9861](https://issues.apache.org/jira/browse/CB-9861) fixed failing tests
* [CB-9800](https://issues.apache.org/jira/browse/CB-9800) Fixing contribute link.
* [CB-9792](https://issues.apache.org/jira/browse/CB-9792) Make CLI logging system interrupt process on an error event
* [CB-9788](https://issues.apache.org/jira/browse/CB-9788) Add support of stderr/stdout split to CLI logger
* [CB-9784](https://issues.apache.org/jira/browse/CB-9784) Remove CLI logger levels prefixes
* [CB-8198](https://issues.apache.org/jira/browse/CB-8198) Unified console output logic for core platforms
* [CB-9523](https://issues.apache.org/jira/browse/CB-9523) Show out of date message for older cordova CLI
* [CB-9597](https://issues.apache.org/jira/browse/CB-9597) Updates cli to pass structured args to platform methods

### 5.3.1 (Aug 28, 2015)
* Updated cordova-lib dependency to 5.3.1

### 5.2.0 (Aug 06, 2015)
* docs: unify expression of Amazon Fire OS
* docs: delete duplicated Windows Phone SDK description
* [CB-9114](https://issues.apache.org/jira/browse/CB-9114): Deprecation Warning for --usegit flag. This closes #214
* Adding .ratignore file.
* [CB-9171](https://issues.apache.org/jira/browse/CB-9171) Support Plugin Variables with =
* [CB-9128](https://issues.apache.org/jira/browse/CB-9128) cordova-cli documentation translation: cordova-cli
* [CB-5578](https://issues.apache.org/jira/browse/CB-5578) Adds `clean` command to cordova-cli.
* [CB-8993](https://issues.apache.org/jira/browse/CB-8993) Plugin restore ignores search path. This closes #213
* [CB-9121](https://issues.apache.org/jira/browse/CB-9121) Add support for build configuration to be specified using the CLI
* [CB-8898](https://issues.apache.org/jira/browse/CB-8898) Adds missing section about `requirements` to general cordova help

### 5.1.1 (June 4, 2015)
* [CB-8898](https://issues.apache.org/jira/browse/CB-8898) Adds missing section about `requirements` to general cordova help
* [CB-8898](https://issues.apache.org/jira/browse/CB-8898) Introduces `cordova requirements` command
* Updated cordova-lib dependency to 5.1.1

### 5.0.0 (Apr 16, 2015)
* Add information on Firefox OS to the README
* Update link to hooks README
* [CB-8634](https://issues.apache.org/jira/browse/CB-8634) Adds docs about support for custom branches for `cordova platform add`

### 4.3.0 (Feb 27, 2015)
* docs update for plugin --save
* Grunt "retire" task added (close #204)
* [CB-8439](https://issues.apache.org/jira/browse/CB-8439) Fix 'cordova platform update' documentation to include `<plat-spec>` (close #208)
* [CB-8379](https://issues.apache.org/jira/browse/CB-8379) Have --version print out cordova-lib version if it's not the same as CLI's version
* [CB-8211](https://issues.apache.org/jira/browse/CB-8211), [CB-8358](https://issues.apache.org/jira/browse/CB-8358) Update `--link` help text
* [CB-8168](https://issues.apache.org/jira/browse/CB-8168) --list support for CLI (close #205)
* [CB-8314](https://issues.apache.org/jira/browse/CB-8314) Speed up Travis CI (close #207)
* [CB-8301](https://issues.apache.org/jira/browse/CB-8301) Added CI configuration files (close #206)
* [CB-8227](https://issues.apache.org/jira/browse/CB-8227) [CB-8237](https://issues.apache.org/jira/browse/CB-8237) [CB-8238](https://issues.apache.org/jira/browse/CB-8238) Add --save option to 'cordova platform add', 'cordova platform remove' and 'cordova platform update'
* Add coverage/ to .npmignore
* [CB-5316](https://issues.apache.org/jira/browse/CB-5316) Spell Cordova as a brand unless it's a command or script
* [CB-7950](https://issues.apache.org/jira/browse/CB-7950) CLI make CordovaCliCreate.prototype.run vaguely correct
* [CB-7739](https://issues.apache.org/jira/browse/CB-7739) document installing specific version of platforms
* [CB-7950](https://issues.apache.org/jira/browse/CB-7950) CLI create.js misspells parseConfig

### 4.2.0 (Jan 06, 2015)
* [CB-6756](https://issues.apache.org/jira/browse/CB-6756) use cordova_lib.binname instead of cordova
* Fixed jshint issues with cli.js (close #199)
* [CB-8211](https://issues.apache.org/jira/browse/CB-8211) Add --link option to `cordova plugin add` (close #191)
* [CB-8129](https://issues.apache.org/jira/browse/CB-8129) Adds 'npm run cover' command to generate tests coverage report
* searchpath option is added to restore

### 4.1.2 (Nov 13, 2014)
* Expose cordova-lib and the cli from cordova-cli
* [CB-7636](https://issues.apache.org/jira/browse/CB-7636) Allow using --nobuild flag without screaning

### 4.0.0 (Oct 10, 2014)
* Made version semver complient and bumped to 4.0.0
* Pinned dependencies
* added missing AL header

### 3.6.1-0.2.13
* update shrinkwrap

### 3.6.1-0.2.12
* [CB-7383](https://issues.apache.org/jira/browse/CB-7383) depend on a newer version of cordova-lib

### 3.6.1-0.2.11
* bump version to 3.6.3-0.2.11

### 3.6.1-0.2.10 (Sep 05, 2014)
* updated Release notes
* updated version to include dev prefix

### 3.6.0-0.2.8 (Aug 29, 2014)
* adds missing 'fs' reference required for Windows (ln191)
* [CB-7355](https://issues.apache.org/jira/browse/CB-7355) re added single test to test call through to cordova-lib cordova raw create
* [CB-7364](https://issues.apache.org/jira/browse/CB-7364) remove duplicate logging initialization for cordova/plugman
* [CB-7363](https://issues.apache.org/jira/browse/CB-7363) Do not insist on precise version of cordova-lib
* [CB-7355](https://issues.apache.org/jira/browse/CB-7355) removed create tests which test behaviour of downstream dependencies
* [CB-7358](https://issues.apache.org/jira/browse/CB-7358) cli spec mocks console log to avoid polluting test output while testing
* [CB-7347](https://issues.apache.org/jira/browse/CB-7347) document cordova platform add /path/to support
* [CB-7345](https://issues.apache.org/jira/browse/CB-7345) add tests to validate documentation
* [CB-7345](https://issues.apache.org/jira/browse/CB-7345) improve cli documentation
* [] refactored test to make use of jasmine's 'toThrow' expectation
* correct object referenced in tests
* proper order of initializers, which indicates a bigger problem
* removed merge conflict
* moved custom www handling code to a separate function
* basic tests and structure added to create spec
* renamed cli create spec more sensibly
* parse config json moved to a function
* functional refactor of create with expected input from caller implemented
* updated tests and cli to pass all tests
* tracking cli create spec
* inital commit of cli create command logic in its own file
* added verbose mode initialization to set up event handlers
* created init function to handle initalization of underscore and nopt
* Fixed the tests
* Added browserify option "download_opts"
* [CB-7260](https://issues.apache.org/jira/browse/CB-7260) use newer cordova-lib to get cordova-android 3.5.1, bump version num
* [CB-7249](https://issues.apache.org/jira/browse/CB-7249) cordova-cli documentation translation: cordova-cli
* [CB-7001](https://issues.apache.org/jira/browse/CB-7001) moved browserify help docs to proper locations
* [CB-7001](https://issues.apache.org/jira/browse/CB-7001) added browserify to cordova.txt help doc
* [CB-6024](https://issues.apache.org/jira/browse/CB-6024) Document -- for platform options
* Added browserify flag to cli options
* checking for browserify flag
* [CB-7220](https://issues.apache.org/jira/browse/CB-7220) Support cordova_lib.binname
* [CB-7220](https://issues.apache.org/jira/browse/CB-7220) Split cordova help into per feature help files
* [CB-6756](https://issues.apache.org/jira/browse/CB-6756) Adds the platforms subcommand for save and restore
* [CB-7100](https://issues.apache.org/jira/browse/CB-7100): Use npm based lazy-load by default
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127)lisa7cordova-plugin-consolecordova-cli documentation translation: cordova-cli
* Call process.removeAllListeners() in cli spec
* Add --captureExceptions flag to jasmine
* Pin jasmine to older version temporarily
* Fix [CB-7069](https://issues.apache.org/jira/browse/CB-7069) copy-from & link-to custom uri -> url
* [CB-7002](https://issues.apache.org/jira/browse/CB-7002) Incremented package version to -dev

### 3.5.0-0.2.6 ()
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) Add support for Windows Universal apps (Windows 8.1 and WP 8.1)
* [CB-6728](https://issues.apache.org/jira/browse/CB-6728): Support chip architecture flag --archs
* [CB-6954](https://issues.apache.org/jira/browse/CB-6954): Use the unified cordova_lib.events
* [CB-6740](https://issues.apache.org/jira/browse/CB-6740): [amazon-fireos]Clean up error reporting when AmazonWebView SDK not found
* [CB-6943](https://issues.apache.org/jira/browse/CB-6943) Path can include the : if it is absolute, only test for http. Added tests
* Show full stack for CordovaError in verbose mode
* [CB-6024](https://issues.apache.org/jira/browse/CB-6024): Use nopt instead of optimist in cli
* [CB-6859](https://issues.apache.org/jira/browse/CB-6859) remove wp7 as platform
* Add --usenpm flag to activate npm based lazy_load
* [CB-6767](https://issues.apache.org/jira/browse/CB-6767) Allow `cordova` to be replacable in error messages
* CLI implementation & docs for the save and restore plugins
* Add --noregstry flag for disabling plugin lookup in the registry

### 3.5.0-0.2.4 (May 14, 2014)
* [CB-5941](https://issues.apache.org/jira/browse/CB-5941) Update link to hooks-README.md file from README.md
* Fix cordova help
* Fixing failing CLI tests by removing 'experimental' key

### 3.5.0-0.2.0 (May 09, 2014)
* [CB-6649](https://issues.apache.org/jira/browse/CB-6649) Removing experimental flag from positional arguments
* [CB-6648](https://issues.apache.org/jira/browse/CB-6648) Adding a flag for experimental features
* Fix require paths to use cordova-lib
* Update package.json to use cordova-lib
* Split out cordova-lib: move cordova-cli files
* [Windows8] re-added BOM : [CB-5421](https://issues.apache.org/jira/browse/CB-5421) Add BOM to all html, js, css files to ensure app can pass Windows Store Certification
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* Adding support for privileged
* Merge pull request #4 from rodms10/autoPermission
* android-parser: Add AndroidLaunchMode preference
* Fix CLI tests to work with node v0.11
* Update version of jasmine-node. Fixes test warnings util.print with node 0.11
* [CB-2606](https://issues.apache.org/jira/browse/CB-2606) Andriod icon - do not attempt copy to undefined path
* [CB-2606](https://issues.apache.org/jira/browse/CB-2606) Icons support for iOS, Android, BB10, WP8, Win8, FxOS
* [CB-6329](https://issues.apache.org/jira/browse/CB-6329) Delete unused info-utils.js
* [CB-6329](https://issues.apache.org/jira/browse/CB-6329) Clean-up of cordova info changes previously merged.
* [CB-6329](https://issues.apache.org/jira/browse/CB-6329) improve 'cordova info' command
* [CB-5847](https://issues.apache.org/jira/browse/CB-5847) strictSSL is no longer ignored
* [CB-6432](https://issues.apache.org/jira/browse/CB-6432) pre_package hook does not populate %CORDOVA_PLATFORMS%
* Revert "CB-6267 Windows8. Apply BackgroundColor from config.xml"
* Recreate "platforms" dir if it was deleted.
* [CB-5093](https://issues.apache.org/jira/browse/CB-5093): Add versionCode and CFBundleVersion during prepare
* [CB-6312](https://issues.apache.org/jira/browse/CB-6312) Use "landscape" instead of "userLandscape" in AndroidManifest.xml
* [CB-6421](https://issues.apache.org/jira/browse/CB-6421): Move tests from e2e to spec - cli test
* [CB-6377](https://issues.apache.org/jira/browse/CB-6377) superspawn: always wrap non .exe with spaces to cmd with /s /c

### 3.4.1-0.1.0 (Apr 03, 2014)
* updated to use iOS 3.4.1
* [CB-6377](https://issues.apache.org/jira/browse/CB-6377) Fix up superspawn's cmd fallback when there is a space in the args
* [CB-6377](https://issues.apache.org/jira/browse/CB-6377) Remove windowsVerbatimArguments from superspawn
* [CB-6344](https://issues.apache.org/jira/browse/CB-6344) Fix spy to return a default platform JSON instead of an empty object
* [CB-6382](https://issues.apache.org/jira/browse/CB-6382) platform list: sort output
* [CB-6377](https://issues.apache.org/jira/browse/CB-6377) Handle spaces in paths for cmd related scripts
* [CB-6292](https://issues.apache.org/jira/browse/CB-6292) Add a callback-based API for cordova info (in addition to promise API)
* [CB-6292](https://issues.apache.org/jira/browse/CB-6292) Revert commits that add explicit callbacks to APIs
* [CB-6322](https://issues.apache.org/jira/browse/CB-6322) Simplify platforms/platform code for platform specifics
* README.md: Getting Started guides link was broke. Fix.
* Make "cmd" executed more readable.
* [CB-6141](https://issues.apache.org/jira/browse/CB-6141) Fix Windows 8 tests
* Use smarter BOM-skipping logic when parsing XML.
* [CB-6357](https://issues.apache.org/jira/browse/CB-6357) platform check - install each platform to determine working + version number
* [CB-6357](https://issues.apache.org/jira/browse/CB-6357) platform: provide exports for functions
* [CB-6357](https://issues.apache.org/jira/browse/CB-6357) platform: Refactor into distinct functions
* [CB-6338](https://issues.apache.org/jira/browse/CB-6338) Improve error for missing template
* [CB-6337](https://issues.apache.org/jira/browse/CB-6337) Print nice error when cordova-cli hits various expected things
* This closes #147
* [CB-6267](https://issues.apache.org/jira/browse/CB-6267) Windows8. Apply BackgroundColor from config.xml
* [CB-6338](https://issues.apache.org/jira/browse/CB-6338) Improve error for missing template
* [CB-6030](https://issues.apache.org/jira/browse/CB-6030) - Automatically increment port for serve when default is in use
* [CB-6337](https://issues.apache.org/jira/browse/CB-6337) Print nice error when cordova-cli hits various expected things
* [CB-6323](https://issues.apache.org/jira/browse/CB-6323) Fix harmless typo in superspawn (cmd -> c)
* [CB-6323](https://issues.apache.org/jira/browse/CB-6323) Fix superspawn's resolve function on windows (was very broken)
* [CB-6306](https://issues.apache.org/jira/browse/CB-6306) Error creating project when path to project includes spaces
* Tweak error message when hooks fail (wasn't showing correct command)
* [CB-6296](https://issues.apache.org/jira/browse/CB-6296) callback/promise interface implemented
* [CB-6293](https://issues.apache.org/jira/browse/CB-6293) additional tests for run command
* [CB-6292](https://issues.apache.org/jira/browse/CB-6292) tests for build function's dual return method
* updated jasmine dependency for timing
* [CB-6211](https://issues.apache.org/jira/browse/CB-6211) 'cordova info' command fixed for Windows platform
* Fix prepare command from hiding failures.
* Fix ConfigParser.getPreference error + tests
* [CB-6209](https://issues.apache.org/jira/browse/CB-6209) Uplevel changes from android_parser to amazon_fireos_parser Added orientation related config changes from android_parser.
* [CB-6147](https://issues.apache.org/jira/browse/CB-6147) Enable CLI and Plugman with npm shrinkwrap
* When searchpath is specified in config and CLI, merge them.
* Add --searchpath to help.txt
* Fix node-style-callbacks form of the CLI api not passing through results.

### 3.4.0-0.1.3 (Mar 3, 2014)
* Update to plugman v0.20.2

### 3.4.0-0.1.2 (Feb 28, 2014)
* Update to plugman v0.20.1

### 3.4.0-0.1.1 (Feb 26, 2014)
* Update to plugman v0.20.0
* [CB-5647](https://issues.apache.org/jira/browse/CB-5647) Remove concept of .staging dir. Install directly to www/
* [CB-5299](https://issues.apache.org/jira/browse/CB-5299) Speed up prepare by using plugman's new reapply_global_munge()
* Refactored config_parser.js to simply both it and its tests.
* [CB-6076](https://issues.apache.org/jira/browse/CB-6076) Make "Generating config.xml from defaults" a verbose log
* [CB-5181](https://issues.apache.org/jira/browse/CB-5181) Use spawn helper for all sub-shelling.
* [CB-6049](https://issues.apache.org/jira/browse/CB-6049), [CB-5181](https://issues.apache.org/jira/browse/CB-5181) Enable stdio for build sub-commands and hooks

## 3.4.0-0.1.0 (Feb 14, 2014)
* [CB-5638](https://issues.apache.org/jira/browse/CB-5638) Clean-up: remove unreachable info case from function
* [CB-5937](https://issues.apache.org/jira/browse/CB-5937) Add "platform check" command: Shows platforms that are out of date
* [CB-5634](https://issues.apache.org/jira/browse/CB-5634) Minor refactoring + tests for Android's orientation preference.
* [CB-5634](https://issues.apache.org/jira/browse/CB-5634) Set Android orientation from config.xml
* Upleveled amazon_fireos_parser. Making it at par with android_parser.js
* [CB-5947](https://issues.apache.org/jira/browse/CB-5947) Throw when trying to create project inside custom www.
* [CB-4153](https://issues.apache.org/jira/browse/CB-4153) Update help.txt about --source -> --copy-from

## 3.3.1-0.3.1 (Jan 31, 2014)
* [CB-4153](https://issues.apache.org/jira/browse/CB-4153) Rename --source and --link flags to --copy-from and --link-to

## 3.3.1-0.3.0 (Jan 30, 2014)
* Updated plugman dependency to 0.19.0
* [CB-5913](https://issues.apache.org/jira/browse/CB-5913) Fail more gracefully on Windows when symlinks fail.
* Fix isWindows check in util.js to support win64
* [CB-5907](https://issues.apache.org/jira/browse/CB-5907) Make `cordova update` get version from platform's version script
* [CB-3612](https://issues.apache.org/jira/browse/CB-3612) Don't pass --device to "run" command by default.
* [CB-5493](https://issues.apache.org/jira/browse/CB-5493) lazy_load now downloads to a temp dir and then moves.
* [CB-5782](https://issues.apache.org/jira/browse/CB-5782) Hide stack trace for explicitly handled error conditions
* [CB-5590](https://issues.apache.org/jira/browse/CB-5590) Have config.xml version map to CFBundleShortVersionString instead of CFBundleVersion
* [CB-5299](https://issues.apache.org/jira/browse/CB-5299) Cache pbxproj to avoid re-parsing it for each plugin.
* [CB-5813](https://issues.apache.org/jira/browse/CB-5813) Fix missing quotes on update and ls commands
* [CB-5808](https://issues.apache.org/jira/browse/CB-5808) Fix lazy_load stripping off windows drive letters
* Expose util.isCordova as cordova.findProjectRoot()
* Allow lazy_load libs to work without an id and version for local paths.
* Add an option to config.js to not write config.json during create.
* Update node-xcode dependency to 0.6.6

## 3.3.1-0.2.0 (Jan 15, 2014)
* [CB-5006](https://issues.apache.org/jira/browse/CB-5006) Add --searchpath to "plugin add" so that installing by ID will search local paths before hitting the registry.
* [CB-4153](https://issues.apache.org/jira/browse/CB-4153) Add --src & --link to cordova create.
* [CB-5687](https://issues.apache.org/jira/browse/CB-5687) Make cordova commands work when CWD is inside of a symlink'ed www/
* [CB-4910](https://issues.apache.org/jira/browse/CB-4910) Default config.xml to the root instead of within www/
* [CB-5764](https://issues.apache.org/jira/browse/CB-5764) Move hooks/ to top-level instead of under .cordova
* [CB-5763](https://issues.apache.org/jira/browse/CB-5763) Don't create .cordova/ by default
* [CB-4871](https://issues.apache.org/jira/browse/CB-4871) Reduced package size significantly.
* [CB-4976](https://issues.apache.org/jira/browse/CB-4976) Don't use ~/.cordova/lib for local directory
* [CB-5777](https://issues.apache.org/jira/browse/CB-5777) Fix "platform update" not updating cordova.js
* [CB-5728](https://issues.apache.org/jira/browse/CB-5728) Files in merges must remain intact when removing platform

## 3.3.0-0.1.0
* [CB-5347](https://issues.apache.org/jira/browse/CB-5347) Handle dangling platform symlink in cordova platform add
* Added deprecation notice about wp7
* updated plugman version to 0.17.0
* [CB-5573](https://issues.apache.org/jira/browse/CB-5573) relies on stderr content and error codes to detect a problem with xcode installation.
* [CB-4382](https://issues.apache.org/jira/browse/CB-4382) Pass cli arguments to project-level hooks
* [CB-5362](https://issues.apache.org/jira/browse/CB-5362) blackberry parser: support local cordova-blackberry
* [CB-5345](https://issues.apache.org/jira/browse/CB-5345) Add pre_package event for windows8 parser.

## 3.2.0-0.4.0

* Make sure errors during prepare are reported
* [CB-5031](https://issues.apache.org/jira/browse/CB-5031) Add CLI help text for platform update and plugin search
* [CB-5298](https://issues.apache.org/jira/browse/CB-5298) Remove redundant requirements check for iOS and Android. The bin/create scripts check.
* windows8. fixes version number parsing logic
* [CB-4472](https://issues.apache.org/jira/browse/CB-4472) Remove preference from template config.xml

## 3.2.0-0.3.0

* [CB-5501](https://issues.apache.org/jira/browse/CB-5501) fix blackberry10 platform
* [android] fixing failing android parser spec tests
* [android] call out to platform check_req script

## 3.2.0-0.2.0

* [CB-5485](https://issues.apache.org/jira/browse/CB-5485) fixed issue with use of cordova cli api

## 3.2.0-0.1.0

* add the output of the plugman results to the console
* [CB-5363](https://issues.apache.org/jira/browse/CB-5363) Improve config_json error reporting
* [CB-5364](https://issues.apache.org/jira/browse/CB-5364) config_parser - check for null element text
* Fix issue not finding platform script when in subdir - check platforms which have subdir
* [CB-5377](https://issues.apache.org/jira/browse/CB-5377) serve: should only indicate listening when it is
* [CB-5368](https://issues.apache.org/jira/browse/CB-5368) Cordova serve deflate content breaks IE
* Change cordova serve's project.json to include etags.
* [CB-5280](https://issues.apache.org/jira/browse/CB-5280) Update serve's help text to remove platform arguments
* [CB-5364](https://issues.apache.org/jira/browse/CB-5364) config_parser - handle duplicates with children and text when merging
* [CB-5320](https://issues.apache.org/jira/browse/CB-5320) Document avoiding sudo
* [CB-4400](https://issues.apache.org/jira/browse/CB-4400): cd to project root in most cordova commands.
* [CB-5063](https://issues.apache.org/jira/browse/CB-5063): Revert to copying cordova.js before user www dir
* fix 3 failing tests for windows8 and wp8 and add assertions for wp7 too.
* Adding instructions for installing on master.
* [CB-5063](https://issues.apache.org/jira/browse/CB-5063): Keep cordova.js in platform_www to avoid copying it from lib.
* [CB-5307](https://issues.apache.org/jira/browse/CB-5307): Remove references to Callback and Incubator
* tests were failing attempting to match lib/dir and lib\\dir on windows
* [CB-5183](https://issues.apache.org/jira/browse/CB-5183) WP7/8 lib path is not correctly resolved by CLI (additional changes)
* [CB-5283](https://issues.apache.org/jira/browse/CB-5283) Improved cordova serve message to be more descriptive
* [CB-4866](https://issues.apache.org/jira/browse/CB-4866) Execute hooks in ascending order of any leading numbers
* [CB-5143](https://issues.apache.org/jira/browse/CB-5143) Locate the actual Android app .java file much more carefully.
* Cleaning up wp7+8 parsers' use of promises. Fix tests.
* serve: Fix doRoot() not being called & remove duplicated table.
* serve: provide basic entry point
* Code style (indentation)
* Wait for the pre_package event to finish, or the update_csproj function might give unexpected results
* Add pre_package event to wp8 project
* readability + code quality in wp7+8 parsers
* [CB-5183](https://issues.apache.org/jira/browse/CB-5183) WP7/8 custom_path is not correctly resolved by CLI
* [CB-4994](https://issues.apache.org/jira/browse/CB-4994) Update xcode dependency to handle Xcode 5 capabilities.
* [CB-5220](https://issues.apache.org/jira/browse/CB-5220) "An error occurred" is missing an "A" ...


## 3.1.0-0.2.0

* increased version of plugman to 0.14.0 in package.json
* [CB-5187](https://issues.apache.org/jira/browse/CB-5187): remove unused var os_platform
* CB:5187 on node  windows broken compile, emulate, run
* [CB-4976](https://issues.apache.org/jira/browse/CB-4976) Don't symlink into ~/.cordova/lib for local libs
* [CB-5142](https://issues.apache.org/jira/browse/CB-5142) improve grammar of emulate description
* [CB-5147](https://issues.apache.org/jira/browse/CB-5147) emulate needs a space before error message
* [CB-5125](https://issues.apache.org/jira/browse/CB-5125) add tests for chil process spawn
* [CB-5125](https://issues.apache.org/jira/browse/CB-5125): replace child process exec with spawn
* [CB-4748](https://issues.apache.org/jira/browse/CB-4748): Fail quickly if dir passed to cordova create is not empty.
* [CB-5106](https://issues.apache.org/jira/browse/CB-5106): removed flood of cp error messages when running tests
* [CB-5106](https://issues.apache.org/jira/browse/CB-5106):[wp7] fixed broken wp7 tests
* [CB-5106](https://issues.apache.org/jira/browse/CB-5106):[win8] fixed tests for windows 8
* Using .find to grab visualelements instead
* [CB-5066](https://issues.apache.org/jira/browse/CB-5066): fixed issue with visual elements not being referenced correctly
* windows8: remove debug console.log
* windows8: fixed project parser issue, and updated tests
* Update tests for commit d1c8024: update_project() should not call update_www() directly
* begin firefoxos tests
* [CB-5066](https://issues.apache.org/jira/browse/CB-5066): dealing with windows8 issues
* config.xml helper function is used, removed error merge of wp folder.
* [CB-5066](https://issues.apache.org/jira/browse/CB-5066): continuing merge of windows 8 stuff
* [CB-5066](https://issues.apache.org/jira/browse/CB-5066): merged in windows 8 support into master from cordova-3.1.x
* config.xml helper function is used, removed error merge of wp folder.
* [CB-5066](https://issues.apache.org/jira/browse/CB-5066): continuing merge of windows 8 stuff
* [CB-5066](https://issues.apache.org/jira/browse/CB-5066): merged in windows 8 support into master from cordova-3.1.x
* [CB-2234](https://issues.apache.org/jira/browse/CB-2234) Add 'cordova info' command
* [CB-4774](https://issues.apache.org/jira/browse/CB-4774): Copy www assets before running plugin prepare
* cordova help should return a Q. fixes [CB-5070](https://issues.apache.org/jira/browse/CB-5070)
* updated to a version greater than our latest version on npm
* added not about platform+os restrictions
* added myself as a contributor, [CB-5042](https://issues.apache.org/jira/browse/CB-5042) added info on windows8
* [CB-5067](https://issues.apache.org/jira/browse/CB-5067): added exception incase no platform level config.xml or defaults.xml exisit
* added temp config path for ffos, fixed wp8 config_xml function
* [CB-4774](https://issues.apache.org/jira/browse/CB-4774) Updated prepare flow to make platform config.xml a build output   - Adds a new method to
* [CB-5032](https://issues.apache.org/jira/browse/CB-5032): clarify the help text
* [CB-4621](https://issues.apache.org/jira/browse/CB-4621) Updating run and emulate commands to always provide default options
* Log requests in cordova serve
* Make cordova serve ignore dot files.
* [CB-4957](https://issues.apache.org/jira/browse/CB-4957): added fix for FFOS
* Update "cordova serve" to work with promises refactoring
* [CB-4774](https://issues.apache.org/jira/browse/CB-4774) Display proper error if cordova prepare run not in project dir.
* Fixes a bug where cordova prepare bombs on a config missing a content element   - Changes an undefi
* Bumping elementtree version to 0.1.5 to match plugman and support namespaced xml elements
* Fix cli.js tests broken by --silent change.
* [CB-4877]: Add basic logging, --silent flag.
* Fix busted test.
* First pass
* [CB-4883]: Graceful handling of lazy loading errors.
* reapplied change to add event mid build to allow mods to www folder pre_package  aka 775e969f9cc27a
* Remove two debugger; lines that snuck in.
* [CB-4604](https://issues.apache.org/jira/browse/CB-4604) Execute hooks directly (not .bat files) cross-platform
* Refactor to use Q.js promises in place of callbacks everywhere.
* [CB-4837]: Version 3.0.10. Depends on Plugman 0.12.x.
* Add missing license headers
* Update repo versions to 3.1.0-rc1
* Add `cordova update foo` command, with tests. [CB-4777](https://issues.apache.org/jira/browse/CB-4777)
* Add version numbers to `platform ls` output.
* [CB-4545](https://issues.apache.org/jira/browse/CB-4545) support for merges directory on both wp7 & wp8
* Rename CHANGELOG.md -> RELEASENOTES.md
* Fix expectation for platform ls test, for firefoxos
* Fix platforms.js: firefoxos.parser
* CB:4657 added ffos support to cli
* [CB-4657](https://issues.apache.org/jira/browse/CB-4657): added staging_dir function to ff parser
* add default manifest properties for firefox os platform
* make the firefoxos parser actually build the project
* change firefoxos link to tarball
* add firefox platform
* [CB-4797](https://issues.apache.org/jira/browse/CB-4797) Fix a crash on undefined platform in path.
* [CB-4797](https://issues.apache.org/jira/browse/CB-4797) Add missing return statement in cordova serve
* Fix broken tests due to lazy requiring change.
* [CB-4797](https://issues.apache.org/jira/browse/CB-4797) Change `serve` command to serve platforms keyed off of path component.
* [CB-4793](https://issues.apache.org/jira/browse/CB-4793) Lazily require modules in some places.
* [CB-4325](https://issues.apache.org/jira/browse/CB-4325) Run platform installs in serial instead of in parallel
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
