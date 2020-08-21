'use strict';

// NOTE: indices must be in descending order

const assert = require('assert');

// Generates a set of decommitments to prove the existence of leaves at a given indices.
// Accomplishes this by tracking the indices of the leafs in the serialized tree, and
// accumulates the decommitments if only one of the nodes, at any given level, would be
// known (provided as leafs) at verify-time.
const generate = ({ tree, indices }) => {
  const known = Array(tree.length).fill(false);
  const decommitments = [];
  const leafCount = tree.length >>> 1;

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'Indices must be in descending order.');
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

  return { decommitments: decommitments.map(Buffer.from), indices: indices.slice() };
};

// Compute the root given a set of leafs, their indices, and a set of decommitments
// Uses a circular queue to accumulate the parent nodes and another circular to track
// the serialized tree indices of those nodes.
const getRoot = ({ indices, leafs, leafCount, decommitments, hashFunction }) => {
  // Keep verification minimal by using circular hashes queue with separate read and write heads
  // TODO: Consider an empty hashes array and referencing leafs parameter directly, while
  // treeIndices[nextReadIndex] > leafCount, rather than copying all leafs to memory.
  const hashes = leafs.map((leaf) => leaf);
  const treeIndices = indices.map((index) => leafCount + index);
  const indexCount = indices.length;

  let readIndex = 0;
  let writeIndex = 0;
  let decommitmentIndex = 0;

  while (true) {
    const index = treeIndices[readIndex];

    if (index === 1) {
      // Given the circular nature of writeIndex, get the last writeIndex.
      const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1;

      return { root: hashes[rootIndex] };
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
const getNewRoot = ({ indices, leafs, newLeafs, leafCount, decommitments, hashFunction }) => {
  const hashes = leafs.map((leaf) => leaf);
  const newHashes = newLeafs.map((leaf) => leaf);
  const treeIndices = indices.map((index) => leafCount + index);
  const indexCount = indices.length;

  let readIndex = 0;
  let writeIndex = 0;
  let decommitmentIndex = 0;

  while (true) {
    const index = treeIndices[readIndex];

    if (index === 1) {
      const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1;

      return { root: hashes[rootIndex], newRoot: newHashes[rootIndex] };
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

// TODO: indexIsOdd is like a left flag, (indexIsOdd && !nextIsPair) is like a right flag, so do we need
//       indices? Or rather, can they be inferred from flags?
// TODO: implement and test for unbalanced trees
