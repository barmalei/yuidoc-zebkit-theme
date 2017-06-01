module.exports = function (data, options) {
    for(var k in data.classes) {
        var clz = data.classes[k];

        if (clz.access !== 'package') {
            if (clz['extends']) {
                var ext = clz['extends'].trim();
                if (ext[0] === '{') {
                    ext = ext.substring(1, ext.length - 1);
                }

                if (data.classes.hasOwnProperty(ext)) {
                    var ref = data.classes[ext];
                    if (!ref.implementations) ref.implementations = [];
                    ref.hasImplementations = true;
                    ref.implementations.push(clz.name);
                }
            } else if (clz['uses']) {
                var interfaces = clz['uses'];
                for(var i = 0; i < interfaces.length; i++) {
                    var intf = interfaces[i];
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