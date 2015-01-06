The cordova-local utility enables a developer to easily switch between multiple local installations of cordova with a single command. It is meant to be installed globally with 'npm install -g cordova-local'.

To use the utility, use the command 'cordova-local' in place of 'cordova' in your regular cordova workflow. This will call the globally installed cordova-local command, which invokes the closest local installation of cordova in the current directory or its ancestors.

If the '--inclglobal' flag is added, cordova-local will attempt to invoke a global installation of cordova in the event that no local installation is found.
