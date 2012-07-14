var should = require('should')
,   exec   = require('child_process').exec
,   path   = require('path')
,   fs     = require('fs')

describe('cordova cli', function() {

    describe('sanity', function() {
        it('you are sane', function(done) {
            true.should.eql(true)
            done()
        })
    })
    
    describe('cordova create ios com.foobar Baz', function() {
        it('should create a project called Baz', function(done) {
            exec('cordova create ios com.foobar Baz', function(err, stderr, stdout) {
                path.existsSync(path.join(__dirname, '..', 'Baz')).should.eql(true)
                done()
            })
        })
    })

    after(function() {
        var bazDir = path.join(__dirname, '..', 'Baz')
        // fs.rmdirSync(bazDir) failing due to node bug?
        exec('rm -rf Baz', function(){})
    })
    // end of tests
})
