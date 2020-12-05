'use strict';

const { getBalancedLeafCount } = require('./common');
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

  return compact
    ? {
        index,
        compactProof: [to32ByteBuffer(elementCount)].concat(filteredDecommitments),
      }
    : {
        index,
        elementCount,
        decommitments: filteredDecommitments,
      };
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
    // If not "right-most" node at this level, or odd, compute the parent hash
    if (index !== upperBound || index & 1) {
      // Note that hash order is irrelevant if hash function sorts nodes
      hash =
        index & 1
          ? hashFunction(decommitments[--decommitmentIndex], hash)
          : hashFunction(hash, decommitments[--decommitmentIndex]);
    }

    index >>>= 1;
    upperBound >>>= 1;
  }

  return { root: hash, elementCount };
};

// Compute the existing root given a leaf, its index, and a set of decommitments
// and computes a new root, along the way, given a new leaf to take its place.
// See getRoot for relevant inline comments.
const getNewRoot = ({ index, leaf, updateLeaf, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  let decommitmentIndex = decommitments.length;
  let hash = Buffer.from(leaf);
  let updateHash = Buffer.from(updateLeaf);
  let upperBound = elementCount - 1;

  while (decommitmentIndex > 0) {
    if (index !== upperBound || index & 1) {
      hash =
        index & 1
          ? hashFunction(decommitments[--decommitmentIndex], hash)
          : hashFunction(hash, decommitments[--decommitmentIndex]);

      updateHash =
        index & 1
          ? hashFunction(decommitments[decommitmentIndex], updateHash)
          : hashFunction(updateHash, decommitments[decommitmentIndex]);
    }

    index >>>= 1;
    upperBound >>>= 1;
  }

  return { root: hash, newRoot: updateHash, elementCount };
};

// This is identical to the above getRoot, except it builds a tree, similar to Common.buildTree
// See above getRoot for relevant inline comments
const getPartialTree = ({ index, leaf, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  let balancedLeafCount = getBalancedLeafCount(elementCount);
  const tree = Array(balancedLeafCount << 1).fill(null);

  let decommitmentIndex = decommitments.length;
  let hash = Buffer.from(leaf);
  let upperBound = elementCount - 1;

  while (decommitmentIndex > 0) {
    const nodeIndex = balancedLeafCount + index;
    tree[nodeIndex] = hash;

    if (index !== upperBound || index & 1) {
      hash =
        index & 1
          ? hashFunction(decommitments[--decommitmentIndex], hash)
          : hashFunction(hash, decommitments[--decommitmentIndex]);

      const pairIndex = index & 1 ? nodeIndex - 1 : nodeIndex + 1;
      tree[pairIndex] = decommitments[decommitmentIndex];

      // maybe if (index + 1 === upperBound) we know the next decommitment is the last leaf
    }

    balancedLeafCount >>>= 1;
    index >>>= 1;
    upperBound >>>= 1;
  }

  tree[1] = hash;

  return { tree, elementCount };
};

module.exports = { generate, getRoot, getNewRoot, getPartialTree };
