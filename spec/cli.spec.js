var cordova = require('../cordova');

describe("cordova", function() {
    describe("'help' command", function() {
        it("should console.log some stuff", function() {
            spyOn(console, "log");
            cordova.help();
            expect(console.log).toHaveBeenCalled();
        });
    });
});
