var fs        = require('fs')
,   path      = require('path')
,   util      = require('util')
,   exec      = require('child_process').exec
,   platforms = ['ios', 'android']
,   dist      = process.env.CORDOVA_HOME != undefined ? process.env.CORDOVA_HOME : path.join(__dirname, 'lib', 'cordova-1.9.0')
,   colors    = require('colors')
,   wrench    = require('wrench')

// Runs up the directory chain looking for a .cordova directory.
// IF it is found we are in a Cordova project.
// If not.. we're not.
function isCordova(dir) {
    if (dir) {
        var contents = fs.readdirSync(dir);
        if (contents && contents.length && (contents.indexOf('.cordova') > -1)) {
            return dir;
        } else {
            var parent = path.join(dir, '..');
            if (parent && parent.length > 1) {
                return isCordova(parent);
            } else return false;
        }
    } else return false;
}

module.exports = {

    help: function help () {
        var raw = fs.readFileSync(path.join(__dirname, 'doc', 'help.txt')).toString('utf8').split("\n")
        console.log(raw.map(function(line) {
            if (line.match('    ')) {
                var prompt = '    $ '
                ,   isPromptLine = !!(line.indexOf(prompt) != -1)
                if (isPromptLine) {
                    return prompt.green + line.replace(prompt, '')
                }
                else {
                    return line.split(/\./g).map( function(char) { 
                        if (char === '') {
                            return '.'.grey
                        }
                        else {
                            return char
                        }
                    }).join('')
                }
            }
            else {
                return line.magenta
            }
        }).join("\n"))
    }
    ,
    docs: function docs () {

        var express = require('express')
        ,   port    = 2222
        ,   static  = path.join(dist, 'doc')
        ,   server  = express.createServer();
        
        server.configure(function() {
            server.use(express.static(static))
            server.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
        })

        server.get('/', function(req, res) {
            return res.render('index.html')
        })

        console.log("\nServing Cordova/Docs at: ".grey + 'http://localhost:2222'.blue.underline + "\n")
        console.log('Hit ctrl + c to terminate the process.'.cyan)
        server.listen(parseInt(port, 10))
    }
    ,
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
    }
    ,
    platform: function platform(command, target) {
        var projectRoot = isCordova(process.cwd());
        if (!projectRoot) {
            console.error('Current working directory is not a Cordova-based project.');
            return;
        }
        if (arguments.length === 0) command = 'ls';

        switch(command) {
            case 'ls':
                var contents = fs.readdirSync(path.join(projectRoot, 'platforms'));
                if (contents.length) {
                    contents.map(function(p) {
                        console.log(p);
                    });
                } else {
                    console.log('No platforms. Use `cordova platform add <platform>`.');
                }
                break;
            case 'add':
                break;
            case 'remove':
                break;
            default:
                console.error('Unrecognized command "' + command '". Use either `add`, `remove`, or `ls`.');
                break;
        }
    }
    ,
    build: function build () {
        var cmd = util.format("%s/cordova/debug", process.cwd())
        exec(cmd, function(err, stderr, stdout) {
            if (err) 
                console.error('An error occurred while building project.', err)
            
            console.log(stdout)
            console.log(stderr)
        })
    }
    ,
    emulate: function emulate() {
        var cmd = util.format("%s/cordova/emulate", process.cwd())
        exec(cmd, function(err, stderr, stdout) {
            if (err) 
                console.error('An error occurred attempting to start emulator.', err)
            
            console.log(stdout)
            console.log(stderr)
        })
   }
   // end of module defn
}
