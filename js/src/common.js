'use strict';

const { roundUpToPowerOf2, hashNode } = require('./utils');

const getDepth = (elementCount) => {
  return Math.ceil(Math.log2(elementCount));
};

const getBalancedLeafCount = (elementCount) => {
  return roundUpToPowerOf2(elementCount);
};

// common algorithm to build a serialized merkle tree from an array of leafs
const buildTree = ({ leafs }, options = {}) => {
  const { hashFunction = hashNode } = options;
  const depth = getDepth(leafs.length);
  const balancedLeafCount = getBalancedLeafCount(leafs.length);
  const tree = Array(balancedLeafCount << 1).fill(null);

  for (let i = 0; i < balancedLeafCount; i++) {
    tree[balancedLeafCount + i] = leafs[i];
  }

  for (let i = balancedLeafCount - 1; i > 0; i--) {
    const index = i << 1;
    tree[i] = hashFunction(tree[index], tree[index + 1]);
  }

  return { tree, depth };
};

module.exports = {
  getDepth,
  getBalancedLeafCount,
  buildTree,
};
