var fs        = require('fs')
,   path      = require('path')
,   util      = require('util')
,   exec      = require('child_process').exec
,   platforms = ['ios', 'android']
,   dist      = process.env.CORDOVA_HOME != undefined ? process.env.CORDOVA_HOME : path.join(__dirname, 'lib', 'cordova-1.9.0')

module.exports = {

    help: function help () {
        console.log(fs.readFileSync(path.join(__dirname, 'doc', 'help.txt')).toString('utf8'))
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
                console.log( platform + ' project successfully created.')
            }
        })
    }
    ,
    build: function build () {
        var cmd = util.format("%s/cordova/debug", process.cwd())
        exec(cmd, function(err, stderr, stdout) {
            if (err) console.error('An error occurred while building project.', err)
        })
    }
    ,
    emulate: function emulate() {
        var cmd = util.format("%s/cordova/emulate", process.cwd())
        exec(cmd, function(err, stderr, stdout) {
            if (err) console.error('An error occurred attempting to start emulator.', err)
        })
   }
   // end of module defn
}
