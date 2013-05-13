﻿
(function(){

var VERSION = '2.7.0',
    currentScript = 'cordova-' + VERSION + '.js',
    scripts = document.getElementsByTagName('script');

for (var n = 0; n < scripts.length; n++) {
	if (scripts[n].src.indexOf('cordova-current.js') > -1) {
		var cordovaPath = scripts[n].src.replace('cordova-current.js', currentScript);
		var scriptElem = document.createElement("script");
		scriptElem.src = cordovaPath;
		document.head.appendChild(scriptElem);
	}
}

})();


