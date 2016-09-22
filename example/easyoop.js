/**
 * This is the core module that provides powerful easy OOP concept, packaging and number of utility methods.
 * The module has no any dependency from others zebkit modules and can be used independently.
 * @class zebkit
 * @access package
 */
(function() {

var $busy           = 1,
    $readyCallbacks = [], // stores method that wait for redness
    isInBrowser = typeof navigator !== "undefined",
    $global     = (typeof window !== "undefined" && window != null) ? window : this;


//  Faster match operation analogues:
//  Math.floor(f)  =>  ~~(a)
//  Math.round(f)  =>  (f + 0.5) | 0
function isString(o)  {
    return typeof o !== "undefined" && o !== null &&
          (typeof o === "string" || o.constructor === String);
}

function isNumber(o)  {
    return typeof o !== "undefined" && o !== null &&
          (typeof o === "number" || o.constructor === Number);
}

function isBoolean(o) {
    return typeof o !== "undefined" && o !== null &&
          (typeof o === "boolean" || o.constructor === Boolean);
}

function lookupObjValue(obj, name) {
    if (arguments.length == 1) {
        obj = $global;
    }

    if (name == null || name.trim().length == 0) {
        throw new Error("Invalid field name: '" + name + "'");
    }

    var names = name.trim().split('.');
    for(var i = 0; i < names.length; i++) {
        obj = obj[names[i]];
        if (obj == null) {
            return obj;
        }
    }
    return obj;
}

/**
 * URL class
 * @param {String} url an url
 * @constructor
 * @class zebkit.URL
 */
function URL(url) {
    //               protocol[1]        host[2]  path[3]  querystr[4]
    var purl = /^([a-zA-Z_0-9]+\:)\/\/([^\/]*)(\/[^?]*)(\?[^?\/]*)?/,
        m    = null;

    if (typeof document !== "undefined") {
        var a = document.createElement('a');
        a.href = url;
        m = purl.exec(a.href);
        if (m == null) {
            m = purl.exec(window.location);
            if (m == null) {
                throw new Error("Cannot resolve '" + url + "' url");
            }
            a.href = m[1] + "//" + m[2] + m[3].substring(0, p.lastIndexOf("/") + 1) + url;
            m = purl.exec(a.href);
        }
    } else {
        m = purl.exec(url);
    }

    /**
     * URL path
     * @attribute path
     * @type {String}
     * @readOnly
     */
    this.path = m[3].replace(/[\/]+/g, "/");
    this.href = a.href;

    /**
     * URL protocol
     * @attribute protocol
     * @type {String}
     * @readOnly
     */
    this.protocol = (m[1] != null ? m[1].toLowerCase() : null);

    /**
     * Host
     * @attribute host
     * @type {String}
     * @readOnly
     */
    this.host = m[2];

    /**
     * Query string
     * @attribute qs
     * @type {String}
     * @readOnly
     */
    this.qs = m[4];
};

URL.prototype.toString = function() {
    return this.href;
};

/**
 * Get a parent URL of the URL
 * @return  {zebkit.URL} a parent URL
 * @method getParentURL
 */
URL.prototype.getParentURL = function() {
    var i = this.path.lastIndexOf("/");
    return (i < 0) ? null
                   : new URL(this.protocol + "//" + this.host + this.path.substring(0, i + 1));
};

/**
 * Test if the given url is absolute
 * @param  {u}  u an URL
 * @return {Boolean} true if the URL is absolute
 * @method isAbsolute
 * @static
 */
URL.isAbsolute = function(u) {
    return /^[a-zA-Z]+\:\/\//i.test(u);
};

/**
 * Join the given relative path to the URL.
 * If the passed path starts from "/" character
 * it will be joined without taking in account
 * the URL path
 * @param  {String} p* a relative paths
 * @return {String} an absolute URL
 * @method join
 */
URL.prototype.join = function(p) {
    var fp = this.protocol + "//" + this.host + (arguments[0][0] === '/' ? '/' : this.path);
    for(var i = 0; i < arguments.length; i++) {
        var p = arguments[i];
        if (URL.isAbsolute(p)) {
            throw new Error("Absolute URL '" + p + "' cannot be joined");
        }

        if (fp[fp.length - 1] !== '/' && p[0] !== '/') {
            fp = fp + "/" + p;
        } else {
            if (fp[fp.length - 1] === '/' && p[0] === '/') {
                fp = fp + p.substring(1);
            } else {
                fp = fp + p;
            }
        }
    }
    return fp;
};

function $ls(callback, all) {
    for (var k in this) {
        var v = this[k];
        if (this.hasOwnProperty(k) && (v instanceof Package) === false)  {
            if ((k[0] !== '$' && k[0] !== '_') || all === true) {
                callback.call(this, k, this[k]);
            }
        }
    }
}

function $lsall(fn) {
    $ls.call(this, function(k, v) {
        if (v != null && v.clazz === zebkit.Class && v.$name == null) {
            v.$name = fn + k;
            $lsall.call(v, v.$name + ".");
        }
    });
}

// package class
function Package(name, parent) {
    this.$url    = null;
    this.$name   = name;
    this.config  = {};
    this.$parent = arguments.length < 2 ? null : parent;

    if (typeof document !== "undefined") {
        var s  = document.getElementsByTagName('script'),
            ss = s[s.length - 1].getAttribute('src'),
            i  = ss == null ? -1 : ss.lastIndexOf("/");

        this.$url = (i > 0) ? new URL(ss.substring(0, i + 1))
                            : new URL(document.location.toString()).getParentURL();
    }
}

Package.prototype.fullname = function() {
    var n = [ this.$name ], p = this;
    while(p.$parent != null) {
        p = p.$parent;
        n.unshift(p.$name);
    }
    return n.join(".");
};

Package.prototype.packages = function(callback, recursively) {
    for (var k in this) {
        var v = this[k];
        if (k !== "$parent" && this.hasOwnProperty(k) && v instanceof Package) {
            callback.call(this, k, v);
            if (recursively === true) {
                v.packages(callback, recursively);
            }
        }
    }
};

Package.prototype.ls = function(cb, all) {
    $ls.call(this, cb, all);
};

Package.prototype.import = function() {
    var code = [];
    if (arguments.length > 0) {
        for(var i = 0; i < arguments.length; i++) {
            var v = lookupObjValue(this, arguments[i]);
            if (v == null || !(v instanceof Package)) {
                throw new Error("Package '" + arguments[i] + " ' cannot be found");
            }
            code.push(v.import());
        }

        return code.length > 0 ?  code.join(";") : null;
    } else {
        var fn = this.fullname();
        this.ls(function(k, v) {
            code.push(k + '=' + fn + '.' + k);
        });

        return code.length > 0 ?  "var " + code.join(",") + ";" : null;
    }
};

Package.prototype.require = function() {
    var pkgs = [], $this = this, i = 0;
    while (isString(arguments[i])) {
        var pkg = lookupObjValue(this, arguments[i]);
        if (pkg == null || !(pkg instanceof Package)) {
            throw new Error("Package '" + arguments[i] + "' cannot be found");
        }
        pkgs.push(pkg);
        i++;
    }

    var callbacks = [];
    for (;i < arguments.length; i++) {
        var callback = (function(callback) {
            return function() {
                return callback.apply($this, pkgs);
            };
        })(arguments[i]);

        callbacks.push(callback);
    }

    this.ready.apply(this, callbacks);
};

Package.prototype.package = function(name, callback) {
    // no arguments than return the package itself
    if (arguments.length === 0) {
        return this;
    }

    var target = this;
    if (typeof arguments[0] !== 'function') {
        if (name == null) {
            throw new Error("Null package name");
        }

        name = name.trim();
        if (name.match(/^[a-zA-Z_][a-zA-Z0-9_]+(\.[a-zA-Z_][a-zA-Z0-9_]+)*$/) === null) {
            throw new Error("Invalid package name '" + name + "'");
        }

        var names = name.split('.');
        for(var i = 0, k = names[0]; i < names.length; i++, k = k + '.' + names[i]) {
            var n = names[i], p = target[n];
            if (typeof p === "undefined") {
                p = new Package(n, target);
                target[n] = p;
            } else {
                if ((p instanceof Package) === false) {
                    throw new Error("Requested package '" + name +  "' conflicts with variable '" + n + "'");
                }
            }
            target = p;
        }
    }

    if (typeof arguments[arguments.length - 1] === 'function') {
        var f = arguments[arguments.length - 1];

        // call in ready section since every call
        // can have influence on ready state
        this.ready(function() {
            f.call(target, target, typeof zebkit !== 'undefined' ? zebkit.Class : null);
            $lsall.call(target, target.fullname() + ".");
        });
    }

    return target;
};

/**
 * The method makes sure all variables, structures, elements are loaded
 * and ready to be used. The result of the method execution is calling
 * passed callback functions when the environment is ready. The goal of
 * the method to provide safe place to run your code safely in proper
 * place and at proper time.

        zebkit.ready(function() {
            // run code here safely
            ...
        });

 * @param {Fucntion|Array} [f] a function or array of functions to be called
 * safely. If there no one callback method has been passed it causes busy
 * flag will be decremented.
 * @method ready
 * @for  zebkit
 */
Package.prototype.ready = function() {
    if (arguments.length === 0) {
        if ($busy > 0) $busy--;
    } else {
        if (arguments.length === 1      &&
            $busy === 0                 &&
            $readyCallbacks.length === 0  )
        {
            arguments[0]();
            return;
        }
    }

    for(var i = 0; i < arguments.length; i++) {
        $readyCallbacks.push(arguments[i]);
    }

    while ($busy === 0 && $readyCallbacks.length > 0) {
        $readyCallbacks.shift()();
    }
};

Package.prototype.busy = function() {
    $busy++;
};

// =================================================================================================
//
//   Zebkit root package declaration
//
// =================================================================================================
zebkit = new Package("zebkit").package(function(pkg) {
    var $$$    = 11,  // hash code counter
        $caller = null; // currently called method reference


    // single method proxy wrapper
    function ProxyMethod(name, f, clazz) {
        if (typeof f.methodBody !== "undefined") {
            throw new Error("Proxy method '" + name + "' cannot be wrapped");
        }

        var a = function() {
            var cm = $caller;
            $caller = a;
            // don't use finally section it is slower than try-catch
            try {
                var r = f.apply(this, arguments);
                $caller = cm;
                return r;
            } catch(e) {
                $caller = cm;
                console.log(name + "(" + arguments.length + ") " + (e.stack ? e.stack : e));
                throw e;
            }
        };

        a.methodBody = f;
        a.methodName = name;
        a.boundTo    = clazz;
        return a;
    }

    // copy methods from source to destination
    function cpMethods(src, dest, clazz) {
        for(var name in src) {
            if (src.hasOwnProperty(name) &&
                name   !== pkg.CNAME     &&
                name   !== "clazz"         )
            {
                var method = src[name];
                if (typeof method === "function" && method !== $toString) {
                    if (name === "$prototype") {
                        method.call(dest, clazz);
                    } else {
                        var old = dest[name];
                        //TODO analyze if we overwrite extend field
                        if (old != null) {
                            if (method.$isAbstract === true) {
                                continue;
                            }

                            if (old.boundTo === clazz) {
                                throw new Error("Method '" + name +"(...)'' bound to this class already exists");
                            }
                        }

                        if (typeof method.methodBody !== "undefined") {
                            dest[name] = ProxyMethod(name, method.methodBody, clazz);
                        } else {
                            dest[name] = ProxyMethod(name, method, clazz);
                        }
                    }
                }
            }
        }
    }

    function $toString() {
        return this.$hash$;
    }

    // return function that is meta class
    //  instanceOf      - parent template function (can be null)
    //  templateConstructor - template function,
    //  inheritanceList     - parent class and interfaces
    function make_template(instanceOf, templateConstructor, inheritanceList) {
        // supply template with unique identifier that is returned with toString() method
        templateConstructor.$hash$   = "$zEk$" + ($$$++);
        templateConstructor.toString = $toString;
        templateConstructor.prototype.clazz = templateConstructor; // instances of the template has to point to the template as a class

        templateConstructor.clazz = templateConstructor.constructor = instanceOf;
        templateConstructor.$parents = {};

        // instances of the constructor also has to be unique
        // so force toString method population
        templateConstructor.prototype.toString    = $toString;
        templateConstructor.prototype.constructor = templateConstructor; // set constructor of instances to the template

        // setup parent entities
        if (inheritanceList != null && inheritanceList.length > 0) {
            for(var i = 0; i < inheritanceList.length; i++) {
                var inherited = inheritanceList[i];
                if (inherited == null                       ||
                    typeof inherited        !== "function"  ||
                    typeof inherited.$hash$ === "undefined"   )
                {
                    throw new ReferenceError("Invalid parent class or interface:" + inherited);
                }

                if (typeof templateConstructor.$parents[inherited.$hash$] !== "undefined") {
                    throw Error("Duplicate inherited class or interface: " + inherited);
                }

                templateConstructor.$parents[inherited.$hash$] = inherited;

                // if parent has own parents copy the parents references
                for(var k in inherited.$parents) {
                    //if (inherited.$parents.hasOwnProperty(k)) {
                        if (typeof templateConstructor.$parents[k] !== "undefined") {
                            throw Error("Duplicate inherited class or interface: " + k);
                        }

                        templateConstructor.$parents[k] = inherited.$parents[k];
                    //}
                }
            }
        }
        return templateConstructor;
    }

    pkg.URL = URL;

    pkg.CNAME = '$';
    pkg.CDNAME = '';

    pkg.$FN = (isString.name !== "isString") ? (function(f) {  // IE stuff
                                                    if (f.$methodName == null) { // test if name has been earlier detected
                                                        var mt = f.toString().match(/^function\s+([^\s(]+)/);
                                                        f.$methodName = (mt == null) ? pkg.CDNAME
                                                                                     : (typeof mt[1] === "undefined" ? pkg.CDNAME
                                                                                                                     : mt[1]);
                                                    }
                                                    return f.$methodName;
                                                })
                                             : (function(f) { return f.name; });

    pkg.isIE        = isInBrowser && (Object.hasOwnProperty.call(window, "ActiveXObject") || !!window.ActiveXObject);
    pkg.isFF        = isInBrowser && window.mozInnerScreenX != null;

    pkg.isMacOS = isInBrowser && navigator.platform.toUpperCase().indexOf('MAC') !== -1;

    pkg.isString   = isString;
    pkg.isNumber   = isNumber;
    pkg.isBoolean  = isBoolean;

    pkg.$global    = $global;


    pkg.$Map = function() {
        var Map = function() {
            this.keys   = [];
            this.values = [];
            this.size   = 0 ;
        };

        Map.prototype = {
            set : function(key, value) {
                var i = this.keys.indexOf(key);
                if (i < 0) {
                    this.keys.push(key);
                    this.values.push(value);
                    this.size++;
                } else {
                   this.values[i] = value;
                }
                return this;
             },

            delete: function(key) {
                var i = this.keys.indexOf(key);
                if (i < 0) {
                   return false;
                }

                this.keys.splice(i, 1);
                this.values.splice(i, 1);
                this.size--;
                return true;
            },

            get : function(key) {
                var i = this.keys.indexOf(key);
                return i < 0 ? undefined : this.values[i];
            },

            clear : function() {
                this.keys = [];
                this.keys.length = 0;
                this.values = [];
                this.values.length = 0;
                this.size = 0;
            },

            has : function(key) {
                return this.keys.indexOf(key) >= 0;
            },

            forEach: function(callback, context) {
                var $this = context == null ? this : context;
                for(var i = 0 ; i < this.size; i++) {
                    callback.call($this, this.values[i], this.keys[i], this);
                }
            }
        };

        return Map;
    };

    // Map is class
    if (typeof pkg.$global.Map === "undefined") {
        pkg.$global.Map = pkg.$Map();
    }

    /**
     * Clone the given object
     * @param  {Object} obj an object to be cloned
     * @return {Object} a cloned object
     * @method  clone
     * @for  zebkit
     */
    pkg.clone = function (obj, map) {
        // clone atomic type
        if (obj == null || pkg.isString(obj) || pkg.isBoolean(obj) || pkg.isNumber(obj)) {
            return obj;
        }

        if (obj.$notClonable === true) {
            return obj;
        }

        map = map || new Map();
        var t = map.get(obj);
        if (typeof t !== "undefined") {
            return t;
        }

        // clone with provided custom "clone" method
        if (typeof obj.$clone !== "undefined") {
            return obj.$clone(map);
        }

        // clone array
        if (Array.isArray(obj)) {
            var nobj = [];

            map.set(obj, nobj);
            map[obj] = nobj;

            for(var i = 0; i < obj.length; i++) {
                nobj[i] = pkg.clone(obj[i], map);
            }
            return nobj;
        }

        // clone class
        if (obj.clazz === pkg.Class) {
            var clazz = pkg.Class(obj, []);
            clazz.parentPropsLookup = true;
            return clazz;
        }

        // function cannot be cloned
        if (typeof obj === 'function' || obj.constructor !==  Object) {
            return obj;
        }

        var nobj = {};
        map.set(obj, nobj);

        // clone object fields
        for(var k in obj) {
            if (obj.hasOwnProperty(k) === true) {
                nobj[k] = pkg.clone(obj[k], map);
            }
        }

        return nobj;
    };

    /**
     * Instantiate a new class instance by the given class name with the specified constructor
     * arguments.
     * @param  {Function} clazz a class
     * @param  {Array} [args] an arguments list
     * @return {Object}  a new instance of the given class initialized with the specified arguments
     * @method newInstance
     * @for  zebkit
     */
    pkg.newInstance = function(clazz, args) {
        if (args && args.length > 0) {
            function f() {}
            f.prototype = clazz.prototype;
            var o = new f();
            clazz.apply(o, args);
            return o;
        }
        return new clazz();
    };

    pkg.getPropertySetter = function(obj, name) {
        var pi = obj.constructor.$propertyInfo;
        if (pi != null) {
            if (typeof pi[name] === "undefined") {
                var m = obj[ "set" + name[0].toUpperCase() + name.substring(1) ];
                pi[name] = (typeof m  === "function") ? m : null;
            }
            return pi[name];
        }

        var m = obj[ "set" + name[0].toUpperCase() + name.substring(1) ];
        return (typeof m  === "function") ? m : null;
    };

    // target - is object whose properties have to populated
    // p      - properties
    pkg.properties = function(target, p) {
        for(var k in p) {
            // skip private properties( properties that start from "$")
            if (k !== "clazz" && k[0] !== '$' && p.hasOwnProperty(k) && typeof p[k] !== "undefined" && typeof p[k] !== 'function') {
                if (k[0] === '-') {
                    delete target[k.substring(1)];
                } else {
                    var v = p[k],
                        m = zebkit.getPropertySetter(target, k);

                    // value factory detected
                    if (v !== null && v.$new != null) {
                        v = v.$new();
                    }

                    if (m === null) {
                        target[k] = v;  // setter doesn't exist, setup it as a field
                    } else {
                        // property setter is detected, call setter to
                        // set the property value
                        if (Array.isArray(v)) m.apply(target, v);
                        else                  m.call(target, v);
                    }
                }
            }
        }
        return target;
    };

    /**
     * Interface is a special class that is used to "pitch" a class with a some marker.
     * It is not supposed an interface directly rules which method the class has to implement.

            // declare "I" interface
            var I = zebkit.Interface();

            // declare "A" class that implements "I" interface
            var A = zebkit.Class(I, [ function m() {} ]);

            // instantiate "A" class
            var a = new A();
            zebkit.instanceOf(a, I);  // true
            zebkit.instanceOf(a, A);  // true


     * @return {Function} an interface
     * @constructor
     * @class  zebkit.Interface
     */
    pkg.Interface = make_template(null, function() {
        var $Interface = make_template(pkg.Interface, function() {
            // TODO: not stable feature, that allows to dump interface with a new one
            // whose prototype can be fulfilled with passed method
            if (this.constructor !== $Interface) {  // means the method execution is not a result of "new" method
                if ($Interface.$original != null)  {
                    return $Interface.$original.apply(this, arguments);
                }

                var methods = [],
                    hasCosntr = false,
                    proto   = $Interface.prototype;

                for(var k in proto) {
                    if (k !== "clazz" && proto.hasOwnProperty(k) && typeof proto[k] === 'function') {
                        if (k === pkg.CNAME) {
                            methods[methods.length] = (function (constr, args) {
                                return function() {
                                    return constr.apply(this, args);
                                };
                            })(proto[k], arguments);
                            hasCosntr = true;
                        } else {
                            methods[methods.length] = proto[k];
                        }
                    }
                }

                if (hasCosntr === false) {
                    throw new Error("No interface initializer was found");
                }

                var ii = pkg.Interface(methods);
                ii.$original = $Interface;

                // TODO: not a very good workaround to force instanceOf(x, $Interface) => true
                ii.$hash$ = $Interface.$hash$;
                return ii;
            }

            if (arguments.length > 1) {
                throw new Error("One argument is expected");
            }

            return new (pkg.Class($Interface, arguments.length > 0 ? arguments[0] : []));
        }, null);

        if (arguments.length > 1) {
            throw Error("One argument is expected");
        }

        if (arguments.length > 0) {
            var methods    = arguments[0],
                isAbstract = false,
                proto      = $Interface.prototype;

            if (Array.isArray(methods) === false) {
                throw new Error("Methods is expected");
            }

            for(var i = 0; i < methods.length; i++) {
                var method = methods[i];

                if (method === "abstract") {
                    isAbstract = true;
                } else {
                    if (typeof method !== "function") {
                        throw new Error("Method is expected instead of " + method);
                    }

                    var name = pkg.$FN(method);
                    if (name === pkg.CDNAME) {
                        name = pkg.CNAME;
                    }

                    if (proto[name] != null) {
                        throw new Error("Duplicated method '" + name + "(...)'");
                    }

                    if (isAbstract) {
                        (function(name) {
                            proto[name] = function() {
                                throw new Error("Not implemented abstract method '" + name + "(...)'");
                            };
                            proto[name].$isAbstract = true;
                        })(name);
                    } else {
                        proto[name] = method;
                    }
                }
            }
        }
        return $Interface;
    });


    /**
     * Class declaration method. Easy OOP concept supports:
     *
     *
     *  __Single class inheritance.__ Any class can extend an another zebkit class

        // declare class "A" that with one method "a"
        var A = zebkit.Class([
            function a() { ... }
        ]);

        // declare class "B" that inherits class "A"
        var B = zebkit.Class(A, []);

        // instantiate class "B" and call method "a"
        var b = new B();
        b.a();


    * __Class method overriding.__ Override a parent class method implementation


            // declare class "A" that with one method "a"
            var A = zebkit.Class([
                function a() { ... }
            ]);

            // declare class "B" that inherits class "A"
            // and overrides method a with an own implementation
            var B = zebkit.Class(A, [
                function a() { ... }
            ]);


    * __Constructors.__ Constructor is a method with empty name


            // declare class "A" that with one constructor
            var A = zebkit.Class([
                function () { this.variable = 100; }
            ]);

            // instantiate "A"
            var a = new A();
            a.variable // variable is 100

    * __Static methods and variables declaration.__ Static fields and methods can be defined
        by declaring special "$clazz" method whose context is set to declared class

            var A = zebkit.Class([
                // special method where static stuff has to be declared
                function $clazz() {
                    // declare static field
                    this.staticVar = 100;
                    // declare static method
                    this.staticMethod = function() {};
                }
            ]);

            // access static field an method
            A.staticVar      // 100
            A.staticMethod() // call static method

        __Access to super class context.__ You can call method declared in a parent class

            // declare "A" class with one class method "a(p1,p2)"
            var A = zebkit.Class([
                function a(p1, p2) { ... }
            ]);

            // declare "B" class that inherits "A" class and overrides "a(p1,p2)" method
            var B = zebkit.Class(A, [
                function a(p1, p2) {
                    // call "a(p1,p2)" method implemented with "A" class
                    this.$super(p1,p2);
                }
            ]);

     *
     *  One of the powerful feature of zebkit easy OOP concept is possibility to instantiate
     *  anonymous classes and interfaces. Anonymous class is an instance of an existing
     *  class that can override the original class methods with own implementations, implements
     *  own list of interfaces. In other words the class instance customizes class definition
     *  for the particular instance of the class;

                // declare "A" class
                var A = zebkit.Class([
                    function a() { return 1; }
                ]);

                // instantiate anonymous class that add an own implementation of "a" method
                var a = new A([
                    function a() { return 2; }
                ]);
                a.a() // return 2

     * @param {zebkit.Class} [inheritedClass] an optional parent class to be inherited
     * @param {zebkit.Interface} [inheritedInterfaces*] an optional list of interfaces for
     * the declared class to be extended
     * @param {Array} methods list of declared class methods. Can be empty array.
     * @return {Function} a class definition
     * @constructor
     * @class zebkit.Class
     */

    /**
     * Extend existent class with the given methods and interfaces
     * Be  careful to use the method, pay attention the following facts:

    - only the given class and the classes that inherit the class __after the extend method calling__ get the updates

     *
     * For example:

        var A = zebkit.Class([ // declare class A that defines one "a" method
            function a() {
                console.log("A:a()");
            }
        ]);

        var a = new A();
        a.a();  // show "A:a()" message

        A.extend([
            function b() {
                console.log("EA:b()");
            },

            function a() {   // redefine "a" method
                console.log("EA:a()");
            }
        ]);

        // can call b() method we just added to the instance class
        a.b(); // show "EA:b()" message
        a.a(); // show "EA:a()" message

     * @param {Array} methods array of the methods the class have to be
     * extended with
     * @method mixing
     * @for zebkit
     */
    function mixing(clazz, methods) {
        if (Array.isArray(methods) === false) {
            throw new Error("Methods array is expected (" + methods + ")");
        }

        var names = {};
        for(var i = 0; i < methods.length; i++) {
            var method     = methods[i],
                methodName = pkg.$FN(method);

            // detect if the passed method is proxy method
            if (method.methodBody != null) {
                throw new Error("Proxy method '" + methodName + "' cannot be mixed in a class");
            }

            // map user defined constructor to internal constructor name
            if (methodName === pkg.CDNAME) {
                methodName = pkg.CNAME;
            } else {
                if (methodName[0] === "$") {
                    // populate prototype fields if a special method has been defined
                    if (methodName === "$prototype") {
                        method.call(clazz.prototype, clazz);
                        if (clazz.prototype[pkg.CDNAME]) {
                            clazz.prototype[pkg.CNAME] = clazz.prototype[pkg.CDNAME];
                            delete clazz.prototype[pkg.CDNAME];
                        }
                        continue;
                    }

                    // populate class level fields if a special method has been defined
                    if (methodName === "$clazz") {
                        method.call(clazz);
                        continue;
                    }
                }
            }

            if (names[methodName] === true) {
                throw new Error("Duplicate declaration of '" + methodName+ "(...)' method");
            }

            var existentMethod = clazz.prototype[methodName];
            if (typeof existentMethod !== 'undefined' && typeof existentMethod !== 'function') {
                throw new Error("'" + methodName + "(...)' method clash with a field");
            }

            // Create and set proxy method that is bound to the given class
            clazz.prototype[methodName] = ProxyMethod(methodName, method, clazz);

            // save method we have already added to check double declaration error
            names[methodName] = true;
        }
    }

    // create Class template what means we define a function (meta class) that has to be used to define
    // Class. That means we definea a fucntion that returns amother function that is a Class
    pkg.Class = make_template(null, function() {
        if (arguments.length === 0) {
            throw new Error("No class method list was found");
        }

        if (Array.isArray(arguments[arguments.length - 1]) === false) {
            throw new Error("Invalid class definition");
        }

        if (arguments.length > 1 && typeof arguments[0] !== "function")  {
            throw new ReferenceError("Invalid parent class or interface '" + arguments[0] + "'");
        }

        var classMethods = arguments[arguments.length - 1],
            parentClass  = null,
            toInherit    = [];

        // detect parent class in inheritance list as the first argument that has "clazz" set to Class
        if (arguments.length > 0 && (arguments[0] == null || arguments[0].clazz === pkg.Class)) {
            parentClass = arguments[0];
        }

        // use instead of slice for performance reason
        for(var i = 0; i < arguments.length - 1; i++) {
            toInherit[i] = arguments[i];

            // let's make sure we inherit interface
            if (parentClass === null || i > 0) {
                if (toInherit[i] == null || toInherit[i].clazz !== pkg.Interface) {
                    throw new ReferenceError("Invalid inherited interface [" + i + "] :" + toInherit[i]);
                }
            }
        }

        // define Class (function) that has to be used to instatiate the class instance
        var classTemplate = make_template(pkg.Class, function() {
            this.$hash$ = "$ZkIo" + ($$$++);

            if (arguments.length > 0) {
                var a = arguments[arguments.length - 1];

                // anonymous is customized class instance if last arguments is array of functions
                if (Array.isArray(a) === true && typeof a[0] === 'function') {
                    a = a[0];

                    // prepare arguments list to declare an anonymous class
                    var args = [ classTemplate ],      // first of all the class has to inherit the original class
                        k    = arguments.length - 2;

                    // collect interfaces the anonymous class has to implement
                    for(; k >= 0 && arguments[k].clazz === pkg.Interface; k--) {
                        args.push(arguments[k]);
                    }

                    // add methods list
                    args.push(arguments[arguments.length - 1]);

                    var cl = pkg.Class.apply(null, args),  // declare new anonymous class
                        // create a function to instantiate an object that will be made the
                        // anonymous class instance. The intermediate object is required to
                        // call constructor properly since we have arguments as an array
                        f  = function() {};

                    cl.$name = classTemplate.$name; // the same class name for anonymous
                    f.prototype = cl.prototype; // the same prototypes

                    var o = new f();

                    // call constructor
                    // use array copy instead of cloning with slice for performance reason
                    // (Array.prototype.slice.call(arguments, 0, k + 1))
                    args = [];
                    for (var i = 0; i < k + 1; i++) {
                        args[i] = arguments[i];
                    }
                    cl.apply(o, args);

                    // set constructor field for consistency
                    o.constructor = cl;
                    return o;
                }
            }

            // call class constructor
            var res = undefined;
            if (this[pkg.CNAME] != null) {
                res = this[pkg.CNAME].apply(this, arguments);
            }

            // TODO: redesign storing interface to avoid using for
            var parents = this.clazz.$parents;
            for (var k in parents) {
                var init = parents[k].prototype[pkg.CNAME];
                if (typeof init !== "undefined" && parents[k].clazz === pkg.Interface) {
                    init.call(this);
                }
            }

            return res;
        }, toInherit);

        // prepare fields that caches the class properties
        classTemplate.$propertyInfo = {};

        // copy parents prototype methods and fields into
        // new class template
        classTemplate.$parent = parentClass;
        if (parentClass !== null) {
            for(var k in parentClass.prototype) {
                if (parentClass.prototype.hasOwnProperty(k)) {
                    var f = parentClass.prototype[k];
                    classTemplate.prototype[k] = (f != null && f.methodBody != null) ? ProxyMethod(f.methodName, f.methodBody, f.boundTo)
                                                                                     : f;
                }
            }
        }

        // extend method cannot be overridden
        classTemplate.prototype.extend = function() {
            var clazz = this.clazz,
                l = arguments.length,
                f = arguments[l - 1],
                hasArray = Array.isArray(f);

            // replace the instance class with a new intermediate class
            // that inherits the replaced class. it is done to support
            // $super method calls.
            if (this.$isExtended !== true) {
                clazz = pkg.Class(clazz, []);
                this.$isExtended = true;         // mark the instance as extended to avoid double extending.
                clazz.$name = this.clazz.$name;
                this.clazz = clazz;
            }

            if (hasArray) {
                var init = null;
                for(var i = 0; i < f.length; i++) {
                    var n = pkg.$FN(f[i]);
                    if (n === pkg.CDNAME) {
                        init = f[i];  // postpone calling initializer before all methods will be defined
                    } else {
                        if (typeof this[n] !== 'undefined' && typeof this[n] !== 'function') {
                            throw new Error("Method '" + n + "' clash with a property");
                        }
                        this[n] = ProxyMethod(n, f[i], clazz);
                    }
                }

                if (init != null) {
                    init.call(this);
                }
                l--;
            }

            // add new interfaces if they has been passed
            for (var i = 0; i < arguments.length - (hasArray ? 1 : 0); i++) {
                if (arguments[i].clazz !== pkg.Interface) {
                    throw new Error("Invalid argument " + arguments[i] + " Interface is expected.");
                }

                var I = arguments[i];
                if (clazz.$parents[I.$hash$] != null) {
                    throw new Error("Interface has been already inherited");
                }

                cpMethods(I.prototype, this, clazz);
                clazz.$parents[I.$hash$] = I;

                // call interface initializer
                if (I.prototype[pkg.CNAME] != null) {
                    I.prototype[pkg.CNAME].call(this);
                }
            }
            return this;
        };

        classTemplate.prototype.$super = function() {
           if ($caller !== null) {
                var $s = $caller.boundTo.$parent;

                while ($s !== null) {
                    var m = $s.prototype[$caller.methodName];
                    if (m != null) {
                        return m.apply(this, arguments);
                    }
                    $s = $s.$parent;
                }

                // handle method not found error
                var cln = this.clazz && this.clazz.$name ? this.clazz.$name + "." : "";
                throw new ReferenceError("Method '" +
                                         cln +
                                         ($caller.methodName === pkg.CNAME ? "constructor"
                                                                           : $caller.methodName) + "(" + arguments.length + ")" + "' not found");
            }
            throw new Error("$super is called outside of class context");
        };

        // TODO: not stable API, $super that doesn't throw exception is there is no super implementation
        classTemplate.prototype.$$super = function() {
           if ($caller !== null) {
                var $s = $caller.boundTo.$parent;
                while ($s !== null) {
                    var m = $s.prototype[$caller.methodName];
                    if (m != null) {
                        return m.apply(this, arguments);
                    }
                    $s = $s.$parent;
                }
            }
            throw new Error("$super is called outside of class context");
        };

        classTemplate.prototype.$getSuper = function(name) {
           if ($caller !== null) {
                var $s = $caller.boundTo.$parent;
                while ($s !== null) {
                    var m = $s.prototype[name];
                    if (m != null) {
                        return m;
                    }
                    $s = $s.$parent;
                }
                return null;
            }
            throw new Error("$super is called outside of class context");
        };

        classTemplate.prototype.$clone = function(map) {
            map = map || new Map();

            var f = function() {};
            f.prototype = this.constructor.prototype;
            var nobj = new f();
            map.set(this, nobj);

            for(var k in this) {
                if (this.hasOwnProperty(k)) {
                    // obj's layout is obj itself
                    var t = map.get(this[k]);
                    if (t !== undefined) {
                        nobj[k] = t;
                    } else {
                        nobj[k] = zebkit.clone(this[k], map);
                    }
                }
            }

            // speed up clearing resources
            map.clear();

            nobj.constructor = this.constructor;
            nobj.$hash$ = "$zObj_" + ($$$++);
            nobj.clazz = this.clazz;
            return nobj;
        };

        classTemplate.prototype.clazz = classTemplate;

        // check if the method has been already defined in the class
        if (typeof classTemplate.prototype.properties === 'undefined') {
            classTemplate.prototype.properties = function(p) {
                return pkg.properties(this, p);
            };
        }

        var lans = "Listeners are not supported";

        // check if the method has been already defined in the class
        if (typeof classTemplate.prototype.bind === 'undefined') {
            classTemplate.prototype.bind = function() {
                if (this._ == null) {
                    throw new Error(lans);
                }
                return this._.add.apply(this._, arguments);
            };
        }

        // check if the method has been already defined in the class
        if (typeof classTemplate.prototype.unbind === 'undefined') {
            classTemplate.prototype.unbind = function() {
                if (this._ == null) {
                    throw new Error(lans);
                }
                this._.remove.apply(this._, arguments);
            };
        }

        mixing(classTemplate, classMethods);
        // copy methods from interfaces
        if (toInherit.length > 0) {
            for(var i = toInherit[0].clazz === pkg.Interface ? 0 : 1; i < toInherit.length; i++) {
                cpMethods(toInherit[i].prototype, classTemplate.prototype, classTemplate);
            }
        }

        // populate static fields
        // TODO: exclude the basic static methods and static constant
        // static inheritance
        if (parentClass != null) {
            for (var k in parentClass) {
                if (k[0] !== '$' &&
                    parentClass.hasOwnProperty(k) &&
                    classTemplate.hasOwnProperty(k) === false)
                {
                    classTemplate[k] = pkg.clone(parentClass[k]);
                }
            }
        }

        // add extend method later to avoid the method be inherited as a class static field
        classTemplate.extend = function() {
            var methods   = arguments[arguments.length - 1],
                hasMethod = Array.isArray(methods);

            // inject class
            if (hasMethod && this.$isExtended !== true) {
                // create intermediate class
                var srcClazz = this,
                    A = this.$parent != null ? pkg.Class(this.$parent, [])
                                             : pkg.Class([]);

                // copy this class prototypes methods to intermediate class A and re-define
                // boundTo to the intermediate class A if they were bound to source class
                // methods that have been  moved from source class to class have to be re-bound
                // to A class
                for(var name in this.prototype) {
                    if (this.prototype.hasOwnProperty(name) === true && name !== "clazz") {
                        var f = this.prototype[name];
                        A.prototype[name] = f != null && f.methodBody != null ? ProxyMethod(name, f.methodBody, f.boundTo)
                                                                              : f;

                        if (A.prototype[name] != null && A.prototype[name].boundTo === this) {
                            A.prototype[name].boundTo = A;
                            if (f.boundTo === this) {
                                f.boundTo = A;
                            }
                        }
                    }
                }

                this.$parent = A;
                this.$isExtended = true;
            }

            if (hasMethod) {
                mixing(this, methods);
            }

            // add passed interfaces
            for(var i = 0; i < arguments.length - (hasMethod ? 1 : 0); i++) {
                var I = arguments[i];
                if (I == null || I.clazz !== zebkit.Interface) {
                    throw new Error("Interface is expected");
                }

                if (this.$parents[I.$hash$] != null) {
                    throw new Error("Interface has been already inherited");
                }

                cpMethods(I.prototype, this.prototype, this);
                this.$parents[I.$hash$] = I;
            }
        };

        return classTemplate;
    });

    var $cachedO = pkg.$cachedO = {},
        $cachedE = pkg.$cachedE = [];

    pkg.$cacheSize = 7777;

    /**
     * Get an object by the given key from cache (and cached it if necessary)
     * @param  {String} key a key to an object. The key is hierarchical reference starting with the global
     * name space as root. For instance "test.a" key will fetch $global.test.a object.
     * @return {Object}  an object
     * @for  zebkit
     * @private
     * @method  zebkit.$cache
     */
    pkg.$cache = function(key) {
        // don't cache global objects
        if (pkg.$global[key]) {
            return pkg.$global[key];
        }

        if ($cachedO.hasOwnProperty(key) === true) {
            // read cached entry
            var e = $cachedO[key];
            if (e.i < ($cachedE.length-1)) { // cached entry is not last one

                // move accessed entry to the list tail to increase its access weight
                var pn = $cachedE[e.i + 1];
                $cachedE[e.i]   = pn;
                $cachedE[++e.i] = key;
                $cachedO[pn].i--;
            }
            return e.o;
        }

        var ctx = pkg.$global, i = 0, j = 0;
        for( ;ctx != null; ) {
            i = key.indexOf('.', j);

            if (i < 0) {
                ctx = ctx[key.substring(j, key.length)];
                break;
            }

            ctx = ctx[key.substring(j, i)];
            j = i + 1;
        }

        if (ctx != null) {
            if ($cachedE.length >= pkg.$cacheSize) {
                // cache is full, replace first element with the new one
                var n = $cachedE[0];
                $cachedE[0]   = key;
                $cachedO[key] = { o:ctx, i:0 };
                delete $cachedO[n];
            }
            else {
                $cachedO[key] = { o: ctx, i:$cachedE.length };
                $cachedE[$cachedE.length] = key;
            }
            return ctx;
        }

        throw new Error("Reference '" + key + "' not found");
    };

    /**
     * Get class by the given class name
     * @param  {String} name a class name
     * @return {Function} a class. Throws exception if the class cannot be
     * resolved by the given class name
     * @method forName
     * @throws Error
     * @for  zebkit
     */
    pkg.Class.forName = function(name) {
        return pkg.$cache(name);
    };

    pkg.Class.newInstance = function() {
        return pkg.newInstance(this, arguments);
    };

    /**
     * Test if the given object is instance of the specified class or interface. It is preferable
     * to use this method instead of JavaScript "instanceof" operator whenever you are dealing with
     * zebkit classes and interfaces.
     * @param  {Object} obj an object to be evaluated
     * @param  {Function} clazz a class or interface
     * @return {Boolean} true if a passed object is instance of the given class or interface
     * @method instanceOf
     * @for  zebkit
     */
    pkg.instanceOf = function(obj, clazz) {
        if (clazz != null) {
            if (obj == null || typeof obj.clazz === 'undefined') {
                return false;
            }

            var c = obj.clazz;
            return c != null && (c === clazz || typeof c.$parents[clazz.$hash$] !== "undefined");
        }

        throw new Error("instanceOf(): null class");
    };

    /**
     * Dummy class that implements nothing but can be useful to instantiate
     * anonymous classes with some on "the fly" functionality:

            // instantiate and use zebkit class with method "a()" implemented
            var ac = new zebkit.Dummy([
                 function a() {
                    ...
                 }
            ]);

            // use it
            ac.a();
     *
     * @constructor
     * @class zebkit.Dummy
     */
    pkg.Dummy = pkg.Class([]);
});

if (isInBrowser) {
    var m = window.location.search.match(/[?&][a-zA-Z0-9_.]+=[^?&=]+/g);

    zebkit.config = {};
    for(var i=0; m && i < m.length; i++) {
        var l = m[i].split('=');
        zebkit.config[l[0].substring(1)] = l[1];
    }

    var $interval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval($interval);
            zebkit.ready();
        }
    }, 100);
} else {
    zebkit.ready();
}

return zebkit;

/**
 * @for
 */
})();

