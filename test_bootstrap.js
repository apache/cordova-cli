/**
 * TEST BOOTSTRAP FILE
 * Runs through any bs to make sure the tests are good to go.
 **/

var fs = require('fs'),
    path = require('path'),
    util = require('./src/util'),
    platforms = require('./platforms');

// If a platform library dependency does not exist, will clone it down.
platforms.forEach(function(p) {
    if (!fs.existsSync(path.join(__dirname, 'lib', p))) {
        util.getPlatformLib(p);
    }
});
process.exit(0);

