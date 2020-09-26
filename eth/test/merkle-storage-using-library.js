const fs = require('fs');
const chai = require('chai');
const { expect } = chai;

const gasCosts = require('./fixtures/gas-costs.json');
const { generateElements } = require('./helpers');
const MerkleTree = require('../../js');
const { to32ByteBuffer } = require('../../js/src/utils');

const Merkle_Storage_Using_Sorted_Hash_Lib = artifacts.require("Merkle_Storage_Using_Sorted_Hash_Lib");
const Merkle_Storage_Using_Lib = artifacts.require("Merkle_Storage_Using_Lib");

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
let elementCount;

const testUseOne = async (index, options) => {
  const gasFixtureString = `testUseOne_${elementCount}_${index}_${options.sortedHash ? 'sorted' : 'unsorted'}`;

  const expectedGas = gasCosts[gasFixtureString];
  const { element, compactProof } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_one(index, hexElement, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, options) => {
  const gasFixtureString = `testUpdateOne_${elementCount}_${index}_${seed}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.updateSingle(index, newElement, options);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_one(index, hexElement, hexNewElement, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testUseAndUpdateOne = async (index, options) => {
  const gasFixtureString = `testUseAndUpdateOne_${elementCount}_${index}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { element, compactProof } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_one(index, hexElement, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseMany = async (indices, options) => {
  const gasFixtureString = `testUseMany_${elementCount}_${indices.join('-')}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many(hexElements, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, options) => {
  const gasFixtureString = `testUseMany_${elementCount}_${indices.join('-')}_${seed}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const newElements = generateElements(indices.length, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.updateMulti(indices, newElements, options);
  const { elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_many(hexElements, hexNewElements, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testUseAndUpdateMany = async (indices, options) => {
  const gasFixtureString = `testUseAndUpdateMany_${elementCount}_${indices.join('-')}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_many(hexElements, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOne = async (seed, options) => {
  const gasFixtureString = `testAppendOne_${elementCount}_${seed}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.appendSingle(newElement, options);
  const { compactProof } = proof;
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.append_one(hexNewElement, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testAppendOneConsecutively = async (iterations, seed, options) => {
  const gasFixtureString = `testAppendOneConsecutively_${elementCount}_${iterations}_${seed}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const newElements = generateElements(iterations, { seed });

  const cumulativeGasUsed = await newElements.reduce(async (cGasUsed, newElement) => {
    const cumulativeGasUsed = await cGasUsed;
    const hexNewElement = '0x' + newElement.toString('hex');
    const { newMerkleTree, proof } = merkleTree.appendSingle(newElement, options);
    const { compactProof } = proof;
    merkleTree = newMerkleTree;
    const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
    const { receipt } = await contractInstance.append_one(hexNewElement, hexProof);
    
    return cumulativeGasUsed + receipt.gasUsed;
  }, 0);

  gasCosts[gasFixtureString] = cumulativeGasUsed;

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendMany = async (appendSize, seed, options) => {
  const gasFixtureString = `testAppendMany_${elementCount}_${appendSize}_${seed}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const newElements = generateElements(appendSize, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.appendMulti(newElements, options);
  const { compactProof } = proof;
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.append_many(hexNewElements, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testAppendManyConsecutively = async (iterations, appendSize, seed, options) => {
  const gasFixtureString = `testAppendManyConsecutively_${elementCount}_${iterations}_${appendSize}_${seed}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  let cumulativeGasUsed = 0;

  const newElementsMatrix = Array(iterations).fill(null).map(() => {
    const newElements = generateElements(appendSize, { seed });
    seed = newElements[0].toString('hex');

    return newElements;
  });
  
  for (let i = 0; i < iterations; i++) {
    const newElements = newElementsMatrix[i];
    const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
    const { newMerkleTree, proof } = merkleTree.appendMulti(newElements, options);
    const { compactProof } = proof;
    merkleTree = newMerkleTree;
    const hexProof = compactProof.map(d => '0x' + d.toString('hex'));
    const { receipt } = await contractInstance.append_many(hexNewElements, hexProof);
    cumulativeGasUsed = cumulativeGasUsed + receipt.gasUsed;
  }

  gasCosts[gasFixtureString] = cumulativeGasUsed;

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendMany = async (indices, options) => {
  const gasFixtureString = `testUseUpdateAndAppendMany_${elementCount}_${indices.join('-')}_${options.sortedHash ? 'sorted' : 'unsorted'}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { elements, compactProof } = merkleTree.generateCombinedProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_and_append_many(hexElements, hexProof);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendManyConsecutively = async (iterations, seed, count, expectedGas, options) => {
  // TODO: can't be tested without duplicating the update and append element logic here
  return;
};

const testGetIndices = async (indices, options) => {
  const elements = indices.map(index => merkleTree.elements[index]);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const { compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const results = await contractInstance.verify_indices(hexElements, hexProof);

  expect(results.map(index => index.toNumber())).to.deep.equal(indices);
};

const testVerifySizeWithProof = async (options) => {
  const proofOptions = Object.assign({ simple: false }, options);
  const { elementCount, compactProof } = merkleTree.generateSizeProof(proofOptions);
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const results = await contractInstance.verify_size_with_proof(elementCount, hexProof);

  expect(results).to.be.true;
};

const testVerifySize = async (options) => {
  const proofOptions = Object.assign({ simple: true }, options);
  const { elementCount, elementRoot } = merkleTree.generateSizeProof(proofOptions);
  const hexElementRoot = '0x' + elementRoot.toString('hex');
  const results = await contractInstance.verify_size(elementCount, hexElementRoot);

  expect(results).to.be.true;
};


describe("Merkle_Storage_Using_Libraries", async accounts => {
  after(() => {
    fs.writeFileSync('./test/fixtures/gas-costs.json', JSON.stringify(gasCosts, null, ' '));
  });

  describe("Merkle_Storage_Using_Sorted_Hash_Lib", async accounts => {
    describe("Starting with 20 elements", async accounts => {
      beforeEach(async () => {
        contractInstance = await Merkle_Storage_Using_Sorted_Hash_Lib.new();
        const elements = generateElements(20, { seed: 'ff' });
        merkleTree = new MerkleTree(elements, sortedOptions);
        await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
        elementCount = 20;
      });
    
      it("should use 1 element for.", () => {
        return testUseOne(0, sortedOptions);
      });
    
      it("should update 1 element.", () => {
        return testUpdateOne(0, '11', sortedOptions);
      });
    
      it("should use and update 1 element.", () => {
        return testUseAndUpdateOne(0, sortedOptions);
      });
    
      it("should use 2 elements.", () => {
        return testUseMany([0, 1], sortedOptions);
      });
    
      it("should use 3 elements.", () => {
        return testUseMany([0, 1, 2], sortedOptions);
      });
    
      it("should use 4 elements.", () => {
        return testUseMany([0, 1, 2, 3], sortedOptions);
      });
    
      it("should use 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should update 2 elements.", () => {
        return testUpdateMany([0, 1], '11', sortedOptions);
      });
    
      it("should update 3 elements.", () => {
        return testUpdateMany([0, 1, 2], '11', sortedOptions);
      });
    
      it("should update 4 elements.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', sortedOptions);
      });
    
      it("should update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
    
      it("should update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
    
      it("should use and update 2 elements.", () => {
        return testUseAndUpdateMany([0, 1], sortedOptions);
      });
    
      it("should use and update 3 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2], sortedOptions);
      });
    
      it("should use and update 4 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], sortedOptions);
      });
    
      it("should use and update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use and update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should append 1 new element.", async () => {
        return testAppendOne('22', sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively.", () => {
        return testAppendOneConsecutively(100, '22', sortedOptions);
      });
    
      it(`should append 2 new elements.`, async () => {
        return testAppendMany(2, '22', sortedOptions);
      });
    
      it(`should append 3 new elements.`, async () => {
        return testAppendMany(3, '22', sortedOptions);
      });
    
      it(`should append 4 new elements.`, async () => {
        return testAppendMany(4, '22', sortedOptions);
      });
    
      it(`should append 8 new elements.`, async () => {
        return testAppendMany(8, '22', sortedOptions);
      });
    
      it(`should append 20 new elements.`, async () => {
        return testAppendMany(20, '22', sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 2, '22', sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 3, '22', sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 4, '22', sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively,.", () => {
        return testAppendManyConsecutively(100, 8, '22', sortedOptions);
      });
    
      it("should use, update, and append 2 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 19], sortedOptions);
      });
    
      it("should use, update, and append 3 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 19], sortedOptions);
      });
    
      it("should use, update, and append 4 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 19], sortedOptions);
      });
    
      it("should use, update, and append 8 new elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use, update, and append 20 new elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });

      it("should verify size simply with element root.", () => {
        return testVerifySize(null, unsortedOptions);
      });
    });
  
    describe("Starting with 200 elements", async accounts => {
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
    
      it("should update 1 element.", () => {
        return testUpdateOne(0, '11', sortedOptions);
      });
    
      it("should use and update 1 element.", () => {
        return testUseAndUpdateOne(0, sortedOptions);
      });
    
      it("should use 2 elements.", () => {
        return testUseMany([0, 1], sortedOptions);
      });
    
      it("should use 3 elements.", () => {
        return testUseMany([0, 1, 2], sortedOptions);
      });
    
      it("should use 4 elements.", () => {
        return testUseMany([0, 1, 2, 3], sortedOptions);
      });
    
      it("should use 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
  
      it("should use 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should update 2 elements.", () => {
        return testUpdateMany([0, 1], '11', sortedOptions);
      });
    
      it("should update 3 elements.", () => {
        return testUpdateMany([0, 1, 2], '11', sortedOptions);
      });
    
      it("should update 4 elements.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', sortedOptions);
      });
    
      it("should update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
    
      it("should update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
  
      it("should update 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
    
      it("should use and update 2 elements.", () => {
        return testUseAndUpdateMany([0, 1], sortedOptions);
      });
    
      it("should use and update 3 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2], sortedOptions);
      });
    
      it("should use and update 4 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], sortedOptions);
      });
    
      it("should use and update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use and update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
  
      it("should use and update 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should append 1 new element.", async () => {
        return testAppendOne('22', sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively.", () => {
        return testAppendOneConsecutively(100, '22', sortedOptions);
      });
    
      it(`should append 2 new elements.`, async () => {
        return testAppendMany(2, '22', sortedOptions);
      });
    
      it(`should append 3 new elements.`, async () => {
        return testAppendMany(3, '22', sortedOptions);
      });
    
      it(`should append 4 new elements.`, async () => {
        return testAppendMany(4, '22', sortedOptions);
      });
    
      it(`should append 8 new elements.`, async () => {
        return testAppendMany(8, '22', sortedOptions);
      });
    
      it(`should append 20 new elements.`, async () => {
        return testAppendMany(20, '22', sortedOptions);
      });
  
      it(`should append 100 new elements.`, async () => {
        return testAppendMany(100, '22', sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 2, '22', sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 3, '22', sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 4, '22', sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 8, '22', sortedOptions);
      });
    
      it("should use, update, and append 2 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 199], sortedOptions);
      });
    
      it("should use, update, and append 3 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 199], sortedOptions);
      });
    
      it("should use, update, and append 4 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 199], sortedOptions);
      });
    
      it("should use, update, and append 8 new elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use, update, and append 20 new elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });
  
      it("should use, update, and append 100 new elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });

      it("should verify size simply with element root.", () => {
        return testVerifySize(unsortedOptions);
      });
    });
  
    describe("Starting with 2000 elements", async accounts => {
      beforeEach(async () => {
        contractInstance = await Merkle_Storage_Using_Sorted_Hash_Lib.new();
        const elements = generateElements(2000, { seed: 'ff' });
        merkleTree = new MerkleTree(elements, sortedOptions);
        await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
        elementCount = 2000;
      });
    
      it("should use 1 element.", () => {
        return testUseOne(0, sortedOptions);
      });
    
      it("should update 1 element.", () => {
        return testUpdateOne(0, '11', sortedOptions);
      });
    
      it("should use and update 1 element.", () => {
        return testUseAndUpdateOne(0, sortedOptions);
      });
    
      it("should use 2 elements.", () => {
        return testUseMany([0, 1], sortedOptions);
      });
    
      it("should use 3 elements.", () => {
        return testUseMany([0, 1, 2], sortedOptions);
      });
    
      it("should use 4 elements.", () => {
        return testUseMany([0, 1, 2, 3], sortedOptions);
      });
    
      it("should use 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
  
      it("should use 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should update 2 elements.", () => {
        return testUpdateMany([0, 1], '11', sortedOptions);
      });
    
      it("should update 3 elements.", () => {
        return testUpdateMany([0, 1, 2], '11', sortedOptions);
      });
    
      it("should update 4 elements.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', sortedOptions);
      });
    
      it("should update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
    
      it("should update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
  
      it("should update 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', sortedOptions);
      });
    
      it("should use and update 2 elements.", () => {
        return testUseAndUpdateMany([0, 1], sortedOptions);
      });
    
      it("should use and update 3 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2], sortedOptions);
      });
    
      it("should use and update 4 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], sortedOptions);
      });
    
      it("should use and update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use and update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
  
      it("should use and update 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should append 1 new element.", async () => {
        return testAppendOne('22', sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively.", () => {
        return testAppendOneConsecutively(100, '22', sortedOptions);
      });
    
      it(`should append 2 new elements.`, async () => {
        return testAppendMany(2, '22', sortedOptions);
      });
    
      it(`should append 3 new elements.`, async () => {
        return testAppendMany(3, '22', sortedOptions);
      });
    
      it(`should append 4 new elements.`, async () => {
        return testAppendMany(4, '22', sortedOptions);
      });
    
      it(`should append 8 new elements.`, async () => {
        return testAppendMany(8, '22', sortedOptions);
      });
    
      it(`should append 20 new elements.`, async () => {
        return testAppendMany(20, '22', sortedOptions);
      });
  
      it(`should append 100 new elements.`, async () => {
        return testAppendMany(100, '22', sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 2, '22', sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 3, '22', sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 4, '22', sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 8, '22', sortedOptions);
      });
    
      it("should use, update, and append 2 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1999], sortedOptions);
      });
    
      it("should use, update, and append 3 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 1999], sortedOptions);
      });
    
      it("should use, update, and append 4 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 1999], sortedOptions);
      });
    
      it("should use, update, and append 8 new elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });
    
      it("should use, update, and append 20 new elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });
  
      it("should use, update, and append 100 new elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), sortedOptions);
      });

      it("should verify size simply with element root.", () => {
        return testVerifySize(unsortedOptions);
      });
    });
  });

  describe("Merkle_Storage_Using_Lib", async accounts => {
    describe("Starting with 200 elements", async accounts => {
      beforeEach(async () => {
        contractInstance = await Merkle_Storage_Using_Lib.new();
        const elements = generateElements(200, { seed: 'ff' });
        merkleTree = new MerkleTree(elements, unsortedOptions);
        await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
        elementCount = 200;
      });
    
      it(`should use 1 element.`, () => {
        return testUseOne(0, unsortedOptions);
      });
    
      it(`should update 1 element.`, () => {
        return testUpdateOne(0, '11', unsortedOptions);
      });
    
      it(`should use and update 1 element.`, () => {
        return testUseAndUpdateOne(0, unsortedOptions);
      });
    
      it(`should use 2 elements.`, () => {
        return testUseMany([0, 1], unsortedOptions);
      });
    
      it("should use 3 elements.", () => {
        return testUseMany([0, 1, 2], unsortedOptions);
      });
    
      it("should use 4 elements.", () => {
        return testUseMany([0, 1, 2, 3], unsortedOptions);
      });
    
      it("should use 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
    
      it("should use 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
  
      it("should use 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
    
      it("should update 2 elements.", () => {
        return testUpdateMany([0, 1], '11', unsortedOptions);
      });
    
      it("should update 3 elements.", () => {
        return testUpdateMany([0, 1, 2], '11', unsortedOptions);
      });
    
      it("should update 4 elements.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', unsortedOptions);
      });
    
      it("should update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', unsortedOptions);
      });
    
      it("should update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', unsortedOptions);
      });
  
      it("should update 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', unsortedOptions);
      });
    
      it("should use and update 2 elements.", () => {
        return testUseAndUpdateMany([0, 1], unsortedOptions);
      });
    
      it("should use and update 3 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2], unsortedOptions);
      });
    
      it("should use and update 4 elements.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], unsortedOptions);
      });
    
      it("should use and update 8 elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
    
      it("should use and update 20 elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
  
      it("should use and update 100 elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
    
      it("should append 1 new element.", async () => {
        return testAppendOne('22', unsortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively.", () => {
        return testAppendOneConsecutively(100, '22', unsortedOptions);
      });
    
      it(`should append 2 new elements.`, async () => {
        return testAppendMany(2, '22', unsortedOptions);
      });
    
      it(`should append 3 new elements.`, async () => {
        return testAppendMany(3, '22', unsortedOptions);
      });
    
      it(`should append 4 new elements.`, async () => {
        return testAppendMany(4, '22', unsortedOptions);
      });
    
      it(`should append 8 new elements.`, async () => {
        return testAppendMany(8, '22', unsortedOptions);
      });
    
      it(`should append 20 new elements.`, async () => {
        return testAppendMany(20, '22', unsortedOptions);
      });
  
      it(`should append 100 new elements.`, async () => {
        return testAppendMany(100, '22', unsortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 2, '22', unsortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 3, '22', unsortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 4, '22', unsortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively.", () => {
        return testAppendManyConsecutively(100, 8, '22', unsortedOptions);
      });
    
      it("should use, update, and append 2 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 199], unsortedOptions);
      });
    
      it("should use, update, and append 3 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 199], unsortedOptions);
      });
    
      it("should use, update, and append 4 new elements.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 199], unsortedOptions);
      });
    
      it("should use, update, and append 8 new elements.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
    
      it("should use, update, and append 20 new elements.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), unsortedOptions);
      });
  
      it("should use, update, and append 100 new elements.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), unsortedOptions);
      });

      it("should get indices for 2 elements.", () => {
        return testGetIndices([0, 1], unsortedOptions);
      });
  
      it("should get indices for 5 elements.", () => {
        return testGetIndices([2, 7, 8, 15, 19], unsortedOptions);
      });
  
      it("should verify size with proof.", () => {
        return testVerifySizeWithProof(unsortedOptions);
      });

      it("should verify size simply with element root", () => {
        return testVerifySize(unsortedOptions);
      });
    });

    describe("Starting with 0 elements (empty)", async accounts => {
      beforeEach(async () => {
        contractInstance = await Merkle_Storage_Using_Lib.new();
        const elements = generateElements(0, { seed: 'ff' });
        merkleTree = new MerkleTree(elements, unsortedOptions);
        await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
        elementCount = 0;
      });

      it(`should append 1 new element (the first).`, () => {
        return testAppendOne('ff', unsortedOptions);
      });
    
      it(`should append 4 new elements (the first 4 elements).`, () => {
        return testAppendMany(4, 'ff', unsortedOptions);
      });

      it("should verify size with proof.", () => {
        return testVerifySizeWithProof(unsortedOptions);
      });

      it("should verify size simply with element root", () => {
        return testVerifySize(unsortedOptions);
      });
    });
  });
});
