
'use strict'

var typeforce = require('typeforce')
var Readable = require('readable-stream')
var bitcoin = require('bitcoinjs-lib')
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

  var stream = new Readable({
    objectMode: true
  })

  stream._read = noop

  blockchain.addresses.transactions(options.addresses, options.height || undefined, function (err, txs) {
    txs.forEach(function (txInfo) {
      stream.push({
        height: txInfo.blockHeight,
        blockId: txInfo.blockId,
        confirmations: txInfo.__confirmations,
        tx: bitcoin.Transaction.fromHex(txInfo.txHex)
      })
    }, stream)
    stream.push(null)
  })

  return stream
}
