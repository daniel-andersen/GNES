var gulp = require('gulp');
var connect = require('gulp-connect');
var livereload = require('gulp-livereload');
var pug = require('gulp-pug');
var less = require('gulp-less');
var minifyCSS = require('gulp-csso');
var coffee = require('gulp-coffee');

gulp.task('webserver', function() {
  connect.server({
    port: 8000,
    livereload: true,
    root: ['.', 'build']
  });
});

gulp.task('css', function() {
  gulp.src('./css/**/*.less')
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(gulp.dest('build/css'))
    .pipe(livereload());
});

gulp.task('html', function() {
  gulp.src('html/**/*.html')
    .pipe(pug())
    .pipe(gulp.dest('build/html'))
    .pipe(livereload());
});

gulp.task('coffee', function() {
  gulp.src('./src/**/*.coffee')
    .pipe(coffee({bare: true}))
    .pipe(gulp.dest('build/src'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('css/**/*.less', ['css']);
  gulp.watch('html/**/*.html', ['html']);
  gulp.watch('src/**/*.coffee', ['coffee']);
})

gulp.task('default', ['css', 'html', 'coffee']);
gulp.task('serve', ['default', 'webserver', 'watch']);
