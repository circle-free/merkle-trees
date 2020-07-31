'use strict';

const assert = require('assert');
const { hashNode, to32ByteBuffer } = require('./utils');
const { getDepthFromTree, verifyMixedRoot, getLeafCountFromTree } = require('./common');

// NOTE: Assumes valid tree
// NOTE: indices must be in descending order
const generateMultiProof = (tree, indices) => {
  const depth = getDepthFromTree(tree);
  const leafCount = getLeafCountFromTree(tree);
  const nodeCount = 2 * leafCount;
  const known = Array(nodeCount).fill(false);
  const values = [];
  const decommitments = [];

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'indices must be in descending order');
    known[leafCount + indices[i]] = true;
    values.push(tree[leafCount + indices[i]]);
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const left = known[2 * i];
    const right = known[2 * i + 1];

    if (left ^ right) decommitments.push(tree[2 * i + left]);

    known[i] = left || right;
  }

  return {
    mixedRoot: tree[0],
    root: tree[1],
    leafCount,
    indices,
    values,
    decommitments,
  };
};

// NOTE: indices must be in descending order
const verifyMultiProof = (mixedRoot, root, leafCount, indices, values, decommitments) => {
  if (!verifyMixedRoot(mixedRoot, root, leafCount)) return false;

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((decommitment) => decommitment);

  const queue = values.map((value, i) => ({ index: leafCount + indices[i], value }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, value } = queue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      return value.equals(root);
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      queue.push({ index: index >> 1, value: hashNode(value, decommits.shift()) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can ne hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, value: hashNode(queue.shift().value, value) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      queue.push({ index: index >> 1, value: hashNode(decommits.shift(), value) });
    }
  }
};

// TODO: test this function
const updateRootMultiProof = (mixedRoot, root, leafCount, indices, oldValues, newValues, decommitments) => {
  assert(verifyMixedRoot(mixedRoot, root, leafCount), 'Invalid root parameters');

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((decommitment) => decommitment);

  const oldQueue = oldValues.map((value, i) => ({ index: leafCount + indices[i], value }));
  const newQueue = newValues.map((value, i) => ({ index: leafCount + indices[i], value }));

  while (true) {
    assert(oldQueue.length >= 1, 'Something went wrong.');

    const { index, value: oldValue } = oldQueue.shift();
    const { value: newValue } = newQueue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      assert(oldValue.equals(root), 'Invalid proof.');

      return { mixedRoot: hashNode(to32ByteBuffer(leafCount), newValue), root: newValue };
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      oldQueue.push({ index: index >> 1, value: hashNode(oldValue, decommits.shift()) });
      newQueue.push({ index: index >> 1, value: hashNode(newValue, decommits.shift()) });
    } else if (oldQueue.length > 0 && oldQueue[0].index === index - 1) {
      // Odd nodes can ne hashed with neighbor on left (hash stack)
      oldQueue.push({ index: index >> 1, value: hashNode(oldQueue.shift().value, oldValue) });
      newQueue.push({ index: index >> 1, value: hashNode(newQueue.shift().value, newValue) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      oldQueue.push({ index: index >> 1, value: hashNode(decommits.shift(), oldValue) });
      newQueue.push({ index: index >> 1, value: hashNode(decommits.shift(), newValue) });
    }
  }
};

module.exports = {
  generateMultiProof,
  verifyMultiProof,
  updateRootMultiProof,
};
