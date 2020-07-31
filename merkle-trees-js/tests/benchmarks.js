'strict';

const chai = require('chai');
const { expect } = chai;
const { generateLeafs, generateRandomLeaf } = require('./helpers');
const { buildTree } = require('../src/merkle-tree');
const { generateMultiProof, verifyMultiProof } = require('../src/multi-proof');
const { generateAppendProof, appendLeaf } = require('../src/append-proof');

describe('Some Samples and Benchmarking', () => {
  describe('Indexed Multi-Proof Cases', () => {
    const options = { indexed: true };

    it('Multi-Proof for the first 12 sequential leafs, out of 512', () => {
      const leafs = generateLeafs(512, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildTree(leafs);
      const indices = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
      const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices, options);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments, options);
      console.log(
        `      Multi-Proof for first 12/512 sequential leafs, contains ${decommitments.length} decommitments.`
      );

      expect(proofValid).to.equal(true);
    });

    it('Multi-Proof for 12 arbitrary leafs, out of 512', () => {
      const leafs = generateLeafs(512, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildTree(leafs);
      const indices = [485, 423, 362, 350, 230, 175, 125, 98, 83, 50, 32, 12];
      const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices, options);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments, options);
      console.log(`      Multi-Proof for 12/512 arbitrary leafs, contains ${decommitments.length} decommitments.`);

      expect(proofValid).to.equal(true);
    });

    it('Multi-Proof for all 16 leafs, out of 16', () => {
      const leafs = generateLeafs(16, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildTree(leafs);
      const indices = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
      const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices, options);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments, options);
      console.log(`      Multi-Proof for all 16/26 arbitrary leafs, contains ${decommitments.length} decommitments.`);

      expect(proofValid).to.equal(true);
    });

    it('Multi-Proof for 6 arbitrary leafs, out of 4096', () => {
      const leafs = generateLeafs(4096, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildTree(leafs);
      const indices = [4000, 3471, 2510, 1789, 922, 46];
      const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indices, options);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments, options);
      console.log(`      Multi-Proof for 6/4096 arbitrary leafs, contains ${decommitments.length} decommitments.`);

      expect(proofValid).to.equal(true);
    });
  });

  describe('Append-Proof Cases', () => {
    it('Append-Proof for tree with 500 leafs', () => {
      const leafs = generateLeafs(500, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildTree(leafs, { unbalanced: true });
      const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, 500);
      const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
        generateRandomLeaf(),
        mixedRoot,
        root,
        realLeafCount,
        decommitments
      );
      console.log(`      Append-Proof for 500-leaf tree, contains ${decommitments.length} decommitments.`);

      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newRoot.equals(root)).to.equal(false);
      expect(newRealLeafCount).to.not.equal(realLeafCount);
    });

    it('Append-Proof for tree with 1000 leafs', () => {
      const leafs = generateLeafs(1000, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildTree(leafs, { unbalanced: true });
      const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, 1000);
      const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
        generateRandomLeaf(),
        mixedRoot,
        root,
        realLeafCount,
        decommitments
      );
      console.log(`      Append-Proof for 1000-leaf tree, contains ${decommitments.length} decommitments.`);

      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newRoot.equals(root)).to.equal(false);
      expect(newRealLeafCount).to.not.equal(realLeafCount);
    });

    it('Append-Proof for tree with 4000 leafs', () => {
      const leafs = generateLeafs(4000, { seed: Buffer.from('ff', 'hex') });
      const { tree } = buildTree(leafs, { unbalanced: true });
      const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, 4000);
      const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
        generateRandomLeaf(),
        mixedRoot,
        root,
        realLeafCount,
        decommitments
      );
      console.log(`      Append-Proof for 4000-leaf tree, contains ${decommitments.length} decommitments.`);

      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newRoot.equals(root)).to.equal(false);
      expect(newRealLeafCount).to.not.equal(realLeafCount);
    });

    for (let i = 8180; i <= 8192; i++) {
      it(`Append-Proof for tree with ${i} leafs`, () => {
        const leafs = generateLeafs(i, { seed: Buffer.from('ff', 'hex') });
        const { tree } = buildTree(leafs, { unbalanced: true });
        const { mixedRoot, root, realLeafCount, decommitments } = generateAppendProof(tree, i);
        const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(
          generateRandomLeaf(),
          mixedRoot,
          root,
          realLeafCount,
          decommitments
        );
        console.log(`      Append-Proof for ${i}-leaf tree, contains ${decommitments.length} decommitments.`);

        expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
        expect(newRoot.equals(root)).to.equal(false);
        expect(newRealLeafCount).to.not.equal(realLeafCount);
      });
    }
  });

  describe('Indexed vs Flag Multi-Proof', () => {
    it('Some samples of 12 out of 512', () => {
      const leafs = generateLeafs(512, { seed: Buffer.from('ff', 'hex') });

      const options = { indexed: true };
      const { tree, depth } = buildTree(leafs);
      const indicesDesc = [485, 423, 362, 350, 230, 175, 125, 98, 83, 50, 32, 12];
      const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indicesDesc, options);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indicesDesc, values, decommitments, options);

      // console.log(`"0x${root.toString('hex')}"`);
      // console.log(depth);
      // console.log(`[${indicesDesc.join(', ')}]`);
      // console.log(`[${values.map(v => `"0x${v.toString('hex')}"`).join(', ')}]`);
      // console.log(`[${decommitments.map(d => `"0x${d.toString('hex')}"`).join(', ')}]`);

      expect(proofValid).to.equal(true);

      const { tree: newTree } = buildTree(leafs, { sortedHash: true });
      const indicesAsc = indicesDesc.reverse();
      const {
        mixedRoot: newMixedRoot,
        root: newRoot,
        values: newValues,
        decommitments: newDecommitments,
        flags,
      } = generateMultiProof(newTree, indicesAsc);
      const flagProofValid = verifyMultiProof(newMixedRoot, newRoot, leafCount, flags, newValues, newDecommitments);

      expect(flagProofValid).to.equal(true);

      // console.log(`"0x${newRoot.toString('hex')}"`);
      // console.log(`[${newValues.map(v => `"0x${v.toString('hex')}"`).join(', ')}]`);
      // console.log(`[${newDecommitments.map(d => `"0x${d.toString('hex')}"`).join(', ')}]`);
      // console.log(`[${flags.join(', ')}]`);
    });

    it('Some samples of 6 out of 1024', () => {
      const leafs = generateLeafs(1024, { seed: Buffer.from('ff', 'hex') });

      const options = { indexed: true };
      const { tree, depth } = buildTree(leafs);
      const indicesDesc = [100, 80, 50, 32, 11, 2];
      const { mixedRoot, root, leafCount, values, decommitments } = generateMultiProof(tree, indicesDesc, options);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indicesDesc, values, decommitments, options);

      // console.log(`"0x${root.toString('hex')}"`);
      // console.log(depth);
      // console.log(`[${indicesDesc.join(', ')}]`);
      // console.log(`[${values.map(v => `"0x${v.toString('hex')}"`).join(', ')}]`);
      // console.log(`[${decommitments.map(d => `"0x${d.toString('hex')}"`).join(', ')}]`);

      expect(proofValid).to.equal(true);

      const { tree: newTree } = buildTree(leafs, { sortedHash: true });
      const indicesAsc = indicesDesc.reverse();
      const {
        mixedRoot: newMixedRoot,
        root: newRoot,
        values: newValues,
        decommitments: newDecommitments,
        flags,
      } = generateMultiProof(newTree, indicesAsc);
      const flagProofValid = verifyMultiProof(newMixedRoot, newRoot, leafCount, flags, newValues, newDecommitments);

      expect(flagProofValid).to.equal(true);

      // console.log(`"0x${newRoot.toString('hex')}"`);
      // console.log(`[${newValues.map(v => `"0x${v.toString('hex')}"`).join(', ')}]`);
      // console.log(`[${newDecommitments.map(d => `"0x${d.toString('hex')}"`).join(', ')}]`);
      // console.log(`[${flags.join(', ')}]`);
    });
  });
});
