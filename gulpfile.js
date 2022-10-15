/*
 * gulpfile.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */


const gulp = require('gulp');

const { series, parallel } = require('gulp');
const { src, dest } = require('gulp');

const del  = require('del');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');

// clean

gulp.task('clean', function () {
    return del([
      'll.min.js',      
      'll_libs.min.js',
      'index.min.js',
      'scene.min.js',      
    ]);
});

gulp.task('clean_release', function () {
    return del([
      'release/*.js',
      'release/*.html',
      'release/*.ico',
      'release/css',
      'release/docs',
      'release/img',
      'release/libs'
    ]);
});

gulp.task('clean_assets', function () {
    return del([
      'release/assets',            
    ]);
});

// build

function build_ll(){
    return src('js/**/*')        
        .pipe(concat('ll.min.js'))
        .pipe(uglify())
        .pipe(dest('.'));
}

function build_ll_libs(){
    return src('libs/tween/Tween.js')
        .pipe(src('libs/graphlib/graphlib.js'))
        .pipe(src('libs/kd-tree/kdTree.js'))
        .pipe(concat('ll_libs.min.js'))
        .pipe(uglify())
        .pipe(dest('.'));
}

function build_scene(){
    return src('scene.js')
        .pipe(concat('scene.min.js'))
        .pipe(uglify())        
        .pipe(dest('.'));
}

function build_index(){
    return src('index.js')
        .pipe(concat('index.min.js'))
        .pipe(uglify())        
        .pipe(dest('.'));
}

function copy_index_html(){
    return src('index.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest('./release')); // The destination for the file
}

function copy_scene_html(){
    return src('scene.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest('./release')); // The destination for the file
}

/*
function build_xxx(){
    return src('xxx.js')
        .pipe(concat('xxx.min.js'))
        .pipe(uglify())        
        .pipe(dest('.'));
}
*/

// copy to release folder

function copy_from_to(from, to){
    return src(from).pipe(dest(to));
}

function copy_ll(){
    return copy_from_to('ll.min.js', './release');
}

function copy_ll_libs(){
    return copy_from_to('ll_libs.min.js', './release');
}

function copy_scene(){
    return copy_from_to('scene.min.js', './release');
}

function copy_index(){
    return copy_from_to('index.min.js', './release');
}


function copy_favicon(){    
    return copy_from_to('favicon.ico', './release');
}


function copy_docs(){
    return copy_from_to('docs/**/*', 'release/docs');    
}

function copy_css(){
    return copy_from_to('css/**/*', 'release/css');
}

function copy_img(){
    return copy_from_to('img/**/*', 'release/img');
}


const build_lightline = parallel(build_ll, build_ll_libs, build_scene, build_index);

const copy_lightline = parallel(copy_css, copy_img, copy_docs, 
                        copy_ll, copy_ll_libs, copy_scene, copy_index,  
                        copy_favicon, 
                        copy_index_html, 
                        copy_scene_html);



// exports

gulp.task('clean', gulp.series('clean'));
gulp.task('clean_release', gulp.series('clean_release'));
gulp.task('clean_assets', gulp.series('clean_assets'));
gulp.task('clean_all', gulp.parallel('clean', 'clean_release', 'clean_assets'));

//exports.build = series(gulp.series('clean'), build_lightline);
exports.build = series(build_lightline);
exports.build_release = series(gulp.parallel('clean', 'clean_release'), build_lightline, copy_lightline);

/*
exports.build_ll = build_ll;
exports.build_ll_libs = build_ll_libs;

exports.build_scene = build_scene;
exports.build_viza_scene = build_viza_scene;

exports.build_index = build_index;
exports.build_viewer = build_viewer;
exports.build_wrxspace = build_wrxspace;
exports.build_viza = build_viza;

exports.build_product_tour = build_product_tour;
exports.build_utils = build_utils;
*/

exports.default = exports.build;

