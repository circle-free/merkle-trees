'strict';

const chai = require('chai');
const { expect } = chai;
const { generateElements } = require('./helpers');
const { MerkleTree, PartialMerkleTree } = require('../index');
const { it } = require('mocha');

const testTreeFromSingleProof = (elementCount, seed, index, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateSingleProof(index, options);
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options);

  expect(partialTree._sortedHash).to.equal(merkleTree._sortedHash);
  expect(partialTree._unbalanced).to.equal(merkleTree._unbalanced);
  expect(partialTree._elementPrefix.equals(merkleTree._elementPrefix)).to.be.true;
  expect(partialTree._depth).to.equal(merkleTree._depth);
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements);
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree);
};

const testTreeFromSingleUpdateProof = (elementCount, seed, index, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const updateElement = generateElements(1, { seed: '11' })[0];
  const { proof, newMerkleTree } = merkleTree.updateSingle(index, updateElement, options);
  const partialTree = PartialMerkleTree.fromSingleUpdateProof(proof, options);

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash);
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced);
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true;
  expect(partialTree._depth).to.equal(newMerkleTree._depth);
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements);
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree);
};

const testTreeFromMultiProof = (elementCount, seed, indices, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateMultiProof(indices, options);
  const partialTree = PartialMerkleTree.fromMultiProof(proof, options);

  expect(partialTree._sortedHash).to.equal(merkleTree._sortedHash);
  expect(partialTree._unbalanced).to.equal(merkleTree._unbalanced);
  expect(partialTree._elementPrefix.equals(merkleTree._elementPrefix)).to.be.true;
  expect(partialTree._depth).to.equal(merkleTree._depth);
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements);
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree);
};

const testTreeFromMultiUpdateProof = (elementCount, seed, indices, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const updateElements = generateElements(indices.length, { seed: '11' });
  const { proof, newMerkleTree } = merkleTree.updateMulti(indices, updateElements, options);
  const partialTree = PartialMerkleTree.fromMultiUpdateProof(proof, options);

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash);
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced);
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true;
  expect(partialTree._depth).to.equal(newMerkleTree._depth);
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements);
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree);
};

const testTreeFromSingleAppendProof = (elementCount, seed, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const appendElement = generateElements(1, { seed: '22' })[0];
  const { proof, newMerkleTree } = merkleTree.appendSingle(appendElement, options);
  const partialTree = PartialMerkleTree.fromAppendProof(proof, options);

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash);
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced);
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true;
  expect(partialTree._depth).to.equal(newMerkleTree._depth);
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements);
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree);
};

const testTreeFromMultiAppendProof = (elementCount, seed, appendCount, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const appendElements = generateElements(appendCount, { seed: '22' });
  const { proof, newMerkleTree } = merkleTree.appendMulti(appendElements, options);
  const partialTree = PartialMerkleTree.fromAppendProof(proof, options);

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash);
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced);
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true;
  expect(partialTree._depth).to.equal(newMerkleTree._depth);
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements);
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree);
};

const testGenerateSingleProofFromPartial = (elementCount, index, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateSingleProof(index, options);
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options);

  const proofFromPartial = partialTree.generateSingleProof(index, options);
  const proofIsValid = MerkleTree.verifySingleProof(proofFromPartial, options);

  expect(proofIsValid).to.be.true;
  expect(proofFromPartial.root.equals(proof.root)).to.be.true;
};

const testGenerateSingleUpdateProofFromSinglePartial = (elementCount, index, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const updateElement = generateElements(1, { seed: '11' })[0];

  const merkleTree = new MerkleTree(elements, options);
  const { proof: proofFromTree, newMerkleTree } = merkleTree.updateSingle(index, updateElement, options);

  const partialTree = PartialMerkleTree.fromSingleProof(proofFromTree, options);
  const { proof: proofFromPartialTree, newPartialTree } = partialTree.updateSingle(index, updateElement, options);

  const proofFromPartialTreeIsValid = MerkleTree.verifySingleProof(proofFromPartialTree, options);

  expect(proofFromPartialTreeIsValid).to.be.true;
  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true;
};

const testGenerateMultiUpdateProofFromMultiPartial = (elementCount, indices, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const updateElements = generateElements(indices.length, { seed: '11' });

  const merkleTree = new MerkleTree(elements, options);
  const { proof: proofFromTree, newMerkleTree } = merkleTree.updateMulti(indices, updateElements, options);

  const partialTree = PartialMerkleTree.fromMultiProof(proofFromTree, options);
  const { proof: proofFromPartialTree, newPartialTree } = partialTree.updateMulti(indices, updateElements, options);

  const proofFromPartialTreeIsValid = MerkleTree.verifyMultiProof(proofFromPartialTree, options);

  expect(proofFromPartialTreeIsValid).to.be.true;
  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true;
};

const testCheckElements = (elementCount, index, checkIndices, expectations, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateSingleProof(index, options);
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options);
  const elementChecks = partialTree.check(
    checkIndices,
    checkIndices.map((i) => elements[i])
  );

  expect(elementChecks).to.deep.equal(expectations);
  checkIndices.forEach((index, i) => expect(partialTree.check(index, elements[index])).to.equal(expectations[i]));
};

const testSetElement = (elementCount, index, setIndex, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateSingleProof(index, options);
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options);
  const newPartialTree = partialTree.set(setIndex, elements[setIndex]);

  [index, setIndex].forEach((i) => expect(newPartialTree._elements[i].equals(elements[i])).to.be.true);
  const expectedTreeNodes = partialTree._tree.map((n) => n && n.toString('hex'));
  const newLeafIndex = (newPartialTree._tree.length >> 1) + setIndex;
  expectedTreeNodes[newLeafIndex] = merkleTree._tree[newLeafIndex].toString('hex');
  expect(newPartialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expectedTreeNodes);
};

const testSetElements = (elementCount, index, setIndices, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateSingleProof(index, options);
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options);
  const newPartialTree = partialTree.set(
    setIndices,
    setIndices.map((i) => elements[i])
  );

  setIndices.concat(index).forEach((i) => expect(newPartialTree._elements[i].equals(elements[i])).to.be.true);
  const expectedTreeNodes = partialTree._tree.map((n) => n && n.toString('hex'));

  setIndices.forEach((setIndex) => {
    const newLeafIndex = (newPartialTree._tree.length >> 1) + setIndex;
    expectedTreeNodes[newLeafIndex] = merkleTree._tree[newLeafIndex].toString('hex');
  });

  expect(newPartialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expectedTreeNodes);
};

const testAppendElement = (elementCount, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const index = elementCount - 1;
  const proof = merkleTree.generateSingleProof(index, options);
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options);
  const appendElement = generateElements(1, { seed: '22' })[0];
  const newPartialTree = partialTree.append(appendElement);
  const newMerkleTree = new MerkleTree(elements.concat(appendElement), options);

  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true;
};

const testAppendElements = (elementCount, appendElementCount, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const index = elementCount - 1;
  const proof = merkleTree.generateSingleProof(index, options);
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options);
  const appendElements = generateElements(appendElementCount, { seed: '22' });
  const newPartialTree = partialTree.append(appendElements);
  const newMerkleTree = new MerkleTree(elements.concat(appendElements), options);

  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true;
};

describe('Partial Merkle Trees', () => {
  describe('Build Partial Trees From Single Proofs', () => {
    describe('Balanced', () => {
      it('should build an 8-element Partial Tree from a Single Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };

        const elements = Array(8).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';

        const tree = Array(16).fill(null);
        tree[10] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[11] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[0] = 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d';

        const expected = { elements, tree };

        testTreeFromSingleProof(8, 'ff', 2, expected, options);
      });

      it('should build a 1-element Partial Tree from a Single Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromSingleProof(1, 'ff', 0, expected, options);
      });

      it('should build a sorted-hash 8-element Partial Tree from a Single Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };

        const elements = Array(8).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';

        const tree = Array(16).fill(null);
        tree[10] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[11] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c';
        tree[1] = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        tree[0] = '6764fd6d226590b844285c3d0f1e12bbd19cb7d1ee8277b0fb5b9b45efbbffb6';

        const expected = { elements, tree };

        testTreeFromSingleProof(8, 'ff', 2, expected, options);
      });

      it('should build a sorted-hash 1-element Partial Tree from a Single Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromSingleProof(1, 'ff', 0, expected, options);
      });

      it('should build an 8-element Partial Tree from a compact Single Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };

        const elements = Array(8).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';

        const tree = Array(16).fill(null);
        tree[10] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[11] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[0] = 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d';

        const expected = { elements, tree };

        testTreeFromSingleProof(8, 'ff', 2, expected, options);
      });

      it('should build a 1-element Partial Tree from a compact Single Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromSingleProof(1, 'ff', 0, expected, options);
      });
    });

    describe('Unbalanced', () => {
      it('should build a 9-element Partial Tree from a Single Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const elements = Array(9).fill(null);
        elements[8] = '137b5194eb17aa8cc50e40d7054133657e5e5e13a6a746694cc6d464993ea3f1';

        const tree = Array(32).fill(null);
        tree[24] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[12] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[6] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[3] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[2] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[1] = '5449a839359e08115bbc14ed1795892a3a8562d583744e1a1fa146d273ff1f55';
        tree[0] = '743605bc7fcb07d66ecf3f2b5fcea24bfb27901bfbdb7baf6a194aa45d62461d';

        const expected = { elements, tree };

        testTreeFromSingleProof(9, 'ff', 8, expected, options);
      });

      it('should build a 27-element Partial Tree from a Single Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const elements = Array(27).fill(null);
        elements[25] = '07f7dfa8d4ab639269639378be0af23e0a8edb7dd76f1a6b84d9011a930c1036';

        const tree = Array(64).fill(null);
        tree[57] = 'f26d6a46e3dd889bd514b8b08b003efa113e9e1886681ad5d518fa292035a392';
        tree[56] = 'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a';
        tree[28] = 'dd1c66ff9c67d05f1aeb7ec6196210db830b83ac973345b2908d31677d52c311';
        tree[29] = '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b';
        tree[14] = '24975f4bf474a6484760e2489b06f74e0f107c06507c1c3daa2d264a3eaca401';
        tree[7] = '24975f4bf474a6484760e2489b06f74e0f107c06507c1c3daa2d264a3eaca401';
        tree[6] = '88d2a11c3b0935fc6a30e3b0a69fa58a84de08ea333248f23e5d747613fc04f9';
        tree[3] = 'fa0c9c1524f303d1d23d569be579c73757c184b063d106da9f87589048bd81e8';
        tree[2] = 'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be';
        tree[1] = '864ec5c4fc04d31a78f34609510aae2359aadd8f6552c90f4b19f577320c95a3';
        tree[0] = '82d4289279a9a69edeffe02b207e8b4c71f924361c5db2f08ec2f40d97ceb4cf';

        const expected = { elements, tree };

        testTreeFromSingleProof(27, 'ff', 25, expected, options);
      });

      it('should build a 100-element Partial Tree from a Single Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const elements = Array(100).fill(null);
        elements[97] = 'b646b7374351011433374985a8369211f174e82217b148284dd289aea0924048';

        const tree = Array(256).fill(null);
        tree[225] = 'df772d27e4b7660ec33c84fad6f1cefecc233191a1a6c96392ebbaadb1c1a745';
        tree[224] = '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c';
        tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
        tree[113] = 'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681';
        tree[56] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[28] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[14] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[7] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
        tree[3] = 'c7ac26658765aeb6a62d2ff9670a675e6a701dc072d31882537c17797540d1ba';
        tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
        tree[1] = 'e6d48938549ee639bbd7650edd189b1a6d3c375b9392dfa4d53168696aac096f';
        tree[0] = '1971f4a916665d02ab059da67d0212746fc7e0d7bf953e53f6426e51cf3f3eb8';

        const expected = { elements, tree };

        testTreeFromSingleProof(100, 'ff', 97, expected, options);
      });

      it('should build a sorted-hash 9-element Partial Tree from a Single Proof.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };

        const elements = Array(9).fill(null);
        elements[8] = '137b5194eb17aa8cc50e40d7054133657e5e5e13a6a746694cc6d464993ea3f1';

        const tree = Array(32).fill(null);
        tree[24] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[12] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[6] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[3] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[2] = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        tree[1] = '86620d93d22f2d06344f81166356ed881cfdc36c8b35a7115e8b0daad4d56ee4';
        tree[0] = '4c10104ea544f26190809c1117a092b18c8d7ab892f23c30a0f0cdb2c5242c48';

        const expected = { elements, tree };

        testTreeFromSingleProof(9, 'ff', 8, expected, options);
      });

      it('should build a sorted-hash 27-element Partial Tree from a Single Proof', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };

        const elements = Array(27).fill(null);
        elements[25] = '07f7dfa8d4ab639269639378be0af23e0a8edb7dd76f1a6b84d9011a930c1036';

        const tree = Array(64).fill(null);
        tree[57] = 'f26d6a46e3dd889bd514b8b08b003efa113e9e1886681ad5d518fa292035a392';
        tree[56] = 'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a';
        tree[28] = 'dd1c66ff9c67d05f1aeb7ec6196210db830b83ac973345b2908d31677d52c311';
        tree[29] = '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b';
        tree[14] = 'd7a7143b496e3b66ffe1b218adb9437298aaa02bb63526f6f0c0ea1e30c1bdfb';
        tree[7] = 'd7a7143b496e3b66ffe1b218adb9437298aaa02bb63526f6f0c0ea1e30c1bdfb';
        tree[6] = 'c62e1d7cf122111fa068da94e48ecd21cb02bba4bd41d56e9f4b69a4509a2962';
        tree[3] = '2152896c688a914f712d6ec00dfdfb64f04f2a59ff31f6fb6f2b4ee49137ea90';
        tree[2] = '2c2cdc952c9d537709959cd357f6268fff33e5e21147f1a23db6cae78fb91eb9';
        tree[1] = '631a369d35cbaa7521202f8746fbb2727209acb39c71437ab607efc0356e57c5';
        tree[0] = 'f486e0285ce20258ec9bc865b05ca7b781c80356a80c4589cebfe6a21920246c';

        const expected = { elements, tree };

        testTreeFromSingleProof(27, 'ff', 25, expected, options);
      });

      it('should build a sorted-hash 100-element Partial Tree from a Single Proof', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };

        const elements = Array(100).fill(null);
        elements[97] = 'b646b7374351011433374985a8369211f174e82217b148284dd289aea0924048';

        const tree = Array(256).fill(null);
        tree[225] = 'df772d27e4b7660ec33c84fad6f1cefecc233191a1a6c96392ebbaadb1c1a745';
        tree[224] = '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c';
        tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
        tree[113] = 'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681';
        tree[56] = 'fd40325cdd68255b4c4d9c1ef4b7f96d3e9fb685ed1fe4a66a8b07a5b58c4d11';
        tree[28] = 'fd40325cdd68255b4c4d9c1ef4b7f96d3e9fb685ed1fe4a66a8b07a5b58c4d11';
        tree[14] = 'fd40325cdd68255b4c4d9c1ef4b7f96d3e9fb685ed1fe4a66a8b07a5b58c4d11';
        tree[7] = 'fd40325cdd68255b4c4d9c1ef4b7f96d3e9fb685ed1fe4a66a8b07a5b58c4d11';
        tree[6] = '904afce76e0f7ccead463e22aec76018c1450afd3deb4f387e0617ef39721685';
        tree[3] = 'eff316f1875dfc72ac589474bbe0902e326b41894a7d91bbcdcb496d4c7b91af';
        tree[2] = 'bb9a6e5787ae741c6a0e75a360aefe75ee06284ece1edddc1573ac9462945e7f';
        tree[1] = '5c0bd9cce6a6b4da7a61e98b6d1f14fa323a5e7d583798aab4f17617b40f62f0';
        tree[0] = '2b77cea5d8a8c7da68b24f3cefbfe4c7ec98d4f039b91dcdd841fb5c4f739cfd';

        const expected = { elements, tree };

        testTreeFromSingleProof(100, 'ff', 97, expected, options);
      });

      it('should build a 100-element Partial Tree from a compact Single Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };

        const elements = Array(100).fill(null);
        elements[97] = 'b646b7374351011433374985a8369211f174e82217b148284dd289aea0924048';

        const tree = Array(256).fill(null);
        tree[225] = 'df772d27e4b7660ec33c84fad6f1cefecc233191a1a6c96392ebbaadb1c1a745';
        tree[224] = '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c';
        tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
        tree[113] = 'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681';
        tree[56] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[28] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[14] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[7] = 'fc73842409eddc3eaa4152b720a42c61c2174fda448d9e5282d6b9760fb1d823';
        tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
        tree[3] = 'c7ac26658765aeb6a62d2ff9670a675e6a701dc072d31882537c17797540d1ba';
        tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
        tree[1] = 'e6d48938549ee639bbd7650edd189b1a6d3c375b9392dfa4d53168696aac096f';
        tree[0] = '1971f4a916665d02ab059da67d0212746fc7e0d7bf953e53f6426e51cf3f3eb8';

        const expected = { elements, tree };

        testTreeFromSingleProof(100, 'ff', 97, expected, options);
      });
    });
  });

  describe('Build Partial Trees From Single Update Proofs', () => {
    describe('Balanced', () => {
      it('should build an 8-element Partial Tree from a Single Update Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };

        const elements = Array(8).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(16).fill(null);
        tree[10] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[11] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[5] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[2] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '1078ae4bb62347da6c2e6445a352f4ac8399535dcd913416a88edc1767f14b16';
        tree[0] = '5f9e3e380d71f3828a04f1d44bdd74e441938c088bababc4e13a528f48a65230';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(8, 'ff', 2, expected, options);
      });

      it('should build a 1-element Partial Tree from a Single Update Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(1, 'ff', 0, expected, options);
      });

      it('should build a sorted-hash 8-element Partial Tree from a Single Update Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };

        const elements = Array(8).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(16).fill(null);
        tree[10] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[11] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[5] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[2] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[3] = 'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c';
        tree[1] = '50b40f707599689bc8023eb6de04e9f00532e4de06077f4f40d99a6fea08cd7f';
        tree[0] = '69c1b153b07cf3524f28678a2deffba09085aed0296da9a583b4307bcb4b7157';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(8, 'ff', 2, expected, options);
      });

      it('should build a sorted-hash 1-element Partial Tree from a Single Update Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(1, 'ff', 0, expected, options);
      });

      it('should build an 8-element Partial Tree from a compact Single Update Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };

        const elements = Array(8).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(16).fill(null);
        tree[10] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[11] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[5] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[2] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '1078ae4bb62347da6c2e6445a352f4ac8399535dcd913416a88edc1767f14b16';
        tree[0] = '5f9e3e380d71f3828a04f1d44bdd74e441938c088bababc4e13a528f48a65230';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(8, 'ff', 2, expected, options);
      });

      it('should build a 1-element Partial Tree from a compact Single Update Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(1, 'ff', 0, expected, options);
      });
    });

    describe('Unbalanced', () => {
      it('should build a 9-element Partial Tree from a Single Update Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const elements = Array(9).fill(null);
        elements[8] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(32).fill(null);
        tree[24] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[12] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[6] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[3] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[2] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[1] = 'da3e7fc24e77582fb320b79b59bdb74edb3c4ee5d59f1fe0a38c21af7294485a';
        tree[0] = 'dc24680d74fb46576df0172fff0f778becd7c3053e8b8fbf142e15caf2399125';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(9, 'ff', 8, expected, options);
      });

      it('should build a 27-element Partial Tree from a Single Update Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const elements = Array(27).fill(null);
        elements[25] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(64).fill(null);
        tree[57] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[56] = 'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a';
        tree[28] = 'fed21bdfb042f5e53cae1173e43a6ccedd53a91d25995912a48ab02584135568';
        tree[29] = '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b';
        tree[14] = 'd5519a13a967dff94ca0ddb572261749ad5b1506a1e31236975bb5c9cb607899';
        tree[7] = 'd5519a13a967dff94ca0ddb572261749ad5b1506a1e31236975bb5c9cb607899';
        tree[6] = '88d2a11c3b0935fc6a30e3b0a69fa58a84de08ea333248f23e5d747613fc04f9';
        tree[3] = '636ac5d86984c900efe32640943d4dc25ea08b6b8702a44d696acc3f9ac8bf06';
        tree[2] = 'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be';
        tree[1] = '4bb6bf484b7d59b9e2bf077dc2371b4d789b09f81642f234c83a4c5531f771d6';
        tree[0] = '86736648d4ff694b44aa7a9d1a5b340a553911a44629d7c8adbeac7532ea3821';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(27, 'ff', 25, expected, options);
      });

      it('should build a 100-element Partial Tree from a Single Update Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const elements = Array(100).fill(null);
        elements[97] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(256).fill(null);
        tree[225] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[224] = '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c';
        tree[112] = 'e7460e0eccc4403f9059c623ae43e560a0b6f4b9785d8a10415f969a8c2e43a9';
        tree[113] = 'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681';
        tree[56] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[28] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[14] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[7] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
        tree[3] = '933e92290b8e923d9e547b70303a61e667e4f03d4466de1ec26784453373f3b1';
        tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
        tree[1] = '4ecd6f339dc6f43d8fa3de95e02a64f0ec5164e3c3efc0039971f0d26c5f3158';
        tree[0] = 'cfad3bbd49206b0a95e99bc8142dbc721bfba301b92d58f333be397d8e7aafe6';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(100, 'ff', 97, expected, options);
      });

      it('should build a sorted-hash 9-element Partial Tree from a Single Update Proof.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };

        const elements = Array(9).fill(null);
        elements[8] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(32).fill(null);
        tree[24] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[12] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[6] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[3] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[2] = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        tree[1] = 'f1a096a975a9f9513dfdb118bb20a97d8c295b6f0611dc0f534a3b6bec295936';
        tree[0] = 'be0810314c2e27c5f5603badd29180a7b05c653610316a9a0c8c8a12a717714d';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(9, 'ff', 8, expected, options);
      });

      it('should build a sorted-hash 27-element Partial Tree from a Single Update Proof', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };

        const elements = Array(27).fill(null);
        elements[25] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(64).fill(null);
        tree[57] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[56] = 'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a';
        tree[28] = 'd7fd8f16dd0c420b695ed34e12141c4530b65cd346a1d5cc1c077057a33a785b';
        tree[29] = '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b';
        tree[14] = '4c14cf08dc05a191b4f04fd7001fa1d71f0e617ae645fa2e8f93a11a042ad060';
        tree[7] = '4c14cf08dc05a191b4f04fd7001fa1d71f0e617ae645fa2e8f93a11a042ad060';
        tree[6] = 'c62e1d7cf122111fa068da94e48ecd21cb02bba4bd41d56e9f4b69a4509a2962';
        tree[3] = 'e63eff8548c4a352c11fbbd2a1111b4526a98c3eb39eedd01c2b4345511de708';
        tree[2] = '2c2cdc952c9d537709959cd357f6268fff33e5e21147f1a23db6cae78fb91eb9';
        tree[1] = '521a2fa11c738870dec9c2519a45dfd866fb9b0a95b7cead92e432e6b353a921';
        tree[0] = 'c3c247c16fb9d52178d83da6a3f85172060739de643923ec8acb692be839ff75';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(27, 'ff', 25, expected, options);
      });

      it('should build a sorted-hash 100-element Partial Tree from a Single Update Proof', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };

        const elements = Array(100).fill(null);
        elements[97] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(256).fill(null);
        tree[225] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[224] = '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c';
        tree[112] = 'e7460e0eccc4403f9059c623ae43e560a0b6f4b9785d8a10415f969a8c2e43a9';
        tree[113] = 'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681';
        tree[56] = '59b2383d7d0a521066520a275438e3d49d1f72c8950d0ac5caa665152f929670';
        tree[28] = '59b2383d7d0a521066520a275438e3d49d1f72c8950d0ac5caa665152f929670';
        tree[14] = '59b2383d7d0a521066520a275438e3d49d1f72c8950d0ac5caa665152f929670';
        tree[7] = '59b2383d7d0a521066520a275438e3d49d1f72c8950d0ac5caa665152f929670';
        tree[6] = '904afce76e0f7ccead463e22aec76018c1450afd3deb4f387e0617ef39721685';
        tree[3] = '3766820de274be4c4a7c41b54218a5c04dfc58e539d219d86625548150d76e7e';
        tree[2] = 'bb9a6e5787ae741c6a0e75a360aefe75ee06284ece1edddc1573ac9462945e7f';
        tree[1] = '4c59bb7f57405275a4dae1f8c2ec3d0b8852d01c3570550c358f233b6b0685ce';
        tree[0] = 'f315156d41b9e00a931aeff237c52b1f83ce87942bda42c0a7500d96e13ad980';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(100, 'ff', 97, expected, options);
      });

      it('should build a 100-element Partial Tree from a compact Single Update Proof', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };

        const elements = Array(100).fill(null);
        elements[97] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(256).fill(null);
        tree[225] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[224] = '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c';
        tree[112] = 'e7460e0eccc4403f9059c623ae43e560a0b6f4b9785d8a10415f969a8c2e43a9';
        tree[113] = 'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681';
        tree[56] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[28] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[14] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[7] = '6a14db7dc66e0be22f91e132c9e092e887dacd1a2526b9ca4c470d7f8734e2a3';
        tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
        tree[3] = '933e92290b8e923d9e547b70303a61e667e4f03d4466de1ec26784453373f3b1';
        tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
        tree[1] = '4ecd6f339dc6f43d8fa3de95e02a64f0ec5164e3c3efc0039971f0d26c5f3158';
        tree[0] = 'cfad3bbd49206b0a95e99bc8142dbc721bfba301b92d58f333be397d8e7aafe6';

        const expected = { elements, tree };

        testTreeFromSingleUpdateProof(100, 'ff', 97, expected, options);
      });
    });
  });

  describe('Build Partial Trees From Indexed Multi Proofs', () => {
    describe('Balanced', () => {
      it('should build an 8-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };

        const elements = Array(8).fill(null);
        elements[1] = 'ab28e51d2b2978f600476d733f1fb8688095ab06619ff948f4faf487a36d61be';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[5] = '2deea3ad223102262743172859e6077fca0415f5825a11f88222ebe424d524f1';

        const tree = Array(16).fill(null);
        tree[9] = '530371c484bd3476650533bc45fc8d339ccac500552b3c0ceea3e4aba4ffe3ac';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[13] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[6] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[0] = 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d';

        const expected = { elements, tree };

        testTreeFromMultiProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromMultiProof(1, 'ff', [0], expected, options);
      });

      it('should build a sorted-hash 8-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };

        const elements = Array(8).fill(null);
        elements[1] = 'ab28e51d2b2978f600476d733f1fb8688095ab06619ff948f4faf487a36d61be';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[5] = '2deea3ad223102262743172859e6077fca0415f5825a11f88222ebe424d524f1';

        const tree = Array(16).fill(null);
        tree[9] = '530371c484bd3476650533bc45fc8d339ccac500552b3c0ceea3e4aba4ffe3ac';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[13] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[6] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[7] = 'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c';
        tree[1] = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        tree[0] = '6764fd6d226590b844285c3d0f1e12bbd19cb7d1ee8277b0fb5b9b45efbbffb6';

        const expected = { elements, tree };

        testTreeFromMultiProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a sorted-hash 1-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromMultiProof(1, 'ff', [0], expected, options);
      });

      it('should build an 8-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };

        const elements = Array(8).fill(null);
        elements[1] = 'ab28e51d2b2978f600476d733f1fb8688095ab06619ff948f4faf487a36d61be';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[5] = '2deea3ad223102262743172859e6077fca0415f5825a11f88222ebe424d524f1';

        const tree = Array(16).fill(null);
        tree[9] = '530371c484bd3476650533bc45fc8d339ccac500552b3c0ceea3e4aba4ffe3ac';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[13] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[6] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[0] = 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d';

        const expected = { elements, tree };

        testTreeFromMultiProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromMultiProof(1, 'ff', [0], expected, options);
      });
    });

    describe('Unbalanced', () => {
      it('should build a 12-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };

        const elements = Array(12).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[3] = 'd62f55381db89d56d428a8f383e2bb4690f27ef918d80b9f4735737f6abce3ec';
        elements[8] = '137b5194eb17aa8cc50e40d7054133657e5e5e13a6a746694cc6d464993ea3f1';
        elements[11] = '71677d75cd383c133f32314542bc7936d3d43561b5a5e04ac936310a81ae144b';

        const tree = Array(32).fill(null);
        tree[18] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[19] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[24] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '817d36c43490240f07cc03207faed6536cad93b4c6da8dbdee91cf138af7b0c1';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[13] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[4] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[2] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[3] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[1] = '490333a663032866dc7e1d94b0dd889d3934c21be0d344c8c3df67a51ebc5176';
        tree[0] = 'b2a2c912869453400b0080e31848ccbcabb264d8135bf55452479601f550cdc1';

        const expected = { elements, tree };

        testTreeFromMultiProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };

        const elements = Array(19).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[9] = 'd6ef9b1ab628977e002767025434cb4cc9fe91756355208938d306d4727e2962';
        elements[12] = '9c3b4ba8006b4fc7148cc6eec4d4843f369c9aa6e639ec0c2d9e9574cffb12b2';
        elements[17] = '34c287baaa9a48f13b5fa36a50c07e766febe977aece54114cae624e78fa335f';

        const tree = Array(64).fill(null);
        tree[34] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '14a5443c720c2048f1c0d8a8884e7ef461f2bebd4850bb9576e019d7aca62122';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '6d4884b8cca54ec5d50f49f171f2c2503bf2a592de38124441ad89c30cbca964';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '370025ffa10a94cdc630db59f941fbc4b476e7002a81a358463cd0c180c52452';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[9] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[10] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[11] = '611f780b080a4ea843420e043cf406d6336e10a6cbfcbbcb7cffd5e75dce2d3a';
        tree[12] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[4] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[5] = '951620fb6a7e785dd418bc6e672f36b8591fafe99a4a3bc7f15829d02d08326a';
        tree[6] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[2] = 'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be';
        tree[3] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[1] = '7342698887d2969d39a68ff703c770b84c55ec5bddffe883f664f783c728342b';
        tree[0] = '4259af49ecf3e6b5e2b50ab4e3624b18a13fcb74ad6528e4e112601067ee1c8b';

        const expected = { elements, tree };

        testTreeFromMultiProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });

      it('should build a sorted-hash 12-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };

        const elements = Array(12).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[3] = 'd62f55381db89d56d428a8f383e2bb4690f27ef918d80b9f4735737f6abce3ec';
        elements[8] = '137b5194eb17aa8cc50e40d7054133657e5e5e13a6a746694cc6d464993ea3f1';
        elements[11] = '71677d75cd383c133f32314542bc7936d3d43561b5a5e04ac936310a81ae144b';

        const tree = Array(32).fill(null);
        tree[18] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[19] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[24] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '817d36c43490240f07cc03207faed6536cad93b4c6da8dbdee91cf138af7b0c1';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[13] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[4] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[5] = 'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c';
        tree[6] = '52759de88b47afb926b869b7e5e096797aa27796be32f087dc9e74c755270e5a';
        tree[2] = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        tree[3] = '52759de88b47afb926b869b7e5e096797aa27796be32f087dc9e74c755270e5a';
        tree[1] = '32f63ef925c871fdea1294f6443fc182bfef69c4ed42fd72a00e3cb5b48d84ca';
        tree[0] = 'eed791e2f595179f11e8c2ac3457efb0e6374a6c9ae31f6fe6eeab9ddb5b2a92';

        const expected = { elements, tree };

        testTreeFromMultiProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a sorted-hash 19-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };

        const elements = Array(19).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[9] = 'd6ef9b1ab628977e002767025434cb4cc9fe91756355208938d306d4727e2962';
        elements[12] = '9c3b4ba8006b4fc7148cc6eec4d4843f369c9aa6e639ec0c2d9e9574cffb12b2';
        elements[17] = '34c287baaa9a48f13b5fa36a50c07e766febe977aece54114cae624e78fa335f';

        const tree = Array(64).fill(null);
        tree[34] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '14a5443c720c2048f1c0d8a8884e7ef461f2bebd4850bb9576e019d7aca62122';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '6d4884b8cca54ec5d50f49f171f2c2503bf2a592de38124441ad89c30cbca964';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[19] = 'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94';
        tree[20] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6';
        tree[23] = 'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85';
        tree[24] = '26e8df125e012fd185561da72d5b9c5ca6444f963465725f2b8d308b05219195';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[9] = 'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c';
        tree[10] = '52759de88b47afb926b869b7e5e096797aa27796be32f087dc9e74c755270e5a';
        tree[11] = 'ec5c9f8ce30c18531b0a15d3b5c40f4c77e8ceaa6280958d3396934a76db72e1';
        tree[12] = '14bbf0000ea76dd757a7d2d05ac6ffd03ae26d0eb6e5560f6f05f6be5279fece';
        tree[4] = '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221';
        tree[5] = '0374bacdc63c3ab3581bbcbea45292d9fada61d5620dc84c247a135b1045ab61';
        tree[6] = '14bbf0000ea76dd757a7d2d05ac6ffd03ae26d0eb6e5560f6f05f6be5279fece';
        tree[2] = '2c2cdc952c9d537709959cd357f6268fff33e5e21147f1a23db6cae78fb91eb9';
        tree[3] = '14bbf0000ea76dd757a7d2d05ac6ffd03ae26d0eb6e5560f6f05f6be5279fece';
        tree[1] = '72b124e49613cad1433e41be21c5d68336d9e7714a215c7eafa53e331435ed08';
        tree[0] = 'bc3845d3df93dcdcf8648e95f63d693e328d07555ce259b6ff2420d6468cc6de';

        const expected = { elements, tree };

        testTreeFromMultiProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });

      it('should build a 12-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };

        const elements = Array(12).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[3] = 'd62f55381db89d56d428a8f383e2bb4690f27ef918d80b9f4735737f6abce3ec';
        elements[8] = '137b5194eb17aa8cc50e40d7054133657e5e5e13a6a746694cc6d464993ea3f1';
        elements[11] = '71677d75cd383c133f32314542bc7936d3d43561b5a5e04ac936310a81ae144b';

        const tree = Array(32).fill(null);
        tree[18] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[19] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[24] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '817d36c43490240f07cc03207faed6536cad93b4c6da8dbdee91cf138af7b0c1';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[13] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[4] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[2] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[3] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[1] = '490333a663032866dc7e1d94b0dd889d3934c21be0d344c8c3df67a51ebc5176';
        tree[0] = 'b2a2c912869453400b0080e31848ccbcabb264d8135bf55452479601f550cdc1';

        const expected = { elements, tree };

        testTreeFromMultiProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };

        const elements = Array(19).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[9] = 'd6ef9b1ab628977e002767025434cb4cc9fe91756355208938d306d4727e2962';
        elements[12] = '9c3b4ba8006b4fc7148cc6eec4d4843f369c9aa6e639ec0c2d9e9574cffb12b2';
        elements[17] = '34c287baaa9a48f13b5fa36a50c07e766febe977aece54114cae624e78fa335f';

        const tree = Array(64).fill(null);
        tree[34] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '14a5443c720c2048f1c0d8a8884e7ef461f2bebd4850bb9576e019d7aca62122';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '6d4884b8cca54ec5d50f49f171f2c2503bf2a592de38124441ad89c30cbca964';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '370025ffa10a94cdc630db59f941fbc4b476e7002a81a358463cd0c180c52452';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[9] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[10] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[11] = '611f780b080a4ea843420e043cf406d6336e10a6cbfcbbcb7cffd5e75dce2d3a';
        tree[12] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[4] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[5] = '951620fb6a7e785dd418bc6e672f36b8591fafe99a4a3bc7f15829d02d08326a';
        tree[6] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[2] = 'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be';
        tree[3] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[1] = '7342698887d2969d39a68ff703c770b84c55ec5bddffe883f664f783c728342b';
        tree[0] = '4259af49ecf3e6b5e2b50ab4e3624b18a13fcb74ad6528e4e112601067ee1c8b';

        const expected = { elements, tree };

        testTreeFromMultiProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });
    });
  });

  describe('Build Partial Trees From Indexed Multi Update Proofs', () => {
    describe('Balanced', () => {
      it('should build an 8-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };

        const elements = Array(8).fill(null);
        elements[1] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[5] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';

        const tree = Array(16).fill(null);
        tree[9] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[13] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[6] = 'c4d2af4260b1b6fb70da505eae59c017e85494d7347391314426863623b3be0b';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a46bdb4a7730f0ebf7d2f4149e0bbf066e4b52cbaeb0935fdebdcc75fa6ab56a';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '315eab4799ecc00535ac9167cc56fc4b5c3522b8c34bb540c6b11932ae6f3c16';
        tree[3] = '68aaad4dc3fcf6e2be402ba9f23d2c4eefdaf2157085f3ad7d9e31ccc4223fef';
        tree[1] = '70f4a2cdb70dc0a5af88bb2920eea7437ef147a760a4ab90d17cbee19aa615bd';
        tree[0] = '88c85e371de22cd21498139441e9f7c9824dd59bda368080459ce0e9ebac8631';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(1, 'ff', [0], expected, options);
      });

      it('should build a sorted-hash 8-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };

        const elements = Array(8).fill(null);
        elements[1] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[5] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';

        const tree = Array(16).fill(null);
        tree[9] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[13] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[6] = 'c4d2af4260b1b6fb70da505eae59c017e85494d7347391314426863623b3be0b';
        tree[7] = 'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94';
        tree[4] = 'a46bdb4a7730f0ebf7d2f4149e0bbf066e4b52cbaeb0935fdebdcc75fa6ab56a';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '315eab4799ecc00535ac9167cc56fc4b5c3522b8c34bb540c6b11932ae6f3c16';
        tree[3] = 'dc386389404408833c276657d9fe7db12b11e27d5fb2f95c4c0a17cf76a01fe8';
        tree[1] = 'd1e7fecf991fb3c3b8f7edd8ef1f070ba2851d6e01e0a9f49323d283ffed523b';
        tree[0] = '77ccec5e6fae7c5453773196e6bd02fe2d5712b4fe8d3063850e5c2d8bd3fc7d';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a sorted-hash 1-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(1, 'ff', [0], expected, options);
      });

      it('should build an 8-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };

        const elements = Array(8).fill(null);
        elements[1] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[5] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';

        const tree = Array(16).fill(null);
        tree[9] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[13] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[6] = 'c4d2af4260b1b6fb70da505eae59c017e85494d7347391314426863623b3be0b';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a46bdb4a7730f0ebf7d2f4149e0bbf066e4b52cbaeb0935fdebdcc75fa6ab56a';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '315eab4799ecc00535ac9167cc56fc4b5c3522b8c34bb540c6b11932ae6f3c16';
        tree[3] = '68aaad4dc3fcf6e2be402ba9f23d2c4eefdaf2157085f3ad7d9e31ccc4223fef';
        tree[1] = '70f4a2cdb70dc0a5af88bb2920eea7437ef147a760a4ab90d17cbee19aa615bd';
        tree[0] = '88c85e371de22cd21498139441e9f7c9824dd59bda368080459ce0e9ebac8631';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(1, 'ff', [0], expected, options);
      });
    });

    describe('Unbalanced', () => {
      it('should build a 12-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };

        const elements = Array(12).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[3] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[8] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[11] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';

        const tree = Array(32).fill(null);
        tree[18] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[19] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[24] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'bc74c504de9ea00fd578f493c5925b7e5d578882e05064d736b92098f1512fab';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = 'd79560dcfc44d44df455b842c6d76ee777d270ccc091d76891a7a2b9294bc7da';
        tree[13] = '1ba1c16e880fd8b0611f7212cb84b183215ec1034112e533c606c0294350d717';
        tree[4] = '454836566a8bde3bc1db3d3b4b3309ac837ba762b7d09b197e0f6c18eb6ca76b';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[2] = '1fc27bba7c52e0c7d24d117d67ed095474fdf5f8a530d9a20b738ba06104ad63';
        tree[3] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[1] = 'b1d75a44c3752c364cb7ddfd5fc51fd5e2ac342f1da0d886c1975f9b871e6369';
        tree[0] = '0f99c39043f976c0fe669d3e77215f62315cc6eeaa127b2683a97c610a58af7b';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };

        const elements = Array(19).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[9] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[12] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';
        elements[17] = 'f1ce0304c2dc475acda047ca28e42789de5200700771845a85d06db75aa69922';

        const tree = Array(64).fill(null);
        tree[34] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '1ce248c80d46e0cc991a8fdc522368aa773464ce1b4af5a974c5dcb2696457ff';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'aa11fa4f96d1a23dc0613dfd7411b8ad57af1ef8d576cf090e39eebec662c247';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8bfec52acb8389063c263b84d47b2b20bc2b26037df19b98436b4efba8508e61';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = 'b62f8b3c28ad8f92d61c776ea2b6357842b63161b001480bcf023e16531574ca';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '568c098c56e5f5ea1db8b951577c7f2e48d557aa6da100b2d336c73999781c16';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[9] = '238013ac53085ccd5318b49e128ec2ffe2ac155aa83f4dce022e08a8066e768a';
        tree[10] = '39d7e81a12bd3d8f29e0094177217197b1478ee1c8a0ef621553bf457a79d03f';
        tree[11] = '2c6dd04728a13f6a6d46a679d5e405f1814053421621a18d41ab30d70d74d24e';
        tree[12] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[4] = 'f91604c649be4018ef83d611ca16324b5f659dd0ebc8e35cd6ef59839ba2e7bd';
        tree[5] = 'e4c34dfc909023ea3b2ca18b0fa0404fd9370db6c45470b50aed6a71356f01b6';
        tree[6] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[2] = '7ab76ef90e60d8c0e03e814d405d4f0d6d1e65c942ee5a6a57cab8d308aa2979';
        tree[3] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[1] = '37f8b7f288943dc7852efc8524fb68ad442cf882f984528bce1d2d4a8a83922e';
        tree[0] = '993c6813836813058d359454c6356bf15f55d66bb7fa4a46fba7837c9317d874';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });

      it('should build a sorted-hash 12-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };

        const elements = Array(12).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[3] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[8] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[11] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';

        const tree = Array(32).fill(null);
        tree[18] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[19] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[24] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'eea3f7291477c7084145e8efeb410a70bf2668dda075d72f0e50d586f6461b55';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = 'd79560dcfc44d44df455b842c6d76ee777d270ccc091d76891a7a2b9294bc7da';
        tree[13] = '1ba1c16e880fd8b0611f7212cb84b183215ec1034112e533c606c0294350d717';
        tree[4] = '755475ac3df51625a4c35f31f25fa29cec5da917b6f58694aea50a8144617678';
        tree[5] = 'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c';
        tree[6] = '86b7601cb096d7897832f51c3e137f5b2d5383825804d6edd4153453c08bc35c';
        tree[2] = '960fd193fa81a56e77439a59c914692ecae86f1dc51591b728affde33e0303dd';
        tree[3] = '86b7601cb096d7897832f51c3e137f5b2d5383825804d6edd4153453c08bc35c';
        tree[1] = 'ab6f6ba5a701dbe1972d029ff3f68ba26f7f81fc788ecfbc2bfe7fff479e9f6b';
        tree[0] = '406947a25a1b4cdf38a3fa21359248c643d7afa7bfd999540350d75bcfc0fa0c';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a sorted-hash 19-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };

        const elements = Array(19).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[9] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[12] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';
        elements[17] = 'f1ce0304c2dc475acda047ca28e42789de5200700771845a85d06db75aa69922';

        const tree = Array(64).fill(null);
        tree[34] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '1ce248c80d46e0cc991a8fdc522368aa773464ce1b4af5a974c5dcb2696457ff';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'aa11fa4f96d1a23dc0613dfd7411b8ad57af1ef8d576cf090e39eebec662c247';
        tree[19] = 'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94';
        tree[20] = '8bfec52acb8389063c263b84d47b2b20bc2b26037df19b98436b4efba8508e61';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = 'b62f8b3c28ad8f92d61c776ea2b6357842b63161b001480bcf023e16531574ca';
        tree[23] = 'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85';
        tree[24] = '99214dccee2db79709f5817ef660c1bcdcb110c8919f0e1e3dbf5674cbc5d427';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[9] = '6099d076fcf90a41189cf5ee9c7ff543fe77b284bc359dfeee84e272be310773';
        tree[10] = 'b8e38c10e6b142a370b09e508956db85afe90ff350c255cff2ec0f1753fb27c0';
        tree[11] = '3ef24b201cf26e765971ddee2803ebf2d1b9b4a19af57e8098c9b7bf7858b733';
        tree[12] = '2f8da70a8cf7cf9ac83d871a9e70975ad314dc218cd5d7e6b83db6f3e79e058d';
        tree[4] = '58258e4ca167669e6d477e985718937a916f7a76e73b21151bf5f704f1b9a3f4';
        tree[5] = '1bc2e6b5af3d3c1681178b469c00ccee9d52fa4ad1ae48e889238701ce7e7cf7';
        tree[6] = '2f8da70a8cf7cf9ac83d871a9e70975ad314dc218cd5d7e6b83db6f3e79e058d';
        tree[2] = 'e3497591fb20950880fd86ce8254df903e55e481c8c930cb08a4d48ef768d5a1';
        tree[3] = '2f8da70a8cf7cf9ac83d871a9e70975ad314dc218cd5d7e6b83db6f3e79e058d';
        tree[1] = '7e13679d68dea01a85cd23c3f1c887913b566cc62eeae064e07300f3abf469d1';
        tree[0] = 'f345ef2c8bc55630badfdb65f8762ae25b735cf2f4222307b823fc64070a10a0';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });

      it('should build a 12-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };

        const elements = Array(12).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[3] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[8] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[11] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';

        const tree = Array(32).fill(null);
        tree[18] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[19] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[24] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'bc74c504de9ea00fd578f493c5925b7e5d578882e05064d736b92098f1512fab';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = 'd79560dcfc44d44df455b842c6d76ee777d270ccc091d76891a7a2b9294bc7da';
        tree[13] = '1ba1c16e880fd8b0611f7212cb84b183215ec1034112e533c606c0294350d717';
        tree[4] = '454836566a8bde3bc1db3d3b4b3309ac837ba762b7d09b197e0f6c18eb6ca76b';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[2] = '1fc27bba7c52e0c7d24d117d67ed095474fdf5f8a530d9a20b738ba06104ad63';
        tree[3] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[1] = 'b1d75a44c3752c364cb7ddfd5fc51fd5e2ac342f1da0d886c1975f9b871e6369';
        tree[0] = '0f99c39043f976c0fe669d3e77215f62315cc6eeaa127b2683a97c610a58af7b';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };

        const elements = Array(19).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[9] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[12] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';
        elements[17] = 'f1ce0304c2dc475acda047ca28e42789de5200700771845a85d06db75aa69922';

        const tree = Array(64).fill(null);
        tree[34] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '1ce248c80d46e0cc991a8fdc522368aa773464ce1b4af5a974c5dcb2696457ff';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'aa11fa4f96d1a23dc0613dfd7411b8ad57af1ef8d576cf090e39eebec662c247';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8bfec52acb8389063c263b84d47b2b20bc2b26037df19b98436b4efba8508e61';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = 'b62f8b3c28ad8f92d61c776ea2b6357842b63161b001480bcf023e16531574ca';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '568c098c56e5f5ea1db8b951577c7f2e48d557aa6da100b2d336c73999781c16';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[9] = '238013ac53085ccd5318b49e128ec2ffe2ac155aa83f4dce022e08a8066e768a';
        tree[10] = '39d7e81a12bd3d8f29e0094177217197b1478ee1c8a0ef621553bf457a79d03f';
        tree[11] = '2c6dd04728a13f6a6d46a679d5e405f1814053421621a18d41ab30d70d74d24e';
        tree[12] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[4] = 'f91604c649be4018ef83d611ca16324b5f659dd0ebc8e35cd6ef59839ba2e7bd';
        tree[5] = 'e4c34dfc909023ea3b2ca18b0fa0404fd9370db6c45470b50aed6a71356f01b6';
        tree[6] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[2] = '7ab76ef90e60d8c0e03e814d405d4f0d6d1e65c942ee5a6a57cab8d308aa2979';
        tree[3] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[1] = '37f8b7f288943dc7852efc8524fb68ad442cf882f984528bce1d2d4a8a83922e';
        tree[0] = '993c6813836813058d359454c6356bf15f55d66bb7fa4a46fba7837c9317d874';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });
    });
  });

  describe('Build Partial Trees From Existence-Only Multi Proofs', () => {
    describe('Balanced', () => {
      it('should build an 8-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };

        const elements = Array(8).fill(null);
        elements[1] = 'ab28e51d2b2978f600476d733f1fb8688095ab06619ff948f4faf487a36d61be';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[5] = '2deea3ad223102262743172859e6077fca0415f5825a11f88222ebe424d524f1';

        const tree = Array(16).fill(null);
        tree[9] = '530371c484bd3476650533bc45fc8d339ccac500552b3c0ceea3e4aba4ffe3ac';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[13] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[6] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[0] = 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d';

        const expected = { elements, tree };

        testTreeFromMultiProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromMultiProof(1, 'ff', [0], expected, options);
      });

      it('should build an 8-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };

        const elements = Array(8).fill(null);
        elements[1] = 'ab28e51d2b2978f600476d733f1fb8688095ab06619ff948f4faf487a36d61be';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[5] = '2deea3ad223102262743172859e6077fca0415f5825a11f88222ebe424d524f1';

        const tree = Array(16).fill(null);
        tree[9] = '530371c484bd3476650533bc45fc8d339ccac500552b3c0ceea3e4aba4ffe3ac';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[13] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[6] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[3] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[1] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[0] = 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d';

        const expected = { elements, tree };

        testTreeFromMultiProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };

        const elements = Array(1).fill(null);
        elements[0] = '06d41322d79dfed27126569cb9a80eb0967335bf2f3316359d2a93c779fcd38a';

        const tree = Array(2).fill(null);
        tree[1] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[0] = 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8';

        const expected = { elements, tree };

        testTreeFromMultiProof(1, 'ff', [0], expected, options);
      });
    });

    describe('Unbalanced', () => {
      it('should build a 12-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };

        const elements = Array(12).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[3] = 'd62f55381db89d56d428a8f383e2bb4690f27ef918d80b9f4735737f6abce3ec';
        elements[8] = '137b5194eb17aa8cc50e40d7054133657e5e5e13a6a746694cc6d464993ea3f1';
        elements[11] = '71677d75cd383c133f32314542bc7936d3d43561b5a5e04ac936310a81ae144b';

        const tree = Array(32).fill(null);
        tree[18] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[19] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[24] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '817d36c43490240f07cc03207faed6536cad93b4c6da8dbdee91cf138af7b0c1';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[13] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[4] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[2] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[3] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[1] = '490333a663032866dc7e1d94b0dd889d3934c21be0d344c8c3df67a51ebc5176';
        tree[0] = 'b2a2c912869453400b0080e31848ccbcabb264d8135bf55452479601f550cdc1';

        const expected = { elements, tree };

        testTreeFromMultiProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };

        const elements = Array(19).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[9] = 'd6ef9b1ab628977e002767025434cb4cc9fe91756355208938d306d4727e2962';
        elements[12] = '9c3b4ba8006b4fc7148cc6eec4d4843f369c9aa6e639ec0c2d9e9574cffb12b2';
        elements[17] = '34c287baaa9a48f13b5fa36a50c07e766febe977aece54114cae624e78fa335f';

        const tree = Array(64).fill(null);
        tree[34] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '14a5443c720c2048f1c0d8a8884e7ef461f2bebd4850bb9576e019d7aca62122';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '6d4884b8cca54ec5d50f49f171f2c2503bf2a592de38124441ad89c30cbca964';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '370025ffa10a94cdc630db59f941fbc4b476e7002a81a358463cd0c180c52452';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[9] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[10] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[11] = '611f780b080a4ea843420e043cf406d6336e10a6cbfcbbcb7cffd5e75dce2d3a';
        tree[12] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[4] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[5] = '951620fb6a7e785dd418bc6e672f36b8591fafe99a4a3bc7f15829d02d08326a';
        tree[6] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[2] = 'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be';
        tree[3] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[1] = '7342698887d2969d39a68ff703c770b84c55ec5bddffe883f664f783c728342b';
        tree[0] = '4259af49ecf3e6b5e2b50ab4e3624b18a13fcb74ad6528e4e112601067ee1c8b';

        const expected = { elements, tree };

        testTreeFromMultiProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });

      it('should build a 12-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

        const elements = Array(12).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[3] = 'd62f55381db89d56d428a8f383e2bb4690f27ef918d80b9f4735737f6abce3ec';
        elements[8] = '137b5194eb17aa8cc50e40d7054133657e5e5e13a6a746694cc6d464993ea3f1';
        elements[11] = '71677d75cd383c133f32314542bc7936d3d43561b5a5e04ac936310a81ae144b';

        const tree = Array(32).fill(null);
        tree[18] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[19] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[24] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '817d36c43490240f07cc03207faed6536cad93b4c6da8dbdee91cf138af7b0c1';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[13] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[4] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[2] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[3] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[1] = '490333a663032866dc7e1d94b0dd889d3934c21be0d344c8c3df67a51ebc5176';
        tree[0] = 'b2a2c912869453400b0080e31848ccbcabb264d8135bf55452479601f550cdc1';

        const expected = { elements, tree };

        testTreeFromMultiProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

        const elements = Array(19).fill(null);
        elements[2] = 'f7383164bf75f186fc5c5e69dfe6c2eaeb1e50a9568c379db8430b952daaa900';
        elements[4] = '86d370d74fa064564149838d4511fb57e4f4357b8fe925e79c400ee768015cc1';
        elements[9] = 'd6ef9b1ab628977e002767025434cb4cc9fe91756355208938d306d4727e2962';
        elements[12] = '9c3b4ba8006b4fc7148cc6eec4d4843f369c9aa6e639ec0c2d9e9574cffb12b2';
        elements[17] = '34c287baaa9a48f13b5fa36a50c07e766febe977aece54114cae624e78fa335f';

        const tree = Array(64).fill(null);
        tree[34] = 'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '5bcbf3cce3e9edf1556f976451ab1df564e24b2642521dbe2d21254bbeadbe80';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '14a5443c720c2048f1c0d8a8884e7ef461f2bebd4850bb9576e019d7aca62122';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '6d4884b8cca54ec5d50f49f171f2c2503bf2a592de38124441ad89c30cbca964';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'e98d0590a166e2e060560ff27987aef772fba0d1b553273fec591368d5640286';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8188a4ece78ff772c7986f979be6dc11cb8be4b007304fbc92fd03b373468e05';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '370025ffa10a94cdc630db59f941fbc4b476e7002a81a358463cd0c180c52452';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '3fbb2f5778c21ef81190ef861605c8f6771a2a60561d7aed46d34349cc944241';
        tree[9] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[10] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
        tree[11] = '611f780b080a4ea843420e043cf406d6336e10a6cbfcbbcb7cffd5e75dce2d3a';
        tree[12] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[4] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
        tree[5] = '951620fb6a7e785dd418bc6e672f36b8591fafe99a4a3bc7f15829d02d08326a';
        tree[6] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[2] = 'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be';
        tree[3] = '3e04893f45bdb92c2ae70a2fdfbea66b3ebbbb7bb02f656882deb4cb9062b228';
        tree[1] = '7342698887d2969d39a68ff703c770b84c55ec5bddffe883f664f783c728342b';
        tree[0] = '4259af49ecf3e6b5e2b50ab4e3624b18a13fcb74ad6528e4e112601067ee1c8b';

        const expected = { elements, tree };

        testTreeFromMultiProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });
    });
  });

  describe('Build Partial Trees From Existence-Only Multi Update Proofs', () => {
    describe('Balanced', () => {
      it('should build an 8-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };

        const elements = Array(8).fill(null);
        elements[1] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[5] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';

        const tree = Array(16).fill(null);
        tree[9] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[13] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[6] = 'c4d2af4260b1b6fb70da505eae59c017e85494d7347391314426863623b3be0b';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a46bdb4a7730f0ebf7d2f4149e0bbf066e4b52cbaeb0935fdebdcc75fa6ab56a';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '315eab4799ecc00535ac9167cc56fc4b5c3522b8c34bb540c6b11932ae6f3c16';
        tree[3] = '68aaad4dc3fcf6e2be402ba9f23d2c4eefdaf2157085f3ad7d9e31ccc4223fef';
        tree[1] = '70f4a2cdb70dc0a5af88bb2920eea7437ef147a760a4ab90d17cbee19aa615bd';
        tree[0] = '88c85e371de22cd21498139441e9f7c9824dd59bda368080459ce0e9ebac8631';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(1, 'ff', [0], expected, options);
      });

      it('should build an 8-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };

        const elements = Array(8).fill(null);
        elements[1] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[5] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';

        const tree = Array(16).fill(null);
        tree[9] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[8] = '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60';
        tree[12] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[13] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[6] = 'c4d2af4260b1b6fb70da505eae59c017e85494d7347391314426863623b3be0b';
        tree[7] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[4] = 'a46bdb4a7730f0ebf7d2f4149e0bbf066e4b52cbaeb0935fdebdcc75fa6ab56a';
        tree[5] = 'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9';
        tree[2] = '315eab4799ecc00535ac9167cc56fc4b5c3522b8c34bb540c6b11932ae6f3c16';
        tree[3] = '68aaad4dc3fcf6e2be402ba9f23d2c4eefdaf2157085f3ad7d9e31ccc4223fef';
        tree[1] = '70f4a2cdb70dc0a5af88bb2920eea7437ef147a760a4ab90d17cbee19aa615bd';
        tree[0] = '88c85e371de22cd21498139441e9f7c9824dd59bda368080459ce0e9ebac8631';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(8, 'ff', [1, 4, 5], expected, options);
      });

      it('should build a 1-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };

        const elements = Array(1).fill(null);
        elements[0] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';

        const tree = Array(2).fill(null);
        tree[1] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[0] = '2524b2088139a21ce5deaed4424127ad4efbd4859298df2a280d467154d4f898';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(1, 'ff', [0], expected, options);
      });
    });

    describe('Unbalanced', () => {
      it('should build a 12-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };

        const elements = Array(12).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[3] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[8] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[11] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';

        const tree = Array(32).fill(null);
        tree[18] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[19] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[24] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'bc74c504de9ea00fd578f493c5925b7e5d578882e05064d736b92098f1512fab';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = 'd79560dcfc44d44df455b842c6d76ee777d270ccc091d76891a7a2b9294bc7da';
        tree[13] = '1ba1c16e880fd8b0611f7212cb84b183215ec1034112e533c606c0294350d717';
        tree[4] = '454836566a8bde3bc1db3d3b4b3309ac837ba762b7d09b197e0f6c18eb6ca76b';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[2] = '1fc27bba7c52e0c7d24d117d67ed095474fdf5f8a530d9a20b738ba06104ad63';
        tree[3] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[1] = 'b1d75a44c3752c364cb7ddfd5fc51fd5e2ac342f1da0d886c1975f9b871e6369';
        tree[0] = '0f99c39043f976c0fe669d3e77215f62315cc6eeaa127b2683a97c610a58af7b';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };

        const elements = Array(19).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[9] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[12] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';
        elements[17] = 'f1ce0304c2dc475acda047ca28e42789de5200700771845a85d06db75aa69922';

        const tree = Array(64).fill(null);
        tree[34] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '1ce248c80d46e0cc991a8fdc522368aa773464ce1b4af5a974c5dcb2696457ff';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'aa11fa4f96d1a23dc0613dfd7411b8ad57af1ef8d576cf090e39eebec662c247';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8bfec52acb8389063c263b84d47b2b20bc2b26037df19b98436b4efba8508e61';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = 'b62f8b3c28ad8f92d61c776ea2b6357842b63161b001480bcf023e16531574ca';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '568c098c56e5f5ea1db8b951577c7f2e48d557aa6da100b2d336c73999781c16';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[9] = '238013ac53085ccd5318b49e128ec2ffe2ac155aa83f4dce022e08a8066e768a';
        tree[10] = '39d7e81a12bd3d8f29e0094177217197b1478ee1c8a0ef621553bf457a79d03f';
        tree[11] = '2c6dd04728a13f6a6d46a679d5e405f1814053421621a18d41ab30d70d74d24e';
        tree[12] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[4] = 'f91604c649be4018ef83d611ca16324b5f659dd0ebc8e35cd6ef59839ba2e7bd';
        tree[5] = 'e4c34dfc909023ea3b2ca18b0fa0404fd9370db6c45470b50aed6a71356f01b6';
        tree[6] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[2] = '7ab76ef90e60d8c0e03e814d405d4f0d6d1e65c942ee5a6a57cab8d308aa2979';
        tree[3] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[1] = '37f8b7f288943dc7852efc8524fb68ad442cf882f984528bce1d2d4a8a83922e';
        tree[0] = '993c6813836813058d359454c6356bf15f55d66bb7fa4a46fba7837c9317d874';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });

      it('should build a 12-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

        const elements = Array(12).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[3] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[8] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[11] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';

        const tree = Array(32).fill(null);
        tree[18] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[19] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[24] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[25] = 'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7';
        tree[27] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[26] = '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964';
        tree[9] = 'bc74c504de9ea00fd578f493c5925b7e5d578882e05064d736b92098f1512fab';
        tree[8] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[12] = 'd79560dcfc44d44df455b842c6d76ee777d270ccc091d76891a7a2b9294bc7da';
        tree[13] = '1ba1c16e880fd8b0611f7212cb84b183215ec1034112e533c606c0294350d717';
        tree[4] = '454836566a8bde3bc1db3d3b4b3309ac837ba762b7d09b197e0f6c18eb6ca76b';
        tree[5] = 'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d';
        tree[6] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[2] = '1fc27bba7c52e0c7d24d117d67ed095474fdf5f8a530d9a20b738ba06104ad63';
        tree[3] = 'c43b4c65f3d411131a89df6a4c75d0263b10610cb98bab39fe08965e84fba424';
        tree[1] = 'b1d75a44c3752c364cb7ddfd5fc51fd5e2ac342f1da0d886c1975f9b871e6369';
        tree[0] = '0f99c39043f976c0fe669d3e77215f62315cc6eeaa127b2683a97c610a58af7b';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(12, 'ff', [2, 3, 8, 11], expected, options);
      });

      it('should build a 19-element Partial Tree from a Compact Multi Proof.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

        const elements = Array(19).fill(null);
        elements[2] = '4a8efaf9728aab687dd27244d1090ea0c6897fbf666dea4c60524cd49862342d';
        elements[4] = 'a70e41111425aef1bf65b11de58118ec31949d6b8f1d9bdabb2667013076af8e';
        elements[9] = '105a21d552f9585b75df6435729fc31417460aeea5a428bf134aed34347d94bc';
        elements[12] = '1123274cbe0edaca6ea7391ca53726c872587203607100703231587a32334582';
        elements[17] = 'f1ce0304c2dc475acda047ca28e42789de5200700771845a85d06db75aa69922';

        const tree = Array(64).fill(null);
        tree[34] = '6e608355cf92a680b5f5992103414eb9a2c655214d7c9a865c03941346cf77ff';
        tree[35] = 'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e';
        tree[36] = '6bd09ddd0038de358d2f4c761b2fa46378bb724b69099c7504fcc7f6db7aa73d';
        tree[37] = '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d';
        tree[41] = 'c414008ffde0a24cccd3d881adcab80ac55ab632e12884c39c402b9f6694ed72';
        tree[40] = 'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f';
        tree[44] = '9b5965575d3e7eed294f422f06915719f50d6aeff18e4c00fe01f68a80db5182';
        tree[45] = '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec';
        tree[49] = '1ce248c80d46e0cc991a8fdc522368aa773464ce1b4af5a974c5dcb2696457ff';
        tree[48] = '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9';
        tree[17] = 'ec3bf1549ba1a76a9647403c4fbfa861de4a9bd594d3591f93a25597b5d4a373';
        tree[16] = 'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27';
        tree[18] = 'aa11fa4f96d1a23dc0613dfd7411b8ad57af1ef8d576cf090e39eebec662c247';
        tree[19] = '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39';
        tree[20] = '8bfec52acb8389063c263b84d47b2b20bc2b26037df19b98436b4efba8508e61';
        tree[21] = '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2';
        tree[22] = 'b62f8b3c28ad8f92d61c776ea2b6357842b63161b001480bcf023e16531574ca';
        tree[23] = 'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2';
        tree[24] = '568c098c56e5f5ea1db8b951577c7f2e48d557aa6da100b2d336c73999781c16';
        tree[25] = 'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445';
        tree[8] = '209b3596df36a23f39a11d2292acdf5075a68644f49393b3739e7b8ce99acb18';
        tree[9] = '238013ac53085ccd5318b49e128ec2ffe2ac155aa83f4dce022e08a8066e768a';
        tree[10] = '39d7e81a12bd3d8f29e0094177217197b1478ee1c8a0ef621553bf457a79d03f';
        tree[11] = '2c6dd04728a13f6a6d46a679d5e405f1814053421621a18d41ab30d70d74d24e';
        tree[12] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[4] = 'f91604c649be4018ef83d611ca16324b5f659dd0ebc8e35cd6ef59839ba2e7bd';
        tree[5] = 'e4c34dfc909023ea3b2ca18b0fa0404fd9370db6c45470b50aed6a71356f01b6';
        tree[6] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[2] = '7ab76ef90e60d8c0e03e814d405d4f0d6d1e65c942ee5a6a57cab8d308aa2979';
        tree[3] = 'c7c184b7ae17914df88b164564e834c9d461845e76336aca451519f5e35ca817';
        tree[1] = '37f8b7f288943dc7852efc8524fb68ad442cf882f984528bce1d2d4a8a83922e';
        tree[0] = '993c6813836813058d359454c6356bf15f55d66bb7fa4a46fba7837c9317d874';

        const expected = { elements, tree };

        testTreeFromMultiUpdateProof(19, 'ff', [2, 4, 9, 12, 17], expected, options);
      });
    });
  });

  describe('Build Partial Trees From Single Append Proofs', () => {
    it('should build a 1-element Partial Tree from a Single Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };

      const elements = Array(1).fill(null);
      elements[0] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';

      const tree = Array(2).fill(null);
      tree[1] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[0] = '9a98370dc2f17b2d0cd30197183a876bf73ab761360b8f2d053f9371aa897198';

      const expected = { elements, tree };

      testTreeFromSingleAppendProof(0, 'ff', expected, options);
    });

    it('should build a 9-element Partial Tree from a Single Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };

      const elements = Array(9).fill(null);
      elements[8] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';

      const tree = Array(32).fill(null);
      tree[24] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[12] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[6] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[3] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[2] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
      tree[1] = 'd6108bc543a9fe3153c9f38a81cf65129438a37b041d6471f87de9ddffd2294d';
      tree[0] = '644d289b64508601322e13302b9f7ee12152a5d96cd2b4a685980be591fa5518';

      const expected = { elements, tree };

      testTreeFromSingleAppendProof(8, 'ff', expected, options);
    });

    it('should build a 28-element Partial Tree from a Single Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };

      const elements = Array(27).fill(null);
      elements[27] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';

      const tree = Array(64).fill(null);
      tree[59] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[58] = '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b';
      tree[29] = '18f318057d7e5b343f2e2f47236b8bedd81dae9d328ccd167a835ed9ffbea309';
      tree[28] = 'dd1c66ff9c67d05f1aeb7ec6196210db830b83ac973345b2908d31677d52c311';
      tree[14] = '055671cd93095cfe5dd1e988b49163267248a47989e227ce86433a18d9d033ac';
      tree[7] = '055671cd93095cfe5dd1e988b49163267248a47989e227ce86433a18d9d033ac';
      tree[6] = '88d2a11c3b0935fc6a30e3b0a69fa58a84de08ea333248f23e5d747613fc04f9';
      tree[3] = 'de97a499abd824d28794ccfe20d7636f76ec6608a02723da6c9ddf9cf97081e8';
      tree[2] = 'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be';
      tree[1] = '9374f999ee0d756bc27b2fe08e8738016a384788611491c6f3462a04bd291654';
      tree[0] = '555b456b2b77e2c8c1c6de55867f61d361616648a386cc27cb8066b10b697bb0';

      const expected = { elements, tree };

      testTreeFromSingleAppendProof(27, 'ff', expected, options);
    });

    it('should build a 100-element Partial Tree from a Single Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };

      const elements = Array(100).fill(null);
      elements[99] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';

      const tree = Array(256).fill(null);
      tree[227] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[226] = '1989275de5f46e101747e3ebdd4f3440f26ddf1ede904e8bce47483cd22a3964';
      tree[113] = '7cb2f6389e732511ec26d3dc26d1baefb1517033b0a09e207562b9a28972f5bf';
      tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
      tree[56] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[28] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[14] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[7] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
      tree[3] = 'a5bd6391af59382143f8ddfe96aab7c0f263b8365312feb5c89e3f4098a7ef80';
      tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
      tree[1] = 'f81322b778ada525c93c316f0e61d643cf42d924d9bc4c767c31c8c8fac25e6c';
      tree[0] = '642bfc0c90349fe1439ef299a7d0d6bbf2251423690e0eef7c50bd8cdd3c1f5b';

      const expected = { elements, tree };

      testTreeFromSingleAppendProof(99, 'ff', expected, options);
    });

    it('should build a sorted-hash 100-element Partial Tree from a Single Append Proof', () => {
      const options = { unbalanced: true, sortedHash: true, compact: false };

      const elements = Array(100).fill(null);
      elements[99] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';

      const tree = Array(256).fill(null);
      tree[227] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[226] = '1989275de5f46e101747e3ebdd4f3440f26ddf1ede904e8bce47483cd22a3964';
      tree[113] = '7cb2f6389e732511ec26d3dc26d1baefb1517033b0a09e207562b9a28972f5bf';
      tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
      tree[56] = 'fcc80b7a7ac922f505b7921e706e9953e4a00fd95694699101f7fe59958c87f6';
      tree[28] = 'fcc80b7a7ac922f505b7921e706e9953e4a00fd95694699101f7fe59958c87f6';
      tree[14] = 'fcc80b7a7ac922f505b7921e706e9953e4a00fd95694699101f7fe59958c87f6';
      tree[7] = 'fcc80b7a7ac922f505b7921e706e9953e4a00fd95694699101f7fe59958c87f6';
      tree[6] = '904afce76e0f7ccead463e22aec76018c1450afd3deb4f387e0617ef39721685';
      tree[3] = '3d5036f4c1b91632e1cd835e67fc36be94bebadd0b9b4d8e70584b1afa6ff516';
      tree[2] = 'bb9a6e5787ae741c6a0e75a360aefe75ee06284ece1edddc1573ac9462945e7f';
      tree[1] = '5627182766e36a68230bfbe5ab8e384c79a6b476e408880adb04ca2623979443';
      tree[0] = '51505aa103ba1261b0d3fbd820e7b3c86e914725fc1fc6785f1a19c62550cc02';

      const expected = { elements, tree };

      testTreeFromSingleAppendProof(99, 'ff', expected, options);
    });

    it('should build a 100-element Partial Tree from a Single Compact Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: true };

      const elements = Array(100).fill(null);
      elements[99] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';

      const tree = Array(256).fill(null);
      tree[227] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[226] = '1989275de5f46e101747e3ebdd4f3440f26ddf1ede904e8bce47483cd22a3964';
      tree[113] = '7cb2f6389e732511ec26d3dc26d1baefb1517033b0a09e207562b9a28972f5bf';
      tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
      tree[56] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[28] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[14] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[7] = '2e317cad6cc387718cdd86a4c94bd61f13959d63d9ec83d6ce75f795c1cdbdf5';
      tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
      tree[3] = 'a5bd6391af59382143f8ddfe96aab7c0f263b8365312feb5c89e3f4098a7ef80';
      tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
      tree[1] = 'f81322b778ada525c93c316f0e61d643cf42d924d9bc4c767c31c8c8fac25e6c';
      tree[0] = '642bfc0c90349fe1439ef299a7d0d6bbf2251423690e0eef7c50bd8cdd3c1f5b';

      const expected = { elements, tree };

      testTreeFromSingleAppendProof(99, 'ff', expected, options);
    });
  });

  describe('Build Partial Trees From Multi Append Proofs', () => {
    it('should build a 5-element Partial Tree from a Multi Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };

      const elements = Array(5).fill(null);
      elements[0] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';
      elements[1] = 'f092ffc50adec70f320c33704d9a635c09529fc5b277deeb50068790f953f21d';
      elements[2] = '136fc3f650545532c02974f1a68e700ef3b050b825ba02622c2aea300757cb7a';
      elements[3] = '4a1a64e888466fdf89e30fddd3644715a620680373ed29a0856a24de11ab31b6';
      elements[4] = 'cc099046f9453d6a1f75c54e5f0af530c46ab8af18752a50bddc7d1414d83233';

      const tree = Array(16).fill(null);
      tree[8] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[9] = 'f00703443cdb74322917b11b412841d069e09846b5a9eddff1c47d6154d67bf1';
      tree[10] = '0bdc458cd85cb58a583bca5e2cb8f10c6774ab4b5970f8fd7e49fb75149b3084';
      tree[11] = 'bfc3b72b4829c12396a700234ff8fe6ad0a85091a4a0a6e2f5054f55933c2971';
      tree[12] = 'ed8385437e7424a4d0dcdeefc91d3387facf4132df77ed4d19d5785511a451ba';
      tree[4] = '21efd0fe292c1c3bf3ca9d0fcb6db213568fd2aa3ab676b407b3c3d9c3ca762b';
      tree[5] = '31ee92d1cd117bf78d1eb0e8e347cf9d94fcee761e9f4094d7f35ab0641e3569';
      tree[6] = 'ed8385437e7424a4d0dcdeefc91d3387facf4132df77ed4d19d5785511a451ba';
      tree[2] = '257da86e84b3f26f04bbb59b200765ab720918d1379dc7a39be4da07de51fd34';
      tree[3] = 'ed8385437e7424a4d0dcdeefc91d3387facf4132df77ed4d19d5785511a451ba';
      tree[1] = '7e34c0358800ea0942afde971a7734ad73bca330dc253708e7b31834860b2e60';
      tree[0] = '5506559aa2662c0729c3908e7dda087cd35df8271ecd066bc3e1ccf4c224bc24';

      const expected = { elements, tree };

      testTreeFromMultiAppendProof(0, 'ff', 5, expected, options);
    });

    it('should build a 19-element Partial Tree from a Multi Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };

      const elements = Array(19).fill(null);
      elements[15] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';
      elements[16] = 'f092ffc50adec70f320c33704d9a635c09529fc5b277deeb50068790f953f21d';
      elements[17] = '136fc3f650545532c02974f1a68e700ef3b050b825ba02622c2aea300757cb7a';
      elements[18] = '4a1a64e888466fdf89e30fddd3644715a620680373ed29a0856a24de11ab31b6';

      const tree = Array(64).fill(null);
      tree[47] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[46] = 'e481ff292c1b323f27dd2e7b0da511947e0d349a0616a739ea628a3a5888c529';
      tree[48] = 'f00703443cdb74322917b11b412841d069e09846b5a9eddff1c47d6154d67bf1';
      tree[49] = '0bdc458cd85cb58a583bca5e2cb8f10c6774ab4b5970f8fd7e49fb75149b3084';
      tree[50] = 'bfc3b72b4829c12396a700234ff8fe6ad0a85091a4a0a6e2f5054f55933c2971';
      tree[23] = '3730bf1994595bc03d335a15990afc3012d14959861661f72f9d6b73b3b0a104';
      tree[22] = '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6';
      tree[24] = '4d017b73ca099fe09575ea52c23db2b92f5feaa49eae575902292db5be07fae9';
      tree[25] = 'bfc3b72b4829c12396a700234ff8fe6ad0a85091a4a0a6e2f5054f55933c2971';
      tree[11] = '416152b456c9bd10dde787f8d5f628de547c3bd3b48d540ec9962e2d614f6d84';
      tree[10] = 'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b';
      tree[12] = '8fa587374b458e8501d59f29466f3c04a5aaa589704efad5e9ca99d2ba7bef9c';
      tree[5] = '8e13dcdaa050cc9e2972df4ecc208c788668979f0051c712f44cc339009ddc32';
      tree[4] = '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4';
      tree[6] = '8fa587374b458e8501d59f29466f3c04a5aaa589704efad5e9ca99d2ba7bef9c';
      tree[2] = '030b03ae56a1599ce857670375af01dd561e9653eb2206269f87cc7f00df9444';
      tree[3] = '8fa587374b458e8501d59f29466f3c04a5aaa589704efad5e9ca99d2ba7bef9c';
      tree[1] = 'e30366e6f5be486cb931dd35ff2bcc9cb8736adbbf530aac306b534c7275609b';
      tree[0] = '0a328b9a33c61b836826e3b5e95cb3d75731a88848140f9ab8dcef38da71b8f1';

      const expected = { elements, tree };

      testTreeFromMultiAppendProof(15, 'ff', 4, expected, options);
    });

    it('should build a 100-element Partial Tree from a Multi Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };

      const elements = Array(100).fill(null);
      elements[98] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';
      elements[99] = 'f092ffc50adec70f320c33704d9a635c09529fc5b277deeb50068790f953f21d';

      const tree = Array(256).fill(null);
      tree[226] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[227] = 'f00703443cdb74322917b11b412841d069e09846b5a9eddff1c47d6154d67bf1';
      tree[113] = '21efd0fe292c1c3bf3ca9d0fcb6db213568fd2aa3ab676b407b3c3d9c3ca762b';
      tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
      tree[56] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[28] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[14] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[7] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
      tree[3] = '2baef9bd920a3e6e55d0a376c4c0598c723896f8422cc9f112314ed52f97fc95';
      tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
      tree[1] = '2686a1bae53b5f4486536a06364fe51a9039a34b832907d043b23b4a5ec101bd';
      tree[0] = '19b3427b04a2bc1988448d50754fe428f481e5a718f80b1ebc21c63d33c9ab19';

      const expected = { elements, tree };

      testTreeFromMultiAppendProof(98, 'ff', 2, expected, options);
    });

    it('should build a sorted-hash 100-element Partial Tree from a Multi Append Proof', () => {
      const options = { unbalanced: true, sortedHash: true, compact: false };

      const elements = Array(100).fill(null);
      elements[98] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';
      elements[99] = 'f092ffc50adec70f320c33704d9a635c09529fc5b277deeb50068790f953f21d';

      const tree = Array(256).fill(null);
      tree[226] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[227] = 'f00703443cdb74322917b11b412841d069e09846b5a9eddff1c47d6154d67bf1';
      tree[113] = '21efd0fe292c1c3bf3ca9d0fcb6db213568fd2aa3ab676b407b3c3d9c3ca762b';
      tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
      tree[56] = 'f9b6ac5ffcf84b497de6ae6906999e142f4a549df473b8c658366d9e6715394d';
      tree[28] = 'f9b6ac5ffcf84b497de6ae6906999e142f4a549df473b8c658366d9e6715394d';
      tree[14] = 'f9b6ac5ffcf84b497de6ae6906999e142f4a549df473b8c658366d9e6715394d';
      tree[7] = 'f9b6ac5ffcf84b497de6ae6906999e142f4a549df473b8c658366d9e6715394d';
      tree[6] = '904afce76e0f7ccead463e22aec76018c1450afd3deb4f387e0617ef39721685';
      tree[3] = 'cd57129b7e48770f2bb207f4af549dc665f0f13462923741d702f93976eab525';
      tree[2] = 'bb9a6e5787ae741c6a0e75a360aefe75ee06284ece1edddc1573ac9462945e7f';
      tree[1] = 'f98e17df060961a9c4f1df54a070e11d9c5d346503cf795ddad3154cd4b92f3d';
      tree[0] = '49e8bf2f73f5ffa15f9c97f0d113ad72851781460bcc163486d1fa01bc80762f';

      const expected = { elements, tree };

      testTreeFromMultiAppendProof(98, 'ff', 2, expected, options);
    });

    it('should build a 100-element Partial Tree from a Multi Compact Append Proof', () => {
      const options = { unbalanced: true, sortedHash: false, compact: true };

      const elements = Array(100).fill(null);
      elements[98] = '2392a80f8a87b8cfde0aa5c84e199f163aae4c2a4c512d37598362ace687ad0c';
      elements[99] = 'f092ffc50adec70f320c33704d9a635c09529fc5b277deeb50068790f953f21d';

      const tree = Array(256).fill(null);
      tree[226] = 'cc7539397f3b3dc92978e04e2d170afa35354687ac3b56079cf760f0eed009d0';
      tree[227] = 'f00703443cdb74322917b11b412841d069e09846b5a9eddff1c47d6154d67bf1';
      tree[113] = '21efd0fe292c1c3bf3ca9d0fcb6db213568fd2aa3ab676b407b3c3d9c3ca762b';
      tree[112] = 'd902920fde7efe9ec00bd50e4195851294dcb7178a0aa8c5ebc913d5659586f9';
      tree[56] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[28] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[14] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[7] = 'a76508346a711aad11c7efa5eb14073f3bf5ea7ce4cc807f2546b5c3d8725913';
      tree[6] = '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203';
      tree[3] = '2baef9bd920a3e6e55d0a376c4c0598c723896f8422cc9f112314ed52f97fc95';
      tree[2] = 'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5';
      tree[1] = '2686a1bae53b5f4486536a06364fe51a9039a34b832907d043b23b4a5ec101bd';
      tree[0] = '19b3427b04a2bc1988448d50754fe428f481e5a718f80b1ebc21c63d33c9ab19';

      const expected = { elements, tree };

      testTreeFromMultiAppendProof(98, 'ff', 2, expected, options);
    });
  });

  describe('Generate Single Proofs From Partial Trees', () => {
    describe('Balanced', () => {
      it('should generate a Single Proof for a 8-element Partial Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };
        testGenerateSingleProofFromPartial(8, 2, options);
      });

      it('should generate a Single Proof for a 1-element Partial Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };
        testGenerateSingleProofFromPartial(1, 0, options);
      });

      it('should generate a Single Proof for a sorted-hash 8-element Partial Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };
        testGenerateSingleProofFromPartial(8, 2, options);
      });

      it('should generate a Single Proof for a sorted-hash 1-element Partial Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };
        testGenerateSingleProofFromPartial(1, 0, options);
      });

      it('should generate a compact Single Proof for a 8-element Partial Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };
        testGenerateSingleProofFromPartial(8, 2, options);
      });

      it('should generate a compact Single Proof for a 1-element Partial Merkle Tree.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };
        testGenerateSingleProofFromPartial(1, 0, options);
      });
    });

    describe('Unbalanced', () => {
      it('should generate a Single Proof for a 9-element Partial Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testGenerateSingleProofFromPartial(9, 8, options);
      });

      it('should generate a Single Proof for a 27-element Partial Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testGenerateSingleProofFromPartial(27, 25, options);
      });

      it('should generate a Single Proof for a 100-element Partial Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testGenerateSingleProofFromPartial(100, 97, options);
      });

      it('should generate a Single Proof for a sorted-hash 9-element Partial Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testGenerateSingleProofFromPartial(9, 8, options);
      });

      it('should generate a Single Proof for a sorted-hash 27-element Partial Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testGenerateSingleProofFromPartial(27, 25, options);
      });

      it('should generate a Single Proof for a sorted-hash 100-element Partial Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testGenerateSingleProofFromPartial(100, 97, options);
      });

      it('should generate a compact Single Proof for a 100-element Partial Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testGenerateSingleProofFromPartial(100, 97, options);
      });
    });
  });

  describe('Generate Single Update Proofs From Partial Trees', () => {
    describe('Balanced', () => {
      it('should generate a Single Proof for a 8-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(8, 2, options);
      });

      it('should generate a Single Proof for a 1-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(1, 0, options);
      });

      it('should generate a Single Proof for a sorted-hash 8-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(8, 2, options);
      });

      it('should generate a Single Proof for a sorted-hash 1-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: true, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(1, 0, options);
      });

      it('should generate a compact Single Proof for a 8-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };
        testGenerateSingleUpdateProofFromSinglePartial(8, 2, options);
      });

      it('should generate a compact Single Proof for a 1-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: false, sortedHash: false, compact: true };
        testGenerateSingleUpdateProofFromSinglePartial(1, 0, options);
      });
    });

    describe('Unbalanced', () => {
      it('should generate a Single Proof for a 9-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(9, 8, options);
      });

      it('should generate a Single Proof for a 27-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(27, 25, options);
      });

      it('should generate a Single Proof for a 100-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(100, 97, options);
      });

      it('should generate a Single Proof for a sorted-hash 9-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(9, 8, options);
      });

      it('should generate a Single Proof for a sorted-hash 27-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(27, 25, options);
      });

      it('should generate a Single Proof for a sorted-hash 100-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testGenerateSingleUpdateProofFromSinglePartial(100, 97, options);
      });

      it('should generate a compact Single Proof for a 100-element Partial Merkle Tree to update an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testGenerateSingleUpdateProofFromSinglePartial(100, 97, options);
      });
    });
  });

  describe.skip('Generate Multi Proofs From Partial Trees (Redundant)', () => {});

  describe('Generate Multi Update Proofs From Partial Trees', () => {
    describe('Balanced', () => {
      it('should generate an Indexed Multi Proof for a 8-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(8, [1, 4, 5], options);
      });

      it('should generate an Indexed Multi Proof for a 1-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(1, [0], options);
      });

      it('should generate an Indexed Multi Proof for a sorted-hash 8-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(8, [1, 4, 5], options);
      });

      it('should generate an Indexed Multi Proof for a sorted-hash 1-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(1, [0], options);
      });

      it('should generate a Existence-Only Multi Proof for a 8-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(8, [1, 4, 5], options);
      });

      it('should generate a Existence-Only Multi Proof for a 1-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(1, [0], options);
      });

      it('should generate a Compact Existence-Only Multi Proof for a 8-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(8, [1, 4, 5], options);
      });

      it('should generate a Compact Existence-Only Multi Proof for a 1-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(1, [0], options);
      });
    });

    describe('Unbalanced', () => {
      it('should generate an Indexed Multi Proof for a 9-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(9, [1, 8], options);
      });

      it('should generate an Indexed Multi Proof for a 27-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(27, [5, 12, 20, 25], options);
      });

      it('should generate an Indexed Multi Proof for a 100-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
        testGenerateMultiUpdateProofFromMultiPartial(100, [7, 24, 25, 68, 97], options);
      });

      it('should generate a Compact Indexed Multi Proof for a sorted-hash 9-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: true, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(9, [1, 8], options);
      });

      it('should generate a Compact Indexed Multi Proof for a sorted-hash 27-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: true, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(27, [5, 12, 20, 25], options);
      });

      it('should generate a Compact Indexed Multi Proof for a sorted-hash 100-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: true, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(100, [7, 24, 25, 68, 97], options);
      });

      it('should generate Compact Existence-Only Multi Proof for a 9-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(9, [1, 8], options);
      });

      it('should generate Compact Existence-Only Multi Proof for a 27-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(27, [5, 12, 20, 25], options);
      });

      it('should generate Compact Existence-Only Multi Proof for a 100-element Partial Merkle Tree to update elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testGenerateMultiUpdateProofFromMultiPartial(100, [7, 24, 25, 68, 97], options);
      });
    });
  });

  describe('Check Elements in a Partial Tree', () => {
    it('check elements in an 8-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testCheckElements(8, 2, [0, 2, 3, 7], [false, true, true, false], options);
    });

    it('check elements in an 89-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testCheckElements(89, 42, [0, 9, 42, 43, 87], [false, false, true, true, false], options);
    });
  });

  describe('Set Elements in a Partial Tree', () => {
    it('sets an element in an 8-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testSetElement(8, 2, 3, options);
    });

    it('sets an element in an 66-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testSetElement(66, 41, 40, options);
    });

    it('sets an element in an 89-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testSetElement(89, 41, 40, options);
    });

    it('sets elements in an 8-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testSetElements(8, 2, [0, 1, 3], options);
    });

    it('sets elements in an 66-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testSetElements(66, 41, [40, 42, 43], options);
    });

    it('sets elements in an 89-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testSetElements(89, 41, [40, 42, 43], options);
    });
  });

  describe('Appends Elements to a Partial Tree', () => {
    it('appends an element to an 1-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testAppendElement(1, options);
    });

    it('appends an element to an 8-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testAppendElement(8, options);
    });

    it('appends an element to an 89-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testAppendElement(89, options);
    });

    it('appends 12 elements to an 1-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testAppendElements(1, 12, options);
    });

    it('appends 5 elements to an 8-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testAppendElements(8, 5, options);
    });

    it('appends 41 elements to an 89-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testAppendElements(89, 41, options);
    });

    it('appends 160 elements to an 24-element Partial Tree built from a Single Proof.', () => {
      const options = { unbalanced: true, sortedHash: false, compact: false };
      testAppendElements(89, 160, options);
    });
  });

  describe.skip('Arbitrary Element Sizes (Likely Redundant Given Merkle Tree Tests)', () => {});
});
