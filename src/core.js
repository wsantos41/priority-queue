/**
 * Binary heap priority queue with O(1) direct decrease-key via a handle/index map.
 *
 * Design decisions:
 *
 * 1. We keep an array `nodes` of {value, priority} pairs and a `Map<T, number>` called
 *    `positions` mapping value -> index in `nodes`. This gives O(1) lookup for decrease-key
 *    WITHOUT rebuilding the heap.
 *
 * 2. Values must be unique. If two entries shared a value, `positions.get(value)` would be
 *    ambiguous. Rather than papering over this with a wrapper or auto-disambiguation, we
 *    throw on duplicate insertion. One clear rule beats a clever compromise.
 *
 * 3. The comparator is fixed at construction. Callers needing max-heap behavior pass
 *    `(a, b) => b - a` or similar. Keeping it injected avoids baking polarity into the heap.
 *
 * 4. `decreaseKey` accepts a new priority and sifts UP only. A "decrease" in a min-heap
 *    means the new priority is smaller (better). If the caller passes a larger value, we
 *    throw — silently doing nothing or sifting down would hide caller bugs. For a max-heap,
 *    the comparator inverts ordering, so "decrease" is about comparator-relative position;
 *    we validate by checking the heap actually improved at that slot.
 */

/**
 * @template T
 * @typedef {Object} Node
 * @property {T} value
 * @property {number} priority
 */

/**
 * @template T
 */
export class PriorityQueue {
  /**
   * @param {(a: number, b: number) => number} comparator
   *        Returns negative when `a` should rank above `b` (i.e., `a` has higher priority).
   *        For a min-heap: `(a, b) => a - b`.
   *        For a max-heap: `(a, b) => b - a`.
   */
  constructor(comparator = (a, b) => a - b) {
    this._compare = comparator;
    /** @type {Array<{value: T, priority: number}>} */
    this._nodes = [];
    /** @type {Map<T, number>} */
    this._positions = new Map();
  }

  /** Number of elements currently in the queue. */
  get size() {
    return this._nodes.length;
  }

  /** True iff the queue is empty. */
  isEmpty() {
    return this._nodes.length === 0;
  }

  /**
   * Insert `value` with `priority`. Throws if `value` is already present —
   * duplicate values would make the position map ambiguous.
   * @param {T} value
   * @param {number} priority
   */
  push(value, priority) {
    if (this._positions.has(value)) {
      throw new Error(`PriorityQueue.push: value already present`);
    }
    const index = this._nodes.length;
    this._nodes.push({ value, priority });
    this._positions.set(value, index);
    this._siftUp(index);
  }

  /**
   * Remove and return the highest-priority element.
   * @returns {{value: T, priority: number} | undefined} `undefined` if empty.
   */
  pop() {
    if (this._nodes.length === 0) return undefined;
    const top = this._nodes[0];
    const last = this._nodes.pop();
    this._positions.delete(top.value);
    if (this._nodes.length > 0) {
      this._nodes[0] = last;
      this._positions.set(last.value, 0);
      this._siftDown(0);
    }
    return top;
  }

  /**
   * Peek at the highest-priority element without removing it.
   * @returns {{value: T, priority: number} | undefined}
   */
  peek() {
    return this._nodes.length === 0 ? undefined : this._nodes[0];
  }

  /**
   * Return the stored priority for `value`, or `undefined` if not present.
   * @param {T} value
   * @returns {number | undefined}
   */
  getPriority(value) {
    const index = this._positions.get(value);
    return index === undefined ? undefined : this._nodes[index].priority;
  }

  /**
   * True iff `value` is currently in the queue.
   * @param {T} value
   */
  has(value) {
    return this._positions.has(value);
  }

  /**
   * Update the priority of an existing `value`.
   *
   * Throws if the value is absent, or if the new priority does not improve the
   * element's standing (i.e., is not "less" per the comparator). This is strict
   * on purpose: a silent no-op on a bad decrease would mask caller bugs.
   *
   * @param {T} value
   * @param {number} newPriority
   */
  decreaseKey(value, newPriority) {
    const index = this._positions.get(value);
    if (index === undefined) {
      throw new Error(`PriorityQueue.decreaseKey: value not found`);
    }
    const current = this._nodes[index].priority;
    // The new priority must be "better" (rank higher) than the current one.
    // For a min-heap with (a,b)=>a-b, better means smaller.
    if (this._compare(newPriority, current) >= 0) {
      throw new Error(
        `PriorityQueue.decreaseKey: new priority does not improve current (${newPriority} vs ${current})`
      );
    }
    this._nodes[index].priority = newPriority;
    this._siftUp(index);
  }

  /**
   * Remove `value` from the queue if present. Returns true if removed.
   * @param {T} value
   * @returns {boolean}
   */
  remove(value) {
    const index = this._positions.get(value);
    if (index === undefined) return false;
    const currentPriority = this._nodes[index].priority;
    const last = this._nodes.pop();
    this._positions.delete(value);
    if (index < this._nodes.length) {
      this._nodes[index] = last;
      this._positions.set(last.value, index);
      // Sift in whichever direction is needed: the replacement may belong
      // above or below the vacated slot.
      if (this._compare(this._nodes[index].priority, currentPriority) < 0) {
        this._siftUp(index);
      } else {
        this._siftDown(index);
      }
    }
    return true;
  }

  /**
   * Sift the element at `i` upward until the heap property is restored.
   * @param {number} i
   */
  _siftUp(i) {
    const nodes = this._nodes;
    const item = nodes[i];
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      const parentNode = nodes[parent];
      if (this._compare(item.priority, parentNode.priority) >= 0) break;
      nodes[i] = parentNode;
      this._positions.set(parentNode.value, i);
      i = parent;
    }
    nodes[i] = item;
    this._positions.set(item.value, i);
  }

  /**
   * Sift the element at `i` downward until the heap property is restored.
   * @param {number} i
   */
  _siftDown(i) {
    const nodes = this._nodes;
    const length = nodes.length;
    const item = nodes[i];
    while (true) {
      let best = i;
      let bestPriority = item.priority;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < length) {
        const lp = nodes[left].priority;
        if (this._compare(lp, bestPriority) < 0) {
          best = left;
          bestPriority = lp;
        }
      }
      if (right < length) {
        const rp = nodes[right].priority;
        if (this._compare(rp, bestPriority) < 0) {
          best = right;
          bestPriority = rp;
        }
      }
      if (best === i) break;
      nodes[i] = nodes[best];
      this._positions.set(nodes[i].value, i);
      nodes[best] = item;
      this._positions.set(item.value, best);
      i = best;
    }
  }
}
