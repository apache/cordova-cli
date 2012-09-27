var shell = require('shelljs'),
    path = require('path');

describe('cli interface', function() {
    it('should print out version with -v', function() {
        var bin = path.join(__dirname, '..', 'bin', 'cordova');
        bin += ' -v';
        var output = shell.exec(bin, {silent:true}).output;
        expect(output.indexOf(require('../package').version)).toBe(0);
    });
});
