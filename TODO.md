# TODO

- [ ] Fix run away tracking of feeds  
    This is a sort of 'memory leaks' such that when ephemeral nodes join they
create a feed even if they don't append / emit any events. This is not as
concerning as it is expected with the naive implementation we've done so far.
These feeds could emit just one event and then would 'need' to be stored to
maintain the multifeed entries they contributed. The problem is that these nodes
could use in memory storage and hence have a new public key for their feed each
time they spin up. If this happens 1000+ times, it can use a ton of memory on
a single node. I've done a test that resulted in `this.core.feeds().length ===
999` with each being ~4Mb of memory. And that was one node.
