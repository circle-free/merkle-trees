'use strict';

const { assert } = require('chai');
const { roundUpToPowerOf2, hashNode } = require('./utils');

const getDepth = (elementCount) => {
  return Math.ceil(Math.log2(elementCount));
};

const getBalancedLeafCount = (elementCount) => {
  return roundUpToPowerOf2(elementCount);
};

// common algorithm to build a serialized merkle tree from an array of leafs
const buildTree = (leafs, options = {}) => {
  const { hashFunction = hashNode } = options;
  const depth = getDepth(leafs.length);
  const balancedLeafCount = getBalancedLeafCount(leafs.length);
  const tree = Array(balancedLeafCount << 1).fill(null);

  for (let i = 0; i < leafs.length; i++) {
    tree[balancedLeafCount + i] = leafs[i];
  }

  let lowerBound = balancedLeafCount;
  let upperBound = balancedLeafCount + leafs.length - 1;

  for (let i = balancedLeafCount - 1; i > 0; i--) {
    const index = i << 1;

    if (index > upperBound) continue;

    if (index <= lowerBound) {
      lowerBound >>>= 1;
      upperBound >>>= 1;
    }

    if (index === upperBound) {
      tree[i] = tree[index];
      continue;
    }

    tree[i] = hashFunction(tree[index], tree[index + 1]);
  }

  return { tree, depth };
};

const checkElement = ({ tree, index, leaf }) => {
  const localLeaf = tree[(tree.length >> 1) + index];

  return localLeaf ? localLeaf.equals(leaf) : false;
};

const checkElements = ({ tree, indices, leafs }) => {
  return indices.reduce((exists, index, i) => exists.concat(checkElement({ tree, index, leaf: leafs[i] })), []);
};

const getUpdatedTree = ({ tree, leafs }, options = {}) => {
  const { hashFunction = hashNode } = options;
  const balancedLeafCount = tree.length >> 1;
  const newTree = tree.map((n) => n && Buffer.from(n));

  for (let i = 0; i < leafs.length; i++) {
    if (leafs[i]) {
      newTree[balancedLeafCount + i] = leafs[i];
    }
  }

  let lowerBound = balancedLeafCount;
  let upperBound = balancedLeafCount + leafs.length - 1;

  for (let i = balancedLeafCount - 1; i > 0; i--) {
    const index = i << 1;

    if (index > upperBound) continue;

    if (index <= lowerBound) {
      lowerBound >>>= 1;
      upperBound >>>= 1;
    }

    if (index === upperBound) {
      if (newTree[index]) {
        newTree[i] = newTree[index];
      }

      continue;
    }

    if (!newTree[index] && !newTree[index + 1]) continue;

    try {
      newTree[i] = hashFunction(newTree[index], newTree[index + 1]);
    } catch {
      throw Error('Insufficient information to build tree.');
    }
  }

  return newTree;
};

const getGrownTree = ({ tree, leafs }, options = {}) => {
  const oldDepth = getDepth(tree.length >> 1);
  const oldBalancedLeafCount = tree.length >> 1;
  const depth = getDepth(leafs.length);
  const balancedLeafCount = getBalancedLeafCount(leafs.length);
  assert(balancedLeafCount >= oldBalancedLeafCount, 'Tree is already larger ');

  const newTree = Array(balancedLeafCount << 1).fill(null);

  for (let i = 0; i < leafs.length; i++) {
    newTree[balancedLeafCount + i] = tree[oldBalancedLeafCount + i] ?? null;
  }

  for (let i = 1; i <= oldDepth; i++) {
    for (let j = 0; j < leafs.length >> i; j++) {
      newTree[(balancedLeafCount >> i) + j] = tree[(oldBalancedLeafCount >> i) + j];
    }
  }

  return getUpdatedTree({ tree: newTree, leafs }, options);
};

module.exports = {
  getDepth,
  getBalancedLeafCount,
  buildTree,
  checkElement,
  checkElements,
  getUpdatedTree,
  getGrownTree,
};
