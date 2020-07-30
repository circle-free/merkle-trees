'strict';

const chai = require('chai');
const { expect } = chai;
const { generateLeafs, generateRandomLeaf } = require('./helpers');
const { buildTree } = require('../src/common');
const { generateMultiProof, verifyMultiProof } = require('../src/multi-proof');
const { buildTree: buildAppendableTree, generateAppendProof, appendLeaf } = require('../src/appendable-tree');

describe('Multi-Proof Cases', () => {
  it('Multi-Proof for the first 12 sequential leafs, out of 512', () => {
    const leafs = generateLeafs(512, { seed: Buffer.from('ff', 'hex') });
    const { tree } = buildTree(leafs);
    const indices = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments);
    console.log(
      `      Multi-Proof, for the first 12 sequential leafs, out of 512, contains ${decommitments.length} decommitments.`
    );

    expect(proofValid).to.equal(true);
  });

  it('Multi-Proof for 12 arbitrary leafs, out of 512', () => {
    const leafs = generateLeafs(512, { seed: Buffer.from('ff', 'hex') });
    const { tree } = buildTree(leafs);
    const indices = [485, 423, 362, 350, 230, 175, 125, 98, 83, 50, 32, 12];
    const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments);
    console.log(
      `      Multi-Proof, for 12 arbitrary leafs, out of 512, contains ${decommitments.length} decommitments.`
    );

    expect(proofValid).to.equal(true);
  });

  it('Multi-Proof for all 16 leafs, out of 16', () => {
    const leafs = generateLeafs(16, { seed: Buffer.from('ff', 'hex') });
    const { tree } = buildTree(leafs);
    const indices = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments);
    console.log(
      `      Multi-Proof, for all 16 arbitrary leafs, out of 16, contains ${decommitments.length} decommitments.`
    );

    expect(proofValid).to.equal(true);
  });

  it('Multi-Proof for 6 arbitrary leafs, out of 4096', () => {
    const leafs = generateLeafs(4096, { seed: Buffer.from('ff', 'hex') });
    const { tree } = buildTree(leafs);
    const indices = [4000, 3471, 2510, 1789, 922, 46];
    const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices);
    const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments);
    console.log(
      `      Multi-Proof, for 6 arbitrary leafs, out of 4096, contains ${decommitments.length} decommitments.`
    );

    expect(proofValid).to.equal(true);
  });
});

describe('Append-Proof Cases', () => {
  it('Append-Proof for tree with 500 leafs', () => {
    const leafs = generateLeafs(500, { seed: Buffer.from('ff', 'hex') });
    const { tree } = buildAppendableTree(leafs);
    const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, 500);
    const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
      generateRandomLeaf(),
      mixedRoot,
      root,
      realLeafCount,
      decommitments
    );
    console.log(`      Append-Proof, for a tree with 500 leafs, contains ${decommitments.length} decommitments.`);

    expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
    expect(newRoot.equals(root)).to.equal(false);
    expect(newRealLeafCount).to.not.equal(realLeafCount);
  });

  it('Append-Proof for tree with 1000 leafs', () => {
    const leafs = generateLeafs(1000, { seed: Buffer.from('ff', 'hex') });
    const { tree } = buildAppendableTree(leafs);
    const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, 1000);
    const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
      generateRandomLeaf(),
      mixedRoot,
      root,
      realLeafCount,
      decommitments
    );
    console.log(`      Append-Proof, for a tree with 1000 leafs, contains ${decommitments.length} decommitments.`);

    expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
    expect(newRoot.equals(root)).to.equal(false);
    expect(newRealLeafCount).to.not.equal(realLeafCount);
  });

  it('Append-Proof for tree with 4000 leafs', () => {
    const leafs = generateLeafs(4000, { seed: Buffer.from('ff', 'hex') });
    const { tree } = buildAppendableTree(leafs);
    const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, 4000);
    const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
      generateRandomLeaf(),
      mixedRoot,
      root,
      realLeafCount,
      decommitments
    );
    console.log(`      Append-Proof, for a tree with 4000 leafs, contains ${decommitments.length} decommitments.`);

    expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
    expect(newRoot.equals(root)).to.equal(false);
    expect(newRealLeafCount).to.not.equal(realLeafCount);
  });

  for (let i = 8180; i <= 8192; i++) {
    it(`Append-Proof for tree with ${i} leafs`, () => {
      const leafs = generateLeafs(i, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildAppendableTree(leafs);
      const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, i);
      const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
        generateRandomLeaf(),
        mixedRoot,
        root,
        realLeafCount,
        decommitments
      );
      console.log(`      Append-Proof, for a tree with ${i} leafs, contains ${decommitments.length} decommitments.`);

      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newRoot.equals(root)).to.equal(false);
      expect(newRealLeafCount).to.not.equal(realLeafCount);
    });
  }
});
