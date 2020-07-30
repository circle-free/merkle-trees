'strict';

const chai = require('chai');
const { expect } = chai;
const { buildTree } = require('../src/common');
const { generateMultiProof, verifyMultiProof } = require('../src/multi-proof');

describe('Multi-Proof', () => {
  describe('Generate Multi-Proof', () => {
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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments);

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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
      const proofValid = verifyMultiProof(randomHash, root, leafCount, indices, values, decommitments);

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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
      const proofValid = verifyMultiProof(mixedRoot, randomHash, leafCount, indices, values, decommitments);

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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const proofValid = verifyMultiProof(mixedRoot, root, items.length + 1, indices, values, decommitments);

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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const incorrectIndices = [7, 3, 2];
      const incorrectValues = incorrectIndices.map((i) => leafs[i]);
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, incorrectIndices, incorrectValues, decommitments);

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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const proofValid = verifyMultiProof(
        mixedRoot,
        root,
        leafCount,
        indices.slice(0, -1),
        values.slice(0, -1),
        decommitments
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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
      decommitments[0] = randomHash;
      const proofValid = verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments);

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
      const treeObject = buildTree(leafs);

      const expectedIndices = [7, 3, 1];
      const { mixedRoot, root, leafCount, indices, values, decommitments } = generateMultiProof(
        treeObject.tree,
        expectedIndices
      );

      const verify = () => verifyMultiProof(mixedRoot, root, leafCount, indices, values, decommitments.slice(0, -1));

      expect(verify).to.throw();
    });
  });
});
