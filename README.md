# Kappa Event Bus

A [kappa-core](https://github.com/kappa-db/kappa-core) based event bus node for
sending messages to all nodes on a peer-to-peer network. This creates a network
wide event emitter with eventual consistency.

## Usage

Node A

```javascript
const EventBus = require('@lejeunerenard/kappa-core-event-bus')

const bus = new EventBus('network-name')

const data = {
  foo: 'bar'
}

bus.emit('event-name', data)
```

Node B

```javascript
const EventBus = require('@lejeunerenard/kappa-core-event-bus')

const bus = new EventBus('network-name')
bus.on('event-name', (data) => {
  console.log('foo', data.foo) // prints: bar
})
```

## License

ISC
