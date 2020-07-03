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

const cdvLibUtil = require(require.resolve('cordova-lib/src/cordova/util'));
const cdvPluginUtil = require(require.resolve('cordova-lib/src/cordova/plugin/util'));

// Cache
let _installedPlatformsList = null;

/*
 * Sections
 */

async function getCordovaDependenciesInfo () {
    // get self "Cordova CLI"
    const cliPath = require.resolve('../package');
    const cliPkg = require(cliPath);
    const libPkg = require(require.resolve('cordova-lib/package'));
    const cliDependencies = await _getLibDependenciesInfo(cliPkg.dependencies);
    const libDependencies = await _getLibDependenciesInfo(libPkg.dependencies);

    cliDependencies.forEach((i, x) => {
        if (i.key === 'lib') {
            cliDependencies[x].content = libDependencies;
        }
    });

    return {
        header: 'Cordova Packages',
        content: [{ key: 'cli', data: cliPkg.version, content: cliDependencies }]
    };
}

async function getInstalledPlatforms (projectRoot) {
    return _getInstalledPlatforms(projectRoot).then(platforms => {
        const header = 'Project Installed Platforms';
        const content = Object.keys(platforms)
            .map(key => ({ key, data: platforms[key] }));

        return { header, content };
    });
}

async function getInstalledPlugins (projectRoot) {
    const header = 'Project Installed Plugins';
    const content = cdvPluginUtil.getInstalledPlugins(projectRoot)
        .map(plugin => ({ key: plugin.id, data: plugin.version }));

    return { header, content };
}

async function getEnvironmentInfo () {
    return Promise.all([
        _getNpmVersion(),
        osInfo()
    ]).then(results => {
        const { platform, distro, release, codename, kernel, arch, build } = results[1];
        let formatRelease = release;

        if (build) {
            formatRelease = `${formatRelease} (${build})`;
        }

        const osFormat = [
            platform === 'darwin' ? codename : distro,
            formatRelease,
            `(${platform} ${kernel})`,
            `${arch}`
        ];

        return {
            header: 'Environment',
            content: [
                { key: 'OS', data: osFormat.join(' ') },
                { key: 'Node', data: process.version },
                { key: 'npm', data: results[0] }
            ]
        };
    });
}

async function getPlatformEnvironmentData (projectRoot) {
    return _getInstalledPlatforms(projectRoot).then(installedPlatforms => {
        const sections = [];

        Object.keys(installedPlatforms).forEach(platform => {
            const platformApi = getPlatformApi(platform);
            if (platformApi && platformApi.getEnvironmentInfo) {
                platformApi.getEnvironmentInfo().then(content => {
                    sections.push({
                        header: `${platform} Environment`,
                        content
                    });
                });
            } else {
                _getPlatformInfo(platform).then(content => {
                    sections.push({
                        header: `${platform} Environment`,
                        content: content
                    });
                });
            }
        });

        return sections;
    });
}

async function getProjectSettingsFiles (projectRoot) {
    const cfgXml = _fetchFileContents(cdvLibUtil.projectConfig(projectRoot)).replace(/\n$/, '');
    // Create package.json snippet
    const pkgRaw = _fetchFileContents(path.join(projectRoot, 'package.json'));
    const pkgJson = JSON.parse(pkgRaw);
    const pkgSnippet = `--- Start of Cordova JSON Snippet ---\n${JSON.stringify(pkgJson.cordova, null, 2)}\n--- End of Cordova JSON Snippet ---`;

    return {
        header: 'Project Setting Files',
        content: [
            { key: 'config.xml', data: cfgXml, fromFile: true },
            { key: 'package.json', data: pkgSnippet, fromFile: true }
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
        .map(name => ({ key: name.slice(cordovaPrefix.length), data: versionFor(name) }));
}

async function _getInstalledPlatforms (projectRoot) {
    if (_installedPlatformsList) {
        return _installedPlatformsList;
    } else {
        return cdvLibUtil.getInstalledPlatformsWithVersions(projectRoot).then(platforms => {
            _installedPlatformsList = platforms;
            return _installedPlatformsList;
        });
    }
}

async function _getNpmVersion () {
    const { stdout: npmVersion } = await execa('npm', ['-v']);
    return npmVersion;
}

function _fetchFileContents (filePath) {
    if (!fs.existsSync(filePath)) return 'File Not Found';

    return fs.readFileSync(filePath, 'utf-8');
}

function _buildContentList (list, indentionBy = 1) {
    const content = [];

    for (const item of list) {
        const padding = String.prototype.padStart((4 * indentionBy), ' ');

        if (item.fromFile) {
            item.data = `\n\n${item.data}\n`;
        }

        content.push(`${padding}${item.key} : ${item.data}`);

        if (item.content && Array.isArray(item.content)) {
            return content.concat(_buildContentList(item.content, ++indentionBy));
        }
    }

    return content;
}

/*
 * @deprecated will be removed when platforms implement the calls.
 */
async function _getPlatformInfo (platform) {
    switch (platform) {
    case 'ios':
        return _failSafeSpawn('xcodebuild', ['-version']);
    case 'android':
        return _failSafeSpawn('android', ['list', 'target']);
    }
}

const _failSafeSpawn = (command, args) => execa(command, args).then(
    ({ stdout }) => stdout,
    err => `ERROR: ${err.message}`
);

const _createSection = section => {
    let content = [];

    content.push(''); // Start of new section
    content.push(`${section.header}:`);
    content.push('');

    if (Array.isArray(section.content)) {
        content = content.concat(_buildContentList(section.content));
    } else {
        content.push(section.content);
    }

    return content;
};

module.exports = async function () {
    const projectRoot = cdvLibUtil.cdProjectRoot();

    Promise.all([
        getCordovaDependenciesInfo(),
        getInstalledPlatforms(projectRoot),
        getInstalledPlugins(projectRoot),
        getEnvironmentInfo(),
        getPlatformEnvironmentData(projectRoot),
        getProjectSettingsFiles(projectRoot)
    ]).then(results => {
        let content = [];

        results.forEach(section => {
            if (Array.isArray(section)) {
                // Handle a Group of Sections
                section.forEach(grouppedSection => {
                    content = content.concat(_createSection(grouppedSection));
                });
            } else {
                // Handle a Single Section
                content = content.concat(_createSection(section));
            }
        });

        cordova.emit('results', content.join('\n'));
    });
};
