'use strict';

const assert = require('assert');

// NOTE: indices must be in descending order

const generate = ({ tree, indices }) => {
  const known = Array(tree.length).fill(false);
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'Indices must be in descending order');
    known[leafCount + indices[i]] = true;
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const left = known[i << 1];
    const right = known[(i << 1) + 1];

    if (left ^ right) decommitments.push(tree[(i << 1) + left]);

    known[i] = left || right;
  }

  return { decommitments: decommitments.map(Buffer.from), indices: indices.slice() };
};

const getRoot = ({ indices, leafs, leafCount, decommitments, hashFunction }) => {
  const treeIndices = indices.map((index) => leafCount + index);
  const hashes = leafs.map((leaf) => leaf);
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  while (true) {
    const index = treeIndices[hashReadIndex];

    if (index === 1) {
      const rootIndex = (hashWriteIndex === 0 ? indices.length : hashWriteIndex) - 1;

      return { root: hashes[rootIndex] };
    }

    const nextHashReadIndex = (hashReadIndex + 1) % indices.length;
    const indexIsOdd = index & 1;
    const nextIsPair = treeIndices[nextHashReadIndex] === index - 1;

    const right = indexIsOdd ? hashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= indices.length;
    const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : hashes[hashReadIndex++];

    treeIndices[hashWriteIndex] = index >> 1;
    hashes[hashWriteIndex++] = hashFunction(left, right);
    hashReadIndex %= indices.length;
    hashWriteIndex %= indices.length;
  }
};

const getNewRoot = ({ indices, leafs, newLeafs, leafCount, decommitments, hashFunction }) => {
  const treeIndices = indices.map((index) => leafCount + index);
  const hashes = leafs.map((leaf) => leaf);
  const newHashes = newLeafs.map((leaf) => leaf);
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  while (true) {
    const index = treeIndices[hashReadIndex];

    if (index === 1) {
      const rootIndex = (hashWriteIndex === 0 ? indices.length : hashWriteIndex) - 1;

      return { root: hashes[rootIndex], newRoot: newHashes[rootIndex] };
    }

    const nextHashReadIndex = (hashReadIndex + 1) % indices.length;
    const indexIsOdd = index & 1;
    const nextIsPair = treeIndices[nextHashReadIndex] === index - 1;

    const right = indexIsOdd ? hashes[hashReadIndex] : decommitments[decommitmentIndex];
    const newRight = indexIsOdd ? newHashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= indices.length;
    const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex] : hashes[hashReadIndex];
    const newLeft = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : newHashes[hashReadIndex++];

    treeIndices[hashWriteIndex] = index >> 1;
    hashes[hashWriteIndex] = hashFunction(left, right);
    newHashes[hashWriteIndex++] = hashFunction(newLeft, newRight);
    hashReadIndex %= indices.length;
    hashWriteIndex %= indices.length;
  }
};

module.exports = { generate, getRoot, getNewRoot };

// TODO: indexIsOdd is like a left flag, (indexIsOdd && !nextIsPair) is like a right flag, so do we need
//       indices? Or rather, can they be inferred from flags?
// TODO: implement and test for unbalanced trees
