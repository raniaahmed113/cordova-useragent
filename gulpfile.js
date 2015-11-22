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
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream'),
    merge = require('merge-stream'),
    upload = require('gulp-upload'),
    q = require('q');

var config = {
    pathScss: [
        './scss/**/*.scss'
    ],
    pathHtml: [
        './www/templates/**/*.html'
    ]
};

gulp.task('translate-extract', function() {
    return gulp.src(config.pathHtml)
        .pipe(gettext.extract('all.po'))
        .pipe(gulp.dest('./tmp/i18n/'));
});

gulp.task('translate', ['translate-extract'], function() {
    var locales = ['en_US', 'lt_LT']; // FIXME: read list of locales from config
    var deferred = q.defer();
    var finished = 0;

    locales.forEach(function(loc) {
        fs.createReadStream('./tmp/i18n/all.po')
            .pipe(request.post({
                // FIXME: use live url
                url: 'http://vertex-flirtas-jm.vagrantshare.com/install/translations/' + loc,
                headers: {
                    'Lc-Debug': '9K^Sa7Rslu@Q31vzCW3E%cYEflU*4ZBd'
                }
            }, function() {
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

var preprocess = require('gulp-preprocess');
gulp.task('dev', function () {
    gulp.src('./const/config.js')
        .pipe(preprocess({context: {ENV: 'DEVELOPMENT', DEBUG: true}}))
        .pipe(gulp.dest('./www/js/'));
});

gulp.task('prod', function () {
    gulp.src('./const/config.js')
        .pipe(preprocess({context: {ENV: 'PRODUCTION'}}))
        .pipe(gulp.dest('./www/js/'));
});