var blockstream = require('./lib/blockstream')
var toTxs = require('./lib/toTxs')
var dataTxsOnly = require('./lib/dataTxsOnly')
var getData = require('./lib/getData')
var combine = require('stream-combiner2')

function txstream (options) {
  return combine(
    blockstream(options),
    toTxs()
  )
}

function datatxstream (options) {
  return combine(
    txstream(options),
    dataTxsOnly()
  )
}

function datastream (options) {
  return combine(
    datatxstream(options),
    getData()
  )
}

module.exports = {
  streams: {
    blocks: blockstream,
    txs: txstream,
    dataTxs: datatxstream,
    data: datastream
  }
}
