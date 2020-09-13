'use strict';

const { hashNode, to32ByteBuffer, from32ByteBuffer } = require('./utils');

// Generates a set of decommitments to prove the existence of a leaf at a given index.
const generate = ({ tree, elementCount, index }, options = {}) => {
  const { compact = false } = options;
  const decommitments = [];
  const leafCount = tree.length >>> 1;

  for (let i = leafCount + index; i > 1; i >>>= 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1]);
  }

  // Filter out non-existent decommitments, which are nodes to the "right" of the last leaf
  const filteredDecommitments = decommitments.filter((d) => d).map(Buffer.from);

  if (compact) return { compactProof: [to32ByteBuffer(elementCount)].concat(filteredDecommitments) };

  return { elementCount, decommitments: filteredDecommitments };
};

// Compute the root given a leaf, its index, and a set of decommitments.
const getRoot = ({ index, leaf, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

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

  return { root: hash, elementCount };
};

// Compute the existing root given a leaf, its index, and a set of decommitments
// and computes a new root, along the way, given a new leaf to take its place.
// See getRoot for relevant inline comments.
const getNewRoot = ({ index, leaf, newLeaf, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

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

  return { root: hash, newRoot: newHash, elementCount };
};

module.exports = { generate, getRoot, getNewRoot };
