'use strict';

const assert = require('assert');
const { hashNode, to32ByteBuffer } = require('./utils');

// NOTE: This is still valid since an imperfect Merkle Tree will still be serialized normally
const getDepthFromTree = (tree) => {
  return Math.log2(tree.length) - 1;
};

// NOTE: Given an imperfect Merkle Tree (leaf count is not power of 2)
const getDepthFromLeafs = (leafs) => {
  return Math.ceil(Math.log2(leafs.length));
};

const getDepthFromLeafCount = (leafCount) => {
  return Math.ceil(Math.log2(leafCount));
};

const getRoot = (tree) => {
  return tree[1];
};

const getMixedRoot = (tree) => {
  return tree[0];
};

const getLeafCountFromTree = (tree) => {
  return tree.length >> 1;
};

const getRealLeafCountFromTree = (tree) => {
  return tree.slice(tree.length >> 1, tree.length).reduce((count, leaf) => count + leaf, 0);
};

const getLeafCountFromLeafs = (leafs) => {
  return 1 << Math.ceil(Math.log2(leafs.length));
};

const getLeafCountFromRealLeafCount = (leafCount) => {
  return 1 << Math.ceil(Math.log2(leafCount));
};

const verifyMixedRoot = (mixedRoot, root, leafCount) => {
  return hashNode(to32ByteBuffer(leafCount), root).equals(mixedRoot);
};

// NOTE: leafs must already be buffers, preferably 32 bytes
const buildTree = (leafs) => {
  const leafCount = leafs.length;
  const depth = getDepthFromLeafs(leafs);

  assert(leafCount === 1 << depth, `${leafCount} leafs will not produce a perfect Merkle Tree.`);

  const nodeCount = 2 * leafCount;
  const tree = Array(nodeCount).fill(null);

  for (let i = 0; i < leafCount; i++) {
    tree[leafCount + i] = leafs[i];
  }

  for (let i = leafCount - 1; i > 0; i--) {
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

const generateProof = (tree, index) => {
  const leafCount = tree.length >> 1;

  assert(index < leafCount, 'Leaf index does not exist.');

  if (leafCount === 1) {
    return { mixedRoot: tree[0], root: tree[1], leafCount, index, value: tree[1], decommitments: [] };
  }

  const decommitments = [];

  for (let i = leafCount + index; i > 1; i = i >> 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  return { mixedRoot: tree[0], root: tree[1], leafCount, index, value: tree[leafCount + index], decommitments };
};

const verifyProof = (mixedRoot, root, leafCount, index, value, decommitments = []) => {
  if (!verifyMixedRoot(mixedRoot, root, leafCount)) return false;

  if (leafCount === 1 && value.equals(root)) return true;

  let hash = value;

  for (let i = decommitments.length - 1; i >= 0; i--) {
    hash = index & 1 ? hashNode(decommitments[i], hash) : hashNode(hash, decommitments[i]);
    index >>= 1; // integer divide index by 2
  }

  return hash.equals(root);
};

const updateWithProof = (mixedRoot, root, leafCount, index, oldValue, newValue, decommitments = []) => {
  assert(verifyMixedRoot(mixedRoot, root, leafCount), 'Invalid root parameters.');

  if (leafCount === 1 && oldValue.equals(root)) {
    return {
      mixedRoot: hashNode(to32ByteBuffer(leafCount), newValue),
      root: newValue,
    };
  }

  let oldHash = oldValue;
  let newHash = newValue;

  for (let i = decommitments.length - 1; i >= 0; i--) {
    oldHash = index & 1 ? hashNode(decommitments[i], oldHash) : hashNode(oldHash, decommitments[i]);
    newHash = index & 1 ? hashNode(decommitments[i], newHash) : hashNode(newHash, decommitments[i]);
    index >>= 1; // integer divide index by 2
  }

  assert(oldHash.equals(root), 'Invalid proof.');

  return {
    mixedRoot: hashNode(to32ByteBuffer(leafCount), newHash),
    root: newHash,
  };
};

// NOTE: indices must be in order for max efficiency
const updateTree = (tree, indices, values) => {
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
      tree[treeIndex] = hashNode(tree[2 * treeIndex], tree[2 * treeIndex + 1]);
      const nodeIndex = treeIndex >> 1;
      const length = nodeIndices.length;

      // push the node index if its a node, and the array is empty or the node is not already there
      const pushNodeIndex = nodeIndex > 0 && (!length || nodeIndices[length - 1] !== nodeIndex);

      return pushNodeIndex ? nodeIndices.concat([nodeIndex]) : nodeIndices;
    }, []);
  }

  tree[0] = hashNode(to32ByteBuffer(leafCount), tree[1]);

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
  getRoot,
  getMixedRoot,
  verifyMixedRoot,
  getLeafCountFromTree,
  getRealLeafCountFromTree,
  getLeafCountFromLeafs,
  getLeafCountFromRealLeafCount,
};
