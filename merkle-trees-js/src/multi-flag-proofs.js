'use strict';

const assert = require('assert');
const { rightShift, and } = require('bitwise-buffer');

const { to32ByteBoolBuffer } = require('./utils');

// NOTE: indices must be in descending order

const generateBooleans = ({ tree, indices }) => {
  const known = Array(tree.length).fill(false);
  const relevant = Array(tree.length).fill(false);
  const decommitments = [];
  const flags = [];
  const skips = [];
  const leafCount = tree.length >> 1;

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'Indices must be in descending order');
    known[leafCount + indices[i]] = true;
    relevant[(leafCount + indices[i]) >> 1] = true;
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const leftChildIndex = i << 1;
    const left = known[leftChildIndex];
    const right = known[leftChildIndex + 1];
    const sibling = tree[leftChildIndex + left];

    if (left ^ right) decommitments.push(sibling);

    if (relevant[i]) {
      flags.push(left === right);
      skips.push(!sibling);
      relevant[i >> 1] = true;
    }

    known[i] = left || right;
  }

  return {
    decommitments: decommitments.filter((d) => d).map(Buffer.from),
    flags,
    skips,
  };
};

const generateBits = ({ tree, indices }) => {
  const { decommitments, flags, skips } = generateBooleans({ tree, indices });

  assert(flags.length <= 256, 'Proof too large for bit flags.');

  return {
    decommitments,
    flags: to32ByteBoolBuffer(flags),
    skips: to32ByteBoolBuffer(skips),
    hashCount: flags.length,
  };
};

const generate = (parameters) => {
  return parameters.bitFlags ? generateBits(parameters) : generateBooleans(parameters);
};

const getRootBooleans = ({ leafs, flags, skips, decommitments, hashFunction }) => {
  const flagCount = flags.length;
  const leafCount = leafs.length;

  // TODO: compare this performance vs an empty hashes array, and using leafIndex > leafCount to decide
  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const hashes = leafs.map((leaf) => leaf);
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < flagCount; i++) {
    if (skips && skips[i]) {
      hashes[hashWriteIndex++] = hashes[hashReadIndex++];
      hashReadIndex %= leafCount;
      hashWriteIndex %= leafCount;
      continue;
    }

    const left = flags[i] ? hashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= leafCount;
    const right = hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = hashFunction(left, right);

    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;
  }

  const rootIndex = (hashWriteIndex === 0 ? leafCount : hashWriteIndex) - 1;

  return { root: Buffer.from(hashes[rootIndex]) };
};

const getRootBits = ({ leafs, hashCount, flags, skips, decommitments, hashFunction }) => {
  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const leafCount = leafs.length;
  const hashes = leafs.map((leaf) => leaf);
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;
  const oneBuffer = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');

  for (let i = 0; i < hashCount; i++) {
    const skip = skips && and(rightShift(skips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      hashes[hashWriteIndex++] = hashes[hashReadIndex++];
      hashReadIndex %= leafCount;
      hashWriteIndex %= leafCount;
      continue;
    }

    const flag = and(rightShift(flags, i), oneBuffer).equals(oneBuffer);
    const left = flag ? hashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= leafCount;
    const right = hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = hashFunction(left, right);

    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;
  }

  const rootIndex = (hashWriteIndex === 0 ? leafCount : hashWriteIndex) - 1;

  return { root: Buffer.from(hashes[rootIndex]) };
};

const getRoot = (parameters) => {
  return Buffer.isBuffer(parameters.flags) ? getRootBits(parameters) : getRootBooleans(parameters);
};

const getNewRootBooleans = ({ leafs, newLeafs, flags, skips, decommitments, hashFunction }) => {
  const flagCount = flags.length;
  const leafCount = leafs.length;

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const hashes = leafs.map((leaf) => leaf);
  const newHashes = newLeafs.map((leaf) => leaf);
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < flagCount; i++) {
    if (skips && skips[i]) {
      hashes[hashWriteIndex] = hashes[hashReadIndex];
      newHashes[hashWriteIndex++] = newHashes[hashReadIndex++];
      hashReadIndex %= leafCount;
      hashWriteIndex %= leafCount;
      continue;
    }

    const left = flags[i] ? hashes[hashReadIndex] : decommitments[decommitmentIndex];
    const newLeft = flags[i] ? newHashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= leafCount;
    const right = hashes[hashReadIndex];
    const newRight = newHashes[hashReadIndex++];
    hashes[hashWriteIndex] = hashFunction(left, right);
    newHashes[hashWriteIndex++] = hashFunction(newLeft, newRight);

    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;
  }

  const rootIndex = (hashWriteIndex === 0 ? leafCount : hashWriteIndex) - 1;

  return { root: Buffer.from(hashes[rootIndex]), newRoot: Buffer.from(newHashes[rootIndex]) };
};

const getNewRootBits = ({ leafs, newLeafs, hashCount, flags, skips, decommitments, hashFunction }) => {
  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const leafCount = leafs.length;
  const hashes = leafs.map((leaf) => leaf);
  const newHashes = newLeafs.map((leaf) => leaf);
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;
  const oneBuffer = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');

  for (let i = 0; i < hashCount; i++) {
    const skip = skips && and(rightShift(skips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      hashes[hashWriteIndex] = hashes[hashReadIndex];
      newHashes[hashWriteIndex++] = newHashes[hashReadIndex++];
      hashReadIndex %= leafCount;
      hashWriteIndex %= leafCount;
      continue;
    }

    const flag = and(rightShift(flags, i), oneBuffer).equals(oneBuffer);
    const left = flag ? hashes[hashReadIndex] : decommitments[decommitmentIndex];
    const newLeft = flag ? newHashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= leafCount;
    const right = hashes[hashReadIndex];
    const newRight = newHashes[hashReadIndex++];
    hashes[hashWriteIndex] = hashFunction(left, right);
    newHashes[hashWriteIndex++] = hashFunction(newLeft, newRight);

    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;
  }

  const rootIndex = (hashWriteIndex === 0 ? leafCount : hashWriteIndex) - 1;

  return { root: Buffer.from(hashes[rootIndex]), newRoot: Buffer.from(newHashes[rootIndex]) };
};

const getNewRoot = (parameters) => {
  return Buffer.isBuffer(parameters.flags) ? getNewRootBits(parameters) : getNewRootBooleans(parameters);
};

module.exports = { generate, getRoot, getNewRoot };

// TODO: use separate set of flags for left/right hash order, allowing this to work for non-sorted-hash trees
//       Should be able to infer indices of elements based on proof hash order and flags
// TODO: somehow merge logic for bitwise and boolean algorithms
// TODO: test for unbalanced trees
