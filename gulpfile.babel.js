'use strict';

// Gulp require (global)
import gulp     from 'gulp';
import watch    from 'gulp-watch';
import sass     from 'gulp-sass';
import cssmin   from 'gulp-minify-css';
import rename   from 'gulp-rename';
import concat   from 'gulp-concat';
import uglify   from 'gulp-uglify';
import htmlmin  from 'gulp-htmlmin';
import useref   from 'gulp-useref';
import rigger   from 'gulp-rigger';
import plumber  from 'gulp-plumber';
import babel    from 'gulp-babel';
import rimraf   from 'rimraf';

// helpful path object
let path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        lintpath: 'src/js/partials/*.js',
        style: 'src/style/main.scss'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/style/**/*.scss'
    },
    clean: './build'
};


// Gulp Tasks

gulp.task('html:build', () => {
    gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest(path.build.html));
});

gulp.task('js:build', () => {
    gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(path.build.js))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js));
});

gulp.task('style:build', () => {
    gulp.src(path.src.style)
        .pipe(plumber())
        .pipe(sass())
        .pipe(gulp.dest(path.build.css))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(cssmin())
        .pipe(gulp.dest(path.build.css));
});

gulp.task('build', [
    'html:build',
    'js:build',
    'style:build'
]);

gulp.task('watch', () => {
    watch([path.watch.html], () => {
        gulp.start('html:build');
    });
    watch([path.watch.style], () => {
        gulp.start('style:build');
    });
    watch([path.watch.js], () => {
        gulp.start('js:build');
    });
});

gulp.task('clean', (cb) => {
    rimraf(path.clean, cb);
});

gulp.task('default', ['build', 'watch']);