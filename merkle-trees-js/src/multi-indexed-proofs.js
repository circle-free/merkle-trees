'use strict';

const assert = require('assert');

// NOTE: indices must be in descending order

// TODO: implement and test for unbalanced trees
const generate = ({ tree, indices }) => {
  const known = Array(tree.length).fill(false);
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'Indices must be in descending order');
    known[leafCount + indices[i]] = true;
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const left = known[i << 1];
    const right = known[(i << 1) + 1];

    if (left ^ right) decommitments.push(tree[(i << 1) + left]);

    known[i] = left || right;
  }

  return { decommitments: decommitments.map(Buffer.from) };
};

// TODO: refactor to use read/write heads on decommitments
// TODO: test if/how this works with sortedHash
const getRoot = ({ indices, leafs, leafCount, decommitments, hashFunction }) => {
  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((d) => d);
  const queue = leafs.map((leaf, i) => ({ index: leafCount + indices[i], node: leaf }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, node } = queue.shift();

    if (index === 1) {
      // tree index 1, so return root
      return { root: Buffer.from(node) };
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      queue.push({ index: index >> 1, node: hashFunction(node, decommits.shift()) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can be hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, node: hashFunction(queue.shift().node, node) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      queue.push({ index: index >> 1, node: hashFunction(decommits.shift(), node) });
    }
  }
};

// TODO: refactor to use read/write heads on decommitments
// TODO: test if/how this works with sortedHash
const getNewRoot = ({ indices, leafs, newLeafs, leafCount, decommitments, hashFunction }) => {
  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map(Buffer.from);
  const queue = leafs.map((leaf, i) => ({ index: leafCount + indices[i], node: leaf }));
  const newQueue = newLeafs.map((leaf, i) => ({ index: leafCount + indices[i], node: leaf }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, node } = queue.shift();
    const { node: newNode } = newQueue.shift();

    if (index === 1) {
      // tree index 1, so return root
      return { root: Buffer.from(node), newRoot: Buffer.from(newNode) };
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      const decommitment = decommits.shift();
      queue.push({ index: index >> 1, node: hashFunction(node, decommitment) });
      newQueue.push({ index: index >> 1, node: hashFunction(newNode, decommitment) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can be hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, node: hashFunction(queue.shift().node, node) });
      newQueue.push({ index: index >> 1, node: hashFunction(newQueue.shift().node, newNode) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      const decommitment = decommits.shift();
      queue.push({ index: index >> 1, node: hashFunction(decommitment, node) });
      newQueue.push({ index: index >> 1, node: hashFunction(decommitment, newNode) });
    }
  }
};

module.exports = { generate, getRoot, getNewRoot };
