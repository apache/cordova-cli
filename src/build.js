var cordova_util  = require('./util'),
    path          = require('path'),
    config_parser = require('./config_parser'),
    fs            = require('fs'),
    shell         = require('shelljs'),
    et            = require('elementtree'),
    android_parser= require('./metadata/android_parser'),
    blackberry_parser= require('./metadata/blackberry_parser'),
    ios_parser    = require('./metadata/ios_parser'),
    n             = require('ncallbacks'),
    prompt        = require('prompt'),
    util          = require('util');

function shell_out_to_debug(projectRoot, platform) {
    var cmd = path.join(projectRoot, 'platforms', platform, 'cordova', 'debug > /dev/null');
    // TODO: wait for https://issues.apache.org/jira/browse/CB-1548 to be fixed before we axe this
    // TODO: this is bb10 only for now
    // TODO: this hsould be in emualte, we should use the load-device command
    if (platform.indexOf('blackberry') > -1) {
        cmd = 'ant -f ' + path.join(projectRoot, 'platforms', platform, 'build.xml') + ' qnx load-device';
    }
    var response = shell.exec(cmd, {silent:true});
    if (response.code > 0) throw 'An error occurred while building the ' + platform + ' project. ' + response.output;
}

function copy_www(projectRoot, platformRoot) {
    // Clean out the existing www.
    var target = path.join(platformRoot, 'www');
    shell.rm('-rf', target);

    // Copy app assets into native package
    shell.cp('-r', path.join(projectRoot, 'www'), platformRoot);
}

function copy_js(jsPath, platformPath) {
    fs.writeFileSync(path.join(platformPath, 'www', 'cordova.js'), fs.readFileSync(jsPath, 'utf-8'), 'utf-8');
}

function write_project_properties(cordovaConfig, projFile) {
    // TODO: eventually support all blackberry sub-platforms
    var props = fs.readFileSync(projFile, 'utf-8');
    props = props.replace(/qnx\.bbwp\.dir=.*\n/, 'qnx.bbwp.dir=' + cordovaConfig.blackberry.qnx.bbwp + '\n');
    props = props.replace(/qnx\.sigtool\.password=.*\n/, 'qnx.sigtool.password=' + cordovaConfig.blackberry.qnx.signing_password + '\n');
    props = props.replace(/qnx\.device\.ip=.*\n/, 'qnx.device.ip=' + cordovaConfig.blackberry.qnx.device_ip + '\n');
    props = props.replace(/qnx\.device\.password=.*\n/, 'qnx.device.password=' + cordovaConfig.blackberry.qnx.device_password + '\n');
    props = props.replace(/qnx\.sim\.ip=.*\n/, 'qnx.sim.ip=' + cordovaConfig.blackberry.qnx.sim_ip + '\n');
    props = props.replace(/qnx\.sim\.password=.*\n/, 'qnx.sim.password=' + cordovaConfig.blackberry.qnx.sim_password + '\n');
    fs.writeFileSync(projFile, props, 'utf-8');
}

module.exports = function build (callback) {
    var projectRoot = cordova_util.isCordova(process.cwd());

    if (!projectRoot) {
        throw 'Current working directory is not a Cordova-based project.';
    }

    var xml = path.join(projectRoot, 'www', 'config.xml');
    var assets = path.join(projectRoot, 'www');
    var cfg = new config_parser(xml);
    var platforms = cfg.ls_platforms();

    if (platforms.length === 0) throw 'No platforms added to this project. Please use `cordova platform add <platform>`.';

    var end = n(platforms.length, function() {
        if (callback) callback();
    });

    // Iterate over each added platform 
    platforms.forEach(function(platform) {
        // Figure out paths based on platform
        // TODO this is fugly, lots of repetition.
        var assetsPath, js, parser, platformPath;
        switch (platform) {
            case 'android':
                platformPath = path.join(projectRoot, 'platforms', 'android');
                assetsPath = path.join(platformPath, 'assets');
                parser = new android_parser(platformPath);
                // Update the related platform project from the config
                parser.update_from_config(cfg);
                copy_www(projectRoot, assetsPath);
                js = path.join(__dirname, '..', 'lib', 'android', 'framework', 'assets', 'js', 'cordova.android.js');
                copy_js(js, assetsPath);
                shell_out_to_debug(projectRoot, 'android');
                end();
                break;
            case 'blackberry-10':
                platformPath = path.join(projectRoot, 'platforms', 'blackberry-10');
                js = path.join(__dirname, '..', 'lib', 'android', 'framework', 'assets', 'js', 'cordova.android.js');
                parser = new blackberry_parser(platformPath);
                
                // Update the related platform project from the config
                parser.update_from_config(cfg);

                // Copy everything over except config.xml
                var cfg_www = path.join(projectRoot, 'www', 'config.xml');
                var temp_cfg = path.join(projectRoot, 'config.xml');
                shell.mv(cfg_www, temp_cfg);
                shell.cp('-rf', path.join(projectRoot, 'www', '*'), path.join(platformPath, 'www'));
                shell.mv(temp_cfg, cfg_www);

                // Move the js to just cordova.js
                shell.mv('-f', path.join(platformPath, 'www', 'qnx', 'cordova-*.js'), path.join(platformPath, 'www', 'cordova.js'));

                // Add the webworks.js script file
                var index = path.join(platformPath, 'www', 'index.html');
                var contents = fs.readFileSync(index, 'utf-8');
                contents = contents.replace(/<script type="text\/javascript" src="cordova\.js"><\/script>/, '<script type="text/javascript" src="js/webworks.js"></script><script type="text/javascript" src="cordova.js"></script>');
                fs.writeFileSync(index, contents, 'utf-8');

                // Do we have BB config?
                var dotFile = path.join(projectRoot, '.cordova');
                var dot = JSON.parse(fs.readFileSync(dotFile, 'utf-8'));
                if (dot.blackberry === undefined || dot.blackberry.qnx === undefined) {
                    // Let's save relevant BB SDK + signing info to .cordova
                    console.log('Looks like we need some of your BlackBerry development environment information. We\'ll just ask you a few questions and we\'ll be on our way to building.');
                    prompt.start();
                    prompt.get([{
                        name:'bbwp',
                        required:true,
                        description:'Enter the full path to your BB10 bbwp executable'
                    },{
                        name:'signing_password',
                        required:true,
                        description:'Enter your BlackBerry signing password',
                        hidden:true
                    },{
                        name:'device_ip',
                        description:'Enter the IP to your BB10 device'
                    },{
                        name:'device_password',
                        description:'Enter the password for your BB10 device'
                    },{
                        name:'sim_ip',
                        description:'Enter the IP to your BB10 simulator'
                    },{
                        name:'sim_password',
                        description:'Enter the password for your BB10 simulator'
                    }
                    ], function(err, results) {
                        if (err) throw 'Error during BlackBerry configuration retrieval';
                        // Write out .cordova file
                        if (dot.blackberry === undefined) dot.blackberry = {};
                        if (dot.blackberry.qnx === undefined) dot.blackberry.qnx = {};
                        dot.blackberry.qnx.bbwp = results.bbwp;
                        dot.blackberry.qnx.signing_password = results.signing_password;
                        dot.blackberry.qnx.device_ip = results.device_ip;
                        dot.blackberry.qnx.device_password = results.device_password;
                        dot.blackberry.qnx.sim_ip = results.sim_ip;
                        dot.blackberry.qnx.sim_password = results.sim_password;
                        fs.writeFileSync(dotFile, JSON.stringify(dot), 'utf-8');
                        console.log('Perfect! If you need to change any of these properties, just edit the .cordova file in the root of your cordova project (it\'s just JSON, you\'ll be OK).');
                        // Update project.properties
                        write_project_properties(dot, path.join(platformPath, 'project.properties'));
                        // shell it
                        shell_out_to_debug(projectRoot, 'blackberry-10');
                        end();
                    });
                    return;
                }
                // Write out config stuff to project.properties file
                write_project_properties(dot, path.join(platformPath, 'project.properties'));
                // Shell it
                shell_out_to_debug(projectRoot, 'blackberry-10');
                end();
                break;
            case 'ios':
                platformPath = path.join(projectRoot, 'platforms', 'ios');
                js = path.join(__dirname, '..', 'lib', 'ios', 'CordovaLib', 'javascript', 'cordova.ios.js');
                parser = new ios_parser(platformPath);
                // Update the related platform project from the config
                parser.update_from_config(cfg, function() {
                    copy_www(projectRoot, platformPath);
                    copy_js(js, platformPath);
                    shell_out_to_debug(projectRoot, 'ios');
                    end();
                });
                break;
        }
    });
};
