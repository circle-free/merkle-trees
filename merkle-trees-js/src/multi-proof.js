'use strict';

const { Keccak } = require('sha3');
const assert = require('assert');
const { hashNode, to32ByteBuffer } = require('./utils');
const { getDepthFromTree, getDepthFromLeafs, validateMixedRoot } = require('./common');

// NOTE: leafs must already be buffers, preferably 32 bytes
const buildTree = (leafs) => {
  const leafCount = leafs.length;
  const depth = getDepthFromLeafs(leafs);

  assert(leafCount == 1 << depth, `${leafCount} leafs will not produce a perfect Merkle Tree.`);

  const nodeCount = 2 * leafCount;
  const tree = Array(nodeCount).fill(null);

  for (let i = 0; i < leafCount; i++) {
    tree[(1 << depth) + i] = leafs[i];
  }

  for (let i = (1 << depth) - 1; i > 0; i--) {
    tree[i] = hashNode(tree[2 * i], tree[2 * i + 1]);
  }

  // Mix in leaf count to prevent second pre-image attack
  // This means the true Merkle Root is the Mixed Root at tree[0]
  tree[0] = hashNode(to32ByteBuffer(leafCount), tree[1]);

  return {
    tree,
    mixedRoot: tree[0],
    root: tree[1],
    realLeafCount: leafCount,
    leafCount,
    depth,
  };
};

// NOTE: Assumes valid tree
// NOTE: indices must be in descending order
const generateMultiProof = (tree, indices) => {
  const depth = getDepthFromTree(tree);
  const leafCount = 1 << depth;
  const nodeCount = 2 * leafCount;
  const known = Array(nodeCount).fill(false);
  const values = [];
  const decommitments = [];

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'indices must be in descending order');
    known[(1 << depth) + indices[i]] = true;
    values.push(tree[(1 << depth) + indices[i]]);
  }

  for (let i = (1 << depth) - 1; i > 0; i--) {
    const left = known[2 * i];
    const right = known[2 * i + 1];

    if (left && !right) decommitments.push(tree[2 * i + 1]);

    if (right && !left) decommitments.push(tree[2 * i]);

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
  if (!validateMixedRoot(mixedRoot, root, leafCount)) return false;

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((decommitment) => decommitment);

  const queue = [];
  values.forEach((value, i) => {
    queue.push({ index: leafCount + indices[i], value });
  });

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, value } = queue.shift();

    if (index === 1) {
      // This Merkle root has tree index 1, so check against the root
      return value.equals(root);
    } else if (index % 2 === 0) {
      // Merge even nodes with a decommitment hash on right
      queue.push({
        index: index >> 1,
        value: hashNode(value, decommits.shift()),
      });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // If relevant, merge odd nodes with their neighbor on left (from the scratch stack)
      queue.push({
        index: index >> 1,
        value: hashNode(queue.shift().value, value),
      });
    } else {
      // Remaining odd nodes are merged with decommitment on the left
      queue.push({
        index: index >> 1,
        value: hashNode(decommits.shift(), value),
      });
    }
  }
};

// TODO: implement
const updateWithMultiProof = () => {}

module.exports = {
  buildTree,
  generateMultiProof,
  verifyMultiProof,
};
