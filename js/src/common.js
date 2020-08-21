'use strict';

const { roundUpToPowerOf2 } = require('./utils');

// common algorithm to build a serialized merkle tree from an array of leafs
const buildTree = ({ leafs, hashFunction }) => {
  const leafCount = leafs.length;
  const tree = Array(leafCount << 1).fill(null);

  for (let i = 0; i < leafCount; i++) {
    tree[leafCount + i] = leafs[i];
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const index = i << 1;
    tree[i] = hashFunction(tree[index], tree[index + 1]);
  }

  return { tree };
};

const getDepthFromElementCount = (elementCount) => {
  return Math.ceil(Math.log2(elementCount));
};

const getLeafCountFromElementCount = (elementCount) => {
  return roundUpToPowerOf2(elementCount);
};

module.exports = {
  buildTree,
  getDepthFromElementCount,
  getLeafCountFromElementCount,
};