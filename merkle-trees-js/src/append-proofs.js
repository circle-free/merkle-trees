'use strict';

const assert = require('assert');
const { bitCount32 } = require('./utils');

const generate = ({ tree, elementCount }) => {
  // The idea here is that we only need nodes/proof from the left of the append index
  // since there are no real nodes/leafs to the right of the append index
  // (i.e. a lone rightmost 9th leafs is its parent, grandparent, and great grandparent)
  // So, we start at the top level (2 nodes) and determine the subtree of the append index.
  // If it is on the right (hint, at level 1 it always is, by definition) then we pull in the
  // left subtrees hash, track the offset in the serialized tree structure, and move down a
  // level. Note that when we move down a level, the offset doubles.
  const decommitments = [];

  let numBranchesOnNodes = tree.length >> 1;
  let appendIndex = elementCount;
  let level = 0;
  let offset = 0;

  while (true) {
    if (numBranchesOnNodes === 0) return { decommitments: decommitments.map(Buffer.from) };

    if (appendIndex >= numBranchesOnNodes) {
      // appendIndex is in the right subtree
      decommitments.push(tree[(1 << level) + offset]);
      offset += 1;
    }

    // appendIndex must always be localized to given subtree
    appendIndex = appendIndex % numBranchesOnNodes;
    numBranchesOnNodes >>= 1; // divide by 2
    offset <<= 1; // multiply by 2
    level += 1;
  }
};

const getRoot = ({ elementCount, decommitments, hashFunction }) => {
  assert(decommitments.length === bitCount32(elementCount), 'Unexpected number of decommitments.');

  // Clone decommitments so we don't destroy/consume it
  const queue = decommitments.map((d) => d);
  const n = queue.length - 1;

  for (let i = n; i > 0; i--) {
    queue[i - 1] = hashFunction(queue[i - 1], queue[i]);
  }

  return { root: queue[0] };
};

const getNewRoot = ({ newLeaf, elementCount, decommitments, hashFunction }) => {
  assert(decommitments.length === bitCount32(elementCount), 'Unexpected number of decommitments.');

  // Clone decommitments array so we don't destroy/consume it
  const queue = decommitments.map((d) => d);
  const n = queue.length - 1;

  // As we verify the proof, we'll build the new root in parallel, since the
  // verification loop will consume the queue/stack
  let newRoot = hashFunction(queue[n], newLeaf);

  for (let i = n; i > 0; i--) {
    newRoot = hashFunction(queue[i - 1], newRoot);
    queue[i - 1] = hashFunction(queue[i - 1], queue[i]);
  }

  return { root: queue[0], newRoot };
};

module.exports = { generate, getRoot, getNewRoot };
