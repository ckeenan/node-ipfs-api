'use strict'

const gulp = require('gulp')
const Server = require('karma').Server
const $ = require('gulp-load-plugins')()
const runSequence = require('run-sequence')
const exec = require('child_process').exec
const path = require('path')
const fs = require('fs')

const config = require('./config')
const testFilePath = path.resolve(__dirname + '/../test/performance/files/')

require('./daemons')

gulp.task('test', done => {
  runSequence(
    'test:node',
    'test:browser',
    done
  )
})

gulp.task('test:node', done => {
  runSequence(
    'daemons:start',
    'addTestFiles',
    'mocha',
    'rmTestFiles',
    'daemons:stop',
    done
  )
})

gulp.task('test:browser', done => {
  runSequence(
    'daemons:start',
    'addTestFiles',
    'karma',
    'rmTestFiles',
    'daemons:stop',
    done
  )
})

gulp.task('mocha', () => {
  return gulp.src([
    'test/setup.js',
    'test/**/*.spec.js'
  ])
    .pipe($.mocha({
      timeout: config.webpack.dev.timeout
    }))
})

gulp.task('addTestFiles', (cb) => {
  console.log('creating test files...')
  exec('for i in $(seq 1 4 256); do dd if=/dev/urandom bs=1k count=$i of=' + testFilePath + '/random.$i; done', err => {
    fs.writeFileSync(__dirname + '/../test/performance/test-files.json', JSON.stringify(fs.readdirSync(testFilePath)))
    cb(err)
  })
})

gulp.task('rmTestFiles', (cb) => {
  exec('rm ' + testFilePath + '/*', err => {
    cb(err)
  })
})

gulp.task('karma', done => {
  new Server({
    configFile: __dirname + '/../karma.conf.js',
    singleRun: true
  }, done).start()
})
