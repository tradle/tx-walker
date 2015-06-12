
'use strict'

var through2 = require('through2')

module.exports = function toTxs() {
  return through2.obj(function (block, enc, done) {
    block.transactions.forEach(this.push, this)
    done()
  })
}
