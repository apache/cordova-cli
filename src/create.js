


/**
 * provides logic for exposing cordova-lib create functionality to the command line
 * the create argument is implied from the call to this function, all other cl arguments should be passed in unmodified
 * 
 * @args  - 
 * @undashed 
 */
var CordovaCLICreate = function (args, undashed) {
    var cfg = {},
        customWww;

        // If we got a fourth parameter, consider it to be JSON to init the config.
        if ( undashed[4] ) {
            cfg = JSON.parse(undashed[4]);
        }

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

        // create(dir, id, name, cfg)
        cordova.raw.create( undashed[1]  // dir to create the project in
                          , undashed[2]  // App id
                          , undashed[3]  // App name
                          , cfg
        ).done();
 
};

module.exports = CordovaCLICreate;

