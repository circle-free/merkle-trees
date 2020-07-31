'use strict';

// TODO: rename stuff to be consistent with project nomenclature

const assert = require('assert');
const { hashNode, sortHashNode, to32ByteBuffer } = require('./utils');
const { getDepthFromTree, verifyMixedRoot } = require('./common');

// Indices must be sorted in ascending order
const generateMultiProof = (tree, indices) => {
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
    mixedRoot: tree[0],
    root: tree[1],
    leafCount: tree.length >> 1,
    values: indices.map((i) => tree[(1 << treeDepth) + i]),
    decommitments: proofs,
    flags,
  };
};

const verifyMultiProof = (mixedRoot, root, leafCount, values, proofs, flags) => {
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

const updateRootMultiProof = (mixedRoot, root, leafCount, oldValues, newValues, proofs, flags) => {
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
    mixedRoot: hashNode(to32ByteBuffer(leafCount), newHashes[totalHashes - 1]),
    root: newHashes[totalHashes - 1],
  };
};

module.exports = {
  generateMultiProof,
  verifyMultiProof,
  updateRootMultiProof,
};
