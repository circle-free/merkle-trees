'strict';

const chai = require('chai');
const { expect } = chai;
const { generateElements } = require('./helpers');
const MerkleTree = require('../src/merkle');

describe.only('Common Merkle-Tree', () => {
  describe('Merkle Tree Construction', () => {
    describe('Balanced', () => {
      it('should build a 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        const expectedDepth = 3;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build a 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        const expectedDepth = 0;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build a balanced sorted-hash 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        const expectedDepth = 3;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build a balanced sorted-hash 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        const expectedDepth = 0;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });
    });

    describe('Unbalanced', () => {
      it('should build an 9-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(9, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '5449a839359e08115bbc14ed1795892a3a8562d583744e1a1fa146d273ff1f55';
        const expectedDepth = 4;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build an sorted-hash 9-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(9, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '86620d93d22f2d06344f81166356ed881cfdc36c8b35a7115e8b0daad4d56ee4';
        const expectedDepth = 4;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });
    });

    describe('Balanced/Unbalanced Overlapping Cases', () => {
      it('should build the same 8-element Merkle Tree.', () => {
        const elements = generateElements(8, { seed: 'ff' });
        const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: false });
        const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: false });

        expect(balancedMerkleTree.root.equals(unbalancedMerkleTree.root)).to.equal(true);
        expect(balancedMerkleTree.depth).to.equal(unbalancedMerkleTree.depth);
      });

      it('should build the same sorted-hash 8-element Merkle Tree.', () => {
        const elements = generateElements(8, { seed: 'ff' });
        const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: true });
        const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: true });

        expect(balancedMerkleTree.root.equals(unbalancedMerkleTree.root)).to.equal(true);
        expect(balancedMerkleTree.depth).to.equal(unbalancedMerkleTree.depth);
      });
    });
  });

  describe('Single Proofs', () => {
    describe('Single Proof Generation', () => {
      describe('Balanced', () => {
        it('should generate a Single Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const { root, index, element, decommitments } = merkleTree.generateSingleProof(2);

          const expectedDecommitments = [
            'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
            'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
          ];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(index).to.equal(2);
          expect(element.equals(elements[2])).to.equal(true);
          decommitments.forEach((decommitment, i) =>
            expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
          );
        });

        it('should generate a Single Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const { root, index, element, decommitments } = merkleTree.generateSingleProof(0);

          const expectedDecommitments = [];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(index).to.equal(0);
          expect(element.equals(elements[0])).to.equal(true);
          decommitments.forEach((decommitment, i) =>
            expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
          );
        });

        it('should generate a Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const { root, index, element, decommitments } = merkleTree.generateSingleProof(2);

          const expectedDecommitments = [
            'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
            'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
          ];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(index).to.equal(2);
          expect(element.equals(elements[2])).to.equal(true);
          decommitments.forEach((decommitment, i) =>
            expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
          );
        });

        it('should generate a Single Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const { root, index, element, decommitments } = merkleTree.generateSingleProof(0);

          const expectedDecommitments = [];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(index).to.equal(0);
          expect(element.equals(elements[0])).to.equal(true);
          decommitments.forEach((decommitment, i) =>
            expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
          );
        });
      });

      describe('Unbalanced', () => {
        it.skip('should generate a Single Proof for a 9-element Merkle Tree (TODO).', () => {});

        it.skip('should generate a Single Proof for a sorted-hash 9-element Merkle Tree (TODO).', () => {});
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should generate the same Single Proof for a 8-element Merkle Tree.', () => {
          const elements = generateElements(8, { seed: 'ff' });
          const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: false });
          const balancedProof = balancedMerkleTree.generateSingleProof(2);
          const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: false });
          const unbalancedProof = unbalancedMerkleTree.generateSingleProof(2);

          expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
          expect(balancedProof.index).to.equal(unbalancedProof.index);
          expect(balancedProof.element.equals(unbalancedProof.element)).to.equal(true);
          balancedProof.decommitments.forEach((decommitment, i) =>
            expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
          );
        });

        it('should generate the same Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const elements = generateElements(8, { seed: 'ff' });
          const balancedMerkleTree = new MerkleTree(elements, { unbalanced: false, sortedHash: true });
          const balancedProof = balancedMerkleTree.generateSingleProof(2);
          const unbalancedMerkleTree = new MerkleTree(elements, { unbalanced: true, sortedHash: true });
          const unbalancedProof = unbalancedMerkleTree.generateSingleProof(2);

          expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
          expect(balancedProof.index).to.equal(unbalancedProof.index);
          expect(balancedProof.element.equals(unbalancedProof.element)).to.equal(true);
          balancedProof.decommitments.forEach((decommitment, i) =>
            expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
          );
        });
      });
    });

    describe('Single Proof Verification', () => {
      describe('Balanced', () => {
        it('should verify a Single Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const proof = merkleTree.generateSingleProof(2);
          const proofValid = MerkleTree.verifySingleProof(proof, options);

          expect(proofValid).to.equal(true);
        });

        it('should verify a Single Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const proof = merkleTree.generateSingleProof(0);
          const proofValid = MerkleTree.verifySingleProof(proof, options);

          expect(proofValid).to.equal(true);
        });

        it('should verify a Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const proof = merkleTree.generateSingleProof(2);
          const proofValid = MerkleTree.verifySingleProof(proof, options);

          expect(proofValid).to.equal(true);
        });

        it('should verify a Single Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const proof = merkleTree.generateSingleProof(0);
          const proofValid = MerkleTree.verifySingleProof(proof, options);

          expect(proofValid).to.equal(true);
        });
      });

      describe('Unbalanced', () => {
        it.skip('should verify a Single Proof for an 9-element Merkle Tree (TODO).', () => {});

        it.skip('should verify a Single Proof for an sorted-hash 9-element Merkle Tree (TODO).', () => {});
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should verify a Single Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: false };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const proof = merkleTree.generateSingleProof(2);
          const proofValid = MerkleTree.verifySingleProof(proof, options);

          expect(proofValid).to.equal(true);
        });

        it('should verify a Single Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: true };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const proof = merkleTree.generateSingleProof(2);
          const proofValid = MerkleTree.verifySingleProof(proof, options);

          expect(proofValid).to.equal(true);
        });
      });
    });

    describe('Single Proof Update', () => {
      describe('Balanced', () => {
        it('should use a Single Proof for a 8-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: false };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);

          const newElement = generateElements(1, { seed: '11' })[0];
          const proof = merkleTree.generateSingleUpdateProof(2, newElement);
          const { root } = MerkleTree.updateWithSingleProof(proof, options);

          const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
          const newMerkleTree1 = new MerkleTree(newElements, options);
          const newMerkleTree2 = merkleTree.updateSingle(2, newElement);

          expect(root.equals(newMerkleTree1.root)).to.equal(true);
          expect(root.equals(newMerkleTree2.root)).to.equal(true);
        });

        it('should use a Single Proof for a 1-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: false };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);

          const newElement = generateElements(1, { seed: '11' })[0];
          const proof = merkleTree.generateSingleUpdateProof(0, newElement);
          const { root } = MerkleTree.updateWithSingleProof(proof, options);

          const newElements = elements.map((e, i) => (i === 0 ? newElement : e));
          const newMerkleTree1 = new MerkleTree(newElements, options);
          const newMerkleTree2 = merkleTree.updateSingle(0, newElement);

          expect(root.equals(newMerkleTree1.root)).to.equal(true);
          expect(root.equals(newMerkleTree2.root)).to.equal(true);
        });

        it('should use a Single Proof for a sorted-hash 8-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);

          const newElement = generateElements(1, { seed: '11' })[0];
          const proof = merkleTree.generateSingleUpdateProof(2, newElement);
          const { root } = MerkleTree.updateWithSingleProof(proof, options);

          const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
          const newMerkleTree1 = new MerkleTree(newElements, options);
          const newMerkleTree2 = merkleTree.updateSingle(2, newElement);

          expect(root.equals(newMerkleTree1.root)).to.equal(true);
          expect(root.equals(newMerkleTree2.root)).to.equal(true);
        });

        it('should use a Single Proof for a sorted-hash 1-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);

          const newElement = generateElements(1, { seed: '11' })[0];
          const proof = merkleTree.generateSingleUpdateProof(0, newElement);
          const { root } = MerkleTree.updateWithSingleProof(proof, options);

          const newElements = elements.map((e, i) => (i === 0 ? newElement : e));
          const newMerkleTree1 = new MerkleTree(newElements, options);
          const newMerkleTree2 = merkleTree.updateSingle(0, newElement);

          expect(root.equals(newMerkleTree1.root)).to.equal(true);
          expect(root.equals(newMerkleTree2.root)).to.equal(true);
        });
      });

      describe('Unbalanced', () => {
        it.skip('should use a Single Proof for an 9-element Merkle Tree to update an element (TODO).', () => {});

        it.skip('should use a Single Proof for an sorted-hash 9-element Merkle Tree to update an element (TODO).', () => {});
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should use a Single Proof for a 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          const options = { unbalanced: true, sortedHash: false };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);

          const newElement = generateElements(1, { seed: '11' })[0];
          const proof = merkleTree.generateSingleUpdateProof(2, newElement);
          const { root } = MerkleTree.updateWithSingleProof(proof, options);

          const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
          const newMerkleTree1 = new MerkleTree(newElements, options);
          const newMerkleTree2 = merkleTree.updateSingle(2, newElement);

          expect(root.equals(newMerkleTree1.root)).to.equal(true);
          expect(root.equals(newMerkleTree2.root)).to.equal(true);
        });

        it('should use a Single Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          const options = { unbalanced: true, sortedHash: true };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);

          const newElement = generateElements(1, { seed: '11' })[0];
          const proof = merkleTree.generateSingleUpdateProof(2, newElement);
          const { root } = MerkleTree.updateWithSingleProof(proof, options);

          const newElements = elements.map((e, i) => (i === 2 ? newElement : e));
          const newMerkleTree1 = new MerkleTree(newElements, options);
          const newMerkleTree2 = merkleTree.updateSingle(2, newElement);

          expect(root.equals(newMerkleTree1.root)).to.equal(true);
          expect(root.equals(newMerkleTree2.root)).to.equal(true);
        });
      });
    });

    describe('Single Proof Update Consecutive Uses', () => {
      describe('Balanced', () => {
        it('should use 100 Single Proofs for a 16-element Merkle Tree, to update an 100 elements consecutively.', () => {
          const options = { unbalanced: false, sortedHash: false };
          let elements = generateElements(16);
          let merkleTree = new MerkleTree(elements, options);

          // Elements to be inserted at respective indices
          const newElements = generateElements(100);
          const indices = Array.from({ length: 100 }, () => Math.floor(Math.random() * 16));

          newElements.forEach((newElement, i) => {
            const proof = merkleTree.generateSingleUpdateProof(indices[i], newElement);
            const { root } = MerkleTree.updateWithSingleProof(proof, options);

            elements[indices[i]] = newElement;
            merkleTree = merkleTree.updateSingle(indices[i], newElement);

            expect(root.equals(merkleTree.root)).to.equal(true);
          });
        });
      });

      describe('Unbalanced', () => {
        it.skip('should use 100 Single Proofs for a sorted-hash 17-element Merkle Tree, to update an 100 elements consecutively (TODO).', () => {});
      });
    });
  });

  describe('Multi Proofs', () => {
    describe('Index and Existence Multi Proofs', () => {
      describe('Index and Existence Multi Proof Generation', () => {
        describe('Balanced', () => {
          it('should generate a Multi Proof for a 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [5, 4, 1];
            const proof = merkleTree.generateMultiProof(indices, options);

            const expectedDecommitments = [
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ];

            expect(proof.root.equals(merkleTree.root)).to.equal(true);
            expect(proof.depth).to.equal(merkleTree.depth);
            expect(proof.indices).to.deep.equal(indices);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            proof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
            );
          });

          it('should generate a Multi Proof for a 1-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const elements = generateElements(1, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [0];
            const proof = merkleTree.generateMultiProof(indices, options);

            const expectedDecommitments = [];

            expect(proof.root.equals(merkleTree.root)).to.equal(true);
            expect(proof.depth).to.equal(merkleTree.depth);
            expect(proof.indices).to.deep.equal(indices);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            proof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
            );
          });

          it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [5, 4, 1];
            const proof = merkleTree.generateMultiProof(indices, options);

            const expectedDecommitments = [
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ];

            expect(proof.root.equals(merkleTree.root)).to.equal(true);
            expect(proof.depth).to.equal(merkleTree.depth);
            expect(proof.indices).to.deep.equal(indices);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            proof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
            );
          });

          it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const elements = generateElements(1, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [0];
            const proof = merkleTree.generateMultiProof(indices, options);

            const expectedDecommitments = [];

            expect(proof.root.equals(merkleTree.root)).to.equal(true);
            expect(proof.depth).to.equal(merkleTree.depth);
            expect(proof.indices).to.deep.equal(indices);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            proof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
            );
          });
        });

        describe('Unbalanced', () => {
          it.skip('should generate a Multi Proof for a 9-element Merkle Tree (TODO).', () => {});

          it.skip('should generate a Multi Proof for a sorted-hash 9-element Merkle Tree (TODO).', () => {});
        });

        describe('Balanced/Unbalanced Overlapping Cases', () => {
          it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const indices = [5, 4, 1];

            const balancedMerkleTree = new MerkleTree(elements, options);
            const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);

            options.unbalanced = true;
            const unbalancedMerkleTree = new MerkleTree(elements, options);
            const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);

            expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
            expect(balancedProof.depth).to.equal(unbalancedProof.depth);
            expect(balancedProof.indices).to.deep.equal(unbalancedProof.indices);
            balancedProof.elements.forEach((element, i) =>
              expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
            );
            balancedProof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
            );
          });

          it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const indices = [5, 4, 1];

            const balancedMerkleTree = new MerkleTree(elements, options);
            const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);

            options.unbalanced = true;
            const unbalancedMerkleTree = new MerkleTree(elements, options);
            const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);

            expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
            expect(balancedProof.depth).to.equal(unbalancedProof.depth);
            expect(balancedProof.indices).to.deep.equal(unbalancedProof.indices);
            balancedProof.elements.forEach((element, i) =>
              expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
            );
            balancedProof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
            );
          });
        });
      });

      describe('Index and Existence Multi Proof Verification', () => {
        describe('Balanced', () => {
          it('should verify a Multi Proof for a 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [5, 4, 1];
            const proof = merkleTree.generateMultiProof(indices, options);
            const proofValid = MerkleTree.verifyMultiProof(proof, options);

            expect(proofValid).to.equal(true);
          });

          it('should verify a Multi Proof for a 1-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const elements = generateElements(1, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [0];
            const proof = merkleTree.generateMultiProof(indices, options);
            const proofValid = MerkleTree.verifyMultiProof(proof, options);

            expect(proofValid).to.equal(true);
          });

          it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [5, 4, 1];
            const proof = merkleTree.generateMultiProof(indices, options);
            const proofValid = MerkleTree.verifyMultiProof(proof, options);

            expect(proofValid).to.equal(true);
          });

          it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const elements = generateElements(1, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [0];
            const proof = merkleTree.generateMultiProof(indices, options);
            const proofValid = MerkleTree.verifyMultiProof(proof, options);

            expect(proofValid).to.equal(true);
          });
        });

        describe('Unbalanced', () => {
          it.skip('should verify a Multi Proof for a 9-element Merkle Tree (TODO).', () => {});

          it.skip('should verify a Multi Proof for a sorted-hash 9-element Merkle Tree (TODO).', () => {});
        });

        describe('Balanced/Unbalanced Overlapping Cases', () => {
          it('should verify a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
            const options = { unbalanced: true, sortedHash: false, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [5, 4, 1];
            const proof = merkleTree.generateMultiProof(indices, options);
            const proofValid = MerkleTree.verifyMultiProof(proof, options);

            expect(proofValid).to.equal(true);
          });

          it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
            const options = { unbalanced: true, sortedHash: true, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);
            const indices = [5, 4, 1];
            const proof = merkleTree.generateMultiProof(indices, options);
            const proofValid = MerkleTree.verifyMultiProof(proof, options);

            expect(proofValid).to.equal(true);
          });
        });
      });

      describe('Index and Existence Multi Proof Update', () => {
        describe('Balanced', () => {
          it('should use a Multi Proof for a 8-element Merkle Tree to update elements.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);

            const indices = [5, 4, 1];
            const newElements = generateElements(3, { seed: '11' });
            const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);

            const { root } = MerkleTree.updateWithMultiProof(proof, options);

            const newTreeElements = elements.map((e, i) => {
              const index = indices.indexOf(i);

              return index >= 0 ? newElements[index] : e;
            });

            const newMerkleTree1 = new MerkleTree(newTreeElements, options);
            const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);

            expect(root.equals(newMerkleTree1.root)).to.equal(true);
            expect(root.equals(newMerkleTree2.root)).to.equal(true);
          });

          it('should use a Multi Proof for a 1-element Merkle Tree to update elements.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const elements = generateElements(1, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);

            const indices = [0];
            const newElements = generateElements(3, { seed: '11' });
            const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);

            const { root } = MerkleTree.updateWithMultiProof(proof, options);

            const newTreeElements = elements.map((e, i) => {
              const index = indices.indexOf(i);

              return index >= 0 ? newElements[index] : e;
            });

            const newMerkleTree1 = new MerkleTree(newTreeElements, options);
            const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);

            expect(root.equals(newMerkleTree1.root)).to.equal(true);
            expect(root.equals(newMerkleTree2.root)).to.equal(true);
          });

          it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);

            const indices = [5, 4, 1];
            const newElements = generateElements(3, { seed: '11' });
            const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);

            const { root } = MerkleTree.updateWithMultiProof(proof, options);

            const newTreeElements = elements.map((e, i) => {
              const index = indices.indexOf(i);

              return index >= 0 ? newElements[index] : e;
            });

            const newMerkleTree1 = new MerkleTree(newTreeElements, options);
            const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);

            expect(root.equals(newMerkleTree1.root)).to.equal(true);
            expect(root.equals(newMerkleTree2.root)).to.equal(true);
          });

          it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree to update elements.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const elements = generateElements(1, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);

            const indices = [0];
            const newElements = generateElements(3, { seed: '11' });
            const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);

            const { root } = MerkleTree.updateWithMultiProof(proof, options);

            const newTreeElements = elements.map((e, i) => {
              const index = indices.indexOf(i);

              return index >= 0 ? newElements[index] : e;
            });

            const newMerkleTree1 = new MerkleTree(newTreeElements, options);
            const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);

            expect(root.equals(newMerkleTree1.root)).to.equal(true);
            expect(root.equals(newMerkleTree2.root)).to.equal(true);
          });
        });

        describe('Unbalanced', () => {
          it.skip('should use a Multi Proof for an 9-element Merkle Tree to update an element (TODO).', () => {});

          it.skip('should use a Multi Proof for an sorted-hash 9-element Merkle Tree to update an element (TODO).', () => {});
        });

        describe('Balanced/Unbalanced Overlapping Cases', () => {
          it('should use a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
            const options = { unbalanced: true, sortedHash: false, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);

            const indices = [5, 4, 1];
            const newElements = generateElements(3, { seed: '11' });
            const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);

            const { root } = MerkleTree.updateWithMultiProof(proof, options);

            const newTreeElements = elements.map((e, i) => {
              const index = indices.indexOf(i);

              return index >= 0 ? newElements[index] : e;
            });

            const newMerkleTree1 = new MerkleTree(newTreeElements, options);
            const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);

            expect(root.equals(newMerkleTree1.root)).to.equal(true);
            expect(root.equals(newMerkleTree2.root)).to.equal(true);
          });

          it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element (TODO).', () => {
            const options = { unbalanced: true, sortedHash: true, indexed: true };
            const elements = generateElements(8, { seed: 'ff' });
            const merkleTree = new MerkleTree(elements, options);

            const indices = [5, 4, 1];
            const newElements = generateElements(3, { seed: '11' });
            const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);

            const { root } = MerkleTree.updateWithMultiProof(proof, options);

            const newTreeElements = elements.map((e, i) => {
              const index = indices.indexOf(i);

              return index >= 0 ? newElements[index] : e;
            });

            const newMerkleTree1 = new MerkleTree(newTreeElements, options);
            const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);

            expect(root.equals(newMerkleTree1.root)).to.equal(true);
            expect(root.equals(newMerkleTree2.root)).to.equal(true);
          });
        });
      });

      describe('Index and Existence Multi Proof Update Consecutive Uses', () => {
        describe('Balanced', () => {
          it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            let elements = generateElements(16);
            let merkleTree = new MerkleTree(elements, options);

            // Elements to be inserted at respective indices
            const newElementsMatrix = Array.from({ length: 100 }, () => generateElements(6));
            const rawIndicesMatrix = Array.from({ length: 100 }, () =>
              Array.from({ length: 6 }, () => Math.floor(Math.random() * 16))
            );
            const indicesMatrix = rawIndicesMatrix.map((indices) =>
              indices.filter((index, i) => indices.indexOf(index) === i).sort((a, b) => b - a)
            );

            newElementsMatrix.forEach((ne, i) => {
              const indices = indicesMatrix[i];
              const newElements = ne.slice(0, indices.length);

              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
              const { root } = MerkleTree.updateWithMultiProof(proof, options);

              elements = elements.map((element, i) => {
                const index = indices.indexOf(i);

                return index >= 0 ? newElements[index] : element;
              });

              merkleTree = merkleTree.updateMulti(indices, newElements);

              expect(root.equals(merkleTree.root)).to.equal(true);
            });
          });
        });

        describe('Unbalanced', () => {
          it.skip('should use 100 Multi Proofs for a 17-element Merkle Tree, to perform 100 updates of up to 6 random elements (TODO).', () => {});
        });
      });
    });

    describe('Existence-Only Multi Proofs', () => {
      describe('Existence-Only Boolean-Array Multi Proofs', () => {
        describe('Existence-Only Boolean-Array Multi Proof Generation', () => {
          describe('Balanced', () => {
            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [1, 4, 5];
              const proof = merkleTree.generateMultiProof(indices, options);
  
              const expectedDecommitments = [
                '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              ];

              const expectedFlags = [
                false,
                true,
                false,
                false,
                true,
              ];

              const expectedSkips = [
                false,
                false,
                false,
                false,
                false,
              ];
  
              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.flags).to.deep.equal(expectedFlags);
              expect(proof.skips).to.deep.equal(expectedSkips);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
            });

            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);
  
              const expectedDecommitments = [
                '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
              ];

              const expectedFlags = [
                true,
                false,
                false,
                false,
                true,
              ];

              const expectedSkips = [
                false,
                false,
                false,
                false,
                false,
              ];
  
              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.flags).to.deep.equal(expectedFlags);
              expect(proof.skips).to.deep.equal(expectedSkips);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
            });
  
            it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [0];
              const proof = merkleTree.generateMultiProof(indices, options);
  
              const expectedDecommitments = [];
              const expectedFlags = [];
              const expectedSkips = [];
  
              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.flags).to.deep.equal(expectedFlags);
              expect(proof.skips).to.deep.equal(expectedSkips);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should generate a Multi Proof for a sorted-hash 9-element Merkle Tree, in ascending order (TODO).', () => {});

            it.skip('should generate a Multi Proof for a sorted-hash 9-element Merkle Tree, in descending order (TODO).', () => {});
          });
  
          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should generate the same Multi Proof for a 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: false, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [1, 4, 5];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });

            it('should generate the same Multi Proof for a 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: false, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [5, 4, 1];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });
  
            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [1, 4, 5];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });

            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [5, 4, 1];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });
          });
        });

        describe('Existence-Only Boolean-Array Multi Proof Verification', () => {
          describe('Balanced', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [1, 4, 5];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });

            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });
  
            it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [0];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should verify a Multi Proof for a sorted-hash 9-element Merkle Tree, in ascending order (TODO).', () => {});

            it.skip('should verify a Multi Proof for a sorted-hash 9-element Merkle Tree, in descending order (TODO).', () => {});
          });
  
          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, in ascending order.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [1, 4, 5];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });

            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, in descending order.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });
          });
        });

        describe('Existence-Only Boolean-Array Multi Proof Update', () => {
          describe('Balanced', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [5, 4, 1];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });

            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [1, 4, 5];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });
  
            it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree to update elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [0];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should use a Multi Proof for an sorted-hash 9-element Merkle Tree to update an element, in ascending order (TODO).', () => {});
            
            it.skip('should use a Multi Proof for an sorted-hash 9-element Merkle Tree to update an element, in descending order (TODO).', () => {});
          });
  
          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element, in ascending order (TODO).', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [5, 4, 1];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });

            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element, in descending order (TODO).', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [1, 4, 5];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });
          });
        });

        describe('Existence-Only Boolean-Array Multi Proof Update Consecutive Uses', () => {
          describe('Balanced', () => {
            it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              let elements = generateElements(16);
              let merkleTree = new MerkleTree(elements, options);
  
              // Elements to be inserted at respective indices
              const newElementsMatrix = Array.from({ length: 100 }, () => generateElements(6));
              const rawIndicesMatrix = Array.from({ length: 100 }, () =>
                Array.from({ length: 6 }, () => Math.floor(Math.random() * 16))
              );
              const indicesMatrix = rawIndicesMatrix.map((indices) =>
                indices.filter((index, i) => indices.indexOf(index) === i).sort((a, b) => b - a)
              );
  
              newElementsMatrix.forEach((ne, i) => {
                const indices = indicesMatrix[i];
                const newElements = ne.slice(0, indices.length);
  
                const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
                const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
                elements = elements.map((element, i) => {
                  const index = indices.indexOf(i);
  
                  return index >= 0 ? newElements[index] : element;
                });
  
                merkleTree = merkleTree.updateMulti(indices, newElements);
  
                expect(root.equals(merkleTree.root)).to.equal(true);
              });
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should use 100 Multi Proofs for a 17-element Merkle Tree, to perform 100 updates of up to 6 random elements (TODO).', () => {});
          });
        });
      });

      describe('Existence-Only Boolean-Bit Multi Proofs', () => {
        describe('Existence-Only Boolean-Bit Multi Proof Generation', () => {
          describe('Balanced', () => {
            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [1, 4, 5];
              const proof = merkleTree.generateMultiProof(indices, options);
  
              const expectedDecommitments = [
                '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              ];

              const expectedFlags = Buffer.from('0000000000000000000000000000000000000000000000000000000000000012', 'hex');
              const expectedSkips = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
  
              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.flags.equals(expectedFlags)).to.equal(true);
              expect(proof.flagCount).to.equal(5);
              expect(proof.skips.equals(expectedSkips)).to.equal(true);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
            });

            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);
  
              const expectedDecommitments = [
                '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
              ];

              const expectedFlags = Buffer.from('0000000000000000000000000000000000000000000000000000000000000011', 'hex');
              const expectedSkips = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
  
              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.flags.equals(expectedFlags)).to.equal(true);
              expect(proof.flagCount).to.equal(5);
              expect(proof.skips.equals(expectedSkips)).to.equal(true);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
            });
  
            it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [0];
              const proof = merkleTree.generateMultiProof(indices, options);
  
              const expectedDecommitments = [];
              const expectedFlags = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
              const expectedSkips = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
  
              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.flags.equals(expectedFlags)).to.equal(true);
              expect(proof.flagCount).to.equal(0);
              expect(proof.skips.equals(expectedSkips)).to.equal(true);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should generate a Multi Proof for a sorted-hash 9-element Merkle Tree, in ascending order (TODO).', () => {});

            it.skip('should generate a Multi Proof for a sorted-hash 9-element Merkle Tree, in descending order (TODO).', () => {});
          });
  
          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should generate the same Multi Proof for a 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: false, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [1, 4, 5];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });

            it('should generate the same Multi Proof for a 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: false, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [5, 4, 1];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });
  
            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [1, 4, 5];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });

            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [5, 4, 1];
  
              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);
  
              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);
  
              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
            });
          });
        });

        describe('Existence-Only Boolean-Bit Multi Proof Verification', () => {
          describe('Balanced', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [1, 4, 5];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });

            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });
  
            it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [0];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should verify a Multi Proof for a sorted-hash 9-element Merkle Tree, in ascending order (TODO).', () => {});

            it.skip('should verify a Multi Proof for a sorted-hash 9-element Merkle Tree, in descending order (TODO).', () => {});
          });
  
          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, in ascending order.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [1, 4, 5];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });

            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, in descending order.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);
  
              expect(proofValid).to.equal(true);
            });
          });
        });

        describe('Existence-Only Boolean-Bit Multi Proof Update', () => {
          describe('Balanced', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements, in ascending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [5, 4, 1];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });

            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements, in descending order.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [1, 4, 5];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });
  
            it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree to update elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [0];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should use a Multi Proof for an sorted-hash 9-element Merkle Tree to update an element, in ascending order (TODO).', () => {});
            
            it.skip('should use a Multi Proof for an sorted-hash 9-element Merkle Tree to update an element, in descending order (TODO).', () => {});
          });
  
          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element, in ascending order (TODO).', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [5, 4, 1];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });

            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element, in descending order (TODO).', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlag: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
  
              const indices = [1, 4, 5];
              const newElements = generateElements(3, { seed: '11' });
              const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  
              const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
              const newTreeElements = elements.map((e, i) => {
                const index = indices.indexOf(i);
  
                return index >= 0 ? newElements[index] : e;
              });
  
              const newMerkleTree1 = new MerkleTree(newTreeElements, options);
              const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);
  
              expect(root.equals(newMerkleTree1.root)).to.equal(true);
              expect(root.equals(newMerkleTree2.root)).to.equal(true);
            });
          });
        });

        describe('Existence-Only Boolean-Bit Multi Proof Update Consecutive Uses', () => {
          describe('Balanced', () => {
            it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlag: true };
              let elements = generateElements(16);
              let merkleTree = new MerkleTree(elements, options);
  
              // Elements to be inserted at respective indices
              const newElementsMatrix = Array.from({ length: 100 }, () => generateElements(6));
              const rawIndicesMatrix = Array.from({ length: 100 }, () =>
                Array.from({ length: 6 }, () => Math.floor(Math.random() * 16))
              );
              const indicesMatrix = rawIndicesMatrix.map((indices) =>
                indices.filter((index, i) => indices.indexOf(index) === i).sort((a, b) => b - a)
              );
  
              newElementsMatrix.forEach((ne, i) => {
                const indices = indicesMatrix[i];
                const newElements = ne.slice(0, indices.length);
  
                const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
                const { root } = MerkleTree.updateWithMultiProof(proof, options);
  
                elements = elements.map((element, i) => {
                  const index = indices.indexOf(i);
  
                  return index >= 0 ? newElements[index] : element;
                });
  
                merkleTree = merkleTree.updateMulti(indices, newElements);
  
                expect(root.equals(merkleTree.root)).to.equal(true);
              });
            });
          });
  
          describe('Unbalanced', () => {
            it.skip('should use 100 Multi Proofs for a 17-element Merkle Tree, to perform 100 updates of up to 6 random elements (TODO).', () => {});
          });
        });
      });
    });
  });

  describe('Append Proofs', () => {
    describe('Append Proof Generation', () => {});

    describe('Append Proof Verification and Single Append', () => {});

    describe('Append Proof Verification and Multi Append', () => {});
  });
});
