'use strict';

// NOTE: indices must be in ascending order

const assert = require('assert');

const { hashNode, to32ByteBuffer, from32ByteBuffer } = require('./utils');

// Generates a set of decommitments to prove the existence of leaves at a given indices.
// Accomplishes this by tracking the indices of the leafs in the serialized tree, and
// accumulates the decommitments if only one of the nodes, at any given level, would be
// known (provided as leafs) at verify-time.
const generate = ({ tree, elementCount, indices }, options = {}) => {
  const { compact = false } = options;
  const known = Array(tree.length).fill(false);
  const decommitments = [];
  const leafCount = tree.length >>> 1;

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] < indices[i], 'Indices must be in ascending order.');
    known[leafCount + indices[i]] = true;
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const leftChildIndex = i << 1;
    const left = known[leftChildIndex];
    const right = known[leftChildIndex + 1];

    // Only one of children would be known, so we need the sibling as a decommitment
    if (left ^ right) decommitments.push(tree[leftChildIndex + left]);

    // if at least one of the children is known, we would know the parent at verify-time
    known[i] = left || right;
  }

  const clonedDecommitments = decommitments.map(Buffer.from);

  if (compact) return { compactProof: [to32ByteBuffer(elementCount)].concat(clonedDecommitments) };

  return { elementCount, decommitments: clonedDecommitments };
};

// Compute the root given a set of leafs, their indices, and a set of decommitments
// Uses a circular queue to accumulate the parent nodes and another circular to track
// the serialized tree indices of those nodes.
const getRoot = ({ indices, leafs, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  // TODO: Consider an empty hashes array and referencing leafs parameter directly, while
  // treeIndices[nextReadIndex] > elementCount, rather than copying all leafs to memory.
  const hashes = leafs.map((leaf) => leaf).reverse();
  const treeIndices = indices.map((index) => elementCount + index).reverse();
  const indexCount = indices.length;

  let readIndex = 0;
  let writeIndex = 0;
  let decommitmentIndex = 0;

  while (true) {
    const index = treeIndices[readIndex];

    if (index === 1) {
      // Given the circular nature of writeIndex, get the last writeIndex.
      const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1;

      return { root: hashes[rootIndex], elementCount };
    }

    const nextReadIndex = (readIndex + 1) % indexCount;
    const indexIsOdd = index & 1;

    // The next node is a sibling of the current one
    const nextIsPair = treeIndices[nextReadIndex] === index - 1;

    const right = indexIsOdd ? hashes[readIndex++] : decommitments[decommitmentIndex++];
    readIndex %= indexCount;
    const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : hashes[readIndex++];

    treeIndices[writeIndex] = index >>> 1;
    hashes[writeIndex++] = hashFunction(left, right);

    readIndex %= indexCount;
    writeIndex %= indexCount;
  }
};

// Compute the existing root given a set of leafs, their indices, and a set of decommitments
// and computes a new root, along the way, given new leafs to take their place.
// See getRoot for relevant inline comments.
const getNewRoot = ({ indices, leafs, newLeafs, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  const hashes = leafs.map((leaf) => leaf).reverse();
  const newHashes = newLeafs.map((leaf) => leaf).reverse();
  const treeIndices = indices.map((index) => elementCount + index).reverse();
  const indexCount = indices.length;

  let readIndex = 0;
  let writeIndex = 0;
  let decommitmentIndex = 0;

  while (true) {
    const index = treeIndices[readIndex];

    if (index === 1) {
      const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1;

      return { root: hashes[rootIndex], newRoot: newHashes[rootIndex], elementCount };
    }

    const nextReadIndex = (readIndex + 1) % indexCount;
    const indexIsOdd = index & 1;
    const nextIsPair = treeIndices[nextReadIndex] === index - 1;

    const right = indexIsOdd ? hashes[readIndex] : decommitments[decommitmentIndex];
    const newRight = indexIsOdd ? newHashes[readIndex++] : decommitments[decommitmentIndex++];
    readIndex %= indexCount;
    const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex] : hashes[readIndex];
    const newLeft = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : newHashes[readIndex++];

    treeIndices[writeIndex] = index >>> 1;
    hashes[writeIndex] = hashFunction(left, right);
    newHashes[writeIndex++] = hashFunction(newLeft, newRight);

    readIndex %= indexCount;
    writeIndex %= indexCount;
  }
};

module.exports = { generate, getRoot, getNewRoot };
