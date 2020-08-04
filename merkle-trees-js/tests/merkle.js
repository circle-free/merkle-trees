'strict';

const chai = require('chai');
const { expect } = chai;
const { generateElements } = require('./helpers');
const MerkleTree = require('../src/merkle');

describe.only('Common Merkle-Tree', () => {
  describe('Merkle Tree Construction', () => {
    it('should build a balanced 8-element Merkle Tree.', () => {
      const options = { unbalanced: false, sortedHash: false };
      const elements = generateElements(8, { seed: 'ff' });
      const merkleTree = new MerkleTree(elements, options);

      const expectedMixedRoot = '1d209abcda42e6e22a906c95f0c04045467e54c3fae2a4e3f076dc9a8ac7765b';
      const expectedRoot = '6c3732d4a20a06ab8c72adf58f657aed97725cc6d21c9b91f4c1d1e0b29d675f';
      const expectedDepth = 3;

      expect(merkleTree.mixedRoot.toString('hex')).to.equal(expectedMixedRoot);
      expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
      expect(merkleTree.depth).to.equal(expectedDepth);
      merkleTree.leafs.forEach((leaf, i) => expect(leaf.equals(elements[i])).to.equal(true));
      merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
    });

    it('should build a balanced 1-element Merkle Tree.', () => {
      const options = { unbalanced: false, sortedHash: false };
      const elements = generateElements(1, { seed: 'ff' });
      const merkleTree = new MerkleTree(elements, options);

      const expectedMixedRoot = 'fd6c839120d06943770a0c8a2dcfa05e32c092c67c1b5af9c49542385ab89a90';
      const expectedDepth = 0;

      expect(merkleTree.mixedRoot.toString('hex')).to.equal(expectedMixedRoot);
      expect(merkleTree.root.equals(elements[0])).to.equal(true);
      expect(merkleTree.depth).to.equal(expectedDepth);
      merkleTree.leafs.forEach((leaf, i) => expect(leaf.equals(elements[i])).to.equal(true));
      merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
    });

    it('should build an unbalanced 9-element Merkle Tree.', () => {
      const options = { unbalanced: true, sortedHash: false };
      const elements = generateElements(9, { seed: 'ff' });
      const merkleTree = new MerkleTree(elements, options);

      const expectedMixedRoot = '126c03605debf0013042ff68972dba2bb6c34568451ca0b87e2473e321b87fba';
      const expectedRoot = '3dc055ddeea546bcf7a5230e43aec3db065c80c3fa5e3faa08cdbcab813d9ae9';
      const expectedDepth = 4;

      expect(merkleTree.mixedRoot.toString('hex')).to.equal(expectedMixedRoot);
      expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
      expect(merkleTree.depth).to.equal(expectedDepth);
      merkleTree.leafs.forEach((leaf, i) => expect(i < elements.length ? leaf.equals(elements[i]) : leaf === null).to.equal(true));
      merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
    });

    it('should build the same 8-element Merkle Tree for a balanced set of elements, regardless the unbalanced option.', () => {
      const elements = generateElements(8, { seed: 'ff' });
      const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: false });
      const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: false });

      expect(balancedMerkleTree.mixedRoot.equals(unbalancedMerkleTree.mixedRoot)).to.equal(true);
      expect(balancedMerkleTree.root.equals(unbalancedMerkleTree.root)).to.equal(true);
      expect(balancedMerkleTree.depth).to.equal(unbalancedMerkleTree.depth);
    });

    it('should build a balanced sorted-hash 8-element Merkle Tree.', () => {
      const options = { unbalanced: false, sortedHash: true };
      const elements = generateElements(8, { seed: 'ff' });
      const merkleTree = new MerkleTree(elements, options);

      const expectedMixedRoot = '2ded86334ca213c4ff584f3f0e03533d3d855af257182891c6bba234a70c9ebf';
      const expectedRoot = '9d0a9ed9df3bb4c8de2d3e1b0f97ab30c6d818154d44ec2c88afd1dfeee76bbe';
      const expectedDepth = 3;

      expect(merkleTree.mixedRoot.toString('hex')).to.equal(expectedMixedRoot);
      expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
      expect(merkleTree.depth).to.equal(expectedDepth);
      merkleTree.leafs.forEach((leaf, i) => expect(leaf.equals(elements[i])).to.equal(true));
      merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
    });

    it('should build a balanced sorted-hash 1-element Merkle Tree.', () => {
      const options = { unbalanced: false, sortedHash: true };
      const elements = generateElements(1, { seed: 'ff' });
      const merkleTree = new MerkleTree(elements, options);

      const expectedMixedRoot = 'fd6c839120d06943770a0c8a2dcfa05e32c092c67c1b5af9c49542385ab89a90';
      const expectedDepth = 0;

      expect(merkleTree.mixedRoot.toString('hex')).to.equal(expectedMixedRoot);
      expect(merkleTree.root.equals(elements[0])).to.equal(true);
      expect(merkleTree.depth).to.equal(expectedDepth);
      merkleTree.leafs.forEach((leaf, i) => expect(leaf.equals(elements[i])).to.equal(true));
      merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
    });

    it('should build an unbalanced sorted-hash 9-element Merkle Tree.', () => {
      const options = { unbalanced: true, sortedHash: true };
      const elements = generateElements(9, { seed: 'ff' });
      const merkleTree = new MerkleTree(elements, options);

      const expectedMixedRoot = 'ea5cb033001bcb027e59e114e8f4ceaa4a3259304df40658d166992457e40dcc';
      const expectedRoot = '283d00fb5d5ac9859b827bb793cfed8334254ad6f204539f96bd50afd442e954';
      const expectedDepth = 4;

      expect(merkleTree.mixedRoot.toString('hex')).to.equal(expectedMixedRoot);
      expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
      expect(merkleTree.depth).to.equal(expectedDepth);
      merkleTree.leafs.forEach((leaf, i) => expect(i < elements.length ? leaf.equals(elements[i]) : leaf === null).to.equal(true));
      merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
    });

    it('should build the same sorted-hash 8-element Merkle Tree for a balanced set of elements, regardless the unbalanced option.', () => {
      const elements = generateElements(8, { seed: 'ff' });
      const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: true });
      const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: true });

      expect(balancedMerkleTree.mixedRoot.equals(unbalancedMerkleTree.mixedRoot)).to.equal(true);
      expect(balancedMerkleTree.root.equals(unbalancedMerkleTree.root)).to.equal(true);
      expect(balancedMerkleTree.depth).to.equal(unbalancedMerkleTree.depth);
    });
  });

  describe('Single Proofs', () => {
    describe('Single Proof Generation', () => {
      it('should generate a Single Proof for a balanced 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { mixedRoot, root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(2);
  
        const expectedDecommitments = [
          'ce6a53a536b8452a7b2c5c69e1e9ba0351d3e3e697852f314868cf4decb93714',
          'e6091bfdb47e7e967c08883c469f6c6b26a68309e3cf461ebc584183b938b6d5',
          'd62f55381db89d56d428a8f383e2bb4690f27ef918d80b9f4735737f6abce3ec'
        ];
  
        expect(mixedRoot.equals(merkleTree.mixedRoot)).to.equal(true);
        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(merkleTree.elements.length);
        expect(index).to.equal(2);
        expect(element.equals(elements[2])).to.equal(true);
        decommitments.forEach((decommitment, i) => expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i]));
      });
  
      it('should generate a Single Proof for a balanced 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { mixedRoot, root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(0);
  
        const expectedDecommitments = [];
  
        expect(mixedRoot.equals(merkleTree.mixedRoot)).to.equal(true);
        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(merkleTree.elements.length);
        expect(index).to.equal(0);
        expect(element.equals(elements[0])).to.equal(true);
        decommitments.forEach((decommitment, i) => expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i]));
      });

      it.skip('should generate a Single Proof for an unbalanced 9-element Merkle Tree (TODO).', () => {
      });
      
      it('should generate the same Single Proof for a balanced 8-element Merkle Tree, regardless the unbalanced option.', () => {
        const elements = generateElements(8, { seed: 'ff' });
        const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: false });
        const balancedProof = balancedMerkleTree.generateSingleProof(2);
        const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: false });
        const unbalancedProof = unbalancedMerkleTree.generateSingleProof(2);
  
        expect(balancedProof.mixedRoot.equals(unbalancedProof.mixedRoot)).to.equal(true);
        expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
        expect(balancedProof.elementCount).to.equal(unbalancedProof.elementCount);
        expect(balancedProof.index).to.equal(unbalancedProof.index);
        expect(balancedProof.element.equals(unbalancedProof.element)).to.equal(true);
        balancedProof.decommitments.forEach((decommitment, i) => expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true));
      });

      it('should generate a Single Proof for a balanced sorted-hash 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { mixedRoot, root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(2);
  
        const expectedDecommitments = [
          '4089542f77024ff77e5be4370fd6c63483375005ebda40f27ecf3cc0d2d42123',
          'e6091bfdb47e7e967c08883c469f6c6b26a68309e3cf461ebc584183b938b6d5',
          'd62f55381db89d56d428a8f383e2bb4690f27ef918d80b9f4735737f6abce3ec'
        ];
  
        expect(mixedRoot.equals(merkleTree.mixedRoot)).to.equal(true);
        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(merkleTree.elements.length);
        expect(index).to.equal(2);
        expect(element.equals(elements[2])).to.equal(true);
        decommitments.forEach((decommitment, i) => expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i]));
      });
  
      it('should generate a Single Proof for a balanced sorted-hash 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { mixedRoot, root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(0);
  
        const expectedDecommitments = [];
  
        expect(mixedRoot.equals(merkleTree.mixedRoot)).to.equal(true);
        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(merkleTree.elements.length);
        expect(index).to.equal(0);
        expect(element.equals(elements[0])).to.equal(true);
        decommitments.forEach((decommitment, i) => expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i]));
      });

      it.skip('should generate a Single Proof for an unbalanced sorted-hash 9-element Merkle Tree (TODO).', () => {
      });

      it('should generate the same Single Proof for a balanced sorted-hash 8-element Merkle Tree, regardless the unbalanced option.', () => {
        const elements = generateElements(8, { seed: 'ff' });
        const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: true });
        const balancedProof = balancedMerkleTree.generateSingleProof(2);
        const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: true });
        const unbalancedProof = unbalancedMerkleTree.generateSingleProof(2);
  
        expect(balancedProof.mixedRoot.equals(unbalancedProof.mixedRoot)).to.equal(true);
        expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
        expect(balancedProof.elementCount).to.equal(unbalancedProof.elementCount);
        expect(balancedProof.index).to.equal(unbalancedProof.index);
        expect(balancedProof.element.equals(unbalancedProof.element)).to.equal(true);
        balancedProof.decommitments.forEach((decommitment, i) => expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true));
      });
    });
  
    describe('Single Proof Verification', () => {
      it('should verify a Single Proof for a balanced 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateSingleProof(2);
        const proofValid = MerkleTree.verifySingleProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify a Single Proof for a balanced 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateSingleProof(0);
        const proofValid = MerkleTree.verifySingleProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it.skip('should verify a Single Proof for an unbalanced 9-element Merkle Tree (TODO).', () => {});
      
      it('should verify a Single Proof for a balanced 8-element Merkle Tree, built with the unbalanced option.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateSingleProof(2);
        const proofValid = MerkleTree.verifySingleProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify a Single Proof for a balanced sorted-hash 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateSingleProof(2);
        const proofValid = MerkleTree.verifySingleProof(proof, options);

        expect(proofValid).to.equal(true);
      });
  
      it('should verify a Single Proof for a balanced sorted-hash 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateSingleProof(0);
        const proofValid = MerkleTree.verifySingleProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it.skip('should verify a Single Proof for an unbalanced sorted-hash 9-element Merkle Tree (TODO).', () => {});

      it('should verify a Single Proof for a balanced sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateSingleProof(2);
        const proofValid = MerkleTree.verifySingleProof(proof, options);

        expect(proofValid).to.equal(true);
      });
    });

    describe('Single Proof Update', () => {
      it('should use a Single Proof for a balanced 8-element Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateUpdateProof(2, newElement);
        const { mixedRoot, root, elementCount } = MerkleTree.updateWithSingleProof(proof, options);

        const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.updateOne(2, newElement);
  
        expect(mixedRoot.equals(newMerkleTree1.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);

        expect(mixedRoot.equals(newMerkleTree2.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });
  
      it('should use a Single Proof for a balanced 1-element Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateUpdateProof(0, newElement);
        const { mixedRoot, root, elementCount } = MerkleTree.updateWithSingleProof(proof, options);

        const newElements = elements.map((e, i) => (i === 0 ? newElement : e));
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.updateOne(0, newElement);
  
        expect(mixedRoot.equals(newMerkleTree1.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);

        expect(mixedRoot.equals(newMerkleTree2.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it.skip('should use a Single Proof for an unbalanced 9-element Merkle Tree to update an element (TODO).', () => {
      });
      
      it('should use a Single Proof for a balanced 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateUpdateProof(2, newElement);
        const { mixedRoot, root, elementCount } = MerkleTree.updateWithSingleProof(proof, options);

        const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.updateOne(2, newElement);
  
        expect(mixedRoot.equals(newMerkleTree1.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);

        expect(mixedRoot.equals(newMerkleTree2.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Single Proof for a balanced sorted-hash 8-element Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateUpdateProof(2, newElement);
        const { mixedRoot, root, elementCount } = MerkleTree.updateWithSingleProof(proof, options);

        const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.updateOne(2, newElement);
  
        expect(mixedRoot.equals(newMerkleTree1.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);

        expect(mixedRoot.equals(newMerkleTree2.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });
  
      it('should use a Single Proof for a balanced sorted-hash 1-element Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateUpdateProof(0, newElement);
        const { mixedRoot, root, elementCount } = MerkleTree.updateWithSingleProof(proof, options);

        const newElements = elements.map((e, i) => (i === 0 ? newElement : e));
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.updateOne(0, newElement);
  
        expect(mixedRoot.equals(newMerkleTree1.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);

        expect(mixedRoot.equals(newMerkleTree2.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it.skip('should use a Single Proof for an unbalanced sorted-hash 9-element Merkle Tree to update an element (TODO).', () => {
      });

      it('should use a Single Proof for a balanced sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateUpdateProof(2, newElement);
        const { mixedRoot, root, elementCount } = MerkleTree.updateWithSingleProof(proof, options);

        const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.updateOne(2, newElement);
  
        expect(mixedRoot.equals(newMerkleTree1.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);

        expect(mixedRoot.equals(newMerkleTree2.mixedRoot)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });
    });

    describe('Single Proof Update Test Case', () => {
      it('should use 100 Single Proofs for a balanced sorted-hash 16-element Merkle Tree, to update an 100 elements consecutively.', () => {
        const options = { unbalanced: false, sortedHash: true };
        let elements = generateElements(16);
        let merkleTree = new MerkleTree(elements, options);

        // Elements to be inserted at respective indices
        const newElements = generateElements(100);
        const indices = Array.from({length: 100}, () => Math.floor(Math.random() * 16));

        newElements.forEach((newElement, i) => {
          const proof = merkleTree.generateUpdateProof(indices[i], newElement);
          const { mixedRoot, root, elementCount } = MerkleTree.updateWithSingleProof(proof, options);

          elements[indices[i]] = newElement;
          merkleTree = merkleTree.updateOne(indices[i], newElement);

          expect(mixedRoot.equals(merkleTree.mixedRoot)).to.equal(true);
          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(elementCount).to.equal(merkleTree.elements.length);
        });
      });
    });
  });

  describe('Multi Proofs', () => {
    describe('Multi Proof Generation', () => {

    });

    describe('Multi Proof Verification', () => {

    });

    describe('Multi Proof Update', () => {

    });
  });

  describe('Append Proofs', () => {
    describe('Append Proof Generation', () => {

    });

    describe('Append Proof Verification and Single Append', () => {

    });

    describe('Append Proof Verification and Multi Append', () => {

    });
  });
});
