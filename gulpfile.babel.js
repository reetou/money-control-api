import gulp from 'gulp';
import ts from 'gulp-typescript';
import exec from 'gulp-exec';

gulp.task('ts', () => {
  return gulp.src('*/*.ts')
    .pipe(ts({
      noImplicitAny: false
    }))
    .pipe(gulp.dest('build'))
});

gulp.task('default', ['ts'], () => {
  gulp.watch('src/*.ts', ['ts'])
});