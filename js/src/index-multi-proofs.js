'use strict';

// NOTE: indices must be in ascending order

const assert = require('assert');

const { hashNode, to32ByteBuffer, from32ByteBuffer, roundUpToPowerOf2 } = require('./utils');

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

  const clonedDecommitments = decommitments.filter((d) => d).map(Buffer.from);

  return compact
    ? {
        indices,
        compactProof: [to32ByteBuffer(elementCount)].concat(clonedDecommitments),
      }
    : {
        indices,
        elementCount,
        decommitments: clonedDecommitments,
      };
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

  const balancedLeafCount = roundUpToPowerOf2(elementCount);

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const hashes = leafs.map((leaf) => leaf).reverse();
  const treeIndices = indices.map((index) => balancedLeafCount + index).reverse();
  const indexCount = indices.length;

  let readIndex = 0;
  let writeIndex = 0;
  let decommitmentIndex = 0;
  let upperBound = balancedLeafCount + elementCount - 1;
  let lowestTreeIndex = treeIndices[indices.length - 1];
  let nodeIndex;
  let nextNodeIndex;

  while (true) {
    nodeIndex = treeIndices[readIndex];

    if (nodeIndex === 1) {
      // Given the circular nature of writeIndex, get the last writeIndex.
      const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1;

      return { root: hashes[rootIndex], elementCount };
    }

    const indexIsOdd = nodeIndex & 1;

    if (nodeIndex === upperBound && !indexIsOdd) {
      treeIndices[writeIndex] = nodeIndex >>> 1;
      hashes[writeIndex++] = hashes[readIndex++];
    } else {
      const nextReadIndex = (readIndex + 1) % indexCount;
      nextNodeIndex = treeIndices[nextReadIndex];

      // The next node is a sibling of the current one
      const nextIsPair = nextNodeIndex === nodeIndex - 1;

      const right = indexIsOdd ? hashes[readIndex++] : decommitments[decommitmentIndex++];
      readIndex %= indexCount;
      const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : hashes[readIndex++];

      treeIndices[writeIndex] = nodeIndex >>> 1;
      hashes[writeIndex++] = hashFunction(left, right);
    }

    readIndex %= indexCount;
    writeIndex %= indexCount;

    if (nodeIndex === lowestTreeIndex || nextNodeIndex === lowestTreeIndex) {
      lowestTreeIndex >>>= 1;
      upperBound >>>= 1;
    }
  }
};

// Compute the existing root given a set of leafs, their indices, and a set of decommitments
// and computes a new root, along the way, given new leafs to take their place.
// See getRoot for relevant inline comments.
const getNewRoot = ({ indices, leafs, updateLeafs, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  const balancedLeafCount = roundUpToPowerOf2(elementCount);
  const hashes = leafs.map((leaf) => leaf).reverse();
  const updateHashes = updateLeafs.map((leaf) => leaf).reverse();
  const treeIndices = indices.map((index) => balancedLeafCount + index).reverse();
  const indexCount = indices.length;

  let readIndex = 0;
  let writeIndex = 0;
  let decommitmentIndex = 0;
  let upperBound = balancedLeafCount + elementCount - 1;
  let lowestTreeIndex = treeIndices[indices.length - 1];
  let nodeIndex;
  let nextNodeIndex;

  while (true) {
    nodeIndex = treeIndices[readIndex];

    if (nodeIndex === 1) {
      const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1;

      return { root: hashes[rootIndex], newRoot: updateHashes[rootIndex], elementCount };
    }

    const indexIsOdd = nodeIndex & 1;

    if (nodeIndex === upperBound && !indexIsOdd) {
      treeIndices[writeIndex] = nodeIndex >>> 1;
      hashes[writeIndex] = hashes[readIndex];
      updateHashes[writeIndex++] = updateHashes[readIndex++];
    } else {
      const nextReadIndex = (readIndex + 1) % indexCount;
      nextNodeIndex = treeIndices[nextReadIndex];
      const nextIsPair = nextNodeIndex === nodeIndex - 1;

      const right = indexIsOdd ? hashes[readIndex] : decommitments[decommitmentIndex];
      const newRight = indexIsOdd ? updateHashes[readIndex++] : decommitments[decommitmentIndex++];
      readIndex %= indexCount;
      const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex] : hashes[readIndex];
      const newLeft = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : updateHashes[readIndex++];

      treeIndices[writeIndex] = nodeIndex >>> 1;
      hashes[writeIndex] = hashFunction(left, right);
      updateHashes[writeIndex++] = hashFunction(newLeft, newRight);
    }

    readIndex %= indexCount;
    writeIndex %= indexCount;

    if (nodeIndex === lowestTreeIndex || nextNodeIndex === lowestTreeIndex) {
      lowestTreeIndex >>>= 1;
      upperBound >>>= 1;
    }
  }
};

// This is identical to the above getRoot, except it builds a tree, similar to Common.buildTree
// See above getRoot for relevant inline comments
const getPartialTree = ({ indices, leafs, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  const balancedLeafCount = roundUpToPowerOf2(elementCount);
  const tree = Array(balancedLeafCount << 1).fill(null);

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const hashes = leafs.map((leaf) => leaf).reverse();
  const treeIndices = indices.map((index) => balancedLeafCount + index).reverse();
  const indexCount = indices.length;

  let readIndex = 0;
  let writeIndex = 0;
  let decommitmentIndex = 0;
  let upperBound = balancedLeafCount + elementCount - 1;
  let lowestTreeIndex = treeIndices[indices.length - 1];
  let nodeIndex;
  let nextNodeIndex;

  while (true) {
    nodeIndex = treeIndices[readIndex];

    if (nodeIndex === 1) {
      const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1;
      tree[1] = hashes[rootIndex];

      return { tree, elementCount };
    }

    const indexIsOdd = nodeIndex & 1;

    if (nodeIndex === upperBound && !indexIsOdd) {
      treeIndices[writeIndex] = nodeIndex >>> 1;
      tree[nodeIndex] = hashes[readIndex];
      hashes[writeIndex++] = hashes[readIndex++];
    } else {
      const nextReadIndex = (readIndex + 1) % indexCount;
      nextNodeIndex = treeIndices[nextReadIndex];

      // The next node is a sibling of the current one
      const nextIsPair = nextNodeIndex === nodeIndex - 1;

      const right = indexIsOdd ? hashes[readIndex++] : decommitments[decommitmentIndex++];
      readIndex %= indexCount;
      const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : hashes[readIndex++];

      treeIndices[writeIndex] = nodeIndex >>> 1;
      hashes[writeIndex++] = hashFunction(left, right);

      if (indexIsOdd) {
        tree[nodeIndex] = right;
        tree[nodeIndex - 1] = left;
      } else {
        tree[nodeIndex] = left;
        tree[nodeIndex + 1] = right;
      }
    }

    readIndex %= indexCount;
    writeIndex %= indexCount;

    if (nodeIndex === lowestTreeIndex || nextNodeIndex === lowestTreeIndex) {
      lowestTreeIndex >>>= 1;
      upperBound >>>= 1;
    }
  }
};

module.exports = { generate, getRoot, getNewRoot, getPartialTree };
