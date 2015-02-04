#Usage

var Walker = require('tx-walker')
var walker = new Walker({
  batchSize: 20, // optional
  throttle: 1000 // optional
})

var numBlocks = 0
walker.start(100000) // block height
walker.on('block', function(block) {
  // i want to do bad things to block
});

walker.on('tx', function(tx) {
  // i want to do bad things to tx
});

// emitted after the last 'tx' event of a block, unless the walker is stopped in the middle of the block
walker.on('blockend', function() {
  if (++numBlocks === 10) walker.stop()
})