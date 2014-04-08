/**
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

var platforms = require( "../../platforms" ),
	config_parser = require( "../../src/ConfigParser" ),
	cordovaCreate = require( "../../src/create" ),
	os = require( "os" ),
	fs = require( "fs" ),
	shell = require( "shelljs" ),
	path = require( "path" ),
	somePath = path.join( "some", "path" ),
	destination = path.join( os.tmpdir(), 'cordova-cli-' + ((function() {
		var index, subIndex,
			set = 'abcdefghijklmnopqrstuvwxyz0123456789',
			str = '';

		for ( index = 0 ; index < 12 ; index++ ) {
			subIndex = Math.round( Math.random() * ( set.length - 1 ) );
			str += set.substring( subIndex, subIndex + 1 );
		}

		return str;
	})() )),
	test_parser = new platforms.tizen.parser( somePath );

describe( "tizen project parser", function() {
	describe( "config_xml", function() {
		it( "should return the proper path", function() {
			expect( test_parser.config_xml() )
				.toBe( path.join( somePath, "www", "config.xml" ) );
		});
	});
	describe( "staging_dir", function() {
		it( "should return the proper path", function() {
			expect( test_parser.staging_dir( "." ) )
				.toBe( path.join( somePath, ".staging", "www" ) );
		});
	});
	describe( "www_dir", function() {
		it( "should return the proper path", function() {
			expect( test_parser.www_dir() )
				.toBe( path.join( somePath, "www" ) );
		});
	});
	describe( "cordovajs_path", function() {
		it( "should return the proper path", function() {
			expect( test_parser.cordovajs_path( "." ) )
				.toBe( path.resolve( path.join( ".", "www", "cordova.js" ) ) );
		});
	});
	describe("project update function", function() {
		var tizenParser, configParser, project,
			platformPath = path.join( destination, "platforms", "tizen" );

		beforeEach( function() {
			project = cordovaCreate( destination );
			shell.mkdir( "-p", path.join( platformPath, "www" ) );
			tizenParser = new platforms.tizen.parser( platformPath );
		});
		afterEach( function() {
			theParser = null;
			project = null;
			shell.rm( "-rf", destination );
		});
		describe( "update_project", function() {
			it( "should correctly update the configuration", function( done ) {
				project.then( function() {
					configParser = new config_parser( path.join( destination, "config.xml" ) ),
						root = configParser.doc.getroot();
					tizenParser.update_project( configParser );
					expect( fs.existsSync( path.join( platformPath, "www", "config.xml" ) ) )
						.toBe( true );
					expect( root.get( "xmlns:tizen" ) ).toBe( "http://tizen.org/ns/widgets" );
					expect( !!root.find( "tizen:application" ) ).toBe( true );
					expect( !!root.find( "tizen:setting" ) ).toBe( true );
					done();
				});
			});
		});
		describe( "update_www", function() {
			it( "should correctly update the platform www directory", function( done ) {
				var platformWww = path.join( platformPath, "www" );

				project.then( function() {
					shell.mkdir( path.join( platformPath, "platform_www" ) );
					fs.writeFileSync( path.join( platformPath, "platform_www", "cordova.js" ),
						"/* cordova.js */" );
					fs.writeFileSync( path.join( destination, "www", "xyzzy.txt" ), "xyzzy" );

					tizenParser.update_www();
					expect( fs.existsSync( path.join( platformWww, "config.xml" ) ) ).toBe( true );
					expect( fs.existsSync( path.join( platformWww, "cordova.js" ) ) ).toBe( true );
					expect( fs.existsSync( path.join( platformWww, "xyzzy.txt" ) ) ).toBe( true );
					done();
				});
			});
		});
	});
});
