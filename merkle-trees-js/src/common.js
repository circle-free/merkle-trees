'use strict';

const { hashNode, to32ByteBuffer } = require('./utils');

// NOTE: This is still valid since an imperfect Merkle Tree will still be serialized normally
const getDepthFromTree = (tree) => {
  return Math.log2(tree.length) - 1;
};

// NOTE: Given an imperfect Merkle Tree (leaf count is not power of 2)
const getDepthFromLeafs = (leafs) => {
  return Math.ceil(Math.log2(leafs.length));
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

// TODO: create root update function taking root, indices, value(s), and proof as input
const updateRoot = () => {};

// TODO: create tree update function taking tree, indices, and values(s)
const updateTree = () => {};

module.exports = {
  getDepthFromTree,
  getDepthFromLeafs,
  getRoot,
  getMixedRoot,
  validateMixedRoot,
  getLeafCountFromTree,
  getRealLeafCountFromTree,
  getLeafCountFromLeafs,
  getLeafCountFromRealLeafCount,
};
