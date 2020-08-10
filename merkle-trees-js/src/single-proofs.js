'use strict';

// TODO: make these work with unbalanced trees

const generate = ({ tree, index }) => {
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = leafCount + index; i > 1; i >>= 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  return { decommitments: decommitments.map(Buffer.from) };
};

const getRoot = ({ index, leaf, decommitments, hashFunction }) => {
  const n = decommitments.length - 1;
  let hash = Buffer.from(leaf);

  for (let i = n; i >= 0; i--) {
    hash = index & 1 ? hashFunction(decommitments[i], hash) : hashFunction(hash, decommitments[i]);
    index >>= 1;
  }

  return { root: hash };
};

const getNewRoot = ({ index, leaf, newLeaf, decommitments, hashFunction }) => {
  const n = decommitments.length - 1;
  let hash = Buffer.from(leaf);
  let newHash = Buffer.from(newLeaf);

  for (let i = n; i >= 0; i--) {
    hash = index & 1 ? hashFunction(decommitments[i], hash) : hashFunction(hash, decommitments[i]);
    newHash = index & 1 ? hashFunction(decommitments[i], newHash) : hashFunction(newHash, decommitments[i]);
    index >>= 1;
  }

  return { root: hash, newRoot: newHash };
};

module.exports = { generate, getRoot, getNewRoot };
