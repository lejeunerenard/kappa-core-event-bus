const { EventEmitter } = require('events')
const swarm = require('hyperswarm')
const crypto = require('crypto')
const kappa = require('kappa-core')
const hypercore = require('hypercore')
const multifeed = require('multifeed')
const ram = require('random-access-memory')
const pump = require('pump')
const assert = require('assert')
const debug = require('debug')

const EVENT_BUS_NS = 'event-bus'
const d = {
  swarm: debug(`${EVENT_BUS_NS}:swarm`),
  node: debug(`${EVENT_BUS_NS}:node`),
  events: debug(`${EVENT_BUS_NS}:events`)
}

module.exports = class KappaCoreEventBus {
  constructor (name, opt = {}) {
    opt = Object.assign({
      storage: ram,
      tail: false,
      download: true,
      live: true,
      networkTimeoutMS: 10 * 60 * 1000 // 10 mins
    }, opt)

    assert.ok(name, 'name not defined')
    // TODO Maybe assert that storage is a string or implements the storage interface

    const mf = multifeed(opt.storage, {
      valueEncoding: 'json',
      hypercore, // Use installed version
      sparse: opt.tail // Tail requires sparse
    })
    const core = kappa(null, { multifeed: mf })

    const sw = swarm()
    if ('port' in opt) {
      sw.listen(opt.port)
    }

    this.loaded = new Promise((resolve, reject) => {
      core.writer('local', (err, feed) => {
        if (err) return reject(err)

        this.feed = feed
        d.node('my feed', feed.key.toString('hex'))

        core.ready(() => {
          const topic = crypto.createHash('sha256')
            .update(name)
            .digest()

          // Join swarm
          sw.join(topic, {
            lookup: true,
            announce: true
          })

          sw.on('connection', (connection, info) => {
            d.swarm('Peer Found', sw.connections.size + ' total')

            let isInitiator = info.client
            let stream = core.replicate(isInitiator, { live: this.live, download: this.download })

            pump(connection, stream, connection, (err) => {
              if (err) { d.swarm('ERROR', err) }
            })
          })

          let networkLostTimeout = null
          sw.on('disconnection', (socket, info) => {
            clearTimeout(networkLostTimeout)

            if (sw.connections.length === 0) {
              networkLostTimeout = setTimeout(() => {
                console.error('Network lost! I have no peers.')
                process.exit(1)
              })
            }
          })

          // --- Send events from feed ---
          // Current loaded feeds
          for (let feed of core.feeds()) {
            this.feedToEvents(feed)
          }

          // Future feeds
          mf.on('feed', (feed, name) => {
            feed.update(() => {
              this.feedToEvents(feed)
            })
          })

          resolve()
        })
      })
    })

    // Local bus
    const bus = new EventEmitter()

    Object.assign(this, { sw, name, core, bus, live: opt.live, tail: opt.tail, download: opt.download })
  }

  feedToEvents (feed) {
    feed.createReadStream({
      live: this.live,
      tail: this.tail
    })
      .on('data', (msg) => {
        let { event, data } = msg
        d.events('from feed ', feed.key.toString('hex').substring(0, 10), 'event', event, data)
        this.bus.emit(event, ...data)
      })
  }

  on (event, cb) {
    assert(typeof event === 'string', 'event must be a string')
    assert(typeof cb === 'function', 'second argument must be a callback function')

    this.bus.on(event, (data) => cb(data))
  }

  emit (event, ...args) {
    assert(typeof event === 'string', 'event must be a string')

    this.loaded.then(() => {
      d.events('emit', this.feed.key.toString('hex').substring(0, 10), 'event', event, args)

      this.feed.append({
        event,
        data: args,
        timestamp: new Date()
      })
    })
  }
}
