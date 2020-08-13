'use strict';

// Generates a set of decommitments to prove the existence of a leaf at a given index.
const generate = ({ tree, index }) => {
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = leafCount + index; i > 1; i >>= 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  // Filter out non-existent decommitments, which are nodes to the "right" of the last leaf
  return { decommitments: decommitments.filter((d) => d).map(Buffer.from) };
};

// Compute the root given a leaf, its index, and a set of decommitments.
const getRoot = ({ elementCount, index, leaf, decommitments, hashFunction }) => {
  let n = decommitments.length;
  let hash = Buffer.from(leaf);
  let upperBound = elementCount - 1;

  while (n > 0) {
    // If even and the "right-most" node at this level, the parent hash is this child
    if (index === upperBound && !(index & 1)) {
      index >>= 1;
      upperBound >>= 1;
      continue;
    }

    // Note that hash order is irrelevant if hash function sorts nodes
    hash = index & 1 ? hashFunction(decommitments[--n], hash) : hashFunction(hash, decommitments[--n]);
    index >>= 1;
    upperBound >>= 1;
  }

  return { root: hash };
};

// Compute the existing root given a leaf, its index, and a set of decommitments
// and computes a new root, along the way, given a new leaf to take its place.
// See getRoot for relevant inline comments.
const getNewRoot = ({ elementCount, index, leaf, newLeaf, decommitments, hashFunction }) => {
  let n = decommitments.length;
  let hash = Buffer.from(leaf);
  let newHash = Buffer.from(newLeaf);
  let upperBound = elementCount - 1;

  while (n > 0) {
    if (index === upperBound && !(index & 1)) {
      index >>= 1;
      upperBound >>= 1;
      continue;
    }

    hash = index & 1 ? hashFunction(decommitments[--n], hash) : hashFunction(hash, decommitments[--n]);
    newHash = index & 1 ? hashFunction(decommitments[n], newHash) : hashFunction(newHash, decommitments[n]);
    index >>= 1;
    upperBound >>= 1;
  }

  return { root: hash, newRoot: newHash };
};

module.exports = { generate, getRoot, getNewRoot };
