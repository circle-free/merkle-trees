const fs = require('fs');
const chai = require('chai');
const { expect } = chai;

const gasCosts = require('./fixtures/merkle-gas-costs.json');
const { generateElements } = require('./helpers');
const MerkleTree = require('../../js');

const Merkle_Storage_Using_Lib = artifacts.require("Merkle_Storage_Using_Lib");
const Merkle_Storage_Using_Sorted_Hash_Lib = artifacts.require("Merkle_Storage_Using_Sorted_Hash_Lib");

const unsortedOptions = {
  unbalanced: true,
  sortedHash: false,
  elementPrefix: '0000000000000000000000000000000000000000000000000000000000000000',
  indexed: false,
  compact: true,
};

const sortedOptions = {
  unbalanced: true,
  sortedHash: true,
  elementPrefix: '0000000000000000000000000000000000000000000000000000000000000000',
  indexed: false,
  compact: true,
};

let contractInstance = null;
let merkleTree = null;
let elementCount = null;

const testUseOne = async (index, options) => {
  const gasFixtureString = `testUseOne_${elementCount}_${index}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { element, compactProof } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_one(index, hexElement, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseMany = async (indices, options) => {
  const gasFixtureString = `testUseMany_${elementCount}_${indices.join('-')}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many(hexElements, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, options) => {
  const gasFixtureString = `testUpdateOne_${elementCount}_${index}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.updateSingle(index, updateElement, options);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_one(index, hexElement, hexUpdateElement, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUpdateMany = async (indices, seed, options) => {
  const gasFixtureString = `testUpdateMany_${elementCount}_${indices.join('-')}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed });
  const hexUpdateElements = updateElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.updateMulti(indices, updateElements, options);
  const { elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_many(hexElements, hexUpdateElements, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOne = async (seed, options) => {
  const gasFixtureString = `testAppendOne_${elementCount}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.appendSingle(appendElement, options);
  const { compactProof } = proof;
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.append_one(hexAppendElement, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendMany = async (appendSize, seed, options) => {
  const gasFixtureString = `testAppendMany_${elementCount}_${appendSize}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.appendMulti(appendElements, options);
  const { compactProof } = proof;
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.append_many(hexAppendElements, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseOneAndAppendOne = async (index, seed, options) => {
  const gasFixtureString = `testUseOneAndAppendOne_${elementCount}_${index}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.useAndAppend(index, appendElement, options);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_one_and_append_one(index, hexElement, hexAppendElement, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseOneAndAppendMany = async (index, appendSize, seed, options) => {
  const gasFixtureString = `testUseOneAndAppendMany_${elementCount}_${index}_${appendSize}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.useAndAppend(index, appendElements, options);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_one_and_append_many(index, hexElement, hexAppendElements, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseManyAndAppendOne = async (indices, seed, options) => {
  const gasFixtureString = `testUseManyAndAppendOne_${elementCount}_${indices.join('-')}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.useAndAppend(indices, appendElement, options);
  const { elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many_and_append_one(hexElements, hexAppendElement, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseManyAndAppendMany = async (indices, appendSize, seed, options) => {
  const gasFixtureString = `testUseManyAndAppendMany_${elementCount}_${indices.join('-')}_${appendSize}_${seed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.useAndAppend(indices, appendElements, options);
  const { elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many_and_append_many(hexElements, hexAppendElements, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUpdateOneAndAppendOne = async (index, updateSeed, appendSeed, options) => {
  const gasFixtureString = `testUpdateOneAndAppendOne_${elementCount}_${index}_${updateSeed}_${appendSeed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed: updateSeed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const appendElement = generateElements(1, { seed: appendSeed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.updateAndAppend(index, updateElement, appendElement, options);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_one_and_append_one(index, hexElement, hexUpdateElement, hexAppendElement, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUpdateOneAndAppendMany = async (index, updateSeed, appendSize, appendSeed, options) => {
  const gasFixtureString = `testUpdateOneAndAppendMany_${elementCount}_${index}_${updateSeed}_${appendSize}_${appendSeed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed: updateSeed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const appendElements = generateElements(appendSize, { seed: appendSeed });
  const hexAppendElements = appendElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.updateAndAppend(index, updateElement, appendElements, options);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_one_and_append_many(index, hexElement, hexUpdateElement, hexAppendElements, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUpdateManyAndAppendOne = async (indices, updateSeed, appendSeed, options) => {
  const gasFixtureString = `testUpdateOneAndAppendMany_${elementCount}_${indices.join('-')}_${updateSeed}_${appendSeed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed: updateSeed });
  const hexUpdateElements = updateElements.map(e => '0x' + e.toString('hex'));
  const appendElement = generateElements(1, { seed: appendSeed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.updateAndAppend(indices, updateElements, appendElement, options);
  const { elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_many_and_append_one(hexElements, hexUpdateElements, hexAppendElement, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUpdateManyAndAppendMany = async (indices, updateSeed, appendSize, appendSeed, options) => {
  const gasFixtureString = `testUpdateManyAndAppendMany_${elementCount}_${indices.join('-')}_${updateSeed}_${appendSize}_${appendSeed}_${options.sortedHash ? 's' : 'u'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed: updateSeed });
  const hexUpdateElements = updateElements.map(e => '0x' + e.toString('hex'));
  const appendElements = generateElements(appendSize, { seed: appendSeed });
  const hexAppendElements = appendElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.updateAndAppend(indices, updateElements, appendElements, options);
  const { elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_many_and_append_many(hexElements, hexUpdateElements, hexAppendElements, hexProof);
  merkleTree = newMerkleTree;

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};


describe("Merkle Storage Using Merkle Library", async accounts => {
  after(() => {
    fs.writeFileSync('./test/fixtures/merkle-gas-costs.json', JSON.stringify(gasCosts, null, ' '));
  });

  describe("Starting with 200 elements (Unsorted Hash)", async accounts => {
    beforeEach(async () => {
      contractInstance = await Merkle_Storage_Using_Lib.new();
      const elements = generateElements(200, { seed: 'ff' });
      merkleTree = new MerkleTree(elements, unsortedOptions);
      await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
      elementCount = 200;
    });
  
    it("should use 1 element.", () => {
      return testUseOne(0, unsortedOptions);
    });

    it("should use 2 elements.", () => {
      return testUseMany([0, 1], unsortedOptions);
    });
  
    it("should use 5 elements.", () => {
      return testUseMany([0, 1, 2, 3, 4], unsortedOptions);
    });
  
    it("should use 10 elements.", () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUseMany(firstHalf.concat(secondHalf), unsortedOptions);
    });
  
    it("should use 20 elements.", () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUseMany(firstHalf.concat(secondHalf), unsortedOptions);
    });

    it("should update 1 element.", () => {
      return testUpdateOne(0, '11', unsortedOptions);
    });

    it("should update 2 elements.", () => {
      return testUpdateMany([0, 1], '11', unsortedOptions);
    });
  
    it("should update 5 elements.", () => {
      return testUpdateMany([0, 1, 2, 3, 4], '11', unsortedOptions);
    });
  
    it("should update 10 elements.", () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUpdateMany(firstHalf.concat(secondHalf), '11', unsortedOptions);
    });
  
    it("should update 20 elements.", () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUpdateMany(firstHalf.concat(secondHalf), '11', unsortedOptions);
    });

    it("should append 1 new element.", async () => {
      return testAppendOne('22', unsortedOptions);
    });
  
    it(`should append 2 new elements.`, async () => {
      return testAppendMany(2, '22', unsortedOptions);
    });
  
    it(`should append 5 new elements.`, async () => {
      return testAppendMany(5, '22', unsortedOptions);
    });
  
    it(`should append 10 new elements.`, async () => {
      return testAppendMany(10, '22', unsortedOptions);
    });
  
    it(`should append 20 new elements.`, async () => {
      return testAppendMany(20, '22', unsortedOptions);
    });

    it(`should use 1 element and append 1 element.`, async () => {
      return testUseOneAndAppendOne(elementCount - 1, '22', unsortedOptions);
    });

    it(`should use 1 element and append 2 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 2, '22', unsortedOptions);
    });

    it(`should use 1 element and append 5 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 5, '22', unsortedOptions);
    });

    it(`should use 1 element and append 10 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 10, '22', unsortedOptions);
    });

    it(`should use 1 element and append 20 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 20, '22', unsortedOptions);
    });

    it(`should use 2 elements and append 1 element.`, async () => {
      return testUseManyAndAppendOne([58, 199], '22', unsortedOptions);
    });

    it(`should use 5 elements and append 1 element.`, async () => {
      return testUseManyAndAppendOne([25, 47, 95, 130, 199], '22', unsortedOptions);
    });

    it(`should use 10 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22', unsortedOptions);
    });

    it(`should use 20 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22', unsortedOptions);
    });

    it(`should use 2 elements and append 2 elements.`, async () => {
      return testUseManyAndAppendMany([58, 199], 2, '22', unsortedOptions);
    });

    it(`should use 5 elements and append 5 elements.`, async () => {
      return testUseManyAndAppendMany([25, 47, 95, 130, 199], 5, '22', unsortedOptions);
    });

    it(`should use 10 elements and append 10 elements.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 10, '22', unsortedOptions);
    });

    it(`should use 20 elements and append 20 elements.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 20, '22', unsortedOptions);
    });

    it(`should update 1 element and append 1 element.`, async () => {
      return testUpdateOneAndAppendOne(199, '11', '22', unsortedOptions);
    });

    it(`should update 1 element and append 2 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 2, '22', unsortedOptions);
    });

    it(`should update 1 element and append 5 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 5, '22', unsortedOptions);
    });

    it(`should update 1 element and append 10 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 10, '22', unsortedOptions);
    });

    it(`should update 1 element and append 20 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 20, '22', unsortedOptions);
    });

    it(`should update 2 elements and append 1 element.`, async () => {
      return testUpdateManyAndAppendOne([58, 199], '11', '22', unsortedOptions);
    });

    it(`should update 5 elements and append 1 element.`, async () => {
      return testUpdateManyAndAppendOne([25, 47, 95, 130, 199], '11', '22', unsortedOptions);
    });

    it(`should update 10 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22', unsortedOptions);
    });

    it(`should update 20 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22', unsortedOptions);
    });

    it(`should update 2 elements and append 2 elements.`, async () => {
      return testUpdateManyAndAppendMany([58, 199], '11', 2, '22', unsortedOptions);
    });

    it(`should update 5 elements and append 5 elements.`, async () => {
      return testUpdateManyAndAppendMany([25, 47, 95, 130, 199], '11', 5, '22', unsortedOptions);
    });

    it(`should update 10 elements and append 10 elements.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 10, '22', unsortedOptions);
    });

    it(`should update 20 elements and append 20 elements.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 20, '22', unsortedOptions);
    });
  });

  describe("Starting with 200 elements (Sorted Hash)", async accounts => {
    beforeEach(async () => {
      contractInstance = await Merkle_Storage_Using_Sorted_Hash_Lib.new();
      const elements = generateElements(200, { seed: 'ff' });
      merkleTree = new MerkleTree(elements, sortedOptions);
      await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
      elementCount = 200;
    });
  
    it("should use 1 element.", () => {
      return testUseOne(0, sortedOptions);
    });

    it("should use 2 elements.", () => {
      return testUseMany([0, 1], sortedOptions);
    });
  
    it("should use 5 elements.", () => {
      return testUseMany([0, 1, 2, 3, 4], sortedOptions);
    });
  
    it("should use 10 elements.", () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
    });
  
    it("should use 20 elements.", () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
    });

    it("should update 1 element.", () => {
      return testUpdateOne(0, '11', sortedOptions);
    });

    it("should update 2 elements.", () => {
      return testUpdateMany([0, 1], '11', sortedOptions);
    });
  
    it("should update 5 elements.", () => {
      return testUpdateMany([0, 1, 2, 3, 4], '11', sortedOptions);
    });
  
    it("should update 10 elements.", () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
    });
  
    it("should update 20 elements.", () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
    });

    it("should append 1 new element.", async () => {
      return testAppendOne('22', sortedOptions);
    });
  
    it(`should append 2 new elements.`, async () => {
      return testAppendMany(2, '22', sortedOptions);
    });
  
    it(`should append 5 new elements.`, async () => {
      return testAppendMany(5, '22', sortedOptions);
    });
  
    it(`should append 10 new elements.`, async () => {
      return testAppendMany(10, '22', sortedOptions);
    });
  
    it(`should append 20 new elements.`, async () => {
      return testAppendMany(20, '22', sortedOptions);
    });

    it(`should use 1 element and append 1 element.`, async () => {
      return testUseOneAndAppendOne(elementCount - 1, '22', sortedOptions);
    });

    it(`should use 1 element and append 2 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 2, '22', sortedOptions);
    });

    it(`should use 1 element and append 5 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 5, '22', sortedOptions);
    });

    it(`should use 1 element and append 10 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 10, '22', sortedOptions);
    });

    it(`should use 1 element and append 20 elements.`, async () => {
      return testUseOneAndAppendMany(elementCount - 1, 20, '22', sortedOptions);
    });

    it(`should use 2 elements and append 1 element.`, async () => {
      return testUseManyAndAppendOne([58, 199], '22', sortedOptions);
    });

    it(`should use 5 elements and append 1 element.`, async () => {
      return testUseManyAndAppendOne([25, 47, 95, 130, 199], '22', sortedOptions);
    });

    it(`should use 10 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22', sortedOptions);
    });

    it(`should use 20 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22', sortedOptions);
    });

    it(`should use 2 elements and append 2 elements.`, async () => {
      return testUseManyAndAppendMany([58, 199], 2, '22', sortedOptions);
    });

    it(`should use 5 elements and append 5 elements.`, async () => {
      return testUseManyAndAppendMany([25, 47, 95, 130, 199], 5, '22', sortedOptions);
    });

    it(`should use 10 elements and append 10 elements.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 10, '22', sortedOptions);
    });

    it(`should use 20 elements and append 20 elements.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 20, '22', sortedOptions);
    });

    it(`should update 1 element and append 1 element.`, async () => {
      return testUpdateOneAndAppendOne(199, '11', '22', sortedOptions);
    });

    it(`should update 1 element and append 2 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 2, '22', sortedOptions);
    });

    it(`should update 1 element and append 5 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 5, '22', sortedOptions);
    });

    it(`should update 1 element and append 10 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 10, '22', sortedOptions);
    });

    it(`should update 1 element and append 20 elements.`, async () => {
      return testUpdateOneAndAppendMany(elementCount - 1, '11', 20, '22', sortedOptions);
    });

    it(`should update 2 elements and append 1 element.`, async () => {
      return testUpdateManyAndAppendOne([58, 199], '11', '22', sortedOptions);
    });

    it(`should update 5 elements and append 1 element.`, async () => {
      return testUpdateManyAndAppendOne([25, 47, 95, 130, 199], '11', '22', sortedOptions);
    });

    it(`should update 10 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22', sortedOptions);
    });

    it(`should update 20 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22', sortedOptions);
    });

    it(`should update 2 elements and append 2 elements.`, async () => {
      return testUpdateManyAndAppendMany([58, 199], '11', 2, '22', sortedOptions);
    });

    it(`should update 5 elements and append 5 elements.`, async () => {
      return testUpdateManyAndAppendMany([25, 47, 95, 130, 199], '11', 5, '22', sortedOptions);
    });

    it(`should update 10 elements and append 10 elements.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map(i => elementCount - 5 + i);
      return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 10, '22', sortedOptions);
    });

    it(`should update 20 elements and append 20 elements.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
      return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 20, '22', sortedOptions);
    });
  });
});
