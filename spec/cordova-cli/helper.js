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
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
var root = this;
var unfakes = [];
var fake = function(owner, thingToFake, newThing) {
        var originalThing;
            originalThing = owner[thingToFake];
                owner[thingToFake] = newThing;
                    return unfakes.push(function() {
                              return owner[thingToFake] = originalThing;
                                  });
                      };
var _ = function(obj) {
    return {
        each: function(iterator) {
            var item, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = obj.length; _i < _len; _i++) {
            item = obj[_i];
            _results.push(iterator(item));
            }
            return _results;
        },
        isFunction: function() {
            return Object.prototype.toString.call(obj) === "[object Function]";
        },
        isString: function() {
            return Object.prototype.toString.call(obj) === "[object String]";
        }
    };
};

root.spyOnConstructor = function(owner, classToFake, methodsToSpy) {
var fakeClass, spies;
if (methodsToSpy == null) {
methodsToSpy = [];
}
if (_(methodsToSpy).isString()) {
methodsToSpy = [methodsToSpy];
}
spies = {
constructor: jasmine.createSpy("" + classToFake + "'s constructor")
};
fakeClass = (function() {

function _Class() {
spies.constructor.apply(this, arguments);
}

return _Class;

})();
_(methodsToSpy).each(function(methodName) {
spies[methodName] = jasmine.createSpy("" + classToFake + "#" + methodName);
return fakeClass.prototype[methodName] = function() {
return spies[methodName].apply(this, arguments);
};
});
fake(owner, classToFake, fakeClass);
return spies;
};
