
'use strict'

var typeforce = require('typeforce')
var through2 = require('through2')
var bitcoin = require('bitcoinjs-lib')

/**
 *  options             {Object}
 *  options.api         {Object} common-blockchain API
 *  options.networkName {String} (optional, default: 'bitcoin')
 *  options.batchSize   {Number} (optional, default: 20)
 *    how many blocks to ask for in a request to whatever the provider is
 *  options.throttle    {Number} (optional, default: 2000)
 *    how many milliseconds to wait between requests
 */
module.exports = function blockstream(options) {
  typeforce({
    api: 'Object'
  }, options)

  var batchSize = options.batchSize || 20
  var heightsQueue = []
  var networkName = options.networkName || 'bitcoin'
  var blockchain = options.api
  var throttle = options.throttle || 2000
  var lastCalled = 0

  return through2.obj({
    highWaterMark: batchSize,
  }, function transform(height, enc, done) {
    heightsQueue.push(height)
    if (heightsQueue.length >= batchSize) {
      processBatch.call(this, heightsQueue.slice(), done)
      heightsQueue.length = 0
    } else {
      done()
    }
  })

  function processBatch (heights, cb) {
    var self = this
    var now = Date.now()
    var wait = throttle - (now - lastCalled)
    if (wait > 0) {
      return setTimeout(function () {
        processBatch.call(self, heights, cb)
      }, wait)
    }

    lastCalled = now
    var sorted = heights.sort(function (a, b) {
      return a - b
    })

    blockchain.blocks.get(heights, function(err, blocks) {
      if (err) {
        cb(err, chunk)
        return cb()
      }

      var passed = heights.every(function (h) {
        var idx = sorted.indexOf(h)
        var block = blocks[idx]
        if (typeof block === 'string') {
          block = bitcoin.Block.fromHex(block)
        }
        else if (Buffer.isBuffer(block)) {
          block = bitcoin.Block.fromBuffer(block)
        }
        else if (!block.toHex) {
          cb(new Error('invalid block: ' + block), h)
          return false
        }

        self.push({
          height: h,
          block: block
        })

        return true
      })

      if (passed) cb()
    })
  }
}
