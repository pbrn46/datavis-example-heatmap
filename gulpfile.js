var gulp = require('gulp'),
    eol = require('gulp-eol'),
    watch = require('gulp-watch'),
    concat = require('gulp-concat');


var concatFiles = ['./src/App.headers.react.js', './src/App.react.js'];

var watchFunc = function(concatFiles) {
  var watchCount = 0;
  return function () {
    watch(concatFiles, {ignoreInitial: false}, function (file) {
      gulp.start('concat-js');
    });
  };
};

gulp.task('concat-js-watch', watchFunc(concatFiles));


var concatFunc = function(concatFiles) {
  console.log("HITHIT");
  return function () {
    console.log('Running concat-js');
    gulp.src(concatFiles)
      .pipe(concat('./index.js'))
      .pipe(eol())
      .pipe(gulp.dest('./src'));
  };
};

gulp.task('concat-js', concatFunc(concatFiles));
