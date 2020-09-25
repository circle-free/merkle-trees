const chai = require('chai');
const { expect } = chai;

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

const testUseOne = async (index, expectedGas, options) => {
  const { element, compactProof } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_one(index, hexElement, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, expectedGas, options) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.updateSingle(index, newElement, options);
  const { element, compactProof } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_one(index, hexElement, hexNewElement, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testUseAndUpdateOne = async (index, expectedGas, options) => {
  const { element, compactProof } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_one(index, hexElement, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseMany = async (indices, expectedGas, options) => {
  const { elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many(hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, expectedGas, options) => {
  const newElements = generateElements(indices.length, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.updateMulti(indices, newElements, options);
  const { elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_many(hexElements, hexNewElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testUseAndUpdateMany = async (indices, expectedGas, options) => {
  const { elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_many(hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOne = async (seed, expectedGas, options) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.appendSingle(newElement, options);
  const { compactProof } = proof;
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.append_one(hexNewElement, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testAppendOneConsecutively = async (iterations, seed, expectedGas, options) => {
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

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendMany = async (appendSize, seed, expectedGas, options) => {
  const newElements = generateElements(appendSize, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.appendMulti(newElements, options);
  const { compactProof } = proof;
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.append_many(hexNewElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testAppendManyConsecutively = async (iterations, appendSize, seed, expectedGas, options) => {
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

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendMany = async (indices, expectedGas, options) => {
  const { elements, compactProof } = merkleTree.generateCombinedProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_and_append_many(hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendManyConsecutively = async (iterations, seed, count, expectedGas, options) => {
  // TODO: can't be tested without duplicating the update and append element logic here
  return;
};

const testGetIndices = async (indices, expectedGas, options) => {
  const elements = indices.map(index => merkleTree.elements[index]);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const { compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const results = await contractInstance.verify_indices(hexElements, hexProof);

  expect(results.map(index => index.toNumber())).to.deep.equal(indices);
};

const testVerifySize = async (expectedGas, options) => {
  const { elementCount, compactProof } = merkleTree.generateSizeProof(options);
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const results = await contractInstance.verify_size(elementCount, hexProof);

  expect(results).to.be.true;
};

const testAppendFromEmpty = async (elementCount, seed, expectedGas, options) => {
  const elements = generateElements(elementCount, { seed });
  newMerkleTree = new MerkleTree(elements, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = ['0x' + to32ByteBuffer(0).toString('hex')];

  const { receipt } = await contractInstance.append_many(hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};


describe("Merkle_Storage_Using_Libraries", async accounts => {
  describe("Merkle_Storage_Using_Sorted_Hash_Lib", async accounts => {
    describe("Starting with 20 elements", async accounts => {
      beforeEach(async () => {
        contractInstance = await Merkle_Storage_Using_Sorted_Hash_Lib.new();
        const elements = generateElements(20, { seed: 'ff' });
        merkleTree = new MerkleTree(elements, sortedOptions);
        await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
        elementCount = 20;
      });
    
      it("should use 1 element for 29,360 gas.", () => {
        return testUseOne(0, 29360, sortedOptions);
      });
    
      it("should update 1 element for 34,814 gas.", () => {
        return testUpdateOne(0, '11', 34814, sortedOptions);
      });
    
      it("should use and update 1 element for 35,629 gas.", () => {
        return testUseAndUpdateOne(0, 35629, sortedOptions);
      });
    
      it("should use 2 elements for 32,444 gas.", () => {
        return testUseMany([0, 1], 32444, sortedOptions);
      });
    
      it("should use 3 elements for 33,942 gas.", () => {
        return testUseMany([0, 1, 2], 33942, sortedOptions);
      });
    
      it("should use 4 elements for 34,423 gas.", () => {
        return testUseMany([0, 1, 2, 3], 34423, sortedOptions);
      });
    
      it("should use 8 elements for 40,071 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 40071, sortedOptions);
      });
    
      it("should use 20 elements for 56,229 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 56229, sortedOptions);
      });
    
      it("should update 2 elements for 39,580 gas.", () => {
        return testUpdateMany([0, 1], '11', 39580, sortedOptions);
      });
    
      it("should update 3 elements for 41,998 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 41998, sortedOptions);
      });
    
      it("should update 4 elements for 43,121 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 43121, sortedOptions);
      });
    
      it("should update 8 elements for 52,400 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 52400, sortedOptions);
      });
    
      it("should update 20 elements for 79,003 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 79003, sortedOptions);
      });
    
      it("should use and update 2 elements for 39,933 gas.", () => {
        return testUseAndUpdateMany([0, 1], 39933, sortedOptions);
      });
    
      it("should use and update 3 elements for 42,210 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 42210, sortedOptions);
      });
    
      it("should use and update 4 elements for 43,204 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 43204, sortedOptions);
      });
    
      it("should use and update 8 elements for 51,908 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 51908, sortedOptions);
      });
    
      it("should use and update 20 elements for 76,806 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 76806, sortedOptions);
      });
    
      it("should append 1 new element for 30,857 gas.", async () => {
        return testAppendOne('22', 30857, sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 3,234,4444 gas.", () => {
        return testAppendOneConsecutively(100, '22', 3234444, sortedOptions);
      });
    
      it(`should append 2 new elements, for 34,818 gas.`, async () => {
        return testAppendMany(2, '22', 34818, sortedOptions);
      });
    
      it(`should append 3 new elements, for 35,956 gas.`, async () => {
        return testAppendMany(3, '22', 35956, sortedOptions);
      });
    
      it(`should append 4 new elements, for 37,091 gas.`, async () => {
        return testAppendMany(4, '22', 37091, sortedOptions);
      });
    
      it(`should append 8 new elements, for 42,061 gas.`, async () => {
        return testAppendMany(8, '22', 42061, sortedOptions);
      });
    
      it(`should append 20 new elements, for 57,443 gas.`, async () => {
        return testAppendMany(20, '22', 57443, sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 3,689,360 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 3689360, sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 3,905,642 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 3905642, sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 3,934,808 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 3934808, sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 4,561,052 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 4561052, sortedOptions);
      });
    
      it("should use, update, and append 2 new elements for 49,447 gas.", () => {
        return testUseUpdateAndAppendMany([0, 19], 49447, sortedOptions);
      });
    
      it("should use, update, and append 3 new elements for 51,180 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 19], 51180, sortedOptions);
      });
    
      it("should use, update, and append 4 new elements for 54,290 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 19], 54290, sortedOptions);
      });
    
      it("should use, update, and append 8 new elements for 63,028 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 63028, sortedOptions);
      });
    
      it("should use, update, and append 20 new elements for 99,379 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 99379, sortedOptions);
      });

      it("should verify size.", () => {
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
    
      it("should use 1 element for 31,853 gas.", () => {
        return testUseOne(0, 31853, sortedOptions);
      });
    
      it("should update 1 element for 37,817 gas.", () => {
        return testUpdateOne(0, '11', 37817, sortedOptions);
      });
    
      it("should use and update 1 element for 38,632 gas.", () => {
        return testUseAndUpdateOne(0, 38632, sortedOptions);
      });
    
      it("should use 2 elements for 35,605 gas.", () => {
        return testUseMany([0, 1], 35605, sortedOptions);
      });
    
      it("should use 3 elements for 37,114 gas.", () => {
        return testUseMany([0, 1, 2], 37114, sortedOptions);
      });
    
      it("should use 4 elements for 37,595 gas.", () => {
        return testUseMany([0, 1, 2, 3], 37595, sortedOptions);
      });
    
      it("should use 8 elements for 45,601 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 45601, sortedOptions);
      });
    
      it("should use 20 elements for 67,101 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 67101, sortedOptions);
      });
  
      it("should use 100 elements for 186,131 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), 186131, sortedOptions);
      });
    
      it("should update 2 elements for 43,443 gas.", () => {
        return testUpdateMany([0, 1], '11', 43443, sortedOptions);
      });
    
      it("should update 3 elements for 45,871 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 45871, sortedOptions);
      });
    
      it("should update 4 elements for 46,995 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 46995, sortedOptions);
      });
    
      it("should update 8 elements for 59,194 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 59194, sortedOptions);
      });
    
      it("should update 20 elements for 92,278 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 92278, sortedOptions);
      });
  
      it("should update 100 elements for 282,979 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 282979, sortedOptions);
      });
    
      it("should use and update 2 elements for 43,796 gas.", () => {
        return testUseAndUpdateMany([0, 1], 43796, sortedOptions);
      });
    
      it("should use and update 3 elements for 46,083 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 46083, sortedOptions);
      });
    
      it("should use and update 4 elements for 47,078 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 47078, sortedOptions);
      });
    
      it("should use and update 8 elements for 58,726 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 58726, sortedOptions);
      });
    
      it("should use and update 20 elements for 90,118 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 90118, sortedOptions);
      });
  
      it("should use and update 100 elements for 269,671 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 269671, sortedOptions);
      });
    
      it("should append 1 new element for 31,786 gas.", async () => {
        return testAppendOne('22', 31786, sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 3,315,648 gas.", () => {
        return testAppendOneConsecutively(100, '22', 3315648, sortedOptions);
      });
    
      it(`should append 2 new elements, for 36,798 gas.`, async () => {
        return testAppendMany(2, '22', 36798, sortedOptions);
      });
    
      it(`should append 3 new elements, for 37,924 gas.`, async () => {
        return testAppendMany(3, '22', 37924, sortedOptions);
      });
    
      it(`should append 4 new elements, for 39,071 gas.`, async () => {
        return testAppendMany(4, '22', 39071, sortedOptions);
      });
    
      it(`should append 8 new elements, for 43,927 gas.`, async () => {
        return testAppendMany(8, '22', 43927, sortedOptions);
      });
    
      it(`should append 20 new elements, for 58,988 gas.`, async () => {
        return testAppendMany(20, '22', 58988, sortedOptions);
      });
  
      it(`should append 100 new elements, for 160,415 gas.`, async () => {
        return testAppendMany(100, '22', 160415, sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 3,813,552 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 3813552, sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 4,024,250 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 4024250, sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 4,022,325 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 4022325, sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 4,515,710 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 4515710, sortedOptions);
      });
    
      it("should use, update, and append 2 new elements for 58,541 gas.", () => {
        return testUseUpdateAndAppendMany([0, 199], 58541, sortedOptions);
      });
    
      it("should use, update, and append 3 new elements for 60,262 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 199], 60262, sortedOptions);
      });
    
      it("should use, update, and append 4 new elements for 63,410 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 199], 63410, sortedOptions);
      });
    
      it("should use, update, and append 8 new elements for 71,984 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 71984, sortedOptions);
      });
    
      it("should use, update, and append 20 new elements for 114,862 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 114862, sortedOptions);
      });
  
      it("should use, update, and append 100 new elements for 370,392 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 370392, sortedOptions);
      });

      it("should verify size.", () => {
        return testVerifySize(null, unsortedOptions);
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
    
      it("should use 1 element for 34,358 gas.", () => {
        return testUseOne(0, 34358, sortedOptions);
      });
    
      it("should update 1 element for 40,820 gas.", () => {
        return testUpdateOne(0, '11', 40820, sortedOptions);
      });
    
      it("should use and update 1 element for 41,623 gas.", () => {
        return testUseAndUpdateOne(0, 41623, sortedOptions);
      });
    
      it("should use 2 elements for 38,787 gas.", () => {
        return testUseMany([0, 1], 38787, sortedOptions);
      });
    
      it("should use 3 elements for 40,285 gas.", () => {
        return testUseMany([0, 1, 2], 40285, sortedOptions);
      });
    
      it("should use 4 elements for 40,756 gas.", () => {
        return testUseMany([0, 1, 2, 3], 40756, sortedOptions);
      });
    
      it("should use 8 elements for 52,721 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 52721, sortedOptions);
      });
    
      it("should use 20 elements for 71,050 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 71050, sortedOptions);
      });
  
      it("should use 100 elements for 193,196 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), 193196, sortedOptions);
      });
    
      it("should update 2 elements for 47,338 gas.", () => {
        return testUpdateMany([0, 1], '11', 47338, sortedOptions);
      });
    
      it("should update 3 elements for 49,745 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 49745, sortedOptions);
      });
    
      it("should update 4 elements for 50,882 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 50882, sortedOptions);
      });
    
      it("should update 8 elements for 67,859 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 67859, sortedOptions);
      });
    
      it("should update 20 elements for 97,034 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 97034, sortedOptions);
      });
  
      it("should update 100 elements for 291,641 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 291641, sortedOptions);
      });
    
      it("should use and update 2 elements for 47,703 gas.", () => {
        return testUseAndUpdateMany([0, 1], 47703, sortedOptions);
      });
    
      it("should use and update 3 elements for 49,969 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 49969, sortedOptions);
      });
    
      it("should use and update 4 elements for 50,953 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 50953, sortedOptions);
      });
    
      it("should use and update 8 elements for 67,414 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 67414, sortedOptions);
      });
    
      it("should use and update 20 elements for 94,921 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 94921, sortedOptions);
      });
  
      it("should use and update 100 elements for 278,286 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 278286, sortedOptions);
      });
    
      it("should append 1 new element for 34,573 gas.", async () => {
        return testAppendOne('22', 34573, sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 3,448,812 gas.", () => {
        return testAppendOneConsecutively(100, '22', 3448812, sortedOptions);
      });
    
      it(`should append 2 new elements, for 40,686 gas.`, async () => {
        return testAppendMany(2, '22', 40686, sortedOptions);
      });
    
      it(`should append 3 new elements, for 41,836 gas.`, async () => {
        return testAppendMany(3, '22', 41836, sortedOptions);
      });
    
      it(`should append 4 new elements, for 42,971 gas.`, async () => {
        return testAppendMany(4, '22', 42971, sortedOptions);
      });
    
      it(`should append 8 new elements, for 47,827 gas.`, async () => {
        return testAppendMany(8, '22', 47827, sortedOptions);
      });
    
      it(`should append 20 new elements, for 62,855 gas.`, async () => {
        return testAppendMany(20, '22', 62855, sortedOptions);
      });
  
      it(`should append 100 new elements, for 164,624 gas.`, async () => {
        return testAppendMany(100, '22', 164624, sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 3,984,304 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 3984304, sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 4,175,026 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 4175026, sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 4,175,591 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 4175591, sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 4,645,605 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 4645605, sortedOptions);
      });
    
      it("should use, update, and append 2 new elements for 70,968 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1999], 70968, sortedOptions);
      });
    
      it("should use, update, and append 3 new elements for 72,677 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 1999], 72677, sortedOptions);
      });
    
      it("should use, update, and append 4 new elements for 75,776 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 1999], 75776, sortedOptions);
      });
    
      it("should use, update, and append 8 new elements for 84,461 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 84461, sortedOptions);
      });
    
      it("should use, update, and append 20 new elements for 123,159 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 123159, sortedOptions);
      });
  
      it("should use, update, and append 100 new elements for 383,136 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 383136, sortedOptions);
      });

      it("should verify size.", () => {
        return testVerifySize(null, unsortedOptions);
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
    
      it("should use 1 element for 31,747 gas.", () => {
        return testUseOne(0, 31747, unsortedOptions);
      });
    
      it("should update 1 element for 37,696 gas.", () => {
        return testUpdateOne(0, '11', 37696, unsortedOptions);
      });
    
      it("should use and update 1 element for 38,490 gas.", () => {
        return testUseAndUpdateOne(0, 38490, unsortedOptions);
      });
    
      it("should use 2 elements for 35,678 gas.", () => {
        return testUseMany([0, 1], 35678, unsortedOptions);
      });
    
      it("should use 3 elements for 37,187 gas.", () => {
        return testUseMany([0, 1, 2], 37187, unsortedOptions);
      });
    
      it("should use 4 elements for 37,668 gas.", () => {
        return testUseMany([0, 1, 2, 3], 37668, unsortedOptions);
      });
    
      it("should use 8 elements for 45,629 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 45629, unsortedOptions);
      });
    
      it("should use 20 elements for 66m925 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 66925, unsortedOptions);
      });
  
      it("should use 100 elements for 184,763 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), 184763, unsortedOptions);
      });
    
      it("should update 2 elements for 43,406 gas.", () => {
        return testUpdateMany([0, 1], '11', 43406, unsortedOptions);
      });
    
      it("should update 3 elements for 45,800 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 45800, unsortedOptions);
      });
    
      it("should update 4 elements for 46,936 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 46936, unsortedOptions);
      });
    
      it("should update 8 elements for 59,046 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 59046, unsortedOptions);
      });
    
      it("should update 20 elements for 91,626 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 91626, unsortedOptions);
      });
  
      it("should update 100 elements for 279,737 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 279737, unsortedOptions);
      });
    
      it("should use and update 2 elements for 43,760 gas.", () => {
        return testUseAndUpdateMany([0, 1], 43760, unsortedOptions);
      });
    
      it("should use and update 3 elements for 46,014 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 46014, unsortedOptions);
      });
    
      it("should use and update 4 elements for 47,020 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 47020, unsortedOptions);
      });
    
      it("should use and update 8 elements for 58,578 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 58578, unsortedOptions);
      });
    
      it("should use and update 20 elements for 89,502 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 89502, unsortedOptions);
      });
  
      it("should use and update 100 elements for 266,419 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 266419, unsortedOptions);
      });
    
      it("should append 1 new element for 31,538 gas.", async () => {
        return testAppendOne('22', 31538, unsortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 3,277,832 gas.", () => {
        return testAppendOneConsecutively(100, '22', 3277832, unsortedOptions);
      });
    
      it(`should append 2 new elements, for 36,510 gas.`, async () => {
        return testAppendMany(2, '22', 36510, unsortedOptions);
      });
    
      it(`should append 3 new elements, for 37,608 gas.`, async () => {
        return testAppendMany(3, '22', 37608, unsortedOptions);
      });
    
      it(`should append 4 new elements, for 38,715 gas.`, async () => {
        return testAppendMany(4, '22', 38715, unsortedOptions);
      });
    
      it(`should append 8 new elements, for 43,375 gas.`, async () => {
        return testAppendMany(8, '22', 43375, unsortedOptions);
      });
    
      it(`should append 20 new elements, for 57,896 gas.`, async () => {
        return testAppendMany(20, '22', 57896, unsortedOptions);
      });
  
      it(`should append 100 new elements, for 155,715 gas.`, async () => {
        return testAppendMany(100, '22', 155715, unsortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 3,775,940 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 3775940, unsortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 3,974,298 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 3974298, unsortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 3,979,301 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 3979301, unsortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 4,454,222 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 4454222, unsortedOptions);
      });
    
      it("should use, update, and append 2 new elements for 58,414 gas.", () => {
        return testUseUpdateAndAppendMany([0, 199], 58414, unsortedOptions);
      });
    
      it("should use, update, and append 3 new elements for 60,107 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 199], 60107, unsortedOptions);
      });
    
      it("should use, update, and append 4 new elements for 63,172 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 199], 63172, unsortedOptions);
      });
    
      it("should use, update, and append 8 new elements for 71,536 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 71536, unsortedOptions);
      });
    
      it("should use, update, and append 20 new elements for 113,619 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 113619, unsortedOptions);
      });
  
      it("should use, update, and append 100 new elements for 363,928 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 363928, unsortedOptions);
      });

      it("should get indices for 2 elements.", () => {
        return testGetIndices([0, 1], null, unsortedOptions);
      });
  
      it("should get indices for 5 elements.", () => {
        return testGetIndices([2, 7, 8, 15, 19], null, unsortedOptions);
      });
  
      it("should verify size.", () => {
        return testVerifySize(null, unsortedOptions);
      });
    });

    describe("Starting empty", async accounts => {
      beforeEach(async () => {
        contractInstance = await Merkle_Storage_Using_Lib.new();
        elementCount = 0;
      });
    
      it("should initialize a 4-element root for 47,873 gas.", () => {
        return testAppendFromEmpty(4, 'ff', 47873, unsortedOptions);
      });
    });
  });
});
