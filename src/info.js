/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const { osInfo } = require('systeminformation');
const { cordova, cordova_platforms: { getPlatformApi } } = require('cordova-lib');

const cdvLibUtil = require('cordova-lib/src/cordova/util');
const cdvPluginUtil = require('cordova-lib/src/cordova/plugin/util');

// Cache
let _installedPlatformsList = null;

/*
 * Sections
 */

async function getCordovaDependenciesInfo () {
    // get self "Cordova CLI"
    const cliPkg = require('../package');
    const cliDependencies = await _getLibDependenciesInfo(cliPkg.dependencies);

    const libPkg = require('cordova-lib/package');
    const cliLibDep = cliDependencies.find(({ key }) => key === 'lib');
    cliLibDep.children = await _getLibDependenciesInfo(libPkg.dependencies);

    return {
        key: 'Cordova Packages',
        children: [{
            key: 'cli',
            value: cliPkg.version,
            children: cliDependencies
        }]
    };
}

async function getInstalledPlatforms (projectRoot) {
    return _getInstalledPlatforms(projectRoot).then(platforms => {
        const key = 'Project Installed Platforms';
        const children = Object.entries(platforms)
            .map(([key, value]) => ({ key, value }));

        return { key, children };
    });
}

async function getInstalledPlugins (projectRoot) {
    const key = 'Project Installed Plugins';
    const children = cdvPluginUtil.getInstalledPlugins(projectRoot)
        .map(plugin => ({ key: plugin.id, value: plugin.version }));

    return { key, children };
}

async function getEnvironmentInfo () {
    const [npmVersion, osInfoResult] = await Promise.all([_getNpmVersion(), osInfo()]);
    const { platform, distro, release, codename, kernel, arch, build } = osInfoResult;

    const optionalBuildSuffix = build ? ` (${build})` : '';

    const osFormat = [
        platform === 'darwin' ? codename : distro,
        release + optionalBuildSuffix,
        `(${platform} ${kernel})`,
        `${arch}`
    ];

    return {
        key: 'Environment',
        children: [
            { key: 'OS', value: osFormat.join(' ') },
            { key: 'Node', value: process.version },
            { key: 'npm', value: npmVersion }
        ]
    };
}

async function getPlatformEnvironmentData (projectRoot) {
    const installedPlatforms = await _getInstalledPlatforms(projectRoot);

    return Object.keys(installedPlatforms)
        .map(platform => {
            const platformApi = getPlatformApi(platform);

            const getPlatformInfo = platformApi && platformApi.getEnvironmentInfo
                ? () => platformApi.getEnvironmentInfo()
                : _legacyPlatformInfo[platform];

            return { platform, getPlatformInfo };
        })
        .filter(o => o.getPlatformInfo)
        .map(async ({ platform, getPlatformInfo }) => ({
            key: `${platform} Environment`,
            children: await getPlatformInfo()
        }));
}

async function getProjectSettingsFiles (projectRoot) {
    const cfgXml = _fetchFileContents(cdvLibUtil.projectConfig(projectRoot));

    // Create package.json snippet
    const pkgJson = require(path.join(projectRoot, 'package'));
    const pkgSnippet = [
        '--- Start of Cordova JSON Snippet ---',
        JSON.stringify(pkgJson.cordova, null, 2),
        '--- End of Cordova JSON Snippet ---'
    ].join('\n');

    return {
        key: 'Project Setting Files',
        children: [
            { key: 'config.xml', value: `${cfgXml}` },
            { key: 'package.json', value: pkgSnippet }
        ]
    };
}

/*
 * Section Data Helpers
 */

async function _getLibDependenciesInfo (dependencies) {
    const cordovaPrefix = 'cordova-';
    const versionFor = name => require(`${name}/package`).version;

    return Object.keys(dependencies)
        .filter(name => name.startsWith(cordovaPrefix))
        .map(name => ({ key: name.slice(cordovaPrefix.length), value: versionFor(name) }));
}

async function _getInstalledPlatforms (projectRoot) {
    if (!_installedPlatformsList) {
        _installedPlatformsList = await cdvLibUtil.getInstalledPlatformsWithVersions(projectRoot);
    }
    return _installedPlatformsList;
}

async function _getNpmVersion () {
    return (await execa('npm', ['-v'])).stdout;
}

function _fetchFileContents (filePath) {
    if (!fs.existsSync(filePath)) return 'File Not Found';

    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * @deprecated will be removed when platforms implement the calls.
 */
const _legacyPlatformInfo = {
    ios: async () => [{
        key: 'xcodebuild',
        value: await _failSafeSpawn('xcodebuild', ['-version'])
    }],
    android: async () => [{
        key: 'android',
        value: await _failSafeSpawn('avdmanager', ['list', 'target'])
    }]
};

const _failSafeSpawn = (command, args) => execa(command, args).then(
    ({ stdout }) => stdout,
    err => `ERROR: ${err.message}`
);

function _formatNodeList (list, level = 0) {
    const content = [];

    for (const item of list) {
        const indent = String.prototype.padStart((4 * level), ' ');
        let itemString = `${indent}${item.key}:`;

        if ('value' in item) {
            // Pad multi-line values with a new line on either end
            itemString += (/[\r\n]/.test(item.value))
                ? `\n${item.value.trim()}\n`
                : ` ${item.value}`;
        } else {
            // Start of section
            itemString = `\n${itemString}\n`;
        }

        content.push(itemString);

        if (item.children) {
            content.push(..._formatNodeList(item.children, level + 1));
        }
    }

    return content;
}

module.exports = async function () {
    const projectRoot = cdvLibUtil.cdProjectRoot();

    const results = await Promise.all([
        getCordovaDependenciesInfo(),
        getInstalledPlatforms(projectRoot),
        getInstalledPlugins(projectRoot),
        getEnvironmentInfo(),
        ...(await getPlatformEnvironmentData(projectRoot)),
        getProjectSettingsFiles(projectRoot)
    ]);

    const content = _formatNodeList(results);
    cordova.emit('results', content.join('\n'));
};
