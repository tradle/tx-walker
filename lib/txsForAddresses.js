
'use strict'

var typeforce = require('typeforce')
var Readable = require('readable-stream')
var bitcoin = require('bitcoinjs-lib')
var deepEqual = require('deep-equal')
var noop = function () {}

/**
 *  options             {object} (optional)
 *  options.addresses   {Array} array of addresses
 *  options.networkName {String} (optional, default: 'bitcoin')
 *  options.height {Number} (optional, default: undefined) starting height
 */
module.exports = function txstream(options) {
  typeforce({
    api: 'Object',
    addresses: 'Array'
  }, options)

  var networkName = options.networkName || 'bitcoin'
  var blockchain = options.api
  var live = options.live

  var stream = new Readable({
    objectMode: true
  })

  stream.once('end', function () {
    clearInterval(interval)
  })

  stream._read = noop

  var interval
  var lastBlock = []
  var lastHeight = options.height || 0

  fetch()

  if (live) {
    interval = setInterval(fetch, options.interval || 60000)
    if (interval.unref) interval.unref()
  }

  return stream

  function fetch () {
    blockchain.addresses.transactions(options.addresses, lastHeight, function (err, txs) {
      if (err) return stream.push(null)

      if (live) {
        var maxHeight = txs.reduce(function (h, tx) {
          return Math.max(h, tx.blockHeight)
        }, lastHeight)

        lastBlock = lastBlock.filter(function (tx) {
          return tx.blockHeight === maxHeight
        })

        txs = txs.filter(function (tx) {
          return lastBlock.every(function (saved) {
            return !deepEqual(saved, tx)
          })
        })

        txs.forEach(function (tx) {
          if (tx.blockHeight === maxHeight) {
            lastBlock.push(tx)
          }
        })

        lastHeight = maxHeight
      }

      txs.forEach(function (txInfo) {
        stream.push({
          height: txInfo.blockHeight,
          blockId: txInfo.blockId,
          confirmations: txInfo.__confirmations,
          tx: bitcoin.Transaction.fromHex(txInfo.txHex)
        })
      })

      if (!live) stream.push(null)
    })
  }
}
