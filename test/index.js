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

test('scan blockchain for public data', function(t) {
  var from = 321997;
  var to = 322003;

  t.plan(3 + (to - from + 1) * 2);

  var fileKeys = [
    '8e2b8d39cf77de22a028e26769003b29a43348ac',
    'f89ad154207d45ef031601fe50b270ca27a811f3'
  ];

  var fileKeysSeen = [];

  new Walker({
      networkName: 'testnet',
      batchSize: 5,
      throttle: 2000
    })
    .from(from)
    .to(to)
    .on('blockstart', t.pass)
    .on('blockend', t.pass)
    .on('stop', t.pass)
    .on('OP_RETURN', function(tx, buf) {
      if (!buf || fileKeysSeen.length === fileKeys.length) return;

      if (buf.slice(0, 6).toString() === 'tradle') {
        // cut off "tradle" + 1 byte
        var data = buf.slice(7).toString('hex');
        t.notEqual(fileKeys.indexOf(data), -1);
        fileKeysSeen.push(fileKeysSeen);
      }
    })
    .start()
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
