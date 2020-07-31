'strict';

const chai = require('chai');
const { expect } = chai;
const { generateLeafs, swap } = require('./helpers');
const { buildTree } = require('../src/common');
const { generateMultiProof, verifyMultiProof } = require('../src/multi-proof');

describe('Multi-Proofs', () => {
  describe('Indexed Multi-Proof', () => {
    const options = { indexed: true };

    describe('Generate Indexed Multi-Proof', () => {
      it('should deterministically generate a Multi-Proof.', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const expectMixedRoot = '6bf98ce50fff09718e4801a2be1668fb47d70d065f7eef435c280e384d14d236';
        const expectRoot = '6f4feb766c4e9e71bf038b8df02f0966e2bf98fe1eaacfd96e5d036664ca1b3c';

        const expectedDecommitments = [
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000001',
          'bfd358e93f18da3ed276c3afdbdba00b8f0b6008a03476a6a86bd6320ee6938b',
        ];

        expect(mixedRoot.toString('hex')).to.equal(expectMixedRoot);
        expect(root.toString('hex')).to.equal(expectRoot);
        expect(leafCount).to.equal(items.length);
        indices.forEach((index, i) => expect(index).to.equal(expectedIndices[i]));
        values.forEach((value, i) => expect(value.toString('hex')).to.equal(items[expectedIndices[i]]));
        decommitments.forEach((value, i) => expect(value.toString('hex')).to.equal(expectedDecommitments[i]));
      });
    });

    describe('Verify Multi-Proof', () => {
      it('should verify a valid Multi-Proof.', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments, options);

        expect(proofValid).to.equal(true);
      });

      it('should fail to verify an invalid Multi-Proof (incorrect mixedRoot).', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
        const proofValid = verifyMultiProof(randomHash, root, leafCount, indices, values, decommitments, options);

        expect(proofValid).to.equal(false);
      });

      it('should fail to verify an invalid Multi-Proof (incorrect root).', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
        const proofValid = verifyMultiProof(mixedRoot, randomHash, leafCount, indices, values, decommitments, options);

        expect(proofValid).to.equal(false);
      });

      it('should fail to verify an invalid Multi-Proof (incorrect leaf count).', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const proofValid = verifyMultiProof(mixedRoot, root, items.length + 1, indices, values, decommitments, options);

        expect(proofValid).to.equal(false);
      });

      it('should fail to verify an invalid Multi-Proof (incorrect index-value pairs).', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const incorrectIndices = [7, 3, 2];
        const incorrectValues = incorrectIndices.map((i) => leafs[i]);
        const proofValid = verifyMultiProof(
          mixedRoot,
          root,
          leafCount,
          incorrectIndices,
          incorrectValues,
          decommitments,
          options
        );

        expect(proofValid).to.equal(false);
      });

      it('should fail to verify an invalid Multi-Proof (incorrect index-value pair count).', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const proofValid = verifyMultiProof(
          mixedRoot,
          root,
          leafCount,
          indices.slice(0, -1),
          values.slice(0, -1),
          decommitments,
          options
        );

        expect(proofValid).to.equal(false);
      });

      it('should fail to verify an invalid Multi-Proof (incorrect decommitments).', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
        decommitments[0] = randomHash;
        const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments, options);

        expect(proofValid).to.equal(false);
      });

      it('should fail to verify an invalid Multi-Proof (incorrect decommitment count).', () => {
        const items = [
          '0000000000000000000000000000000000000000000000000000000000000001',
          '0000000000000000000000000000000000000000000000000000000000000002',
          '0000000000000000000000000000000000000000000000000000000000000003',
          '0000000000000000000000000000000000000000000000000000000000000004',
          '0000000000000000000000000000000000000000000000000000000000000005',
          '0000000000000000000000000000000000000000000000000000000000000006',
          '0000000000000000000000000000000000000000000000000000000000000007',
          '0000000000000000000000000000000000000000000000000000000000000008',
        ];

        const leafs = items.map((item) => Buffer.from(item, 'hex'));
        const { tree } = buildTree(leafs);

        const expectedIndices = [7, 3, 1];
        const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
          tree,
          expectedIndices,
          options
        );

        const verify = () =>
          verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments.slice(0, -1), options);

        expect(verify).to.throw();
      });
    });
  });

  describe('Flag Multi-Proof', () => {
    it('should work for 16 sorted leafs', () => {
      const leafs = generateLeafs(16);
      const { tree } = buildTree(leafs, { sortedHash: true });
      const indices = [1, 4, 5, 10];
      const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, flags, values, decommitments);

      expect(proofValid).to.equal(true);
    });

    it('should work for 16 unsorted leafs.', () => {
      const leafs = generateLeafs(16, { random: true });
      const { tree } = buildTree(leafs, { sortedHash: true });
      const indices = [1, 4, 5, 10];
      const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, flags, values, decommitments);

      expect(proofValid).to.equal(true);
    });

    it('should work for 128 sorted leafs', () => {
      const leafs = generateLeafs(128);
      const { tree } = buildTree(leafs, { sortedHash: true });
      const indices = [0, 4, 5, 10, 72, 127];
      const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, flags, values, decommitments);

      expect(proofValid).to.equal(true);
    });

    it('should work for 128 unsorted leafs', () => {
      const leafs = generateLeafs(128, { random: true });
      const { tree } = buildTree(leafs, { sortedHash: true });
      const indices = [0, 4, 5, 10, 72, 127];
      const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, flags, values, decommitments);

      expect(proofValid).to.equal(true);
    });

    it('should result in same valid proof, regardless of leaf-pair-ordering', () => {
      const leafs = generateLeafs(16, { random: true });
      const { tree } = buildTree(leafs, { sortedHash: true });
      const indices = [1, 4, 5, 10];
      const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, flags, values, decommitments);

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
      const newProofValid = verifyMultiProof(mixedRoot, root, leafCount, newFlags, newValues, newDecommitments);

      expect(newProofValid).to.equal(true);

      decommitments.forEach((decommitment, i) => expect(decommitment.equals(newDecommitments[i])).to.equal(true));
      flags.forEach((flag, i) => expect(flag).to.equal(newFlags[i]));
    });

    it('should result in same valid proof, regardless of node-ordering', () => {
      const leafs = generateLeafs(16, { random: true });
      const { tree } = buildTree(leafs, { sortedHash: true });
      const indices = [1, 4, 5, 10];
      const { mixedRoot, root, leafCount, values, decommitments, flags } = generateMultiProof(tree, indices);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, flags, values, decommitments);

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
      const newProofValid = verifyMultiProof(mixedRoot, root, leafCount, newFlags, newValues, newDecommitments);

      expect(newProofValid).to.equal(true);

      decommitments.forEach((decommitment, i) => expect(decommitment.equals(newDecommitments[i])).to.equal(true));
      flags.forEach((flag, i) => expect(flag).to.equal(newFlags[i]));
    });
  });
});
