'strict';

const chai = require('chai');
const { expect } = chai;
const { generateElements } = require('./helpers');
const MerkleTree = require('../src');

describe('Common Merkle-Tree', () => {
  describe('Merkle Tree Construction', () => {
    describe('Balanced', () => {
      it('should build a 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d';
        const expectedElementRoot = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        const expectedDepth = 3;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.elementRoot.toString('hex')).to.equal(expectedElementRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build a 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';
        const expectedElementRoot = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        const expectedDepth = 0;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.elementRoot.toString('hex')).to.equal(expectedElementRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build a balanced sorted-hash 8-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '6764fd6d226590b844285c3d0f1e12bbd19cb7d1ee8277b0fb5b9b45efbbffb6';
        const expectedElementRoot = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        const expectedDepth = 3;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.elementRoot.toString('hex')).to.equal(expectedElementRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build a balanced sorted-hash 1-element Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';
        const expectedElementRoot = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        const expectedDepth = 0;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.elementRoot.toString('hex')).to.equal(expectedElementRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });
    });

    describe('Unbalanced', () => {
      it('should build an 9-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(9, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '743605bc7fcb07d66ecf3f2b5fcea24bfb27901bfbdb7baf6a194aa45d62461d';
        const expectedElementRoot = '5449a839359e08115bbc14ed1795892a3a8562d583744e1a1fa146d273ff1f55';
        const expectedDepth = 4;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.elementRoot.toString('hex')).to.equal(expectedElementRoot);
        expect(merkleTree.depth).to.equal(expectedDepth);
        merkleTree.elements.forEach((element, i) => expect(element.equals(elements[i])).to.equal(true));
      });

      it('should build an sorted-hash 9-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(9, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);

        const expectedRoot = '4c10104ea544f26190809c1117a092b18c8d7ab892f23c30a0f0cdb2c5242c48';
        const expectedElementRoot = '86620d93d22f2d06344f81166356ed881cfdc36c8b35a7115e8b0daad4d56ee4';
        const expectedDepth = 4;

        expect(merkleTree.root.toString('hex')).to.equal(expectedRoot);
        expect(merkleTree.elementRoot.toString('hex')).to.equal(expectedElementRoot);
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
          const { root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(2);

          const expectedDecommitments = [
            'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
            'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
          ];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(elementCount).to.equal(8);
          expect(index).to.equal(2);
          expect(element.equals(elements[2])).to.equal(true);
          expect(decommitments.length).to.equal(expectedDecommitments.length);
          decommitments.forEach((decommitment, i) =>
            expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
          );
        });

        it('should generate a Single Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const { root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(0);

          const expectedDecommitments = [];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(elementCount).to.equal(1);
          expect(index).to.equal(0);
          expect(element.equals(elements[0])).to.equal(true);
          expect(decommitments.length).to.equal(expectedDecommitments.length);
          decommitments.forEach((decommitment, i) =>
            expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
          );
        });

        it('should generate a Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(8, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const { root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(2);

          const expectedDecommitments = [
            'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
            'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
          ];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(elementCount).to.equal(8);
          expect(index).to.equal(2);
          expect(element.equals(elements[2])).to.equal(true);
          expect(decommitments.length).to.equal(expectedDecommitments.length);
          decommitments.forEach((decommitment, i) =>
            expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
          );
        });

        it('should generate a Single Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true };
          const elements = generateElements(1, { seed: 'ff' });
          const merkleTree = new MerkleTree(elements, options);
          const { root, elementCount, index, element, decommitments } = merkleTree.generateSingleProof(0);

          const expectedDecommitments = [];

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(elementCount).to.equal(1);
          expect(index).to.equal(0);
          expect(element.equals(elements[0])).to.equal(true);
          expect(decommitments.length).to.equal(expectedDecommitments.length);
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
          expect(balancedProof.elementCount).to.equal(unbalancedProof.elementCount);
          expect(balancedProof.index).to.equal(unbalancedProof.index);
          expect(balancedProof.element.equals(unbalancedProof.element)).to.equal(true);
          expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
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
          expect(balancedProof.elementCount).to.equal(unbalancedProof.elementCount);
          expect(balancedProof.index).to.equal(unbalancedProof.index);
          expect(balancedProof.element.equals(unbalancedProof.element)).to.equal(true);
          expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
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
            expect(proof.elementCount).to.equal(merkleTree.elements.length);
            expect(proof.indices).to.deep.equal(indices);
            expect(proof.elements.length).to.equal(indices.length);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
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
            expect(proof.elementCount).to.equal(merkleTree.elements.length);
            expect(proof.indices).to.deep.equal(indices);
            expect(proof.elements.length).to.equal(indices.length);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
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
            expect(proof.elementCount).to.equal(merkleTree.elements.length);
            expect(proof.indices).to.deep.equal(indices);
            expect(proof.elements.length).to.equal(indices.length);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
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
            expect(proof.elementCount).to.equal(merkleTree.elements.length);
            expect(proof.indices).to.deep.equal(indices);
            expect(proof.elements.length).to.equal(indices.length);
            proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
            expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
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
            expect(balancedProof.elementCount).to.equal(unbalancedProof.elementCount);
            expect(balancedProof.indices).to.deep.equal(unbalancedProof.indices);
            balancedProof.elements.forEach((element, i) =>
              expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
            );
            expect(balancedProof.elements.length).to.equal(unbalancedProof.elements.length);
            balancedProof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
            );
            expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
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
            expect(balancedProof.elementCount).to.equal(unbalancedProof.elementCount);
            expect(balancedProof.indices).to.deep.equal(unbalancedProof.indices);
            balancedProof.elements.forEach((element, i) =>
              expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
            );
            expect(balancedProof.elements.length).to.equal(unbalancedProof.elements.length);
            balancedProof.decommitments.forEach((decommitment, i) =>
              expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
            );
            expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
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

          it('should use 100 Multi Proofs for a 16-element sorted-hash Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
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
            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
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

              const expectedFlags = [true, false, false, false, true];
              const expectedSkips = [false, false, false, false, false];

              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              expect(proof.elementCount).to.deep.equal(8);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags).to.deep.equal(expectedFlags);
              expect(proof.skips).to.deep.equal(expectedSkips);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
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
              expect(proof.elementCount).to.deep.equal(1);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags).to.deep.equal(expectedFlags);
              expect(proof.skips).to.deep.equal(expectedSkips);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
            });
          });

          describe('Unbalanced', () => {
            it('should generate a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(12, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [11, 8, 3, 2];
              const proof = merkleTree.generateMultiProof(indices, options);

              const expectedDecommitments = [
                '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
                'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
                'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
                'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
              ];

              const expectedFlags = [false, false, true, true, false, false, false, true];
              const expectedSkips = [false, false, false, false, false, true, false, false];

              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              expect(proof.elementCount).to.deep.equal(12);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags).to.deep.equal(expectedFlags);
              expect(proof.skips).to.deep.equal(expectedSkips);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
            });

            it('should generate a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(19, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [17, 12, 9, 4, 2];
              const proof = merkleTree.generateMultiProof(indices, options);

              const expectedDecommitments = [
                '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
                '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
                'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
                '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
                'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
                'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
                'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85',
                '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              ];

              const expectedFlags = [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                true,
                false,
                true,
                true,
              ];

              const expectedSkips = [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                false,
              ];

              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              expect(proof.elementCount).to.deep.equal(19);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags).to.deep.equal(expectedFlags);
              expect(proof.skips).to.deep.equal(expectedSkips);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
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
              expect(balancedProof.elements.length).to.equal(unbalancedProof.elements.length);
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
              expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
            });

            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
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
              expect(balancedProof.elements.length).to.equal(unbalancedProof.elements.length);
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
              expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
            });
          });
        });

        describe('Existence-Only Boolean-Array Multi Proof Verification', () => {
          describe('Balanced', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
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
            it('should verify a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(12, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [11, 8, 3, 0];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);

              expect(proofValid).to.equal(true);
            });

            it('should verify a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(19, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [17, 12, 9, 4, 2];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);

              expect(proofValid).to.equal(true);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
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
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements.', () => {
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
            it('should verify a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(12, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);

              const indices = [11, 8, 3, 0];
              const newElements = generateElements(4, { seed: '11' });
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

            it('should verify a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const elements = generateElements(19, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);

              const indices = [17, 12, 9, 4, 2];
              const newElements = generateElements(5, { seed: '11' });
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

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
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
            it('should use 100 Multi Proofs for a 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              let elements = generateElements(19);
              let merkleTree = new MerkleTree(elements, options);

              // Elements to be inserted at respective indices
              const newElementsMatrix = Array.from({ length: 100 }, () => generateElements(6));
              const rawIndicesMatrix = Array.from({ length: 100 }, () =>
                Array.from({ length: 6 }, () => Math.floor(Math.random() * 19))
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
        });
      });

      describe('Existence-Only Boolean-Bit Multi Proofs', () => {
        describe('Existence-Only Boolean-Bit Multi Proof Generation', () => {
          describe('Balanced', () => {
            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);

              const expectedDecommitments = [
                '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
              ];

              const expectedFlags = Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000000011',
                'hex'
              );

              const expectedSkips = Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000000000',
                'hex'
              );

              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              expect(proof.elementCount).to.equal(8);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags.equals(expectedFlags)).to.equal(true);
              expect(proof.hashCount).to.equal(5);
              expect(proof.skips.equals(expectedSkips)).to.equal(true);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
            });

            it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [0];
              const proof = merkleTree.generateMultiProof(indices, options);

              const expectedDecommitments = [];

              const expectedFlags = Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000000000',
                'hex'
              );

              const expectedSkips = Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000000000',
                'hex'
              );

              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              expect(proof.elementCount).to.equal(1);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags.equals(expectedFlags)).to.equal(true);
              expect(proof.hashCount).to.equal(0);
              expect(proof.skips.equals(expectedSkips)).to.equal(true);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
            });
          });

          describe('Unbalanced', () => {
            it('should generate a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(12, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [11, 8, 3, 2];
              const proof = merkleTree.generateMultiProof(indices, options);

              const expectedDecommitments = [
                '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
                'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
                'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
                'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
              ];

              const expectedFlags = Buffer.from(
                '000000000000000000000000000000000000000000000000000000000000008c',
                'hex'
              );

              const expectedSkips = Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000000020',
                'hex'
              );

              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              expect(proof.elementCount).to.equal(12);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags.equals(expectedFlags)).to.equal(true);
              expect(proof.hashCount).to.equal(8);
              expect(proof.skips.equals(expectedSkips)).to.equal(true);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
            });

            it('should generate a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(19, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [17, 12, 9, 4, 2];
              const proof = merkleTree.generateMultiProof(indices, options);

              const expectedDecommitments = [
                '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
                '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
                'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
                '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
                'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
                'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
                'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85',
                '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              ];

              const expectedFlags = Buffer.from(
                '000000000000000000000000000000000000000000000000000000000000d800',
                'hex'
              );

              const expectedSkips = Buffer.from(
                '0000000000000000000000000000000000000000000000000000000000002400',
                'hex'
              );

              expect(proof.root.equals(merkleTree.root)).to.equal(true);
              expect(proof.elementCount).to.equal(19);
              proof.elements.forEach((element, i) => expect(element.equals(elements[indices[i]])).to.equal(true));
              expect(proof.elements.length).to.equal(indices.length);
              expect(proof.flags.equals(expectedFlags)).to.equal(true);
              expect(proof.hashCount).to.equal(16);
              expect(proof.skips.equals(expectedSkips)).to.equal(true);
              proof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
              );
              expect(proof.decommitments.length).to.equal(expectedDecommitments.length);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: false, indexed: false, bitFlags: true };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [5, 4, 1];

              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);

              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);

              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              expect(balancedProof.elementCount).to.deep.equal(unbalancedProof.elementCount);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.elements.length).to.equal(unbalancedProof.elements.length);
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
              expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
            });

            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(8, { seed: 'ff' });
              const indices = [5, 4, 1];

              const balancedMerkleTree = new MerkleTree(elements, options);
              const balancedProof = balancedMerkleTree.generateMultiProof(indices, options);

              options.unbalanced = true;
              const unbalancedMerkleTree = new MerkleTree(elements, options);
              const unbalancedProof = unbalancedMerkleTree.generateMultiProof(indices, options);

              expect(balancedProof.root.equals(unbalancedProof.root)).to.equal(true);
              expect(balancedProof.elementCount).to.deep.equal(unbalancedProof.elementCount);
              balancedProof.elements.forEach((element, i) =>
                expect(element.equals(unbalancedProof.elements[i])).to.equal(true)
              );
              expect(balancedProof.elements.length).to.equal(unbalancedProof.elements.length);
              expect(balancedProof.flags).to.deep.equal(unbalancedProof.flags);
              expect(balancedProof.skips).to.deep.equal(unbalancedProof.skips);
              balancedProof.decommitments.forEach((decommitment, i) =>
                expect(decommitment.equals(unbalancedProof.decommitments[i])).to.equal(true)
              );
              expect(balancedProof.decommitments.length).to.equal(unbalancedProof.decommitments.length);
            });
          });
        });

        describe('Existence-Only Boolean-Bit Multi Proof Verification', () => {
          describe('Balanced', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(8, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [5, 4, 1];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);

              expect(proofValid).to.equal(true);
            });

            it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(1, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [0];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);

              expect(proofValid).to.equal(true);
            });
          });

          describe('Unbalanced', () => {
            it('should generate a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(12, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [11, 8, 3, 2];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);

              expect(proofValid).to.equal(true);
            });

            it('should generate a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const elements = generateElements(19, { seed: 'ff' });
              const merkleTree = new MerkleTree(elements, options);
              const indices = [17, 12, 9, 4, 2];
              const proof = merkleTree.generateMultiProof(indices, options);
              const proofValid = MerkleTree.verifyMultiProof(proof, options);

              expect(proofValid).to.equal(true);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
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
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
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
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
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
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
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
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
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

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
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

        describe('Existence-Only Boolean-Bit Multi Proof Update Consecutive Uses', () => {
          describe('Balanced', () => {
            it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
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
            it('should use 100 Multi Proofs for a 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              let elements = generateElements(19);
              let merkleTree = new MerkleTree(elements, options);

              // Elements to be inserted at respective indices
              const newElementsMatrix = Array.from({ length: 100 }, () => generateElements(6));
              const rawIndicesMatrix = Array.from({ length: 100 }, () =>
                Array.from({ length: 6 }, () => Math.floor(Math.random() * 19))
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
        });
      });
    });
  });

  describe('Append Proofs', () => {
    describe('Append Proof Generation', () => {
      it('should generate an Append Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { root, elementCount, decommitments } = merkleTree.generateAppendProof();

        const expectedDecommitments = ['0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60'];

        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(1);
        decommitments.forEach((decommitment, i) =>
          expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
        );
        expect(decommitments.length).to.equal(expectedDecommitments.length);
      });

      it('should generate an Append Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(2, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { root, elementCount, decommitments } = merkleTree.generateAppendProof();

        const expectedDecommitments = ['a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27'];

        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(2);
        decommitments.forEach((decommitment, i) =>
          expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
        );
        expect(decommitments.length).to.equal(expectedDecommitments.length);
      });

      it('should generate an Append Proof for a 3-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(3, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { root, elementCount, decommitments } = merkleTree.generateAppendProof();

        const expectedDecommitments = [
          'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
          'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b',
        ];

        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(3);
        decommitments.forEach((decommitment, i) =>
          expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
        );
        expect(decommitments.length).to.equal(expectedDecommitments.length);
      });

      it('should generate an Append Proof for a 8-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { root, elementCount, decommitments } = merkleTree.generateAppendProof();

        const expectedDecommitments = ['0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4'];

        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(8);
        decommitments.forEach((decommitment, i) =>
          expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
        );
        expect(decommitments.length).to.equal(expectedDecommitments.length);
      });

      it('should generate an Append Proof for a 15-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(15, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const { root, elementCount, decommitments } = merkleTree.generateAppendProof();

        const expectedDecommitments = [
          '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4',
          'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b',
          '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6',
          'e481ff292c1b323f27dd2e7b0da511947e0d349a0616a739ea628a3a5888c529',
        ];

        expect(root.equals(merkleTree.root)).to.equal(true);
        expect(elementCount).to.equal(15);
        decommitments.forEach((decommitment, i) =>
          expect(decommitment.toString('hex')).to.equal(expectedDecommitments[i])
        );
        expect(decommitments.length).to.equal(expectedDecommitments.length);
      });
    });

    describe('Append Proof Verification', () => {
      it('should verify an Append Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(2, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 3-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(3, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 8-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 15-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(15, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 1-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 2-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(2, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 3-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(3, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 8-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });

      it('should verify an Append Proof for a 15-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(15, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const proof = merkleTree.generateAppendProof();
        const proofValid = MerkleTree.verifyAppendProof(proof, options);

        expect(proofValid).to.equal(true);
      });
    });

    describe('Append Proof Single Append', () => {
      it('should use an Append Proof for a 1-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 2-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(2, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 3-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(3, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 8-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 15-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false };
        const elements = generateElements(15, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 1-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 2-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(2, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 3-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(3, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 8-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use an Append Proof for a 15-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true };
        const elements = generateElements(15, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const newElement = generateElements(1, { seed: '11' })[0];
        const proof = merkleTree.generateSingleAppendProof(newElement);
        const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

        const newElements = elements.concat(newElement);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendSingle(newElement);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });
    });

    describe('Append Proof Update Consecutive Uses', () => {
      it('should use 100 Append Proofs for a 15-element Merkle Tree, to append an 100 elements consecutively.', () => {
        const options = { unbalanced: true, sortedHash: false };
        let elements = generateElements(15);
        let merkleTree = new MerkleTree(elements, options);

        // Elements to be appended consecutively
        const newElements = generateElements(100);

        newElements.forEach((newElement) => {
          const proof = merkleTree.generateSingleAppendProof(newElement);
          const { root, elementCount } = MerkleTree.appendSingleWithProof(proof, options);

          elements.push(newElement);
          merkleTree = merkleTree.appendSingle(newElement);

          expect(root.equals(merkleTree.root)).to.equal(true);
          expect(elementCount).to.equal(merkleTree.elements.length);
        });
      });
    });

    describe('Append Proof Multi Append', () => {
      it('should use a Multi Append Proof for a 1-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 2-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(2, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 3-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(3, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 8-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 15-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(15, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 19-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(19, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 49-element Merkle Tree, to append 17 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(49, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(17, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 125-element Merkle Tree, to append 8 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false };
        const elements = generateElements(49, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(17, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 1-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(1, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 2-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(2, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 3-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(3, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 8-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(8, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a 15-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(15, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a sorted-hash 19-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(19, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(5, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a sorted-hash 49-element Merkle Tree, to append 17 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(49, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(17, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });

      it('should use a Multi Append Proof for a sorted-hash 125-element Merkle Tree, to append 8 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false };
        const elements = generateElements(49, { seed: 'ff' });
        const merkleTree = new MerkleTree(elements, options);
        const appendElements = generateElements(17, { seed: '11' });
        const proof = merkleTree.generateMultiAppendProof(appendElements);
        const { root, elementCount } = MerkleTree.appendMultiWithProof(proof, options);
        const newElements = elements.concat(appendElements);
        const newMerkleTree1 = new MerkleTree(newElements, options);
        const newMerkleTree2 = merkleTree.appendMulti(appendElements);

        expect(root.equals(newMerkleTree1.root)).to.equal(true);
        expect(root.equals(newMerkleTree2.root)).to.equal(true);
        expect(elementCount).to.equal(newMerkleTree1.elements.length);
        expect(elementCount).to.equal(newMerkleTree2.elements.length);
      });
    });
  });
});
