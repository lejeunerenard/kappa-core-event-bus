const SwarmEventBus = require('../../')

const busName = 'ljr-swarm-automation'

const node = new SwarmEventBus(busName, { tail: true })
node.on('beat', () => {
  console.log('play note')
})
