'use strict';

// TODO: implement append multi
// TODO: test how this works with null elements/leafs before the append index

const assert = require('assert');

// TODO: implement getNewRootMulti (append multiple)

const generate = ({ tree, elementCount }) => {
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = leafCount + elementCount; i > 1; i >>= 1) {
    if (i & 1 || i === 2) {
      decommitments.unshift(tree[i - 1]);
    }
  }

  return { decommitments: decommitments.map(Buffer.from) };
};

const getRoot = ({ decommitments, hashFunction }) => {
  const n = decommitments.length - 1;
  let hash = decommitments[n];

  for (let i = n; i > 0; i--) {
    hash = hashFunction(decommitments[i - 1], hash);
  }

  return { root: hash };
};

const getNewRootSingle = ({ newLeaf, decommitments, hashFunction }) => {
  const n = decommitments.length - 1;
  let hash = decommitments[n];
  let newHash = hashFunction(decommitments[n], newLeaf);

  for (let i = n; i > 0; i--) {
    newHash = hashFunction(decommitments[i - 1], newHash);
    hash = hashFunction(decommitments[i - 1], hash);
  }

  return { root: hash, newRoot: newHash };
};

const getNewRootMulti = ({ newLeafs, decommitments, hashFunction }) => {};

const getNewRoot = (parameters) => {
  return parameters.newLeafs ? getNewRootMulti(parameters) : getNewRootSingle(parameters);
};

module.exports = { generate, getRoot, getNewRoot };
