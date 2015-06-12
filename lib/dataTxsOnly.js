
'use strict'

var through2 = require('through2')
var bitcoin = require('bitcoinjs-lib')

module.exports = function dataTxsOnly () {
  return through2.obj(function (txInfo, enc, done) {
    txInfo.tx.outs.some(function (out) {
      if (bitcoin.scripts.isNullDataOutput(out.script)) {
        this.push(txInfo)
        return true
      }
    }, this)

    done()
  })
}
