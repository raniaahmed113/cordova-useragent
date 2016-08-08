#!/usr/bin/env node

function androidPlatforms(item) {
    return item.match(/^android/);
}

module.exports = function (context) {
    // make sure android platform is part of build
    if (context.opts.platforms.filter(androidPlatforms).length < 1) {
        return;
    }

    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        q = context.requireCordovaModule('q');

    function copyFileFromResources(fileName) {
        return fs.createReadStream(path.join(context.opts.projectRoot, 'resources/android', fileName))
            .pipe(fs.createWriteStream(path.join(context.opts.projectRoot, 'platforms/android', fileName)))
    }

    return q.all([
        copyFileFromResources('release-signing.properties'),
        copyFileFromResources('vertex.keystore')
    ]);
};
