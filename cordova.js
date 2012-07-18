var fs            = require('fs')
,   path          = require('path')
,   util          = require('util')
,   exec          = require('child_process').exec
,   dist          = process.env.CORDOVA_HOME != undefined ? process.env.CORDOVA_HOME : path.join(__dirname, 'lib', 'cordova-1.9.0')
,   colors        = require('colors')
,   wrench        = require('wrench')
,   config_parser = require('./src/config_parser')


module.exports = {
    help: function help () {
        var raw = fs.readFileSync(path.join(__dirname, 'doc', 'help.txt')).toString('utf8').split("\n");
        raw.map(function(line) {
            if (line.match('    ')) {
                var prompt = '    $ '
                ,   isPromptLine = !!(line.indexOf(prompt) != -1);
                if (isPromptLine) {
                    return prompt.green + line.replace(prompt, '');
                }
                else {
                    return line.split(/\./g).map( function(char) { 
                        if (char === '') {
                            return '.'.grey;
                        }
                        else {
                            return char;
                        }
                    }).join('');
                }
            }
            else {
                return line.magenta;
            }
        }).join("\n");
    },
    docs: function docs () {

        var express = require('express')
        ,   port    = 2222
        ,   static  = path.join(dist, 'doc')
        ,   server  = express.createServer();
        
        server.configure(function() {
            server.use(express.static(static));
            server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
        });

        server.get('/', function(req, res) {
            return res.render('index.html');
        });

        console.log("\nServing Cordova/Docs at: ".grey + 'http://localhost:2222'.blue.underline + "\n");
        console.log('Hit ctrl + c to terminate the process.'.cyan);
        server.listen(parseInt(port, 10));
    },
    create: function create (dir) {
        var mkdirp = wrench.mkdirSyncRecursive,
            cpr = wrench.copyDirSyncRecursive;
        if (dir && (dir[0] == '~' || dir[0] == '/')) {
        } else {
            dir = dir ? path.join(process.cwd(), dir) : process.cwd();
        }

        // Check for existing cordova project
        try {
            if (fs.lstatSync(path.join(dir, '.cordova')).isDirectory()) {
                console.error('Cordova project already exists at ' + dir + ', aborting.');
                return;
            }
        } catch(e) { /* no dirs, we're fine */ }

        // Create basic project structure.
        mkdirp(path.join(dir, '.cordova'));
        mkdirp(path.join(dir, 'platforms'));
        mkdirp(path.join(dir, 'plugins'));
        mkdirp(path.join(dir, 'www'));

        // Copy in base template
        cpr(path.join(__dirname, 'templates', 'www'), path.join(dir, 'www'));
    },
    platform:require('./src/platform'),
    build:require('./src/build'),
    emulate:require('./src/emulate'),
    plugin:require('./src/plugin')
};
