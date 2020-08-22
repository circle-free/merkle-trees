'use strict';

const { hashNode } = require('./utils');

// Generates a set of decommitments to prove the existence of a leaf at a given index.
const generate = ({ tree, index }, options = {}) => {
  const decommitments = [];
  const leafCount = tree.length >>> 1;

  for (let i = leafCount + index; i > 1; i >>>= 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  // Filter out non-existent decommitments, which are nodes to the "right" of the last leaf
  return { decommitments: decommitments.filter((d) => d).map(Buffer.from) };
};

// Compute the root given a leaf, its index, and a set of decommitments.
const getRoot = ({ elementCount, index, leaf, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;
  let decommitmentIndex = decommitments.length;
  let hash = Buffer.from(leaf);
  let upperBound = elementCount - 1;

  while (decommitmentIndex > 0) {
    // If even and the "right-most" node at this level, the parent hash is this child
    if (index === upperBound && !(index & 1)) {
      index >>>= 1;
      upperBound >>>= 1;
      continue;
    }

    // Note that hash order is irrelevant if hash function sorts nodes
    hash =
      index & 1
        ? hashFunction(decommitments[--decommitmentIndex], hash)
        : hashFunction(hash, decommitments[--decommitmentIndex]);

    index >>>= 1;
    upperBound >>>= 1;
  }

  return { root: hash };
};

// Compute the existing root given a leaf, its index, and a set of decommitments
// and computes a new root, along the way, given a new leaf to take its place.
// See getRoot for relevant inline comments.
const getNewRoot = ({ elementCount, index, leaf, newLeaf, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;
  let decommitmentIndex = decommitments.length;
  let hash = Buffer.from(leaf);
  let newHash = Buffer.from(newLeaf);
  let upperBound = elementCount - 1;

  while (decommitmentIndex > 0) {
    if (index === upperBound && !(index & 1)) {
      index >>>= 1;
      upperBound >>>= 1;
      continue;
    }

    hash =
      index & 1
        ? hashFunction(decommitments[--decommitmentIndex], hash)
        : hashFunction(hash, decommitments[--decommitmentIndex]);

    newHash =
      index & 1
        ? hashFunction(decommitments[decommitmentIndex], newHash)
        : hashFunction(newHash, decommitments[decommitmentIndex]);

    index >>>= 1;
    upperBound >>>= 1;
  }

  return { root: hash, newRoot: newHash };
};

module.exports = { generate, getRoot, getNewRoot };
