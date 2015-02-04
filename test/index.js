var walkerFixtures = require('./fixtures')
var test = require('tape')
var Walker = require('../')

test('loads blocks and txs', function(t) {
  t.plan(walkerFixtures.blocks.length + walkerFixtures.txs.length + 1);

  var walker = new Walker({
    batchSize: 5,
    throttle: 2000
  });

  var txIdx = 0;
  var blockIdx = 0;
  var startBlockHeight = 100000;
  var i = 0;
  var j = 0;
  walker.on('block', verifyBlock);
  walker.on('blockend', function() {
    if (i === 10) {
      walker.stop()

      // can't start once stopped
      t.throws(walker.start.bind(walker), /dead/, 'can\'t restart once stopped')
    }
  })

  walker.on('tx', verifyTx);
  walker.start(startBlockHeight);

  function verifyBlock(block) {
    t.equal(block.toHex(), walkerFixtures.blocks[i++]);
  }

  function verifyTx(tx) {
    t.equal(tx.toHex(), walkerFixtures.txs[j++]);
  }
});

// test('start / stop / start / stop', function(t) {
//   t.plan(walkerFixtures.blocks.length + walkerFixtures.txs.length)

//   var walker = new Walker({
//     batchSize: 5,
//     throttle: 2000
//   })

//   var startBlockHeight = 100005
//   var i = 0
//   var j = 0
//   walker.on('block', verifyBlock)
//   walker.on('blockend', function() {
//     if (i >= 10) walker.stop()
//   })

//   walker.on('tx', saveTx);
//   walker.start(startBlockHeight);

//   function verifyBlock(block) {
//     t.equal(block.toHex(), walkerFixtures.blocks[i++])
//   }

//   function saveTx(tx) {
//     t.equal(tx.toHex(), walkerFixtures.txs[j++])
//     walker.stop()
//     setTimeout(function() {
//       walker.start()
//     }, 100)
//   }
// });