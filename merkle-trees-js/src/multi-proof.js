'use strict';

const assert = require('assert');
const { hashNode, sortHashNode, to32ByteBuffer, to32ByteBoolBuffer } = require('./utils');
const { leftShift, rightShift, or, and } = require('bitwise-buffer');
const {
  getDepthFromTree,
  verifyMixedRoot,
  getLeafCountFromTree,
  getMixedRoot,
  getRoot,
  computeMixedRoot,
  getRealLeafCountFromTree,
} = require('./merkle-tree');

// Note: Indices must be sorted in ascending order
const generateFlagMultiProof = (tree, indices, options = {}) => {
  const { unbalanced = false } = options;

  const realLeafCount = getRealLeafCountFromTree(tree);
  assert(indices.every((i) => i < realLeafCount));

  let ids = indices.map((i) => i);
  const values = [];
  const tested = [];
  const flags = [];
  const skips = [];
  let decommitmentIndices = [];
  let nextIds = [];
  const treeDepth = getDepthFromTree(tree);

  for (let depth = treeDepth; depth > 0; depth--) {
    // For each node we're interested in proving, add it to the list of values and
    // add it's sibling/pair to list of decommitments. Push half the node's level
    // index to the list of next ids, for the next (higher) depth iteration
    for (let j = 0; j < ids.length; j++) {
      const id = ids[j];
      const nodeIndex = (1 << depth) + id;
      const pairIndex = nodeIndex + (id & 1 ? -1 : 1);
      const pairNode = tree[pairIndex];

      assert(unbalanced || pairNode, 'Cannot create proof for unbalanced tree by default');

      values.push(nodeIndex);
      decommitmentIndices.push(pairIndex);
      nextIds.push(id >> 1);
    }

    // Filter out decommitments that are themselves being proved
    decommitmentIndices = decommitmentIndices.filter((decommitment) => !values.includes(decommitment));

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
    ids = nextIds.filter((value, i) => nextIds.indexOf(value) === i);
    nextIds = [];
  }

  return {
    mixedRoot: getMixedRoot(tree),
    root: getRoot(tree),
    leafCount: realLeafCount,
    values: indices.map((i) => tree[(1 << treeDepth) + i]),
    decommitments: decommitmentIndices.map((di) => tree[di]).filter((d) => d),
    flags,
    hexFlags: to32ByteBoolBuffer(flags),
    flagCount: flags.length,
    skips,
    hexSkips: to32ByteBoolBuffer(skips),
  };
};

const verifyFlagMultiProof = (mixedRoot, root, leafCount, flags, values, decommitments, skips) => {
  if (!verifyMixedRoot(mixedRoot, root, leafCount)) return false;

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const totalFlags = flags.length;
  const totalValues = values.length;
  const hashes = new Array(totalValues);
  let valueIndex = 0;
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < totalFlags; i++) {
    hashReadIndex %= totalValues;
    hashWriteIndex %= totalValues;

    const useValues = valueIndex < totalValues;

    if (skips && skips[i]) {
      hashes[hashWriteIndex++] = useValues ? values[valueIndex++] : hashes[hashReadIndex++];
      continue;
    }

    const left = flags[i]
      ? useValues
        ? values[valueIndex++]
        : hashes[hashReadIndex++]
      : decommitments[decommitmentIndex++];

    hashReadIndex %= totalValues;
    const right = useValues ? values[valueIndex++] : hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = sortHashNode(left, right);
  }

  return hashes[(hashWriteIndex === 0 ? totalValues : hashWriteIndex) - 1].equals(root);
};

// TODO: expose one args become objects
const verifyHexFlagMultiProof = (mixedRoot, root, leafCount, values, totalFlags, hexFlags, decommitments, hexSkips) => {
  if (!verifyMixedRoot(mixedRoot, root, leafCount)) return false;

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const totalValues = values.length;
  const hashes = new Array(totalValues);
  let valueIndex = 0;
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;
  const oneBuffer = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');

  for (let i = 0; i < totalFlags; i++) {
    hashReadIndex %= totalValues;
    hashWriteIndex %= totalValues;

    const useValues = valueIndex < totalValues;
    const skip = skips && and(rightShift(hexSkips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      hashes[hashWriteIndex++] = useValues ? values[valueIndex++] : hashes[hashReadIndex++];
      continue;
    }

    const flag = and(rightShift(hexFlags, i), oneBuffer).equals(oneBuffer);

    const left = flag
      ? useValues
        ? values[valueIndex++]
        : hashes[hashReadIndex++]
      : decommitments[decommitmentIndex++];

    hashReadIndex %= totalValues;
    const right = useValues ? values[valueIndex++] : hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = sortHashNode(left, right);
  }

  return hashes[(hashWriteIndex === 0 ? totalValues : hashWriteIndex) - 1].equals(root);
};

// TODO: test this function
const updateRootWithFlagMultiProof = (mixedRoot, root, leafCount, flags, oldValues, newValues, decommitments) => {
  assert(verifyMixedRoot(mixedRoot, root, leafCount), 'Invalid root parameters.');

  const totalValues = oldValues.length;
  const totalHashes = flags.length;
  const oldHashes = new Array(totalHashes);
  const newHashes = new Array(totalHashes);
  let valueIndex = 0;
  let hashIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < totalHashes; i++) {
    const useValues = valueIndex < totalValues;

    const oldLeft = flags[i]
      ? useValues
        ? oldValues[valueIndex]
        : oldHashes[hashIndex]
      : decommitments[decommitmentIndex];

    const oldRight = useValues ? oldValues[valueIndex] : oldHashes[hashIndex];
    oldHashes[i] = sortHashNode(oldLeft, oldRight);

    const newLeft = flags[i]
      ? useValues
        ? newValues[valueIndex++]
        : newHashes[hashIndex++]
      : decommitments[decommitmentIndex++];

    const newRight = useValues ? newValues[valueIndex++] : newHashes[hashIndex++];
    newHashes[i] = sortHashNode(newLeft, newRight);
  }

  assert(oldHashes[totalHashes - 1].equals(root), 'Invalid proof.');

  return {
    mixedRoot: computeMixedRoot(newHashes[totalHashes - 1], leafCount),
    root: newHashes[totalHashes - 1],
  };
};

// NOTE: indices must be in descending order
const generateIndexedMultiProof = (tree, indices) => {
  const depth = getDepthFromTree(tree);
  const leafCount = getLeafCountFromTree(tree);
  const nodeCount = leafCount << 1;
  const known = Array(nodeCount).fill(false);
  const values = [];
  const decommitments = [];

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'indices must be in descending order');
    known[leafCount + indices[i]] = true;
    values.push(tree[leafCount + indices[i]]);
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const left = known[2 * i];
    const right = known[2 * i + 1];

    if (left ^ right) decommitments.push(tree[2 * i + left]);

    known[i] = left || right;
  }

  return {
    mixedRoot: getMixedRoot(tree),
    root: getRoot(tree),
    leafCount,
    indices,
    values,
    decommitments,
  };
};

// NOTE: indices must be in descending order
const verifyIndexedMultiProof = (mixedRoot, root, leafCount, indices, values, decommitments) => {
  if (!verifyMixedRoot(mixedRoot, root, leafCount)) return false;

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((decommitment) => decommitment);

  const queue = values.map((value, i) => ({ index: leafCount + indices[i], value }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, value } = queue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      return value.equals(root);
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      queue.push({ index: index >> 1, value: hashNode(value, decommits.shift()) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can ne hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, value: hashNode(queue.shift().value, value) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      queue.push({ index: index >> 1, value: hashNode(decommits.shift(), value) });
    }
  }
};

// TODO: test this function
// NOTE: indices must be in descending order
const updateRootWithIndexedMultiProof = (mixedRoot, root, leafCount, indices, oldValues, newValues, decommitments) => {
  assert(verifyMixedRoot(mixedRoot, root, leafCount), 'Invalid root parameters');

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((decommitment) => decommitment);

  const oldQueue = oldValues.map((value, i) => ({ index: leafCount + indices[i], value }));
  const newQueue = newValues.map((value, i) => ({ index: leafCount + indices[i], value }));

  while (true) {
    assert(oldQueue.length >= 1, 'Something went wrong.');

    const { index, value: oldValue } = oldQueue.shift();
    const { value: newValue } = newQueue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      assert(oldValue.equals(root), 'Invalid proof.');

      return { mixedRoot: computeMixedRoot(newValue, leafCount), root: newValue };
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      oldQueue.push({ index: index >> 1, value: hashNode(oldValue, decommits.shift()) });
      newQueue.push({ index: index >> 1, value: hashNode(newValue, decommits.shift()) });
    } else if (oldQueue.length > 0 && oldQueue[0].index === index - 1) {
      // Odd nodes can ne hashed with neighbor on left (hash stack)
      oldQueue.push({ index: index >> 1, value: hashNode(oldQueue.shift().value, oldValue) });
      newQueue.push({ index: index >> 1, value: hashNode(newQueue.shift().value, newValue) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      oldQueue.push({ index: index >> 1, value: hashNode(decommits.shift(), oldValue) });
      newQueue.push({ index: index >> 1, value: hashNode(decommits.shift(), newValue) });
    }
  }
};

const generateMultiProof = (tree, indices, options = {}) => {
  const { indexed = false, unbalanced = false } = options;
  const generate = indexed ? generateIndexedMultiProof : generateFlagMultiProof;
  return generate(tree, indices, { unbalanced });
};

const verifyMultiProof = (mixedRoot, root, leafCount, helpers, values, decommitments, options = {}) => {
  const { indexed = false } = options;
  const verify = indexed ? verifyIndexedMultiProof : verifyFlagMultiProof;
  return verify(mixedRoot, root, leafCount, helpers, values, decommitments);
};

// TODO: test this function
const updateRootWithMultiProof = (mixedRoot, root, leafCount, helpers, oldValues, newValues, decommitments) => {
  const { indexed = false } = options;
  const update = indexed ? updateRootWithIndexedMultiProof : updateRootWithFlagMultiProof;
  return update(mixedRoot, root, leafCount, helpers, oldValues, newValues, decommitments);
};

module.exports = {
  generateMultiProof,
  verifyMultiProof,
  updateRootWithMultiProof,
};
