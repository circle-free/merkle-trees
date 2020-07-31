'use strict';

const assert = require('assert');
const { hashNode, sortHashNode } = require('./utils');
const {
  getDepthFromTree,
  verifyMixedRoot,
  getLeafCountFromTree,
  getMixedRoot,
  getRoot,
  computeMixedRoot,
} = require('./common');

// Note: Indices must be sorted in ascending order
const generateFlagMultiProof = (tree, indices) => {
  let ids = indices.map((i) => i);
  const hashes = [];
  const tested = [];
  const flags = [];
  let proofs = [];
  let nextIds = [];
  const treeDepth = getDepthFromTree(tree);

  for (let depth = treeDepth; depth > 0; depth--) {
    for (let j = 0; j < ids.length; j++) {
      const id = ids[j];
      const nodeIndex = (1 << depth) + id;
      const node = tree[nodeIndex];
      const pairIndex = nodeIndex + (id & 1 ? -1 : 1);
      const pairNode = tree[pairIndex];

      hashes.push(node);
      proofs.push(pairNode);
      nextIds.push(id >> 1);
    }

    proofs = proofs.filter((value) => !hashes.includes(value));

    for (let j = 0; j < ids.length; j++) {
      const id = ids[j];
      const nodeIndex = (1 << depth) + id;
      const node = tree[nodeIndex];

      if (tested.includes(nodeIndex)) continue;

      const pairIndex = nodeIndex + (id & 1 ? -1 : 1);
      const pairNode = tree[pairIndex];
      const proofUsed = proofs.includes(pairNode);
      flags.push(!proofUsed);
      tested.push(nodeIndex);
      tested.push(pairIndex);
    }

    ids = nextIds.filter((value, i) => nextIds.indexOf(value) === i);
    nextIds = [];
  }

  return {
    mixedRoot: getMixedRoot(tree),
    root: getRoot(tree),
    leafCount: tree.length >> 1,
    values: indices.map((i) => tree[(1 << treeDepth) + i]),
    decommitments: proofs,
    flags,
  };
};

const verifyFlagMultiProof = (mixedRoot, root, leafCount, flags, values, proofs) => {
  if (!verifyMixedRoot(mixedRoot, root, leafCount)) return false;

  const totalValues = values.length;
  const totalHashes = flags.length;
  const hashes = new Array(totalHashes);
  let leafPosition = 0;
  let hashPosition = 0;
  let proofPosition = 0;

  for (let i = 0; i < totalHashes; i++) {
    const useValues = leafPosition < totalValues;
    const left = flags[i] ? (useValues ? values[leafPosition++] : hashes[hashPosition++]) : proofs[proofPosition++];
    const right = useValues ? values[leafPosition++] : hashes[hashPosition++];
    hashes[i] = sortHashNode(left, right);
  }

  return hashes[totalHashes - 1].equals(root);
};

// TODO: test this function
const updateRootWithFlagMultiProof = (mixedRoot, root, leafCount, flags, oldValues, newValues, proofs) => {
  assert(verifyMixedRoot(mixedRoot, root, leafCount), 'Invalid root parameters.');

  const totalValues = oldValues.length;
  const totalHashes = flags.length;
  const oldHashes = new Array(totalHashes);
  const newHashes = new Array(totalHashes);
  let leafPosition = 0;
  let hashPosition = 0;
  let proofPosition = 0;

  for (let i = 0; i < totalHashes; i++) {
    const useValues = leafPosition < totalValues;

    const oldLeft = flags[i]
      ? useValues
        ? oldValues[leafPosition++]
        : oldHashes[hashPosition++]
      : proofs[proofPosition++];
    const oldRight = useValues ? oldValues[leafPosition++] : oldHashes[hashPosition++];
    oldHashes[i] = sortHashNode(oldLeft, oldRight);

    const newLeft = flags[i]
      ? useValues
        ? newValues[leafPosition++]
        : newHashes[hashPosition++]
      : proofs[proofPosition++];
    const newRight = useValues ? newValues[leafPosition++] : newHashes[hashPosition++];
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
  const { indexed = false } = options;
  const generate = indexed ? generateIndexedMultiProof : generateFlagMultiProof;
  return generate(tree, indices);
};

const verifyMultiProof = (mixedRoot, root, leafCount, helpers, values, decommitments, options = {}) => {
  const { indexed = false } = options;
  const verify = indexed ? verifyIndexedMultiProof : verifyFlagMultiProof;
  return verify(mixedRoot, root, leafCount, helpers, values, decommitments);
};

// TODO: test this function
const updateRootWithMultiProof = () => {
  const { indexed = false } = options;
  const verify = indexed ? updateRootWithIndexedMultiProof : updateRootWithFlagMultiProof;
  return verify(mixedRoot, root, leafCount, helpers, oldValues, newValues, decommitments);
};

module.exports = {
  generateMultiProof,
  verifyMultiProof,
  updateRootWithMultiProof,
};
