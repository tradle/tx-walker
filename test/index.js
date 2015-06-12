
var test = require('tape')
var through2 = require('through2')
var Fakechain = require('blockloader/fakechain')
var streams = require('../').streams
var blockstream = streams.blocks
var txstream = streams.txs
var datatxstream = streams.dataTxs
var datastream = streams.data
var walkerFixtures = require('./fixtures')
var blockFixtures = walkerFixtures.blocks
var txFixtures = walkerFixtures.txs
var dataFixtures = walkerFixtures.data
var fakechain = new Fakechain({
  networkName: 'testnet'
})

var startBlockHeight = 100000
blockFixtures.forEach(function (b, i) {
  fakechain.addBlock(b, startBlockHeight + i)
})

function getFakeStream (streamer) {
  var stream = streamer({
    api: fakechain,
    networkName: 'testnet',
    batchSize: 5,
    throttle: 2000
  })

  for (var i = 0; i < blockFixtures.length; i++) {
    stream.write(startBlockHeight + i)
  }

  stream.end()
  return stream
}

test('streams blocks', function(t) {
  t.plan(blockFixtures.length);

  var blockIdx = 0
  getFakeStream(blockstream)
    .pipe(through2.obj(function (blockInfo, enc, done) {
      t.equal(blockInfo.block.toHex(), walkerFixtures.blocks[blockIdx++]);
      done()
    }))
});

test('streams txs', function(t) {
  t.plan(txFixtures.length);
  var txIdx = 0
  getFakeStream(txstream)
    .pipe(through2.obj(function (txInfo, enc, done) {
      t.equal(txInfo.tx.toHex(), txFixtures[txIdx++]);
      done()
    }))
});

test('streams data txs', function(t) {
  t.plan(dataFixtures.length);
  var dataIdx = 0
  getFakeStream(datastream)
    .pipe(through2.obj(function (dataInfo, enc, done) {
      t.equal(dataInfo.data.toString('hex'), dataFixtures[dataIdx++]);
      done()
    }))
});
