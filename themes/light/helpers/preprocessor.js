module.exports = function (data, options) {

    function getInheritedMethods(clzname) {
        var methods = [];
        for (var i = 0; i < data.classitems.length; i++ ) {
            var item = data.classitems[i];
            if (item.class === clzname && item.itemtype === 'method') {
                methods.push({
                    name  : item.name,
                    clazz : item.class,
                    params: item.params
                });
            }
        }
        return methods;
    }


    for(var k in data.classes) {
        var clz = data.classes[k];
        if (clz.access !== 'package') { // exclude packages
            if (clz['extends']) { // detect it extend something
                var ext = clz['extends'].trim();
                if (ext[0] === '{') {
                    ext = ext.substring(1, ext.length - 1);
                }

                // find a class that is extended
                if (data.classes.hasOwnProperty(ext)) {
                    // reg implementations in the exteded class
                    var ref = data.classes[ext];
                    if (!ref.implementations) ref.implementations = [];
                    ref.hasImplementations = true;
                    ref.implementations.push(clz.name);
                }
            }

            if (clz['uses']) {
                var interfaces = clz['uses'];

                for(var i = 0; i < interfaces.length; i++) {
                    var intf = interfaces[i].trim();
                    if (intf[0] === '{') {
                        intf = intf.substring(1, intf.length - 1);
                    }


                    if (data.classes.hasOwnProperty(intf)) {
                        var ref = data.classes[intf];
                        if (!ref.implementations) ref.implementations = [];
                        ref.hasImplementations = true;
                        ref.implementations.push(clz.name);
                    }
                }
            }
        }
    }
}