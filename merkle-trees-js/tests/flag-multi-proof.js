'strict';

const chai = require('chai');
const { expect } = chai;
const { buildTree } = require('../src/common');
const { generateMultiProof, verifyMultiProof } = require('../src/flag-multi-proof');
const { generateLeafs, swap } = require('./helpers');

// TODO: break up this describe for each the generation and verification

describe('Flag Multi-Proof', () => {
  it('should work for 16 sorted leafs', () => {
    const leafs = generateLeafs(16);
    const { tree } = buildTree(leafs, { sortedHash: true });
    const indices = [1, 4, 5, 10];
    const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, values, decommitments, flags);

    expect(proofValid).to.equal(true);
  });

  it('should work for 16 unsorted leafs.', () => {
    const leafs = generateLeafs(16, { random: true });
    const { tree } = buildTree(leafs, { sortedHash: true });
    const indices = [1, 4, 5, 10];
    const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, values, decommitments, flags);

    expect(proofValid).to.equal(true);
  });

  it('should work for 128 sorted leafs', () => {
    const leafs = generateLeafs(128);
    const { tree } = buildTree(leafs, { sortedHash: true });
    const indices = [0, 4, 5, 10, 72, 127];
    const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, values, decommitments, flags);

    expect(proofValid).to.equal(true);
  });

  it('should work for 128 unsorted leafs', () => {
    const leafs = generateLeafs(128, { random: true });
    const { tree } = buildTree(leafs, { sortedHash: true });
    const indices = [0, 4, 5, 10, 72, 127];
    const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, values, decommitments, flags);

    expect(proofValid).to.equal(true);
  });

  it('should result in same valid proof, regardless of leaf-pair-ordering', () => {
    const leafs = generateLeafs(16, { random: true });
    const { tree } = buildTree(leafs, { sortedHash: true });
    const indices = [1, 4, 5, 10];
    const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, values, decommitments, flags);

    expect(proofValid).to.equal(true);

    const newLeafs = leafs.map((x) => x);
    swap(newLeafs, 4, 5);
    swap(newLeafs, 10, 11);

    const { tree: newTree } = buildTree(newLeafs, { sortedHash: true });
    const newIndices = [1, 4, 5, 11];
    const {
      mixedRoot: newMixedRoot,
      root: newRoot,
      values: newValues,
      decommitments: newDecommitments,
      flags: newFlags,
    } = generateMultiProof(newTree, newIndices);
    const newProofValid = verifyMultiProof(mixedRoot, root, leafCount, newValues, newDecommitments, newFlags);

    expect(newProofValid).to.equal(true);

    decommitments.forEach((decommitment, i) => expect(decommitment.equals(newDecommitments[i])).to.equal(true));
    flags.forEach((flag, i) => expect(flag).to.equal(newFlags[i]));
  });

  it('should result in same valid proof, regardless of node-ordering', () => {
    const leafs = generateLeafs(16, { random: true });
    const { tree } = buildTree(leafs, { sortedHash: true });
    const indices = [1, 4, 5, 10];
    const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, values, decommitments, flags);

    expect(proofValid).to.equal(true);

    const newLeafs = leafs.map((x) => x);
    swap(newLeafs, 4, 6);
    swap(newLeafs, 5, 7);

    const { tree: newTree } = buildTree(newLeafs, { sortedHash: true });
    const newIndices = [1, 6, 7, 10];
    const {
      mixedRoot: newMixedRoot,
      root: newRoot,
      values: newValues,
      decommitments: newDecommitments,
      flags: newFlags,
    } = generateMultiProof(newTree, newIndices);
    const newProofValid = verifyMultiProof(mixedRoot, root, leafCount, newValues, newDecommitments, newFlags);

    expect(newProofValid).to.equal(true);

    decommitments.forEach((decommitment, i) => expect(decommitment.equals(newDecommitments[i])).to.equal(true));
    flags.forEach((flag, i) => expect(flag).to.equal(newFlags[i]));
  });
});
