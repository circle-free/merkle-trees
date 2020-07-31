'strict';

const chai = require('chai');
const { expect } = chai;
const { generateLeafs } = require('./helpers');
const { buildTree, generateProof, verifyProof, updateTree, updateWithProof } = require('../src/merkle-tree');

describe('Common Merkle-Tree', () => {
  describe('Build Merkle Tree', () => {
    it('should deterministically build a balanced Merkle Tree with 8 leafs.', () => {
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

    it('should deterministically build a balanced Merkle Tree with 1 leaf.', () => {
      const items = ['0000000000000000000000000000000000000000000000000000000000000001'];
      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const { tree, mixedRoot, root, realLeafCount, leafCount, depth } = buildTree(leafs);

      const expectedNodes = [
        'cc69885fda6bcc1a4ace058b4a62bf5e179ea78fd58a1ccd71c22cc9b688792f',
        '0000000000000000000000000000000000000000000000000000000000000001',
      ];

      tree.forEach((node, i) => expect(node.toString('hex')).to.equal(expectedNodes[i]));
      expect(mixedRoot.toString('hex')).to.equal(expectedNodes[0]);
      expect(root.toString('hex')).to.equal(expectedNodes[1]);
      expect(realLeafCount).to.equal(items.length);
      expect(leafCount).to.equal(items.length);
      expect(depth).to.equal(0);
    });

    it('should deterministically build an unbalanced Merkle Tree with 8 leafs.', () => {
      const items = [
        '0000000000000000000000000000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000000000000000000000000000004',
        '0000000000000000000000000000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000000000000000000000000000006',
        '0000000000000000000000000000000000000000000000000000000000000007',
        '0000000000000000000000000000000000000000000000000000000000000008',
        '0000000000000000000000000000000000000000000000000000000000000009',
      ];

      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const options = { unbalanced: true };
      const { tree, mixedRoot, root, realLeafCount, leafCount, depth } = buildTree(leafs, options);

      const expectedNodes = [
        'ee313c2bba3814191d06acf5ce954c9a96ca757b6d071852c7a6ec64479d6e9d',
        '4b74fc901bf589acbcf6e59c166c50ad936798fe554b9534403c1f5aceee28a5',
        '6f4feb766c4e9e71bf038b8df02f0966e2bf98fe1eaacfd96e5d036664ca1b3c',
        '0000000000000000000000000000000000000000000000000000000000000009',
        'a9bb8c3f1f12e9aa903a50c47f314b57610a3ab32f2d463293f58836def38d36',
        '9f71e1879e3b8579db9b2e78c3cea73f3878b754afdbef917992e6764d1741c9',
        '0000000000000000000000000000000000000000000000000000000000000009',
        null,
        'e90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0',
        '2e174c10e159ea99b867ce3205125c24a42d128804e4070ed6fcc8cc98166aa0',
        'bfd358e93f18da3ed276c3afdbdba00b8f0b6008a03476a6a86bd6320ee6938b',
        '24cd397636bedc6cf9b490d0edd57c769c19b367fb7d5c2344ae1ddc7d21c144',
        '0000000000000000000000000000000000000000000000000000000000000009',
        null,
        null,
        null,
        '0000000000000000000000000000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000000000000000000000000000004',
        '0000000000000000000000000000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000000000000000000000000000006',
        '0000000000000000000000000000000000000000000000000000000000000007',
        '0000000000000000000000000000000000000000000000000000000000000008',
        '0000000000000000000000000000000000000000000000000000000000000009',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];

      const expectedLeafCount = 1 << Math.ceil(Math.log2(items.length));

      tree.forEach((node, i) => expect(node ? node.toString('hex') : node).to.equal(expectedNodes[i]));
      expect(mixedRoot.toString('hex')).to.equal(expectedNodes[0]);
      expect(root.toString('hex')).to.equal(expectedNodes[1]);
      expect(realLeafCount).to.equal(items.length);
      expect(leafCount).to.equal(expectedLeafCount);
      expect(depth).to.equal(4);
    });

    it('should build the same tree for a balanced set of leafs, regardless the unbalanced option.', () => {
      const leafs = generateLeafs(32, { random: true });
      const { tree: tree1 } = buildTree(leafs, { unbalanced: false });
      const { tree: tree2 } = buildTree(leafs, { unbalanced: true });

      tree1.forEach((node, i) => expect(node.equals(tree2[i])).to.equal(true));
    });

    it('should deterministically build a balanced sorted-hash Merkle Tree with 8 leafs.', () => {
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
      const options = { sortedHash: true };
      const { tree, mixedRoot, root, realLeafCount, leafCount, depth } = buildTree(leafs, options);

      const expectedNodes = [
        '767ab2360f4575b58ee1fe14242f2149ee9aa5e64ed38a20ac35b1c42b647c0d',
        'ca06f8324669a77a3ef9a7bcf15421d7bb5618a79dbe5590117ba5f5a4e72bc1',
        '0c48ddc2b8d6d066c52fc608d4d0254f418bea6cd8424fe95390ac87323f9c9f',
        '027d4202008bf9d080d976936bdbedf33e9934bc0b1745fd5712497536a83bd9',
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

    it('should deterministically build a balanced sorted-hash Merkle Tree with 1 leaf.', () => {
      const items = ['0000000000000000000000000000000000000000000000000000000000000001'];
      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const options = { sortedHash: true };
      const { tree, mixedRoot, root, realLeafCount, leafCount, depth } = buildTree(leafs, options);

      const expectedNodes = [
        'cc69885fda6bcc1a4ace058b4a62bf5e179ea78fd58a1ccd71c22cc9b688792f',
        '0000000000000000000000000000000000000000000000000000000000000001',
      ];

      tree.forEach((node, i) => expect(node.toString('hex')).to.equal(expectedNodes[i]));
      expect(mixedRoot.toString('hex')).to.equal(expectedNodes[0]);
      expect(root.toString('hex')).to.equal(expectedNodes[1]);
      expect(realLeafCount).to.equal(items.length);
      expect(leafCount).to.equal(items.length);
      expect(depth).to.equal(0);
    });

    it('should deterministically build an unbalanced sorted-hash Merkle Tree with 8 leafs.', () => {
      const items = [
        '0000000000000000000000000000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000000000000000000000000000004',
        '0000000000000000000000000000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000000000000000000000000000006',
        '0000000000000000000000000000000000000000000000000000000000000007',
        '0000000000000000000000000000000000000000000000000000000000000008',
        '0000000000000000000000000000000000000000000000000000000000000009',
      ];

      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const options = { unbalanced: true, sortedHash: true };
      const { tree, mixedRoot, root, realLeafCount, leafCount, depth } = buildTree(leafs, options);

      const expectedNodes = [
        '9f5f1560ba5533967ed4cfd17961ea392c4098fc5632f508a415cb224cf62732',
        'eaa579846af71a39e8280f33a4528ccc7030237aa05632dc6f644e220da4fd16',
        'ca06f8324669a77a3ef9a7bcf15421d7bb5618a79dbe5590117ba5f5a4e72bc1',
        '0000000000000000000000000000000000000000000000000000000000000009',
        '0c48ddc2b8d6d066c52fc608d4d0254f418bea6cd8424fe95390ac87323f9c9f',
        '027d4202008bf9d080d976936bdbedf33e9934bc0b1745fd5712497536a83bd9',
        '0000000000000000000000000000000000000000000000000000000000000009',
        null,
        'e90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0',
        '2e174c10e159ea99b867ce3205125c24a42d128804e4070ed6fcc8cc98166aa0',
        'bfd358e93f18da3ed276c3afdbdba00b8f0b6008a03476a6a86bd6320ee6938b',
        '24cd397636bedc6cf9b490d0edd57c769c19b367fb7d5c2344ae1ddc7d21c144',
        '0000000000000000000000000000000000000000000000000000000000000009',
        null,
        null,
        null,
        '0000000000000000000000000000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000000000000000000000000000004',
        '0000000000000000000000000000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000000000000000000000000000006',
        '0000000000000000000000000000000000000000000000000000000000000007',
        '0000000000000000000000000000000000000000000000000000000000000008',
        '0000000000000000000000000000000000000000000000000000000000000009',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];

      const expectedLeafCount = 1 << Math.ceil(Math.log2(items.length));

      tree.forEach((node, i) => expect(node ? node.toString('hex') : node).to.equal(expectedNodes[i]));
      expect(mixedRoot.toString('hex')).to.equal(expectedNodes[0]);
      expect(root.toString('hex')).to.equal(expectedNodes[1]);
      expect(realLeafCount).to.equal(items.length);
      expect(leafCount).to.equal(expectedLeafCount);
      expect(depth).to.equal(4);
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

  describe('Update Merkle Tree', () => {
    it('should deterministically update a Merkle Tree with 8 leafs.', () => {
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
      const { tree, mixedRoot, root } = buildTree(leafs);

      const updateIndices = [3, 6];
      const updateItems = [
        '0000000000000000000000000000000000000000000000000000000000000009',
        '000000000000000000000000000000000000000000000000000000000000000a',
      ];
      const updateValues = updateItems.map((item) => Buffer.from(item, 'hex'));

      const { tree: newTree, mixedRoot: newMixedRoot, root: newRoot } = updateTree(tree, updateIndices, updateValues);

      const newItems = [
        '0000000000000000000000000000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000000000000000000000000000009',
        '0000000000000000000000000000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000000000000000000000000000006',
        '000000000000000000000000000000000000000000000000000000000000000a',
        '0000000000000000000000000000000000000000000000000000000000000008',
      ];
      const newLeafs = newItems.map((item) => Buffer.from(item, 'hex'));
      const { tree: rebuiltTree } = buildTree(newLeafs);

      newTree.forEach((node, i) => expect(node.equals(rebuiltTree[i])).to.equal(true));
      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newRoot.equals(root)).to.equal(false);
    });

    it('should deterministically update a Merkle Tree with 1 leaf.', () => {
      const items = ['0000000000000000000000000000000000000000000000000000000000000001'];
      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const { tree, mixedRoot, root } = buildTree(leafs);

      const updateIndices = [0];
      const updateItems = ['0000000000000000000000000000000000000000000000000000000000000009'];
      const updateValues = updateItems.map((item) => Buffer.from(item, 'hex'));

      const { tree: newTree, mixedRoot: newMixedRoot, root: newRoot } = updateTree(tree, updateIndices, updateValues);

      const newItems = ['0000000000000000000000000000000000000000000000000000000000000009'];
      const newLeafs = newItems.map((item) => Buffer.from(item, 'hex'));
      const { tree: rebuiltTree } = buildTree(newLeafs);

      newTree.forEach((node, i) => expect(node.equals(rebuiltTree[i])).to.equal(true));
      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newRoot.equals(root)).to.equal(false);
    });
  });

  describe('Update Merkle Root with Proof', () => {
    it('should deterministically update an 8-leaf Merkle Root with a Proof.', () => {
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

      const updateIndex = 3;
      const updateValue = Buffer.from('0000000000000000000000000000000000000000000000000000000000000009', 'hex');

      const { mixedRoot, root, leafCount, decommitments } = generateProof(tree, updateIndex);
      const { mixedRoot: newMixedRoot, root: newRoot } = updateWithProof(
        mixedRoot,
        root,
        leafCount,
        updateIndex,
        leafs[updateIndex],
        updateValue,
        decommitments
      );

      const newItems = [
        '0000000000000000000000000000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000000000000000000000000000009',
        '0000000000000000000000000000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000000000000000000000000000006',
        '0000000000000000000000000000000000000000000000000000000000000007',
        '0000000000000000000000000000000000000000000000000000000000000008',
      ];
      const newLeafs = newItems.map((item) => Buffer.from(item, 'hex'));
      const { tree: rebuiltTree, mixedRoot: rebuiltMixedRoot, root: rebuiltRoot } = buildTree(newLeafs);

      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newMixedRoot.equals(rebuiltMixedRoot)).to.equal(true);
      expect(newRoot.equals(root)).to.equal(false);
      expect(newRoot.equals(rebuiltRoot)).to.equal(true);
    });

    it('should deterministically update an 1-leaf Merkle Root with a Proof.', () => {
      const items = ['0000000000000000000000000000000000000000000000000000000000000001'];
      const leafs = items.map((item) => Buffer.from(item, 'hex'));
      const { tree } = buildTree(leafs);

      const updateIndex = 0;
      const updateValue = Buffer.from('0000000000000000000000000000000000000000000000000000000000000009', 'hex');

      const { mixedRoot, root, leafCount, decommitments } = generateProof(tree, updateIndex);
      const { mixedRoot: newMixedRoot, root: newRoot } = updateWithProof(
        mixedRoot,
        root,
        leafCount,
        updateIndex,
        leafs[updateIndex],
        updateValue,
        decommitments
      );

      const newItems = ['0000000000000000000000000000000000000000000000000000000000000009'];
      const newLeafs = newItems.map((item) => Buffer.from(item, 'hex'));
      const { tree: rebuiltTree, mixedRoot: rebuiltMixedRoot, root: rebuiltRoot } = buildTree(newLeafs);

      expect(newMixedRoot.equals(mixedRoot)).to.equal(false);
      expect(newMixedRoot.equals(rebuiltMixedRoot)).to.equal(true);
      expect(newRoot.equals(root)).to.equal(false);
      expect(newRoot.equals(rebuiltRoot)).to.equal(true);
    });
  });
});
