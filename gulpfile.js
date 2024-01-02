const { src, dest, series, watch } = require('gulp')
const concat = require('gulp-concat')
const autoprefixer = require('gulp-autoprefixer')
const cleanCSS = require('gulp-clean-css')
const del = require('del')
const browserSync = require('browser-sync').create()
const sass = require('sass')
const gulpSass = require('gulp-sass')
const mainSass = gulpSass(sass)
const svgSprite = require('gulp-svg-sprite')
const svgmin = require('gulp-svgmin')
const cheerio = require('gulp-cheerio')
const replace = require('gulp-replace')
const htmlmin = require('gulp-htmlmin')
const notify = require('gulp-notify')
const uglify = require('gulp-uglify-es').default
const image = require('gulp-imagemin')
const typograf = require('gulp-typograf')
const webp = require('gulp-webp')
const plumber = require('gulp-plumber')
const map = require('gulp-sourcemaps')
const babel = require('gulp-babel')
const gulpif = require('gulp-if')
const fileInclude = require('gulp-file-include')

// Paths
const srcFolder = './src'
const buildFolder = './app'
const paths = {
  srcSvg: `${srcFolder}/img/svg/**/*.svg`,
  srcSvgSprites: `${srcFolder}/img/sprite/**/*.svg`,
  srcImgFolder: `${srcFolder}/img`,
  srcScss: `${srcFolder}/scss/**/*.scss`,
  srcJs: `${srcFolder}/js/**/*.js`,
  srcMainJs: `${srcFolder}/js/main.js`,
  resourcesFolder: `${srcFolder}/resources`,
  buildImgFolder: `${buildFolder}/img`,
  buildCssFolder: `${buildFolder}/css`,
  buildJsFolder: `${buildFolder}/js`
}

let isProd = false

const toProd = (done) => {
  isProd = true;
  done();
}

const clean = () => {
  return del([buildFolder])
}

// html
const htmlMinify = () => {
  return src(`${buildFolder}/*.html`)
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(dest(buildFolder))
}


const htmlInclude = () => {
  return src([`${srcFolder}/*.html`])
    .pipe(fileInclude({
      prefix: '@',
      basepath: '@file'
    }))
    .pipe(typograf({
      locale: ['ru', 'en-US']
    }))
    .pipe(dest(buildFolder))
}

// scss styles build
const styles = () => {
  return src(paths.srcScss)
    .pipe(map.init())
    .pipe(plumber(
      notify.onError({
        title: 'SCSS',
        message: 'Error: <%= error.message %>'
      })
    ))
    .pipe(mainSass())
    .pipe(concat('main.css'))
    .pipe(autoprefixer({
      cascade: false,
      grid: true,
      overrideBrowserslist: ["last 5 versions"]
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(map.write('/sourcemaps/'))
    .pipe(dest(paths.buildCssFolder ))
}

// scss styles Dev
const stylesDev = () => {
  return src(paths.srcScss)
    .pipe(plumber(
      notify.onError({
        title: 'SCSS',
        message: 'Error: <%= error.message %>'
      })
    ))
    .pipe(mainSass())
    .pipe(concat('main.css'))
    .pipe(dest(paths.buildCssFolder ))
}

// scripts build
const scripts = () => {
  return src([
    paths.srcMainJs,
    paths.srcJs
  ])
    .pipe(map.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(concat('app.js'))
    .pipe(uglify({
      toplevel: true
    }).on('error', notify.onError({
      title: 'JS',
      message: 'Error: <%= error.message %>'
    })))
    .pipe(map.write('/sourcemaps/'))
    .pipe(dest(paths.buildJsFolder))
}

const scriptsDev = () => {
  return src([
    paths.srcMainJs,
    paths.srcJs
  ])
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(concat('app.js'))
    .pipe(plumber(
      notify.onError({
        title: 'JS',
        message: 'Error: <%= error.message %>'
      })
    ))
    .pipe(dest(paths.buildJsFolder))
}

// images
const images = () => {
  return src([`${paths.srcImgFolder}/svg/**.svg`])
    .pipe(image())
    .pipe(dest(`${paths.buildImgFolder}/svg`))
};

// webp images
const webpImages = () => {
  return src([`${paths.srcImgFolder}/**/**.{jpg,jpeg,png}`])
    .pipe(webp({quality: 100}))
    .pipe(dest(paths.buildImgFolder))
};

// resources
const resources = () => {
  return src(`${paths.resourcesFolder}/**`)
    .pipe(dest(`${buildFolder}/resources`))
}

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: `${buildFolder}`
    },
  });

  watch(paths.srcScss, styles);
  watch(paths.srcJs, scripts);
  watch(`${srcFolder}/*.html`, htmlInclude);
  watch(`${srcFolder}/templates/*.html`, htmlInclude);
  watch(`${paths.resourcesFolder}/**`, resources);
  watch(`${paths.srcImgFolder}/svg/**.svg`, images);
  watch(`${paths.srcImgFolder}/**/**.{jpg,jpeg,png}`, webpImages);
}

exports.default = series(clean, htmlInclude, stylesDev, scriptsDev, images, webpImages, resources, watchFiles)
exports.build = series(toProd, clean, htmlInclude, styles, scripts, webpImages, resources, htmlMinify)
