var Q = require( "q" ),
	CordovaError = require( "../CordovaError" ),
	shelljs = require( "shelljs" ),
	util = require( "../util" ),
	elementTree = require( "elementtree" ),
	exec = require( "child_process" ).exec,
	path = require( "path" );

function genPackageId() {
	var idx,
		returnValue = "";
		characters = [
			"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
			"k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
			"u", "v", "w", "x", "y", "z" ];

	for ( idx = 0 ; idx < 10 ; idx++ ) {
		returnValue += ( characters[ Math.round( Math.random() * 35 ) ] );
	}

	return returnValue;
}

module.exports = function tizen_parser( project ) {
	this.path = project;
}

// Returns a promise
module.exports.check_requirements = function( project_root ) {
	var deferred = Q.defer();

	exec( "web-build --help", {}, function( error, stdout, stderr ) {
		if ( error ) {
			deferred.reject( new CordovaError( "Requirements check failed. Command 'web-build' not found." ) );
		} else {
			deferred.resolve();
		}
	});

	// Requirements met successfully
	return deferred.promise;
}

module.exports.prototype = {
	config_xml: function() {
		return path.join( this.www_dir(), "config.xml" );
	},

	cordovajs_path: function( libDir ) {
		return path.resolve( path.join( libDir, "www", "cordova.js" ) );
	},

	update_www: function() {
		var projectPath = util.isCordova( this.path ),
			wwwDir = this.www_dir();

		shelljs.rm( "-rf", wwwDir );
		shelljs.mkdir( wwwDir );
		shelljs.cp( "-rf", path.join( util.projectWww( projectPath ), "*" ), wwwDir );
		shelljs.cp( "-f", path.join( this.path, "platform_www", "cordova.js" ),
			path.join( wwwDir, "cordova.js" ) );

		// Copies config.xml
		shelljs.cp( "-f", util.projectConfig( projectPath ), wwwDir );
	},

	// Returns a promise
	update_project: function( cfg ) {
		var newElement, packageId, suffix,
			needsUpdate = false,
			root = cfg.doc.getroot();

		// Must have tizen namespace
		if ( !root.get( "xmlns:tizen" ) ) {
			needsUpdate = true;

			root.set( "xmlns:tizen", "http://tizen.org/ns/widgets" );
		}

		// Must have a tizen:application tag
		if ( !root.find( "tizen:application" ) ) {
			needsUpdate = true;

			suffix = ( root.get( "id" ).match( /[0-9a-zA-z]*$/ ) || "" );
			if ( suffix ) {
				suffix = suffix[ 0 ];
			}

			packageId = genPackageId();

			newElement = new elementTree.Element( "tizen:application" );
			newElement.set( "id", packageId + ( suffix ? ( "." + suffix ) : "" ) );
			newElement.set( "package", packageId );
			newElement.set( "required_version", "2.2" );

			root.append( newElement );
		}

		// Must have tizen:setting tag
		if ( !root.find( "tizen:setting" ) ) {
			needsUpdate = true;

			newElement = new elementTree.Element( "tizen:setting" );
			newElement.set( "screen-orientation", "auto-rotation" );
			newElement.set( "context-menu", "enable" );
			newElement.set( "background-support", "disable" );
			newElement.set( "encryption", "disable" );
			newElement.set( "install-location", "auto" );
			newElement.set( "hwkey-event", "enable" );

			root.append( newElement );
		}

		// If we've modified the project (NOT platform) configuration, update it on
		// disk and copy the updated version to the platform
		if ( needsUpdate ) {
			cfg.write();
			shelljs.cp( "-f", cfg.path, this.config_xml() );
		}

		return Q();
	},

	staging_dir: function() {
		return path.join(this.path, '.staging', 'www');
	},

	www_dir: function() {
		return path.join( this.path, "www" );
	}
};
