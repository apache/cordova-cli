var fs        = require('fs')
,   path      = require('path')
,   util      = require('util')
,   exec      = require('child_process').exec
,   platforms = ['ios', 'android']
,   dist      = process.env.CORDOVA_HOME != undefined ? process.env.CORDOVA_HOME : path.join(__dirname, 'lib', 'cordova-1.9.0')
,   colors    = require('colors')

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
    create: function create (platform, package, name) {
        var projectPath = path.join(process.cwd(), name)
        ,   args        = [].slice.call(arguments)
        ,   cmd         = util.format("%s/lib/%s/bin/create %s %s %s", dist, platform, projectPath, package, name)
        
        if (args.length != 3) {
            console.error('Invalid number of arguments.')
            process.exit(1)
        }
        
        exec(cmd, function(err, stdout, stderr) {
            if (err) {
                console.error('An error occurred while creating project!', err)
            } 
            else {
                console.log(stdout)
                console.log( platform + ' project successfully created.')
            }
        })
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
