var gulp = require('gulp'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass');

var js = './src/js/',
    files = [
    js + 'util.js',
    js + 'signals.js',
    js + 'list.js',
    js + 'animation.js',
    js + 'view3d.js',
    js + 'player.js',
    js + 'card.js',
    js + 'deck.js',
    js + 'game.js'
];

gulp.task('concat', function(){
    gulp.src(files)
        .pipe(concat('build.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('sass', function () {
    gulp.src('./src/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('default', ['concat'], function(){
    gulp.watch(js + '*.js', function(){
        gulp.run('concat');
    });
    gulp.watch('./src/scss/*.scss', function(){
        gulp.run('sass');
    });
});
