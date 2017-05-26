var gulp      = require('gulp'),
    copy      = require('gulp-copy'),
    rename    = require('gulp-rename'),
    rm        = require('gulp-rm'),
    clean     = require('gulp-clean'),
    expect    = require('gulp-expect-file');

gulp.task('themes', ["light-theme-rm", "dark-theme-rm"]);

// ==============================================================================
//
//  Light theme tasks
//
// ==============================================================================
gulp.task('light-theme-rm', [ "light-theme-rn" ], function() {
    return gulp.src([
        "themes/light/helpers",
    ], { "read": false } ).pipe(clean({force: true}));
});

gulp.task('light-theme-rn', ["light-theme-cp"], function() {
    return gulp.src("themes/light/layouts/main.light.handlebars").
           pipe(rename("light/layouts/main.handlebars")).
           pipe(gulp.dest("./themes"));
});

gulp.task("light-theme-cp", function() {
    return gulp.src([
        "src/**/*",
    ]).pipe(gulp.dest("themes/light"));
});

// ==============================================================================
//
//  Dark theme tasks
//
// ==============================================================================
gulp.task('dark-theme-rm', [ "dark-theme-rn" ], function() {
    return gulp.src([
        "themes/dark/helpers",
    ], { "read": false } ).pipe(clean({force: true}));
});

gulp.task('dark-theme-rn', ["dark-theme-cp"], function() {
    return gulp.src("themes/dark/layouts/main.dark.handlebars").
           pipe(rename("dark/layouts/main.handlebars")).
           pipe(gulp.dest("./themes"));
});

gulp.task("dark-theme-cp", function() {
    return gulp.src([
        "src/**/*",
    ]).pipe(gulp.dest("themes/dark"));
});


gulp.task('dark', [ "dark-theme-rn" ], function (gulpCallBack){
    var spawn  = require('child_process').spawn;
    var yuidoc = spawn('yuidoc', ['-t', './themes/dark',
                                  '-H', './src/helpers/helpers.js',
                                  "-o", "apidoc-dark",
                                  "-n",
                                  './example/' ], { stdio: 'inherit' });

    yuidoc.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: yuidoc process exited with code: ' + code);
    });
});

gulp.task('light', [ "light-theme-rn" ],  function (gulpCallBack){
    var spawn  = require('child_process').spawn;
    var yuidoc = spawn('yuidoc', ['-t', './themes/light',
                                  "-o", "apidoc-light",
                                  "-n",
                                  './example/' ], { stdio: 'inherit' });

    yuidoc.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: yuidoc process exited with code: ' + code);
    });
});

gulp.task('default', ['themes'] );

gulp.task('watch', function() {
    gulp.watch("src/**/*", ['themes']);
});

