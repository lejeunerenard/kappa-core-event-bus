const SwarmEventBus = require('../../')

const busName = 'ljr-swarm-automation'

const node1 = new SwarmEventBus(busName)
node1.on('ping', (count) => {
  console.log('ping', count)
  if (count > 0) {
    node1.emit('pong', count - 1)
  }
})

const node2 = new SwarmEventBus(busName)
node2.on('pong', (count) => {
  console.log('pong', count)
  if (count > 0) {
    node2.emit('ping', count - 1)
  }
})

node1.emit('pong', 6)
