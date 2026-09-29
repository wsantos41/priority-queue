import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriorityQueue } from '../src/index.js';

test('push and pop respect min-heap order', () => {
  const pq = new PriorityQueue();
  pq.push('a', 5);
  pq.push('b', 1);
  pq.push('c', 3);
  assert.equal(pq.size, 3);
  assert.deepEqual(pq.pop(), { value: 'b', priority: 1 });
  assert.deepEqual(pq.pop(), { value: 'c', priority: 3 });
  assert.deepEqual(pq.pop(), { value: 'a', priority: 5 });
  assert.equal(pq.pop(), undefined);
});

test('isEmpty and size are consistent', () => {
  const pq = new PriorityQueue();
  assert.equal(pq.isEmpty(), true);
  pq.push('x', 10);
  assert.equal(pq.isEmpty(), false);
  assert.equal(pq.size, 1);
  pq.pop();
  assert.equal(pq.isEmpty(), true);
  assert.equal(pq.size, 0);
});

test('peek returns top without removing', () => {
  const pq = new PriorityQueue();
  pq.push('a', 7);
  pq.push('b', 2);
  assert.deepEqual(pq.peek(), { value: 'b', priority: 2 });
  assert.equal(pq.size, 2);
  pq.pop();
  assert.deepEqual(pq.peek(), { value: 'a', priority: 7 });
});

test('peek on empty queue returns undefined', () => {
  const pq = new PriorityQueue();
  assert.equal(pq.peek(), undefined);
});

test('duplicate value throws', () => {
  const pq = new PriorityQueue();
  pq.push('item', 5);
  assert.throws(() => pq.push('item', 3), /already present/);
});

test('decreaseKey lowers priority and restores order', () => {
  const pq = new PriorityQueue();
  pq.push('a', 10);
  pq.push('b', 8);
  pq.push('c', 6);
  pq.decreaseKey('a', 1);
  assert.equal(pq.getPriority('a'), 1);
  assert.deepEqual(pq.peek(), { value: 'a', priority: 1 });
});

test('decreaseKey on missing value throws', () => {
  const pq = new PriorityQueue();
  pq.push('a', 5);
  assert.throws(() => pq.decreaseKey('z', 1), /not found/);
});

test('decreaseKey with non-improving priority throws', () => {
  const pq = new PriorityQueue();
  pq.push('a', 3);
  assert.throws(() => pq.decreaseKey('a', 5), /does not improve/);
  assert.throws(() => pq.decreaseKey('a', 3), /does not improve/);
});

test('decreaseKey works on a deep element requiring multiple sift-up steps', () => {
  const pq = new PriorityQueue();
  // Insert in sorted order so the heap is a complete min-heap.
  for (let i = 0; i < 7; i++) {
    pq.push(`n${i}`, i * 10);
  }
  // Decrease the last leaf to be the new minimum.
  pq.decreaseKey('n6', -1);
  assert.deepEqual(pq.peek(), { value: 'n6', priority: -1 });
});

test('max-heap via inverted comparator', () => {
  const pq = new PriorityQueue((a, b) => b - a);
  pq.push('a', 1);
  pq.push('b', 5);
  pq.push('c', 3);
  assert.deepEqual(pq.pop(), { value: 'b', priority: 5 });
  assert.deepEqual(pq.pop(), { value: 'c', priority: 3 });
  assert.deepEqual(pq.pop(), { value: 'a', priority: 1 });
});

test('remove existing value returns true and restores order', () => {
  const pq = new PriorityQueue();
  pq.push('a', 1);
  pq.push('b', 2);
  pq.push('c', 3);
  pq.push('d', 4);
  assert.equal(pq.remove('c'), true);
  assert.equal(pq.has('c'), false);
  assert.equal(pq.size, 3);
  const out = [];
  while (!pq.isEmpty()) out.push(pq.pop().value);
  assert.deepEqual(out, ['a', 'b', 'd']);
});

test('remove missing value returns false', () => {
  const pq = new PriorityQueue();
  pq.push('a', 1);
  assert.equal(pq.remove('z'), false);
  assert.equal(pq.size, 1);
});

test('remove the only element', () => {
  const pq = new PriorityQueue();
  pq.push('solo', 42);
  assert.equal(pq.remove('solo'), true);
  assert.equal(pq.isEmpty(), true);
  assert.equal(pq.pop(), undefined);
});

test('has and getPriority reflect current state', () => {
  const pq = new PriorityQueue();
  pq.push('x', 9);
  assert.equal(pq.has('x'), true);
  assert.equal(pq.has('y'), false);
  assert.equal(pq.getPriority('x'), 9);
  assert.equal(pq.getPriority('y'), undefined);
  pq.decreaseKey('x', 4);
  assert.equal(pq.getPriority('x'), 4);
  pq.pop();
  assert.equal(pq.getPriority('x'), undefined);
});

test('stress: random insert and decrease-key produces sorted output', () => {
  const pq = new PriorityQueue();
  const values = [];
  for (let i = 0; i < 100; i++) {
    values.push(`v${i}`);
    pq.push(`v${i}`, 1000 - i);
  }
  // Decrease a subset to small priorities.
  for (let i = 0; i < 100; i += 7) {
    pq.decreaseKey(`v${i}`, i);
  }
  const out = [];
  while (!pq.isEmpty()) out.push(pq.pop().priority);
  // Output must be non-decreasing in priority.
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i - 1] <= out[i], `out of order at ${i}: ${out[i - 1]} > ${out[i]}`);
  }
  assert.equal(out.length, 100);
});

test('remove where replacement must sift down', () => {
  const pq = new PriorityQueue();
  // Build a heap where removing the root forces the last element to sift down.
  pq.push('a', 1);
  pq.push('b', 5);
  pq.push('c', 3);
  pq.push('d', 9);
  pq.push('e', 7);
  pq.push('f', 4);
  pq.push('g', 8);
  // Remove root 'a'; last element 'g' (priority 8) moves to root and sifts down.
  pq.remove('a');
  assert.deepEqual(pq.peek(), { value: 'c', priority: 3 });
  const out = [];
  while (!pq.isEmpty()) out.push(pq.pop().value);
  assert.deepEqual(out, ['c', 'f', 'b', 'e', 'g', 'd']);
});
