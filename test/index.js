
var test = require('tape')
var through2 = require('through2')
var bitcoin = require('bitcoinjs-lib')
var uniq = require('uniq')
var Fakechain = require('blockloader/fakechain')
var streams = require('../').stream
var blockstream = streams.blocks
var txstream = streams.txs
var datatxstream = streams.dataTxs
var datastream = streams.data
var walkerFixtures = require('./fixtures')
var blockFixtures = walkerFixtures.blocks
var txFixtures = walkerFixtures.txs
var dataFixtures = walkerFixtures.data
var txAddrFixtures = walkerFixtures.txsForAddresses
var networkName = 'testnet'
var fakechain = new Fakechain({
  networkName: networkName
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

// test('streams blocks', function(t) {
//   t.plan(blockFixtures.length);

//   var blockIdx = 0
//   getFakeStream(blockstream)
//     .pipe(through2.obj(function (blockInfo, enc, done) {
//       t.equal(blockInfo.block.toHex(), walkerFixtures.blocks[blockIdx++]);
//       done()
//     }))
// });

// test('streams txs', function(t) {
//   t.plan(txFixtures.length);
//   var txIdx = 0
//   getFakeStream(txstream)
//     .pipe(through2.obj(function (txInfo, enc, done) {
//       t.equal(txInfo.tx.toHex(), txFixtures[txIdx++]);
//       done()
//     }))
// });

// test('streams data txs', function(t) {
//   t.plan(dataFixtures.length);
//   var dataIdx = 0
//   getFakeStream(datastream)
//     .pipe(through2.obj(function (dataInfo, enc, done) {
//       t.equal(dataInfo.data.toString('hex'), dataFixtures[dataIdx++]);
//       done()
//     }))
// });

// test('streams txs for addresses', function(t) {
//   t.plan(1);

//   var planned = 0
//   var txIdx = 0
//   var txs = {}
//   for (var addr in txAddrFixtures) {
//     txs[addr] = []
//   }

//   streams.txsForAddresses({
//       networkName: networkName,
//       api: fakechain,
//       addresses: Object.keys(txAddrFixtures)
//     })
//     .pipe(through2.obj(function (txInfo, enc, done) {
//       getAddresses(txInfo.tx).forEach(function (addr) {
//         if (txs[addr]) {
//           txs[addr].push(txInfo.tx.getId())
//         }
//       })

//       done()
//     }))
//     .on('data', function () {})
//     .on('end', function () {
//       t.deepEqual(txs, txAddrFixtures)
//     })
// })

test('live stream of txs for addresses', function(t) {
  t.plan(1);

  var chain = new Fakechain({ networkName: 'testnet' })

  var planned = 0
  var txIdx = 0
  var txs = {}
  for (var addr in txAddrFixtures) {
    txs[addr] = []
  }

  var stream = streams.txsForAddresses({
    live: true,
    interval: 200,
    networkName: networkName,
    api: fakechain,
    addresses: Object.keys(txAddrFixtures)
  })

  stream.pipe(through2.obj(function (txInfo, enc, done) {
      getAddresses(txInfo.tx).forEach(function (addr) {
        if (txs[addr]) {
          txs[addr].push(txInfo.tx.getId())
        }
      })

      done()
    }))
    .on('data', function () {})
    .on('end', function () {
      t.deepEqual(txs, txAddrFixtures)
    })

  blockFixtures.forEach(function (b, i) {
    setTimeout(function () {
      chain.addBlock(b, startBlockHeight + i)
      if (i === blockFixtures.length - 1) {
        stream.push(null)
      }
    }, i * 100)
  })
})

function getOutputAddresses (tx) {
  return tx.outs.reduce(function (addrs, output) {
    if (bitcoin.scripts.classifyOutput(output.script) === 'pubkeyhash') {
      var addr = bitcoin.Address
        .fromOutputScript(output.script, bitcoin.networks.testnet)
        .toString()

      addrs.push(addr)
    }

    return addrs
  }, [])
}

function getInputAddresses (tx) {
  return tx.ins.reduce(function (addrs, input) {
    if (bitcoin.scripts.classifyInput(input.script) === 'pubkeyhash') {
      var network = bitcoin.networks[networkName];
      var addr = bitcoin.ECPubKey.fromBuffer(input.script.chunks[1])
        .getAddress(network)
        .toString();

      addrs.push(addr)
    }

    return addrs
  }, [])
}

function getAddresses (tx) {
  return uniq(getOutputAddresses(tx).concat(getInputAddresses(tx)))
}
