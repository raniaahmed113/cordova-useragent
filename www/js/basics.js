if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
        return this.slice(0, str.length) == str;
    };
}

Array.prototype.toggleElement = function(element) {
    var index = this.indexOf(element);

    if (index > -1) {
        this.splice(index, 1);

    } else {
        this.push(element);
    }
};

//FormController.prototype.getDirtyValues = function(form) {
var FormUtils = {

    getDirtyFields: function(form) {
        var output = {};

        function setVal(object, key, prefix) {
            prefix = prefix ? prefix + '.' : '';

            var matches = key.match(/^([a-zA-Z]+)\.(.*)/);
            if (matches) {
                if (!object[matches[1]]) {
                    object[matches[1]] = {};
                }

                setVal(
                    object[matches[1]],
                    matches[2],
                    prefix + matches[1]
                );
                return;
            }

            object[key] = form[prefix + key].$modelValue;
        }

        Object.keys(form).forEach(function(key) {
            if (key.match(/^(\$|ng[A-Z])/) || !form[key].$dirty) {
                return;
            }

            setVal(output, key);
        });

        return output;
    }
};

function range(min, max, step) {
    step = step || 1;
    var input = [];

    for (var i = min; i <= max; i += step) {
        input.push(i);
    }

    return input;
}