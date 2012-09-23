var fs = require('fs'),
    path = require('path'),
    util = require('./src/util'),
    asyncblock = require('asyncblock'),
    platforms = require('./platforms');

// Simply detects whether all platform libs have been cloned.

asyncblock(function(flow) {
    platforms.forEach(function(p) {
        if (!fs.existsSync(path.join(__dirname, 'lib', p))) {
            util.getPlatformLib(p, flow);
        }
    });
    process.exit(0);
});

