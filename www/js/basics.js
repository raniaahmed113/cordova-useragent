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