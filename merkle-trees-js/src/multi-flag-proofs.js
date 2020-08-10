'use strict';

const assert = require('assert');
const { rightShift, and } = require('bitwise-buffer');

const { getDepthFromElementCount } = require('./common');
const { to32ByteBoolBuffer } = require('./utils');

// NOTE: check if indices must only be in ascending order
// TODO: use separate set of flags for left/right hash order, allowing this to work for non-sorted-hash trees
//       Should be able to infer indices of elements based on proof hash order and flags
// TODO: somehow merge logic for bitwise and boolean algorithms

// TODO: test for unbalanced trees
const generateBooleans = ({ tree, indices }) => {
  let ids = indices.slice();
  const nodes = [];
  const tested = [];
  const flags = [];
  const skips = [];
  let decommitmentIndices = [];
  let nextIds = [];
  const leafCount = tree.length >> 1;
  const treeDepth = getDepthFromElementCount(leafCount);

  for (let depth = treeDepth; depth > 0; depth--) {
    // For each node we're interested in proving, add it to the list of nodes and
    // add it's sibling/pair to list of decommitments. Push half the node's level
    // index to the list of next ids, for the next (higher) depth iteration
    for (let j = 0; j < ids.length; j++) {
      const id = ids[j];
      const nodeIndex = (1 << depth) + id;
      const pairIndex = nodeIndex + (id & 1 ? -1 : 1);

      nodes.push(nodeIndex);
      decommitmentIndices.push(pairIndex);
      nextIds.push(id >> 1);
    }

    // Filter out decommitments that are themselves being proved
    decommitmentIndices = decommitmentIndices.filter((decommitment) => !nodes.includes(decommitment));

    // For each node we're interested in proving, check if its sibling/pair is in the
    // list of decommitments, and push the flag (proof NOT used) to the list of flags.
    // Also, keep track of indices already tested (and its pairs), so we can skip over them.
    for (let j = 0; j < ids.length; j++) {
      const id = ids[j];
      const nodeIndex = (1 << depth) + id;

      if (tested.includes(nodeIndex)) continue;

      const pairIndex = nodeIndex + (id & 1 ? -1 : 1);
      const proofUsed = decommitmentIndices.includes(pairIndex);
      flags.push(!proofUsed);
      skips.push(!tree[pairIndex]);
      tested.push(nodeIndex);
      tested.push(pairIndex);
    }

    // Filter out duplicate ids (since 3 >> 1 and 4 >> 1 are redundant)
    ids = nextIds.filter((index, i) => nextIds.indexOf(index) === i);
    nextIds = [];
  }

  return {
    decommitments: decommitmentIndices.map((i) => Buffer.from(tree[i])).filter((d) => d),
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

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const hashes = leafs.map((leaf) => leaf);
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < flagCount; i++) {
    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;

    if (skips && skips[i]) {
      // TODO: check if this next line can be skipped. I don't think it can.
      hashes[hashWriteIndex++] = hashes[hashReadIndex++];
      continue;
    }

    const left = flags[i] ? hashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= leafCount;
    const right = hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = hashFunction(left, right);
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
    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;

    const skip = skips && and(rightShift(skips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      // TODO: check if this next line can be skipped. I don't think it can.
      hashes[hashWriteIndex++] = hashes[hashReadIndex++];
      continue;
    }

    const flag = and(rightShift(flags, i), oneBuffer).equals(oneBuffer);
    const left = flag ? hashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= leafCount;
    const right = hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = hashFunction(left, right);
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
    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;

    if (skips && skips[i]) {
      // TODO: check if these next lines can be skipped. I don't think they can.
      hashes[hashWriteIndex] = hashes[hashReadIndex];
      newHashes[hashWriteIndex++] = newHashes[hashReadIndex++];
      continue;
    }

    const left = flags[i] ? hashes[hashReadIndex] : decommitments[decommitmentIndex];
    const newLeft = flags[i] ? newHashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= leafCount;
    const right = hashes[hashReadIndex];
    const newRight = newHashes[hashReadIndex++];
    hashes[hashWriteIndex] = hashFunction(left, right);
    newHashes[hashWriteIndex++] = hashFunction(newLeft, newRight);
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
    hashReadIndex %= leafCount;
    hashWriteIndex %= leafCount;

    const skip = skips && and(rightShift(skips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      // TODO: check if these next lines can be skipped. I don't think they can.
      hashes[hashWriteIndex] = hashes[hashReadIndex];
      newHashes[hashWriteIndex++] = newHashes[hashReadIndex++];
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
  }

  const rootIndex = (hashWriteIndex === 0 ? leafCount : hashWriteIndex) - 1;

  return { root: Buffer.from(hashes[rootIndex]), newRoot: Buffer.from(newHashes[rootIndex]) };
};

const getNewRoot = (parameters) => {
  return Buffer.isBuffer(parameters.flags) ? getNewRootBits(parameters) : getNewRootBooleans(parameters);
};

module.exports = { generate, getRoot, getNewRoot };
