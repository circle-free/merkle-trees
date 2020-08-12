'use strict';

// Generates a set of decommitments to prove the existence of a leaf at a given index.
const generate = ({ tree, index }) => {
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = leafCount + index; i > 1; i >>= 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  return { decommitments: decommitments.map(Buffer.from) };
};

// Compute the root given a leaf, its index, and a set of decommitments.
const getRoot = ({ index, leaf, decommitments, hashFunction }) => {
  const n = decommitments.length - 1;
  let hash = Buffer.from(leaf);

  for (let i = n; i >= 0; i--) {
    // Note that hash order is irrelevant if hash function sorts nodes
    hash = index & 1 ? hashFunction(decommitments[i], hash) : hashFunction(hash, decommitments[i]);
    index >>= 1;
  }

  return { root: hash };
};

// Compute the existing root given a leaf, its index, and a set of decommitments
// and computes a new root, along the way, given a new leaf to take its place.
// See getRoot for relevant inline comments.
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

// TODO: make these work with unbalanced trees
