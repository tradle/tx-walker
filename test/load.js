var path = require('path');
var fs = require('fs');
var Cursor = require('../');
var blocks = [];
var txs = [];
var cursor = new Cursor({
  networkName: 'bitcoin',
  batchSize: 5,
  throttle: 2000
});

var txIdx = 0;
var blockIdx = 0;
var startBlockHeight = 100000;
cursor.on('block', saveBlock);
cursor.on('blockend', function() {
  if (blocks.length === 10) cursor.stop();
})

cursor.on('tx', saveTx);
cursor.on('stop', function() {
  var json = JSON.stringify({
    blocks: blocks,
    txs: txs
  }, null, 2)

  fs.writeFile(path.join(__dirname + '/fixtures.json'), json, function(err) {
    // console.log(err || 'done');
    if (err) console.error(err);
  })
});

cursor.start(startBlockHeight);

function saveBlock(block) {
  blocks.push(block.toHex ? block.toHex() : block);
}

function saveTx(tx) {
  txs.push(tx.toHex ? tx.toHex() : tx);
}