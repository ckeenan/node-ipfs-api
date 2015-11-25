'use strict'

const isNode = !global.window
const fs = require('fs')

const path = require('path')
const async = require('async')

const testFiles = require('./test-files.json')
const testFilesPath = path.resolve(__dirname, 'files')

let testFileHashes = {}
let testProfiles = {}

const toSortedArr = (obj) => {
  let keys = Object.keys(obj).map((key) => { return +key })
  return keys.map((key) => {
    let o = {}
    o[key] = obj[key.toString()]
    return o
  })
}

describe('ipfs cat performance', () => {
  before(done => {
    if (!isNode) {
      return done()
    }

    async.parallel(testFiles.map(fileName => {
      return (cb) => {
        let testFile
        let testFilePath = path.resolve(testFilesPath, fileName)

        testFile = require('fs').readFileSync(testFilePath)

        /*
        if (isNode) {
          testFile = require('fs').readFileSync(testFilePath)
        } else {
          testFile = require('raw!' + testFilePath)
        }
        */

        let buf = new Buffer(testFile)

        apiClients['a'].add(buf, (err, res) => {
          if (!err) {
            testFileHashes[fileName] = res[0].Hash
          }
          cb(err)
        })
      }
    }), (err) => {
      if (err) throw err
      done()
    })
  })

  it('performance tests', done => {
    if (!isNode) return done()

    async.series(testFiles.map(fileName => {
      return (cb) => {
        let hash = testFileHashes[fileName]
        let startTime = new Date().getTime()

        apiClients['b'].cat(hash, (err, res) => {
          testProfiles[fileName] = 0
          if (err) {
            throw err
          }

          let buf = ''
          res
            .on('error', err => { throw err })
            .on('data', data => buf += data)
            .on('end', () => {
              let endTime = new Date().getTime()
              testProfiles[fileName] = endTime - startTime
              cb()
            })
        })
      }
    }), (err) => {
      if (err) { throw err }
      let time = new Date().getTime() / 1000 | 0
      fs.writeFileSync(__dirname + '/results/' + time + '.json', JSON.stringify(toSortedArr(testProfiles), null, 4))
      done()
    })
  })
})
