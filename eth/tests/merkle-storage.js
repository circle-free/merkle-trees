const fs = require('fs');
const chai = require('chai');
const { expect } = chai;

const gasCosts = require('./fixtures/merkle-gas-costs.json');
const { generateElements, to32ByteBuffer } = require('./helpers');
const { MerkleTree } = require('../../js');

const contracts = [
  {
    name: 'Internal Library Calldata Bytes Sorted-Hash',
    type: 'icbsh',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Internal Library Calldata Bytes Standard',
    type: 'icbs',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Internal Library Calldata Bytes32 Sorted-Hash',
    type: 'icb32sh',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Internal Library Calldata Bytes32 Standard',
    type: 'icb32s',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Internal Library Memory Bytes Sorted-Hash',
    type: 'imbsh',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Internal Library Memory Bytes Standard',
    type: 'imbs',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Internal Library Memory Bytes32 Sorted-Hash',
    type: 'imb32sh',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Internal Library Memory Bytes32 Standard',
    type: 'imb32s',
    artifact: artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Calldata Bytes Sorted-Hash',
    type: 'ecbsh',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Calldata Bytes Standard',
    type: 'ecbs',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Calldata Bytes32 Sorted-Hash',
    type: 'ecb32sh',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes32_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Calldata Bytes32 Standard',
    type: 'ecb32s',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes32_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Memory Bytes Sorted-Hash',
    type: 'embsh',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Memory Bytes Standard',
    type: 'embs',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Memory Bytes32 Sorted-Hash',
    type: 'emb32sh',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes32_Sorted_Hash'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: true,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
  {
    name: 'Deployable Library Memory Bytes32 Standard',
    type: 'emb32s',
    artifact: artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes32_Standard'),
    instance: null,
    merkleTree: null,
    elementCount: null,
    treeOptions: {
      unbalanced: true,
      sortedHash: false,
      elementPrefix: '00',
    },
    proofOptions: {
      indexed: false,
      compact: true,
    },
  },
];

const testUseOne = async (index, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUseOne_${index}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { element, compactProof } = contract.merkleTree.generateSingleProof(index, contract.proofOptions);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.use_one(index, hexElement, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseMany = async (indices, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUseMany_${indices.join('-')}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { elements, compactProof } = contract.merkleTree.generateMultiProof(indices, contract.proofOptions);
  const hexElements = elements.map((e) => '0x' + e.toString('hex'));
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.use_many(hexElements, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUpdateOne_${index}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const { newMerkleTree, proof } = contract.merkleTree.updateSingle(index, updateElement, contract.proofOptions);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.update_one(index, hexElement, hexUpdateElement, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUpdateMany_${indices.join('-')}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed });
  const hexUpdateElements = updateElements.map((e) => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = contract.merkleTree.updateMulti(indices, updateElements, contract.proofOptions);
  const { elements, compactProof } = proof;
  const hexElements = elements.map((e) => '0x' + e.toString('hex'));
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.update_many(hexElements, hexUpdateElements, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testAppendOne = async (seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testAppendOne_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = contract.merkleTree.appendSingle(appendElement, contract.proofOptions);
  const { compactProof } = proof;
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.append_one(hexAppendElement, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testAppendMany = async (appendSize, seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testAppendMany_${appendSize}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = contract.merkleTree.appendMulti(appendElements, contract.proofOptions);
  const { compactProof } = proof;
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.append_many(hexAppendElements, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseOneAndAppendOne = async (index, seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUseOneAndAppendOne_${index}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = contract.merkleTree.useAndAppend(index, appendElement, contract.proofOptions);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.use_one_and_append_one(index, hexElement, hexAppendElement, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseOneAndAppendMany = async (index, appendSize, seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUseOneAndAppendMany_${index}_${appendSize}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = contract.merkleTree.useAndAppend(index, appendElements, contract.proofOptions);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.use_one_and_append_many(index, hexElement, hexAppendElements, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseManyAndAppendOne = async (indices, seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUseManyAndAppendOne_${indices.join(
    '-'
  )}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = contract.merkleTree.useAndAppend(indices, appendElement, contract.proofOptions);
  const { elements, compactProof } = proof;
  const hexElements = elements.map((e) => '0x' + e.toString('hex'));
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.use_many_and_append_one(hexElements, hexAppendElement, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseManyAndAppendMany = async (indices, appendSize, seed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUseManyAndAppendMany_${indices.join(
    '-'
  )}_${appendSize}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = contract.merkleTree.useAndAppend(indices, appendElements, contract.proofOptions);
  const { elements, compactProof } = proof;
  const hexElements = elements.map((e) => '0x' + e.toString('hex'));
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.use_many_and_append_many(hexElements, hexAppendElements, hexProof);
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOneAndAppendOne = async (index, updateSeed, appendSeed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUpdateOneAndAppendOne_${index}_${updateSeed}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed: updateSeed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const appendElement = generateElements(1, { seed: appendSeed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = contract.merkleTree.updateAndAppend(
    index,
    updateElement,
    appendElement,
    contract.proofOptions
  );
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.update_one_and_append_one(
    index,
    hexElement,
    hexUpdateElement,
    hexAppendElement,
    hexProof
  );
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOneAndAppendMany = async (index, updateSeed, appendSize, appendSeed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUpdateOneAndAppendMany_${index}_${updateSeed}_${appendSize}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed: updateSeed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const appendElements = generateElements(appendSize, { seed: appendSeed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = contract.merkleTree.updateAndAppend(
    index,
    updateElement,
    appendElements,
    contract.proofOptions
  );
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.update_one_and_append_many(
    index,
    hexElement,
    hexUpdateElement,
    hexAppendElements,
    hexProof
  );
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateManyAndAppendOne = async (indices, updateSeed, appendSeed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUpdateOneAndAppendMany_${indices.join(
    '-'
  )}_${updateSeed}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed: updateSeed });
  const hexUpdateElements = updateElements.map((e) => '0x' + e.toString('hex'));
  const appendElement = generateElements(1, { seed: appendSeed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = contract.merkleTree.updateAndAppend(
    indices,
    updateElements,
    appendElement,
    contract.proofOptions
  );
  const { elements, compactProof } = proof;
  const hexElements = elements.map((e) => '0x' + e.toString('hex'));
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.update_many_and_append_one(
    hexElements,
    hexUpdateElements,
    hexAppendElement,
    hexProof
  );
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateManyAndAppendMany = async (indices, updateSeed, appendSize, appendSeed, contract) => {
  const gasFixtureString = `${contract.type}_${contract.elementCount}_testUpdateManyAndAppendMany_${indices.join(
    '-'
  )}_${updateSeed}_${appendSize}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed: updateSeed });
  const hexUpdateElements = updateElements.map((e) => '0x' + e.toString('hex'));
  const appendElements = generateElements(appendSize, { seed: appendSeed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = contract.merkleTree.updateAndAppend(
    indices,
    updateElements,
    appendElements,
    contract.proofOptions
  );
  const { elements, compactProof } = proof;
  const hexElements = elements.map((e) => '0x' + e.toString('hex'));
  const hexProof = compactProof.map((p) => '0x' + p.toString('hex'));
  const { receipt } = await contract.instance.update_many_and_append_many(
    hexElements,
    hexUpdateElements,
    hexAppendElements,
    hexProof
  );
  contract.merkleTree = newMerkleTree;

  const retrievedRoot = await contract.instance.root();
  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(retrievedRoot).to.equal('0x' + contract.merkleTree.root.toString('hex'));
  expect(receipt.gasUsed).to.equal(expectedGas);
};

describe('Merkle Storage Using Merkle Library', async () => {
  after(() => {
    fs.writeFileSync('./eth/tests/fixtures/merkle-gas-costs.json', JSON.stringify(gasCosts, null, ' ').concat('\n'));
  });

  contracts.forEach(async (contract) => {
    describe(`Starting with 0 elements (${contract.name})`, async () => {
      beforeEach(async () => {
        contract.instance = await contract.artifact.deployed();
        await contract.instance._debug_set_root(to32ByteBuffer(0));

        contract.merkleTree = new MerkleTree([], contract.treeOptions);
        contract.elementCount = 0;
      });

      it('should append 1 new element.', async () => {
        return testAppendOne('22', contract);
      });

      it(`should append 13 new elements.`, async () => {
        return testAppendMany(13, '22', contract);
      });

      it(`should append 14 new elements.`, async () => {
        return testAppendMany(14, '22', contract);
      });

      it(`should append 15 new elements.`, async () => {
        return testAppendMany(15, '22', contract);
      });

      it(`should append 16 new elements.`, async () => {
        return testAppendMany(16, '22', contract);
      });

      it(`should append 18 new elements.`, async () => {
        return testAppendMany(18, '22', contract);
      });

      it(`should append 19 new elements.`, async () => {
        return testAppendMany(19, '22', contract);
      });

      it(`should append 20 new elements.`, async () => {
        return testAppendMany(20, '22', contract);
      });
    });

    describe(`Starting with 200 elements (${contract.name})`, async () => {
      beforeEach(async () => {
        contract.instance = await contract.artifact.deployed();
        await contract.instance._debug_set_root(to32ByteBuffer(0));

        const seed = 'ff';
        const elements = generateElements(200, { seed });
        contract.merkleTree = new MerkleTree(elements, contract.treeOptions);

        const hexElements = elements.map((e) => '0x' + e.toString('hex'));
        const { receipt } = await contract.instance.create(hexElements);
        contract.elementCount = 200;

        const gasFixtureString = `${contract.type}_${contract.elementCount}_constructCreate_${seed}`;
        gasCosts[gasFixtureString] = receipt.gasUsed;
      });

      it('should use 1 element.', () => {
        return testUseOne(0, contract);
      });

      it('should use 2 elements.', () => {
        return testUseMany([0, 1], contract);
      });

      it('should use 5 elements.', () => {
        return testUseMany([0, 1, 2, 3, 4], contract);
      });

      it('should use 10 elements.', () => {
        const firstHalf = Array.from(Array(5).keys());
        const secondHalf = Array.from(Array(5).keys()).map((i) => contract.elementCount - 5 + i);
        return testUseMany(firstHalf.concat(secondHalf), contract);
      });

      it('should use 20 elements.', () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map((i) => contract.elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), contract);
      });

      it('should update 1 element.', () => {
        return testUpdateOne(0, '11', contract);
      });

      it('should update 2 elements.', () => {
        return testUpdateMany([0, 1], '11', contract);
      });

      it('should update 5 elements.', () => {
        return testUpdateMany([0, 1, 2, 3, 4], '11', contract);
      });

      it('should update 10 elements.', () => {
        const firstHalf = Array.from(Array(5).keys());
        const secondHalf = Array.from(Array(5).keys()).map((i) => contract.elementCount - 5 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', contract);
      });

      it('should update 20 elements.', () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map((i) => contract.elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', contract);
      });

      it('should append 1 new element.', async () => {
        return testAppendOne('22', contract);
      });

      it(`should append 2 new elements.`, async () => {
        return testAppendMany(2, '22', contract);
      });

      it(`should append 5 new elements.`, async () => {
        return testAppendMany(5, '22', contract);
      });

      it(`should append 10 new elements.`, async () => {
        return testAppendMany(10, '22', contract);
      });

      it(`should append 20 new elements.`, async () => {
        return testAppendMany(20, '22', contract);
      });

      it(`should use 1 element and append 1 element.`, async () => {
        return testUseOneAndAppendOne(contract.elementCount - 1, '22', contract);
      });

      it(`should use 1 element and append 2 elements.`, async () => {
        return testUseOneAndAppendMany(contract.elementCount - 1, 2, '22', contract);
      });

      it(`should use 1 element and append 5 elements.`, async () => {
        return testUseOneAndAppendMany(contract.elementCount - 1, 5, '22', contract);
      });

      it(`should use 1 element and append 10 elements.`, async () => {
        return testUseOneAndAppendMany(contract.elementCount - 1, 10, '22', contract);
      });

      it(`should use 1 element and append 20 elements.`, async () => {
        return testUseOneAndAppendMany(contract.elementCount - 1, 20, '22', contract);
      });

      it(`should use 2 elements and append 1 element.`, async () => {
        return testUseManyAndAppendOne([58, 199], '22', contract);
      });

      it(`should use 5 elements and append 1 element.`, async () => {
        return testUseManyAndAppendOne([25, 47, 95, 130, 199], '22', contract);
      });

      it(`should use 10 elements and append 1 element.`, async () => {
        const firstHalf = Array.from(Array(5).keys());
        const secondHalf = Array.from(Array(5).keys()).map((i) => contract.elementCount - 5 + i);
        return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22', contract);
      });

      it(`should use 20 elements and append 1 element.`, async () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map((i) => contract.elementCount - 10 + i);
        return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22', contract);
      });

      it(`should use 2 elements and append 2 elements.`, async () => {
        return testUseManyAndAppendMany([58, 199], 2, '22', contract);
      });

      it(`should use 5 elements and append 5 elements.`, async () => {
        return testUseManyAndAppendMany([25, 47, 95, 130, 199], 5, '22', contract);
      });

      it(`should use 10 elements and append 10 elements.`, async () => {
        const firstHalf = Array.from(Array(5).keys());
        const secondHalf = Array.from(Array(5).keys()).map((i) => contract.elementCount - 5 + i);
        return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 10, '22', contract);
      });

      it(`should use 20 elements and append 20 elements.`, async () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map((i) => contract.elementCount - 10 + i);
        return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 20, '22', contract);
      });

      it(`should update 1 element and append 1 element.`, async () => {
        return testUpdateOneAndAppendOne(199, '11', '22', contract);
      });

      it(`should update 1 element and append 2 elements.`, async () => {
        return testUpdateOneAndAppendMany(contract.elementCount - 1, '11', 2, '22', contract);
      });

      it(`should update 1 element and append 5 elements.`, async () => {
        return testUpdateOneAndAppendMany(contract.elementCount - 1, '11', 5, '22', contract);
      });

      it(`should update 1 element and append 10 elements.`, async () => {
        return testUpdateOneAndAppendMany(contract.elementCount - 1, '11', 10, '22', contract);
      });

      it(`should update 1 element and append 20 elements.`, async () => {
        return testUpdateOneAndAppendMany(contract.elementCount - 1, '11', 20, '22', contract);
      });

      it(`should update 2 elements and append 1 element.`, async () => {
        return testUpdateManyAndAppendOne([58, 199], '11', '22', contract);
      });

      it(`should update 5 elements and append 1 element.`, async () => {
        return testUpdateManyAndAppendOne([25, 47, 95, 130, 199], '11', '22', contract);
      });

      it(`should update 10 elements and append 1 element.`, async () => {
        const firstHalf = Array.from(Array(5).keys());
        const secondHalf = Array.from(Array(5).keys()).map((i) => contract.elementCount - 5 + i);
        return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22', contract);
      });

      it(`should update 20 elements and append 1 element.`, async () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map((i) => contract.elementCount - 10 + i);
        return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22', contract);
      });

      it(`should update 2 elements and append 2 elements.`, async () => {
        return testUpdateManyAndAppendMany([58, 199], '11', 2, '22', contract);
      });

      it(`should update 5 elements and append 5 elements.`, async () => {
        return testUpdateManyAndAppendMany([25, 47, 95, 130, 199], '11', 5, '22', contract);
      });

      it(`should update 10 elements and append 10 elements.`, async () => {
        const firstHalf = Array.from(Array(5).keys());
        const secondHalf = Array.from(Array(5).keys()).map((i) => contract.elementCount - 5 + i);
        return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 10, '22', contract);
      });

      it(`should update 20 elements and append 20 elements.`, async () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map((i) => contract.elementCount - 10 + i);
        return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 20, '22', contract);
      });
    });
  });
});
