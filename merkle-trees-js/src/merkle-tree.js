'use strict';

const assert = require('assert');
const { hashNode, to32ByteBuffer, sortHashNode, findLastIndex } = require('./utils');

// NOTE: This is still valid since an unbalanced Merkle Tree will still be serialized normally
const getDepthFromTree = (tree) => {
  return Math.log2(tree.length) - 1;
};

// NOTE: Given an unbalanced Merkle Tree (leaf count is not power of 2)
const getDepthFromLeafs = (leafs) => {
  return Math.ceil(Math.log2(leafs.length));
};

const getDepthFromLeafCount = (leafCount) => {
  return Math.ceil(Math.log2(leafCount));
};

const getLeafCountFromDepth = (depth) => {
  return 1 << depth;
};

const getRoot = (tree) => {
  return tree[1];
};

const getMixedRoot = (tree) => {
  return tree[0];
};

const getLeaf = (tree, index) => {
  const leafCount = getLeafCountFromTree(tree);
  return tree[leafCount + index];
};

const getLeafs = (tree, indices) => {
  const leafCount = getLeafCountFromTree(tree);

  return indices.map((index) => tree[leafCount + index]);
};

const getLeafCountFromTree = (tree) => {
  return tree.length >> 1;
};

const getRealLeafCountFromTree = (tree) => {
  return findLastIndex(tree.slice(getLeafCountFromTree(tree), tree.length), (v) => v) + 1;
};

const getLeafCountFromLeafs = (leafs) => {
  return 1 << getDepthFromLeafs(leafs);
};

const getLeafCountFromRealLeafCount = (leafCount) => {
  return 1 << getDepthFromLeafCount(leafCount);
};

const computeMixedRoot = (root, realLeafCount, options = {}) => {
  const { sortedHash = false } = options;
  const hashPair = sortedHash ? sortHashNode : hashNode;
  return hashPair(to32ByteBuffer(realLeafCount), root);
};

const verifyMixedRoot = (mixedRoot, root, leafCount, options = {}) => {
  return computeMixedRoot(root, leafCount, options).equals(mixedRoot);
};

// NOTE: leafs must already be buffers, preferably 32 bytes
const buildTree = (leafs, options = {}) => {
  const { sortedHash = false, unbalanced = false } = options;
  const hashPair = sortedHash ? sortHashNode : hashNode;

  const realLeafCount = leafs.length;
  const depth = getDepthFromLeafs(leafs);
  const leafCount = getLeafCountFromDepth(depth);

  assert(unbalanced || realLeafCount === leafCount, 'Cannot create unbalanced tree by default');

  const nodeCount = 2 * leafCount;
  const tree = Array(nodeCount).fill(null);

  for (let i = 0; i < realLeafCount; i++) {
    // Unless explicit, do not allow a leaf to be null
    // TODO: maybe we can. likely we could.
    assert(leafs[i], 'Cannot holes between leafs.');
    tree[leafCount + i] = leafs[i];
  }

  for (let i = leafCount - 1; i > 0; i--) {
    if (tree[2 * i] && tree[2 * i + 1]) {
      // Only bother hashing if left and right are real leafs
      tree[i] = hashPair(tree[2 * i], tree[2 * i + 1]);
      continue;
    }

    if (tree[2 * i]) {
      // NOTE: If a leaf is real, all leafs to the left are real
      // Don't bother hashing (i.e. H(A,B)=A where B is 0)
      tree[i] = tree[2 * i];
      continue;
    }
  }

  // Mix in leaf count to prevent second pre-image attack
  // This means the true Merkle Root is the Mixed Root at tree[0]
  tree[0] = computeMixedRoot(tree[1], realLeafCount);

  return {
    tree,
    mixedRoot: tree[0],
    root: tree[1],
    realLeafCount,
    leafCount,
    depth,
  };
};

const generateProof = (tree, index) => {
  const leafCount = getLeafCountFromTree(tree);
  assert(index < leafCount, 'Leaf index does not exist.');

  const mixedRoot = getMixedRoot(tree);
  const root = getRoot(tree);

  if (leafCount === 1) {
    return { mixedRoot, root, leafCount, index, value: tree[1], decommitments: [] };
  }

  const decommitments = [];

  for (let i = leafCount + index; i > 1; i = i >> 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  return { mixedRoot, root, leafCount, index, value: tree[leafCount + index], decommitments };
};

const verifyProof = (mixedRoot, root, leafCount, index, value, decommitments = [], options = {}) => {
  const { sortedHash = false } = options;
  const hashPair = sortedHash ? sortHashNode : hashNode;

  if (!verifyMixedRoot(mixedRoot, root, leafCount)) return false;

  if (leafCount === 1 && value.equals(root)) return true;

  let hash = value;

  for (let i = decommitments.length - 1; i >= 0; i--) {
    hash = index & 1 ? hashPair(decommitments[i], hash) : hashPair(hash, decommitments[i]);
    index >>= 1; // integer divide index by 2
  }

  return hash.equals(root);
};

const updateWithProof = (mixedRoot, root, leafCount, index, oldValue, newValue, decommitments = [], options = {}) => {
  const { sortedHash = false } = options;
  const hashPair = sortedHash ? sortHashNode : hashNode;

  assert(verifyMixedRoot(mixedRoot, root, leafCount), 'Invalid root parameters.');

  if (leafCount === 1 && oldValue.equals(root)) {
    return { mixedRoot: computeMixedRoot(newValue, leafCount), root: newValue };
  }

  let oldHash = oldValue;
  let newHash = newValue;

  for (let i = decommitments.length - 1; i >= 0; i--) {
    oldHash = index & 1 ? hashPair(decommitments[i], oldHash) : hashPair(oldHash, decommitments[i]);
    newHash = index & 1 ? hashPair(decommitments[i], newHash) : hashPair(newHash, decommitments[i]);
    index >>= 1; // integer divide index by 2
  }

  assert(oldHash.equals(root), 'Invalid proof.');

  return { mixedRoot: computeMixedRoot(newHash, leafCount), root: newHash };
};

// NOTE: indices must be in order for max efficiency
const updateTree = (tree, indices, values, options = {}) => {
  const { sortedHash = false } = options;
  const hashPair = sortedHash ? sortHashNode : hashNode;

  assert(indices.length > 0 && values.length > 0 && indices.length === values.length, 'Invalid indices or values.');
  // TODO: check that largest index is within bounds

  const leafCount = getLeafCountFromTree(tree);

  let nodeUpdateIndices = indices.reduce((nodeIndices, leafIndex, i) => {
    const treeIndex = leafCount + leafIndex;
    tree[treeIndex] = values[i];
    const nodeIndex = treeIndex >> 1;
    const length = nodeIndices.length;

    // push the node index if its a node, and the array is empty or the node is not already there
    const pushNodeIndex = nodeIndex > 0 && (!length || nodeIndices[length - 1] !== nodeIndex);

    return pushNodeIndex ? nodeIndices.concat([nodeIndex]) : nodeIndices;
  }, []);

  while (nodeUpdateIndices.length) {
    nodeUpdateIndices = nodeUpdateIndices.reduce((nodeIndices, treeIndex) => {
      tree[treeIndex] = hashPair(tree[2 * treeIndex], tree[2 * treeIndex + 1]);
      const nodeIndex = treeIndex >> 1;
      const length = nodeIndices.length;

      // push the node index if its a node, and the array is empty or the node is not already there
      const pushNodeIndex = nodeIndex > 0 && (!length || nodeIndices[length - 1] !== nodeIndex);

      return pushNodeIndex ? nodeIndices.concat([nodeIndex]) : nodeIndices;
    }, []);
  }

  tree[0] = computeMixedRoot(tree[1], leafCount);

  return {
    tree,
    mixedRoot: tree[0],
    root: tree[1],
    realLeafCount: leafCount,
    leafCount,
    depth: getDepthFromLeafCount(leafCount),
  };
};

module.exports = {
  buildTree,
  generateProof,
  verifyProof,
  updateWithProof,
  updateTree,
  getDepthFromTree,
  getDepthFromLeafs,
  getDepthFromLeafCount,
  getLeafCountFromDepth,
  getRoot,
  getMixedRoot,
  getLeaf,
  getLeafs,
  computeMixedRoot,
  verifyMixedRoot,
  getLeafCountFromTree,
  getRealLeafCountFromTree,
  getLeafCountFromLeafs,
  getLeafCountFromRealLeafCount,
};