
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
  var self = this

  EventEmitter.call(this)

  options = options || {}
  this._networkName = options.networkName || 'bitcoin'
  this._blockchain = options.api || new Blockchain(this._networkName)
  this._batchSize = options.batchSize || 20
  this._throttle = options.throttle || 2000
  this._running = false

  this.on('tx', this._onTx)
}

inherits(TransactionWalker, EventEmitter)

TransactionWalker.prototype.start = function(height) {
  var self = this

  if (this._stopped) throw new Error('I\'m dead, create a new instance')

  if (typeof height === 'undefined') height = this._fromHeight;
  else this.from(height);

  assert(typeof height === 'number', 'Starting height is required')
  this._height = height - 1

  if (this._running) return
  this._running = true

  ;(function loop() {
    if (!self._running) return

    self._processNextBatch(loop)
  })()

  return this;
}

TransactionWalker.prototype._processNextBatch = function(cb) {
  var self = this
  var heights = []
  var batchSize = this._batchSize
  if ('_toHeight' in this) {
    batchSize = Math.min(batchSize, this._toHeight - this._height)
  }

  for (var i = 1; i <= batchSize; i++) {
    heights.push(this._height + i)
  }

  if (!heights.length) return this.stop()

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
  if (!block) return this.stop()

  if (typeof block === 'string') block = bitcoin.Block.fromHex(block)
  else if (Buffer.isBuffer(block)) block = bitcoin.Block.fromBuffer(block)

  this.emit('blockstart', block, this._height)
  this.emit('block', block, this._height)

  var txs = block.transactions

  for (var i = 0; i < txs.length; i++) {
    this.emit('tx', txs[i])
    if (!this._running) return
  }

  this.emit('blockend', block, this._height)
  return true
}

TransactionWalker.prototype._onTx = function(tx) {
  if (!this.listeners('OP_RETURN').length) return

  for (var i = 0; i < tx.outs.length; i++) {
    var out = tx.outs[i];
    if (bitcoin.scripts.isNullDataOutput(out.script))
      this.emit('OP_RETURN', tx, out.script.chunks[1]);
  }
}

TransactionWalker.prototype.from = function(height) {
  this._fromHeight = height;
  return this;
}

TransactionWalker.prototype.to = function(height) {
  this._toHeight = height;
  return this;
}

TransactionWalker.prototype.stop = function() {
  this._stopped = true
  this._running = false
  this.emit('stop');
  return this;
}

module.exports = TransactionWalker
