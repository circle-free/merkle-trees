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

const validateMixedRoot = (mixedRoot, root, leafCount) => {
  return hashNode(to32ByteBuffer(leafCount), root).equals(mixedRoot);
};

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

// TODO: create root update function taking mixedRoot, root, leafCount, index, value, and proof as input
const updateRoot = () => {};

// TODO: create tree update function taking tree, indices, and values(s)
const updateTree = () => {};

module.exports = {
  buildTree,
  getDepthFromTree,
  getDepthFromLeafs,
  getDepthFromLeafCount,
  getRoot,
  getMixedRoot,
  validateMixedRoot,
  getLeafCountFromTree,
  getRealLeafCountFromTree,
  getLeafCountFromLeafs,
  getLeafCountFromRealLeafCount,
};
