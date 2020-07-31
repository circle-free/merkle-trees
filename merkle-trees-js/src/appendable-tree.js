'use strict';

// TODO: move buildTree with unbalanced option to common

const { Keccak } = require('sha3');
const assert = require('assert');
const { to32ByteBuffer, bitCount32, hashNode } = require('./utils');
const {
  getDepthFromLeafs,
  getDepthFromLeafCount,
  verifyMixedRoot,
  getLeafCountFromRealLeafCount,
} = require('./common');

// TODO: consider using zero-filled buffers as 'nulls'
const buildTree = (leafs) => {
  const realLeafCount = leafs.length;
  const depth = getDepthFromLeafs(leafs); // This will be an effective depth
  const effectiveLeafs = leafs.concat(Array((1 << depth) - realLeafCount).fill(null));
  const effectiveLeafCount = effectiveLeafs.length;
  const nodeCount = 2 * effectiveLeafCount;
  const tree = Array(nodeCount).fill(null);

  for (let i = 0; i < effectiveLeafCount; i++) {
    tree[(1 << depth) + i] = leafs[i] || null;
  }

  for (let i = (1 << depth) - 1; i > 0; i--) {
    if (tree[2 * i] && tree[2 * i + 1]) {
      // Only bother hashing if left and right are real leafs
      tree[i] = hashNode(tree[2 * i], tree[2 * i + 1]);
    } else if (tree[2 * i]) {
      // NOTE: If a leaf is real, all leafs to the left are real
      // Don't bother hashing (i.e. H(A,B)=A where B is 0)
      tree[i] = tree[2 * i];
    }
  }

  // Mix in real leaf count to prevent second pre-image attack
  // This means the true Merkle Root is the Mixed Root at tree[0]
  tree[0] = hashNode(to32ByteBuffer(realLeafCount), tree[1]);

  return {
    tree,
    mixedRoot: tree[0],
    root: tree[1],
    realLeafCount,
    leafCount: effectiveLeafCount,
    depth,
  };
};

const generateAppendProofRecursivelyWith = (tree, leafCount, decommitments = []) => {
  const depth = Math.ceil(Math.log2(leafCount));

  if (depth <= 1) return decommitments;

  const newDecommitments = leafCount % 2 === 1 ? [tree[Math.pow(2, depth) + leafCount - 1]] : [];

  return generateAppendProofRecursivelyWith(
    tree,
    Math.ceil((leafCount + 1) / 2 - 1),
    newDecommitments.concat(decommitments)
  );
};

const generateAppendProofRecursively = (tree, realLeafCount) => {
  const decommitments = generateAppendProofRecursivelyWith(tree, realLeafCount);

  return {
    mixedRoot: tree[0],
    root: tree[1],
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

  let numBranchesOnNodes = 1 << Math.ceil(Math.log2(realLeafCount));
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
        mixedRoot: tree[0],
        root: tree[1],
        realLeafCount,
        decommitments,
      };
    }

    if (appendIndex >= numBranchesOnNodes) {
      // appendIndex is in the right subtree
      decommitments.push(tree[Math.pow(2, level) + offset]);
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
      mixedRoot: hashNode(to32ByteBuffer(1), value),
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
      mixedRoot: hashNode(to32ByteBuffer(realLeafCount + 1), newRoot),
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
      // Must compare against mixed root, not root
      assert(hashNode(to32ByteBuffer(realLeafCount), queue[0]).equals(mixedRoot), 'Invalid Decommitments');

      return {
        mixedRoot: hashNode(to32ByteBuffer(realLeafCount + 1), newRoot),
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
  buildTree,
  generateAppendProof,
  appendLeaf,
};
