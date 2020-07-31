'use strict';

const assert = require('assert');
const { to32ByteBuffer, bitCount32, hashNode } = require('./utils');
const {
  getDepthFromLeafCount,
  verifyMixedRoot,
  getLeafCountFromRealLeafCount,
  computeMixedRoot,
  getMixedRoot,
  getRoot,
} = require('./common');

const generateAppendProofRecursivelyWith = (tree, leafCount, decommitments = []) => {
  const depth = getDepthFromLeafCount(leafCount);

  if (depth <= 1) return decommitments;

  const newDecommitments = leafCount & 1 ? [tree[Math.pow(2, depth) + leafCount - 1]] : [];

  return generateAppendProofRecursivelyWith(
    tree,
    Math.ceil((leafCount + 1) / 2 - 1),
    newDecommitments.concat(decommitments)
  );
};

const generateAppendProofRecursively = (tree, realLeafCount) => {
  const decommitments = generateAppendProofRecursivelyWith(tree, realLeafCount);

  return {
    mixedRoot: getMixedRoot(tree),
    root: getRoot(tree),
    realLeafCount,
    decommitments: decommitments.length === 0 ? [] : [2, ...decommitments],
  };
};

const generateAppendProofLoop = (tree, realLeafCount) => {
  // The idea here is that we only need nodes/proof from the left of the append index
  // since there are no real nodes/leafs to the right of the append index
  // (i.e. a lone rightmost 9th leafs is its parent, grandparent, and great grandparent)
  // So, we start at the top level (2 nodes) and determine the subtree of the append index.
  // If it is on the right (hint, at level 1 it always is, by definition) then we pull in the
  // left subtrees hash, track the offset in the serialized tree structure, and move down a
  // level. Note that when we move down a level, the offset doubles.
  const decommitments = [];

  let numBranchesOnNodes = getLeafCountFromRealLeafCount(realLeafCount);
  let appendIndex = realLeafCount;
  let level = 1;
  let offset = 0;

  while (true) {
    // appendIndex must always be localized to given subtree
    appendIndex = appendIndex % numBranchesOnNodes;
    numBranchesOnNodes >>= 1; // divide by 2
    offset <<= 1; // multiply by 2

    if (numBranchesOnNodes === 0) {
      return {
        mixedRoot: getMixedRoot(tree),
        root: getRoot(tree),
        realLeafCount,
        decommitments,
      };
    }

    if (appendIndex >= numBranchesOnNodes) {
      // appendIndex is in the right subtree
      decommitments.push(tree[(1 << level) + offset]);
      offset += 1;
    }

    level += 1;
  }
};

// Option available to use the recursive algorithm
const generateAppendProof = (tree, realLeafCount, options = {}) => {
  const { recursively = false } = options;

  return recursively
    ? generateAppendProofRecursively(tree, realLeafCount)
    : generateAppendProofLoop(tree, realLeafCount);
};

// TODO: test if this needs to be unique
// NOTE: indices must be in descending order
const verifyMultiProof = (root, depth, indices, values, decommitments) => {};

// NOTE: appending to a null tree/root is effectively going to create one
// NOTE: decommitments need to be ordered from left to right
const appendLeaf = (value, mixedRoot = null, root = null, realLeafCount = 0, decommitments = []) => {
  // NOTE: The number of decommitments (from the left) needed to append to an imperfect tree
  //       are equal to the number of set bits in the realLeafCount
  const bitCount = bitCount32(realLeafCount);
  assert(bitCount === 1 || bitCount === decommitments.length, 'Unexpected number of decommitments.');

  assert((mixedRoot && root && realLeafCount) || (!mixedRoot && !root && !realLeafCount), 'Tree parameter mismatch.');
  assert(verifyMixedRoot(mixedRoot, root, realLeafCount), 'Mixed root mismatched.');

  // Appending to an empty Merkle Tree is trivial
  if (!realLeafCount) {
    return {
      mixedRoot: computeMixedRoot(value, 1),
      root: value,
      realLeafCount: 1,
      leafCount: 1,
      depth: 0,
    };
  }

  let newRoot;
  let newRealLeafCount = realLeafCount + 1;
  let newLeafCount = getLeafCountFromRealLeafCount(newRealLeafCount);

  // Appending to a perfect Merkle Tree is equally trivial
  if ((realLeafCount & (realLeafCount - 1)) === 0) {
    newRoot = hashNode(root, value);

    return {
      mixedRoot: computeMixedRoot(newRoot, realLeafCount + 1),
      root: newRoot,
      realLeafCount: newRealLeafCount,
      leafCount: newLeafCount,
      depth: getDepthFromLeafCount(newLeafCount),
    };
  }

  // Clone decommitments so we don't destroy/consume it
  const queue = decommitments.map((decommitment) => decommitment);
  const n = queue.length - 1;

  // As we verify the proof, we'll build the new root in parallel, since the
  // verification loop will consume the queue/stack
  newRoot = hashNode(queue[n], value);

  for (let i = n; i > 0; i--) {
    newRoot = hashNode(queue[i - 1], newRoot);
    queue[i - 1] = hashNode(queue[i - 1], queue[i]);

    if (i === 1) {
      assert(queue[0].equals(root), 'Invalid Decommitments');

      return {
        mixedRoot: computeMixedRoot(newRoot, realLeafCount + 1),
        root: newRoot,
        realLeafCount: newRealLeafCount,
        leafCount: newLeafCount,
        depth: getDepthFromLeafCount(newLeafCount),
      };
    }
  }
};

// TODO: create function to append several leafs in batch.
//       1) Use the decommitments to recover "normal" nodes and starting depth (as done in single-append).
//       2) Build a serialized tree filling in the known nodes and the appending right leafs.
//       3) Run through the first half of the serialized tree in reverse order (as done in buildTree),
//          but skip computing known nodes (i.e. if (!tree[i]) { tree[i] = hashNode(tree[2 * i], tree[2 * i + 1])) }
//          and skip computing nodes for with unknown children (any leaf or node to the left of the append index)
//       4) This process should result in a new valid root and mixed root, and interestingly, a partially filled
//          serialized tree that contains enough data to build subsequent append proofs
//       Not going to build this yet as it is outside the scope of the current needs
const appendLeafs = (values, mixedRoot = null, root = null, realLeafCount = 0, decommitments = []) => {};

module.exports = {
  generateAppendProof,
  appendLeaf,
};
