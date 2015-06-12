
'use strict'

var through2 = require('through2')
var bitcoin = require('bitcoinjs-lib')

module.exports = function getData() {
  return through2.obj(function (tx, enc, done) {
    tx.outs.some(function (out) {
      if (bitcoin.scripts.isNullDataOutput(out.script)) {
        this.push(tx)
        return true
      }
    }, this)

    done()
  })
}
