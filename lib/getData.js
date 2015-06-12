
'use strict'

var through2 = require('through2')
var bitcoin = require('bitcoinjs-lib')

module.exports = function getData() {
  return through2.obj(function (txInfo, enc, done) {
    txInfo.tx.outs.some(function (out) {
      if (bitcoin.scripts.isNullDataOutput(out.script)) {
        this.push({
          height: txInfo.height,
          tx: txInfo.tx,
          data: out.script.chunks[1]
        })

        return true
      }
    }, this)

    done()
  })
}
