var gulp = require('gulp'),
    gutil = require('gulp-util'),
    bower = require('bower'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    sh = require('shelljs'),
    fs = require('fs'),
    request = require('request'),
    gettext = require('gulp-angular-gettext'),
    source = require('vinyl-source-stream'),
    q = require('q'),
    buildVariants = require('./variants.json');

var config = {
    pathScss: [
        './scss/**/*.scss'
    ],
    pathHtml: './www/templates/**/*.html',
    pathJs: './www/js/**/*.js'
};

var switchFlavor = function(projectId, appVersion) {
    var cfg = buildVariants[projectId];

    if (!appVersion) {
        appVersion = '3.0.0';
    }

    // Compile config file for Angular
    fs.writeFileSync(
        './www/js/config.js',

        fs.readFileSync('./config.tpl.js', { encoding: 'utf8' })
            .replace(/\$apiClientId/, cfg.apiClientId)
            .replace(/\$languages/, JSON.stringify(cfg.languages))
            .replace(/\$fbAppId/, cfg.fbAppId)
    );

    // Compile config file for Cordova
    fs.writeFileSync(
        './config.xml',

        fs.readFileSync('./config.tpl.xml', { encoding: 'utf8' })
            .replace(/{\$projectId}/, projectId)
            .replace(/{\$version}/, appVersion)
            .replace(/{\$appName}/g, cfg.name)
            .replace(/{\$appDesc}/, cfg.desc)
            .replace(/{\$emailSupport}/, cfg.author.email)
            .replace(/{\$url}/, cfg.author.href)
    );

    // Compile config file for Cordova plugins
    fs.writeFileSync(
        './plugins/fetch.json',

        fs.readFileSync('./plugins/fetch.json', { encoding: 'utf8' })
            .replace(/"APP_ID": "(\d+)"/, '"APP_ID": "' + cfg.fbAppId + '"')
            .replace(/"APP_NAME": "(.*?)"/, '"APP_NAME": "' + cfg.name + '"')
    );

    fs.writeFileSync(
        './current.json',

        JSON.stringify({
            projectId: projectId,
            appName: cfg.name,
            version: appVersion
        })
    );
};

var assembleAndroid = function(appFileName) {
    if (sh.exec('ionic build android --release').code !== 0) {
        throw "Failed building Android version of " + appFileName;
    }

    fs.createReadStream('./platforms/android/build/outputs/apk/android-release-unsigned.apk')
        // TODO: sign the .apk
        .pipe(fs.createWriteStream('./tmp/release/android/' + appFileName + '.apk'));
};

var assembleIos = function(appFileName, projectName) {
    if (
        sh.exec('ionic build ios --release --device').code !== 0
         || sh.exec(
             'xcrun -sdk iphoneos' +
             ' PackageApplication "platforms/ios/build/device/' + projectName + '.app"' +
             ' -o "tmp/release/ios/' + appFileName + '.ipa"'
         ).code !== 0
    ) {
        throw "Failed building iOS version of " + appFileName;
    }
};

gulp.task('lt', function() {
    switchFlavor('lt.vertex.flirtas');
});

gulp.task('lv', function() {
    switchFlavor('lt.vertex.flirts');
});

gulp.task('pl', function() {
    switchFlavor('lt.vertex.flirtak');
});

gulp.task('hr', function() {
    switchFlavor('lt.vertex.flertik');
});

gulp.task('en', function() {
    switchFlavor('me.vertex.hotvibes');
});

gulp.task('assemble', function() {
    var latestGitVersionTag = sh.exec('git describe --abbrev=0', { silent: true }).output,
        versionData = latestGitVersionTag.match(/^v?(\d+)\.(\d+)(?:\.(\d+))?/),
        versionMajor = parseInt(versionData[1]),
        versionMinor = parseInt(versionData[2]),
        versionPatch = versionData[3] ? parseInt(versionData[3]) : 0;

    // Create dirs for release
    sh.mkdir('-p', 'tmp/release/android');
    sh.mkdir('-p', 'tmp/release/ios');

    Object.keys(buildVariants).forEach(function(projectId) {
        var majorVersion = (projectId == 'me.vertex.hotvibes' ? versionMajor+1 : versionMajor),
            appVersion = majorVersion + '.' + versionMinor + '.' + versionPatch,
            appFileName = projectId + '-v' + appVersion;

        switchFlavor(projectId, appVersion);

        // Compile the distributables:
        gutil.log('Assembling ' + gutil.colors.red(appFileName) + '..\n');
        assembleAndroid(appFileName);
        assembleIos(appFileName);
    });
});

gulp.task('assemble-android', function() {
    var currentVariant = require('./current.json'),
        appFileName = currentVariant.projectId + '-v' + currentVariant.version;

    assembleAndroid(appFileName);
});

gulp.task('assemble-ios', function() {
    var currentVariant = require('./current.json'),
        appFileName = currentVariant.projectId + '-v' + currentVariant.version;

    assembleIos(appFileName, currentVariant.appName);
});

gulp.task('translate-extract', function() {
    return gulp.src([ config.pathHtml, config.pathJs ])
        .pipe(gettext.extract('all.po', { markerName: '__' }))
        .pipe(gulp.dest('./tmp/i18n/'));
});

gulp.task('translate', ['translate-extract'], function() {
    var locales = ['lt_LT', 'en_US', 'lv_LV', 'ru_RU', 'pl_PL', 'hr_HR'];
    var deferred = q.defer();
    var finished = 0;

    sh.mkdir('-p', 'www/i18n/');

    locales.forEach(function(loc) {
        fs.createReadStream('./tmp/i18n/all.po')
            .pipe(request.post({
                // FIXME: use live url
                url: 'http://vertex-flirtas-jm.vagrantshare.com/install/translations/' + loc,
                headers: {
                    'Lc-Debug': '9K^Sa7Rslu@Q31vzCW3E%cYEflU*4ZBd'
                }
            }, function(err, res) {
                if (!res.statusCode) {
                    console.error(loc + ': Failed.', err, res);
                }

                if (res.statusCode != 200) {
                    console.error(loc + ': Failed. Back-end returned: ' + res.statusCode + ' ' + res.statusMessage);
                }

                gutil.log(loc + ': done');
                finished++;

                if (finished >= locales.length) {
                    deferred.resolve();
                }
            }))
            .pipe(fs.createWriteStream('./www/i18n/' + loc.substr(0, 2) + '.json'))
    });

    return deferred.promise;
});

gulp.task('default', ['sass']);

gulp.task('sass', function (done) {
    gulp.src('./scss/ionic.app.scss')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(gulp.dest('./www/css/'))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({extname: '.min.css'}))
        .pipe(gulp.dest('./www/css/'))
        .on('end', done);
});

gulp.task('watch', function () {
    gulp.watch(config.pathScss, ['sass']);
});

gulp.task('install', ['git-check'], function () {
    return bower.commands.install()
        .on('log', function (data) {
            gutil.log('bower', gutil.colors.cyan(data.id), data.message);
        });
});

gulp.task('git-check', function (done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }
    done();
});