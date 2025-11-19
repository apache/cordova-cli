---
title: CLI Commands
description: Learn how to use Cordova CLI commands and their options.
---

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
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->

# Cordova Command-line-interface (CLI) Commands

## CLI Syntax

```bash
cordova <command> [options] -- [platformOpts]
```

## Global Command List

These commands are available at all times.

| Command  | Description
|----------|--------------
| `create` | Create a project
| `help <command>` | Get help for a command
| `config` | Set, get, delete, edit, and list global cordova options

## Project Command List

These commands are supported when the current working directory is a valid Cordova project.

| Command      | Description
|--------------|--------------
| `info`         | Generate project information
| `requirements` | Checks and print out all the installation requirements for platforms specified
| `platform`     | Manage project platforms
| `plugin`       | Manage project plugins
| `prepare`      | Copy files into platform(s) for building
| `compile`      | Compile project for platform(s)
| `build`        | Build project for platform(s) (`prepare` + `compile`)
| `clean`        | Cleanup project from build artifacts
| `run`          | Run project (including prepare && compile)
| `serve`        | Run project with a local webserver (including prepare)

## Common options

These options apply to all cordova-cli commands.

| Option               | Description
|----------------------|------------------------
| -d or --verbose      | Pipe out more verbose output to your shell. You can also subscribe to `log` and `warn` events if you are consuming `cordova-cli` as a node module by calling `cordova.on('log', function() {})` or `cordova.on('warn', function() {})`.
| -v or --version      | Print out the version of your `cordova-cli` install.
|--nohooks             | Suppress executing hooks (taking RegExp hook patterns as parameters)

## Platform-specific options

Certain commands have options (`platformOpts`) that are specific to a particular platform. They can be provided to the cordova-cli with a '--' separator that stops the command parsing within the cordova-lib module and passes through rest of the options for platforms to parse.

## CLI Usage Example

The following example illustrates how to utilize Cordova CLI to perform various tasks such as:

- Creating a project
- Adding the `camera` plugin
- Adding, building, and running the project on the `android` platform

Additionally, it includes an example showcasing the usage of specific options provided by the Cordova-Android platform, such as `--keystore`, which is utilized for release signing.

1. Create a cordova project

    ```bash
    cordova create myApp com.myCompany.myApp myApp
    cd myApp
    ```

2. Add Camera Plugin to the Project

    ```bash
    cordova plugin add cordova-plugin-camera
    ```

3. Add Android Platform to the Project

    ```bash
    cordova platform add android
    ```

4. Confirm System is Configured with Android Platform Requirements

    ```bash
    cordova requirements android
    ```

5. Build Project for Android with Verbose Logging Enabled

    ```bash
    cordova build android --verbose
    ```

6. Run Project on Android Platform

    ```bash
    cordova run android
    ```

7. Build Project for Android in Release Mode with Signing Parameters

    ```bash
    cordova build android --release -- --keystore="..\android.keystore" --storePassword=android --alias=mykey
    ```

## `cordova create` command

Creates the directory structure for the Cordova project in the specified path.

**Command Syntax:**

```bash
cordova create path [id [name]] [options]
```

**Arguments:**

| Value | Description   |
|-------|---------------|
| path  |  Directory which should not already exist. Cordova will create this directory. For more details on the directory structure, see below. |
| id    | _Default_: `org.apache.cordova.hellocordova` <br/>  Reverse domain-style identifier that maps to `id` attribute of `widget` element in `config.xml`. This can be changed but there may be code generated using this value, such as Java package names. It is recommended that you select an appropriate value.  |
| name  | _Default_: `Hello Cordova` <br/> Application's display title that maps `name` element in `config.xml` file. This can be changed but there may be code generated using this value, such as Java class names. The default value is `Hello Cordova`, but it is recommended that you select an appropriate value. |

**Options:**

| Option | Description |
|--------|-------------|
| --template |  Use a custom template located locally, in NPM, or GitHub. |

### Examples

- Create a Cordova project in `myapp` directory using the specified ID and display name:

```bash
cordova create myapp com.mycompany.myteam.myapp MyApp
```

## `cordova platform` command

Manage cordova platforms - allowing you to add, remove, update and list platforms. Running commands to add or remove platforms affects the contents of the project's platforms directory.

**Command Syntax:**

```bash
cordova {platform | platforms} [
    add <platform-spec> [...] {--save | link=<path> } |
    {remove | rm}  platform [...] {--save}|
    {list | ls}  |
    update ]
```

| Sub-command           | Option | Description |
------------------------|-------------|------|
| add `<platform-spec>` [...] |  | Add specified platforms |
|     | --nosave                 | Do not save `<platform-spec>` into `config.xml` & `package.json` after installing them using `<engine>` tag |
|     | --link=`<path>`          | When `<platform-spec>` is a local path, links the platform library directly instead of making a copy of it (support varies by platform; useful for platform development)
| remove `<platform>` [...] |    | Remove specified platforms |
|     | --nosave                 | Do not delete specified platforms from `config.xml` & `package.json` after removing them |
| update `<platform>` [...] |      | Update specified platforms |
|     | --save                   | Updates the version specified in `config.xml` |
| list |                         | List all installed and available platforms |

### Platform-spec

There are a number of ways to specify a platform:

```text
<platform-spec> : platform[@version] | path | url[#commit-ish]
```

| Value | Description |
|-----------|-------------|
| platform  | Platform name e.g. android, ios, electron etc. to be added to the project. Every release of cordova CLI pins a version for each platform. When no version is specified this version is used to add the platform. |
| version   | Major.minor.patch version specifier using semver |
| path      | Path to a directory or tarball containing a platform |
| url       | URL to a git repository or tarball containing a platform |
| commit-ish | Commit/tag/branch reference. If none is specified, 'master' is used |

### Supported Platforms

- `android`
- `browser`
- `electron`
- `ios`

### Examples

- Add pinned version of the `android` and `ios` platform and save the downloaded version to `config.xml` & `package.json`:

```bash
cordova platform add android ios
```

- Add `android` platform with [semver](http://semver.org/) version ^5.0.0 and save it to `config.xml` & `package.json`:

```bash
cordova platform add android@^5.0.0
```

- Add platform by cloning the specified git repo and checkout to the `4.0.0` tag:

```bash
cordova platform add https://github.com/myfork/cordova-android.git#4.0.0
```

- Add platform using a local directory named `android`:

```bash
cordova platform add ../android
```

- Add platform using the specified tarball:

```bash
cordova platform add ../cordova-android.tgz
```

- Remove `android` platform from the project and remove from `config.xml` & `package.json`:

```bash
cordova platform rm android
```

- Remove `android` platform from the project and do NOT remove from `config.xml` & `package.json`:

```bash
cordova platform rm android --nosave
```

- List available and installed platforms with version numbers. This is useful to find version numbers when reporting issues:

```bash
cordova platform ls
```

## `cordova plugin` command

Manage project plugins

**Command Syntax:**

```bash
cordova {plugin | plugins} [
    add <plugin-spec> [..] {--searchpath=<directory> | --noregistry | --link | --save | --force} |
    {remove | rm} {<pluginid> | <name>} --save |
    {list | ls}
]
```

| Sub-command | Option | Description
|------------------------|-------------|------
| add `<plugin-spec>` [...] |     | Add specified plugins
|       |--searchpath `<directory>` | When looking up plugins by ID, look in this directory and each of its subdirectories before hitting the registry. Multiple search paths can be specified. Use ':' as a separator in `*nix` based systems and ';' for Windows.
|       |--noregistry             | Don't search the registry for plugins.
|       |--link                   | When installing from a local path, creates a symbolic link instead of copying files. The extent to which files are linked varies by platform. Useful for plugin development.
|       |--nosave                 | Do NOT save the `<plugin-spec>` as part of the `plugin` element  into `config.xml` or `package.json`.
|       |--force                  | _Introduced in version 6.1._ Forces copying source files from the plugin even if the same file already exists in the target directory.
| remove `<pluginid>\|<name>` [...] | | Remove plugins with the given IDs/name.
|       |--nosave                 | Do NOT remove the specified plugin from config.xml or package.json
|list                           |  | List currently installed plugins

### Plugin-spec

There are a number of ways to specify a plugin:

    <plugin-spec> : [@scope/]pluginID[@version]|directory|url[#commit-ish][:subdir]

| Value       | Description
|-------------|--------------------
| scope       | Scope of plugin published as a [scoped npm package]
| plugin      | Plugin id (id of plugin in npm registry or in --searchPath)
| version     | Major.minor.patch version specifier using semver
| directory   | Directory containing plugin.xml
| url         | Url to a git repository containing a plugin.xml
| commit-ish  | Commit/tag/branch reference. If none is specified, 'master' is used

### Algorithm for resolving plugins

When adding a plugin to a project, the CLI will resolve the plugin
based on the following criteria (listed in order of precedence):

1. The `plugin-spec` given in the command (e.g. `cordova plugin add pluginID@version`)
2. The `plugin-spec` saved in `config.xml` & `package.json` (i.e. if the plugin was previously added without `--nosave`)
3. As of Cordova version 6.1, the latest plugin version published to npm that the current project can support (only applies to plugins that list their [Cordova dependencies] in their `package.json`)
4. The latest plugin version published to npm

### Examples

- Add `cordova-plugin-camera` and `cordova-plugin-file` to the project and save it to `config.xml` & `package.json`. Use `../plugins` directory to search for the plugins.

    ```bash
    cordova plugin add cordova-plugin-camera cordova-plugin-file --searchpath ../plugins
    ```

- Add `cordova-plugin-camera` with [semver](http://semver.org/) version ^2.0.0 and save it to `config.xml` & `package.json`:

    ```bash
    cordova plugin add cordova-plugin-camera@^2.0.0
    ```

- Add the plugin from the specified local directory:

    ```bash
    cordova plugin add ../cordova-plugin-camera
    ```

- Add the plugin from the specified tarball file:

    ```bash
    cordova plugin add ../cordova-plugin-camera.tgz
    ```

- Remove the plugin from the project and the `config.xml` & `package.json`:

    ```bash
    cordova plugin rm camera
    ```

- Remove the plugin from the project, but not the `config.xml` or `package.json`:

    ```bash
    cordova plugin rm camera --nosave
    ```

- List all plugins installed in the project:

    ```bash
    cordova plugin ls
    ```

### Conflicting plugins
Conflicting plugins may occur when adding plugins that use `edit-config` tags in their plugin.xml file. `edit-config` allows plugins to add or replace attributes of XML elements.

This feature can cause issues with the application if more than one plugin tries to modify the same XML element. Conflict detection has been implemented to prevent plugins from being added so one plugin doesn't try to overwrite another plugin's `edit-config` changes. An error will be thrown when a conflict in `edit-config` has been found and the plugin won't be added. The error message will mention that all conflicts must be resolved before the plugin can be added. One option to resolving the `edit-config` conflict is to make changes to the affected plugins' plugin.xml so that they do not modify the same XML element. The other option is to use the `--force` flag to force add the plugin. This option should be used with caution as it ignores the conflict detection and will overwrite all conflicts it has with other plugins, thus may leave the other plugins in a bad state.

Refer to the [plugin.xml guide](https://cordova.apache.org/docs/en/latest/plugin_ref/spec.html#edit-config) for managing `edit-config`, resolving conflicts, and examples.

## `cordova prepare` command

Transforms config.xml metadata to platform-specific manifest files, copies icons & splashscreens,
copies plugin files for specified platforms so that the project is ready to build with each native SDK.

**Command Syntax:**

```bash
cordova prepare [<platform> [..]]
```

### Options

| Option     | Description
|------------|------------------
| `<platform> [..]` | Platform name(s) to prepare. If not specified, all platforms are prepared.

## `cordova compile` command

`cordova compile` is a subset of the [cordova build command](#cordova-build-command).
It only performs the compilation step without doing prepare. It's common to invoke `cordova build` instead of this command - however, this stage is useful to allow extending using [hooks][Hooks guide].

**Command Syntax:**

```bash
cordova compile [<platform> [...]]
    [--debug | --release]
    [--device | --emulator | --target=<targetName>]
    [--buildConfig=<configfile>]
    [-- <platformOpts>]
```
For detailed documentation see [cordova build command](#cordova-build-command) docs below.

## `cordova build` command

Shortcut for `cordova prepare` + `cordova compile` for all/the specified platforms. Allows you to build the app for the specified platform.

**Command Syntax:**

```bash
cordova build [<platform> [...]]
    [--debug | --release]
    [--device | --emulator]
    [--buildConfig=<configfile>]
    [-- <platformOpts>]
```

| Option     | Description
|------------|------------------
| `<platform> [..]` | Platform name(s) to build. If not specified, all platforms are built.
| --debug    | Perform a debug build. This typically translates to debug mode for the underlying platform being built.
| --release  | Perform a release build. This typically translates to release mode for the underlying platform being built.
| --device   | Build it for a device
| --emulator | Build it for an emulator. In particular, the platform architecture might be different for a device vs. emulator.
| --buildConfig=`<configFile>` | Default: build.json in cordova root directory. <br/> Use the specified build configuration file. `build.json` file is used to specify paramaters to customize the app build process especially related to signing the package.
| `<platformOpts>` | To provide platform specific options, you must include them after `--` separator. Review platform guide docs for more details.

### Examples

- Build for `android` and `ios` platform in `debug` mode for deployment to device:

```bash
cordova build android ios --debug --device
```

- Build for `android` platform in `release` mode and use the specified build configuration:

```bash
cordova build android --release --buildConfig=..\myBuildConfig.json
```

- Build for `android` platform in release mode and pass custom platform options to android build process:

```bash
cordova build android --release -- --keystore="..\android.keystore" --storePassword=android --alias=mykey
```

## `cordova run` command

Prepares, builds, and deploys app on specified platform devices/emulators. If a device is connected it will be used, unless an eligible emulator is already running.

**Command Syntax:**

```bash
cordova run [<platform> [...]]
    [--list | --debug | --release]
    [--noprepare]
    [--nobuild]
    [--device | --emulator | --target=<targetName>]
    [--buildConfig=<configfile>]
    [-- <platformOpts>]
```

| Option      | Description
|-------------|------------------
| `<platform> [..]` | Platform name(s) to run. If not specified, all platforms are run.
| --list      | Lists available targets. Displays both device and emulator deployment targets unless specified
| --debug     | Deploy a debug build. This is the default behavior unless `--release` is specified.
| --release   | Deploy a release build
| --noprepare | Skip preparing (available in Cordova v6.2 or later)
| --nobuild   | Skip building
| --device    | Deploy to a device
| --emulator  | Deploy to an emulator
| --target    | Deploy to a specific target emulator/device. Use `--list` to display target options
| --buildConfig=`<configFile>` | Default: build.json in cordova root directory. <br/> Use the specified build configuration file. `build.json` file is used to specify paramaters to customize the app build process especially related to signing the package.
| `<platformOpts>` | To provide platform specific options, you must include them after `--` separator. Review platform guide docs for more details.

### Examples

- Run a release build of current cordova project on `android` platform emulator named `Nexus_5_API_23_x86`. Use the spcified build configuration when running:

```bash
cordova run android --release --buildConfig=..\myBuildConfig.json --target=Nexus_5_API_23_x86
```

- Run a debug build of current cordova project on `android` platform using a device or emulator (if no device is connected). Skip doing the build:

```bash
cordova run android --nobuild
```

- Run a debug build of current cordova project on an `ios` device:

```bash
cordova run ios --device
```

- Enumerate names of all the connected devices and available emulators that can be used to run this app:

```bash
cordova run ios --list
```

## `cordova emulate` command

Alias for `cordova run --emulator`. Launches the emulator instead of device. See [cordova run command docs](#cordova-run-command) for more details.

## `cordova clean` command

Cleans the build artifacts for all the platforms, or the specified platform by running platform-specific build cleanup.

**Command Syntax:**

```bash
cordova clean [<platform> [...]]
```

**Example Usage:**

- Clean `android` platform build artifacts:

```bash
cordova clean android
```

## `cordova requirements` command

Checks and print out all the requirements for platforms specified (or all platforms added
to project if none specified). If all requirements for each platform are met, exits with code 0
otherwise exits with non-zero code.

This can be useful when setting up a machine for building a particular platform.

**Command Syntax:**

```bash
cordova requirements [platform?]
```

## `cordova info` command

Print out useful information helpful for submitting bug
reports and getting help.

**Command Syntax:**

```bash
cordova info
```

## `cordova serve` command

Run a local web server for www/ assets using specified `port` or default of 8000. Access projects at: `http://HOST_IP:PORT/PLATFORM/www`

**Command Syntax:**

```bash
cordova serve [port]
```

## `cordova help` command

Show syntax summary, or the help for a specific command.

**Command Syntax:**

```bash
cordova help [command]
cordova [command] -h
cordova -h [command]
```

## `cordova config` command

Set, get, delete, edit, and list global cordova options.

**Command Syntax:**

```bash
cordova config [ls|edit|set|get|delete] <key?> <value?>
```

**Usage Examples:**

```bash
cordova config ls
cordova config edit
cordova config set save-exact true
cordova config get save-exact
cordova config delete save-exact
```

[Hooks guide]: http://cordova.apache.org/docs/en/latest/guide_appdev_hooks_index.md.html
[config.xml ref]: http://cordova.apache.org/docs/en/latest/config_ref/index.html
[Cordova dependencies]: http://cordova.apache.org/docs/en/latest/guide/hybrid/plugins/index.html#specifying-project-requirements
[scoped npm package]: https://docs.npmjs.com/misc/scope
