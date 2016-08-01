#!/usr/bin/env node

module.exports = function (context) {
    // make sure android platform is part of build
    if (context.opts.platforms.indexOf('android') < 0) {
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
