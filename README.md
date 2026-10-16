# Priority Queue

A binary heap priority queue with O(1) direct decrease-key, implemented in pure ESM TypeScript-free JavaScript (standard Node.js, no dependencies).

```js
import { PriorityQueue } from './src/index.js';

const pq = new PriorityQueue();          // min-heap by default
pq.push('task-a', 5);
pq.push('task-b', 1);
pq.push('task-c', 3);

pq.decreaseKey('task-a', 0);              // 'task-a' is now the top
console.log(pq.pop());                    // { value: 'task-a', priority: 0 }
console.log(pq.pop());                    // { value: 'task-b', priority: 1 }
```

## Why this exists

Dijkstra's algorithm and A* need decrease-key: updating the priority of an element already in the queue without re-inserting it. The common workaround—re-inserting with a better priority and skipping stale entries—doubles memory and complicates skip logic. This library keeps a `Map` from value to array index so `decreaseKey` finds the node in O(1) and sifts it up in O(log n), no rebuild, no stale entries.

The trade-off: values must be unique. If you push the same value twice, it throws. This is deliberate—if the position map can't uniquely identify an entry, decrease-key is meaningless. If your domain has duplicates, wrap them in a unique object before inserting.

## Edge you will hit

`decreaseKey` is strict: the new priority must genuinely improve the element's standing (be "less" per the comparator). Passing an equal or worse priority throws, rather than silently doing nothing. For a max-heap constructed with `(a, b) => b - a`, "improve" means the new value is *larger*; the validation uses your comparator, so the semantics flip correctly.

## Exports

- `PriorityQueue` (from `src/index.js`)
  - `new PriorityQueue(comparator?)` — default `(a, b) => a - b` (min-heap)
  - `push(value, priority)` — throws on duplicate value
  - `pop()` — returns `{ value, priority }` or `undefined`
  - `peek()` — returns `{ value, priority }` or `undefined`
  - `decreaseKey(value, newPriority)` — throws if absent or not an improvement
  - `remove(value)` — returns `true` if removed, `false` if absent
  - `has(value)` — boolean
  - `getPriority(value)` — `number` or `undefined`
  - `size` — getter, number
  - `isEmpty()` — boolean

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Limitations

Values are coerced to floats, so very large integers lose precision. If you need
exact integer aggregates over a window, this is the wrong tool.

