var express = require('express'),
    path    = require('path'),
    colors  = require('colors'),
    events  = require('./events'),
    port    = 2222,
    statik  = path.join(__dirname, '..', 'doc'),
    server  = express();

module.exports = function docs () {
    events.emit('before_docs');
    server.configure(function() {
        server.use(express['static'](statik));
        server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    server.get('/', function(req, res) {
        return res.render('index.html');
    });

    console.log("\nServing Cordova/Docs at: ".grey + 'http://localhost:2222'.blue.underline + "\n");
    console.log('Hit ctrl + c to terminate the process.'.cyan);
    server.listen(parseInt(port, 10));
    events.emit('after_docs');
};
