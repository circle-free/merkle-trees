'strict';

const chai = require('chai');
const { expect } = chai;
const { buildTree, generateProof, verifyProof } = require('../src/common');

describe('Common Merkle-Tree', () => {
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

  describe('Generate Proof', () => {
    it('should deterministically generate a Proof for a Merkle Tree with 8 leafs.', () => {
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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const expectMixedRoot = '6bf98ce50fff09718e4801a2be1668fb47d70d065f7eef435c280e384d14d236';
      const expectRoot = '6f4feb766c4e9e71bf038b8df02f0966e2bf98fe1eaacfd96e5d036664ca1b3c';
      const expectedValue = items[5];

      const expectedDecommitments = [
        'a9bb8c3f1f12e9aa903a50c47f314b57610a3ab32f2d463293f58836def38d36',
        '24cd397636bedc6cf9b490d0edd57c769c19b367fb7d5c2344ae1ddc7d21c144',
        '0000000000000000000000000000000000000000000000000000000000000005',
      ];

      expect(mixedRoot.toString('hex')).to.equal(expectMixedRoot);
      expect(root.toString('hex')).to.equal(expectRoot);
      expect(leafCount).to.equal(items.length);
      expect(index).to.equal(5);
      expect(value.toString('hex')).to.equal(expectedValue);
      decommitments.forEach((value, i) => expect(value.toString('hex')).to.equal(expectedDecommitments[i]));
    });

    it('should deterministically generate a Proof for a Merkle Tree with 1 leafs.', () => {
      const items = ['0000000000000000000000000000000000000000000000000000000000000001'];

      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const { tree } = buildTree(leafs);

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 0);

      const expectMixedRoot = 'cc69885fda6bcc1a4ace058b4a62bf5e179ea78fd58a1ccd71c22cc9b688792f';
      const expectRoot = items[0];
      const expectedValue = items[0];

      const expectedDecommitments = [];

      expect(mixedRoot.toString('hex')).to.equal(expectMixedRoot);
      expect(root.toString('hex')).to.equal(expectRoot);
      expect(leafCount).to.equal(items.length);
      expect(index).to.equal(0);
      expect(value.toString('hex')).to.equal(expectedValue);
      decommitments.forEach((value, i) => expect(value.toString('hex')).to.equal(expectedDecommitments[i]));
    });
  });

  describe('Verify Multi-Proof', () => {
    it('should verify a valid Proof for a Merkle Tree with 8 leafs.', () => {
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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);
      const proofValid = verifyProof(mixedRoot, root, leafCount, index, value, decommitments);

      expect(proofValid).to.equal(true);
    });

    it('should verify a valid Proof for a Merkle Tree with 1 leaf.', () => {
      const items = ['0000000000000000000000000000000000000000000000000000000000000001'];

      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const { tree } = buildTree(leafs);

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 0);
      const proofValid = verifyProof(mixedRoot, root, leafCount, index, value, decommitments);

      expect(proofValid).to.equal(true);
    });

    it('should fail to verify an invalid Proof (incorrect mixedRoot).', () => {
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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
      const proofValid = verifyProof(randomHash, root, leafCount, index, value, decommitments);

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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
      const proofValid = verifyProof(mixedRoot, randomHash, leafCount, index, value, decommitments);

      expect(proofValid).to.equal(false);
    });

    it('should fail to verify an invalid Multi-Proof (incorrect index).', () => {
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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const proofValid = verifyProof(mixedRoot, root, leafCount, 6, value, decommitments);

      expect(proofValid).to.equal(false);
    });

    it('should fail to verify an invalid Multi-Proof (incorrect value).', () => {
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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const proofValid = verifyProof(mixedRoot, root, leafCount, index, leafs[6], decommitments);

      expect(proofValid).to.equal(false);
    });

    it('should fail to verify an invalid Multi-Proof (incorrect index and value).', () => {
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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const proofValid = verifyProof(mixedRoot, root, leafCount, 6, leafs[6], decommitments);

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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const randomHash = Buffer.from('000000000000000000000000000000000000000000000000000000000000000a', 'hex');
      decommitments[0] = randomHash;
      const proofValid = verifyProof(mixedRoot, root, leafCount, index, value, decommitments);

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

      const { mixedRoot, root, leafCount, index, value, decommitments } = generateProof(tree, 5);

      const proofValid = verifyProof(mixedRoot, root, leafCount, index, value, decommitments.slice(0, -1));

      expect(proofValid).to.equal(false);
    });
  });
});
