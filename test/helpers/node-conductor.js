const SwarmEventBus = require('../../')

const busName = 'ljr-swarm-automation'

const node = new SwarmEventBus(busName)
setInterval(() => {
  console.log('beat')
  node.emit('beat')
}, 1000)
