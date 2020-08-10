'use strict';

// TODO: make these work with unbalanced trees
// TODO: implement and test as flag methods

const generate = ({ tree, index }) => {
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = leafCount + index; i > 1; i >>= 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  return { decommitments: decommitments.map(Buffer.from) };
};

const getRoot = ({ index, leaf, decommitments, hashFunction }) => {
  let hash = Buffer.from(leaf);

  for (let i = decommitments.length - 1; i >= 0; i--) {
    hash = index & 1 ? hashFunction(decommitments[i], hash) : hashFunction(hash, decommitments[i]);
    index >>= 1;
  }

  return { root: hash };
};

const getNewRootSingle = ({ index, leaf, newLeaf, decommitments, hashFunction }) => {
  let hash = Buffer.from(leaf);
  let newHash = Buffer.from(newLeaf);

  for (let i = decommitments.length - 1; i >= 0; i--) {
    hash = index & 1 ? hashFunction(decommitments[i], hash) : hashFunction(hash, decommitments[i]);
    newHash = index & 1 ? hashFunction(decommitments[i], newHash) : hashFunction(newHash, decommitments[i]);
    index >>= 1;
  }

  return { root: hash, newRoot: newHash };
};

const getNewRootMulti = ({ index, leaf, newLeafs, decommitments, hashFunction }) => {};

const getNewRoot = (parameters) => {
  return parameters.newLeafs ? getNewRootMulti(parameters) : getNewRootSingle(parameters);
};

module.exports = { generate, getRoot, getNewRoot };
