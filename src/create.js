var CordovaCliCreate = function () {

}; 

/**
 * provides logic for exposing cordova-lib create functionality to the command line
 * the create argument is implied from the call to this function, all other cl arguments should be passed in unmodified
 * 
 * @args  - 
 * @undashed 
 */
CordovaCliCreate.prototype.run = function (args, undashed) {
    var cfg = {},
        customWww;

    // parseConfig will determine if there's a valid config JSON string
    cfg = parseCofig(undashed[4]);
    
    // customWww
    this.customWww = function (args) {

    }

    // create(dir, id, name, cfg)
    cordova.raw.create( undashed[1]  // dir to create the project in
                      , undashed[2]  // App id
                      , undashed[3]  // App name
                      , cfg
    ).done();
};

/**
 * parseConfig
 * generic parser, if it's valid json, returns the resulting object
 * if anything resolving to false is passed in, return an empty object 
 * invalid json results in an error message and process exit with status code 2.
 *
 * jsondata - a json data string
 *
 */
CordovaCliCreate.prototype.parseConfig = function (jsondata) {
    if (!jsondata) return {};

    try {
        cfg = JSON.parse(jsondata);
    } catch (e) {
        console.error('Error while parsing json data\nError: '+ e +'\nData:' + jsondata);
        process.exit(2); 
    }
};

CordovaCliCreate.prototype.customWww = function (args) {
    // handle custom www
    if (customWww = args['copy-from'] || args['link-to']) {

        if (customWww.indexOf(':') != -1) {
            throw new CordovaError(
            'Only local paths for custom www assets are supported.'
            );

        }

        if ( customWww.substr(0,1) === '~' ) {  // resolve tilde in a naive way.
            customWww = path.join(process.env.HOME,  customWww.substr(1));
        }

        customWww = path.resolve(customWww);
        var wwwCfg = { uri: customWww };
        if (args['link-to']) {
            wwwCfg.link = true;
        }

        cfg.lib = cfg.lib || {};
        cfg.lib.www = wwwCfg;
    }
};

module.exports = new CordovaCliCreate();
