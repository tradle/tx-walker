
'use strict'

var through2 = require('through2')
var bitcoin = require('bitcoinjs-lib')

module.exports = function toTxs() {
  return through2.obj(function (blockInfo, enc, done) {
    blockInfo.block.transactions.forEach(function (tx) {
      this.push({
        height: blockInfo.height,
        tx: tx
      })
    }, this)

    done()
  })
}
