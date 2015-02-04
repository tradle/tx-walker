
'use strict'

var assert = require('assert')
var Blockchain = require('cb-blockr')
var bitcoin = require('bitcoinjs-lib')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

/**
 *  options             {object} (optional)
 *  options.networkName {String} (optional, default: 'bitcoin') 
 *  options.batchSize   {Number} (optional, default: 20)
 *    how many blocks to ask for in a request to whatever the provider is
 *  options.throttle    {Number} (optional, default: 2000)
 *    how many milliseconds to wait between requests
 */
function TransactionWalker(options) {
  EventEmitter.call(this)

  options = options || {}
  this._networkName = options.networkName || 'bitcoin'
  this._blockchain = new Blockchain(this._networkName)
  this._batchSize = options.batchSize || 20
  this._throttle = options.throttle || 2000
  this._running = false
}

inherits(TransactionWalker, EventEmitter)

TransactionWalker.prototype.start = function(height) {
  var self = this
  if (this._stopped) throw new Error('I\'m dead, create a new instance')

  assert(typeof height === 'number', 'Height is required')
  this._height = height - 1

  if (this._running) return
  this._running = true

  ;(function loop() {
    if (!self._running) return

    self._processNextBatch(loop)
  })()
}

TransactionWalker.prototype._processNextBatch = function(cb) {
  var self = this
  var heights = []
  for (var i = 1; i <= this._batchSize; i++) {
    heights.push(this._height + i)
  }

  this._blockchain.blocks.get(heights, function(err, blocks) {
    if (err) {
      self.emit('error', err)
      return self.stop()
    }

    blocks.every(function(block, i) {
      self._height = heights[i]
      return self._readBlock(block)
    })

    setTimeout(cb, self._throttle)
  })
}

TransactionWalker.prototype._readBlock = function(block) {
  block = bitcoin.Block.fromHex(block)

  this.emit('blockstart', block)
  this.emit('block', block)

  var txs = block.transactions

  for (var i = 0; i < txs.length; i++) {
    this.emit('tx', txs[i])
    if (!this._running) return
  }
  
  this.emit('blockend', block)
  return true
}

TransactionWalker.prototype.stop = function() {
  this._stopped = true
  this._running = false
  this.emit('close');
}

module.exports = TransactionWalker
