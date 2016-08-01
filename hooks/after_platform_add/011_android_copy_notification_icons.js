#!/usr/bin/env node

module.exports = function (context) {
    // make sure android platform is part of build
    if (context.opts.platforms.indexOf('android') < 0) {
        return;
    }

    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        q = context.requireCordovaModule('q'),
        notificationIcons = path.join(context.opts.projectRoot, 'resources/android/icon_notification');

    fs.readdir(
        notificationIcons,
        function (err, files) {
            files.forEach(function (fileName) {
                var matches = fileName.match(/^(.*?)\.png/);
                if (!matches) {
                    return;
                }

                var drawableFolder = path.join(
                    context.opts.projectRoot,
                    'platforms/android/res',
                    "drawable-" + matches[1]
                );

                if (!fs.existsSync(drawableFolder)) {
                    fs.mkdirSync(drawableFolder);
                }

                fs.createReadStream(path.join(notificationIcons, fileName))
                    .pipe(
                        fs.createWriteStream(
                            path.join(
                                drawableFolder,
                                'ic_stat_main.png'
                            )
                        )
                    );
            });
        }
    );
};
