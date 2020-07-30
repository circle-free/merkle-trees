'strict';

const chai = require('chai');
const { expect } = chai;
const { buildTree, generateMultiProof, verifyMultiProof } = require('../src/multi-proof');

describe('Multi-Proof', () => {
  describe('Build Merkle Tree', () => {
    it('should deterministically build a Merkle Tree.', () => {
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
      const { tree, mixedRoot, root, realLeafCount, leafCount, depth } = buildTree(leafs);

      const expectedNodes = [
        '6bf98ce50fff09718e4801a2be1668fb47d70d065f7eef435c280e384d14d236',
        '6f4feb766c4e9e71bf038b8df02f0966e2bf98fe1eaacfd96e5d036664ca1b3c',
        'a9bb8c3f1f12e9aa903a50c47f314b57610a3ab32f2d463293f58836def38d36',
        '9f71e1879e3b8579db9b2e78c3cea73f3878b754afdbef917992e6764d1741c9',
        'e90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0',
        '2e174c10e159ea99b867ce3205125c24a42d128804e4070ed6fcc8cc98166aa0',
        'bfd358e93f18da3ed276c3afdbdba00b8f0b6008a03476a6a86bd6320ee6938b',
        '24cd397636bedc6cf9b490d0edd57c769c19b367fb7d5c2344ae1ddc7d21c144',
        '0000000000000000000000000000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000000000000000000000000000004',
        '0000000000000000000000000000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000000000000000000000000000006',
        '0000000000000000000000000000000000000000000000000000000000000007',
        '0000000000000000000000000000000000000000000000000000000000000008',
      ];

      tree.forEach((node, i) => expect(node.toString('hex')).to.equal(expectedNodes[i]));
      expect(mixedRoot.toString('hex')).to.equal(expectedNodes[0]);
      expect(root.toString('hex')).to.equal(expectedNodes[1]);
      expect(realLeafCount).to.equal(items.length);
      expect(leafCount).to.equal(items.length);
      expect(depth).to.equal(3);
    });
  });

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
