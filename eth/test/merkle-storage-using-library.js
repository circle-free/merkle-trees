const chai = require('chai');
const { expect } = chai;

const { generateElements, randomNumberGenerator } = require('./helpers');
const MerkleTree = require('../../js');

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
  const { elementCount, element, decommitments } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.use_one(elementCount, index, hexElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, expectedGas, options) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.updateSingle(index, newElement, options);
  const { elementCount, element, decommitments } = proof;
  const hexElement = '0x' + element.toString('hex');
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.update_one(elementCount, index, hexElement, hexNewElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testUseAndUpdateOne = async (index, expectedGas, options) => {
  const { elementCount, element, decommitments } = merkleTree.generateSingleProof(index);
  const hexElement = '0x' + element.toString('hex');
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_one(elementCount, index, hexElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseMany = async (indices, expectedGas, options) => {
  const { elementCount, elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many(elementCount, hexElements, hexCompactProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, expectedGas, options) => {
  const newElements = generateElements(indices.length, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { newMerkleTree, proof } = merkleTree.updateMulti(indices, newElements, options);
  const { elementCount, elements, compactProof } = proof;
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_many(elementCount, hexElements, hexNewElements, hexCompactProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

  merkleTree = newMerkleTree;
};

const testUseAndUpdateMany = async (indices, expectedGas, options) => {
  const { elementCount, elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_many(elementCount, hexElements, hexCompactProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOne = async (seed, expectedGas, options) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { newMerkleTree, proof } = merkleTree.appendSingle(newElement, options);
  const { elementCount, decommitments } = proof;
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.append_one(elementCount, hexNewElement, hexDecommitments);

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
    const { elementCount, decommitments } = proof;
    merkleTree = newMerkleTree;
    const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
    const { receipt } = await contractInstance.append_one(elementCount, hexNewElement, hexDecommitments);
    
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
  const { elementCount, decommitments } = proof;
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.append_many(elementCount, hexNewElements, hexDecommitments);

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
    const { elementCount, decommitments } = proof;
    merkleTree = newMerkleTree;
    const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
    const { receipt } = await contractInstance.append_many(elementCount, hexNewElements, hexDecommitments);
    cumulativeGasUsed = cumulativeGasUsed + receipt.gasUsed;
  }

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendMany = async (indices, expectedGas, options) => {
  const { elementCount, elements, compactProof } = merkleTree.generateCombinedProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_and_append_many(elementCount, hexElements, hexCompactProof);

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
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const results = await contractInstance.verify_indices(hexElements, hexCompactProof);

  expect(results.map(index => index.toNumber())).to.deep.equal(indices);
};

describe.only("Merkle_Storage_Using_Libraries", async accounts => {
  describe("Merkle_Storage_Using_Sorted_Hash_Lib", async accounts => {
    describe("Starting with 20 elements", async accounts => {
      beforeEach(async () => {
        contractInstance = await Merkle_Storage_Using_Sorted_Hash_Lib.new();
        const elements = generateElements(20, { seed: 'ff' });
        merkleTree = new MerkleTree(elements, sortedOptions);
        await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
        elementCount = 20;
      });
    
      it("should use 1 element for 29,491 gas.", () => {
        return testUseOne(0, 29491);
      });
    
      it("should update 1 element for 35,288 gas.", () => {
        return testUpdateOne(0, '11', 35288);
      });
    
      it("should use and update 1 element for 36,139 gas.", () => {
        return testUseAndUpdateOne(0, 36139);
      });
    
      it("should use 2 elements for 33,194 gas.", () => {
        return testUseMany([0, 1], 33194);
      });
    
      it("should use 3 elements for 34,871 gas.", () => {
        return testUseMany([0, 1, 2], 34871);
      });
    
      it("should use 4 elements for 35,380 gas.", () => {
        return testUseMany([0, 1, 2, 3], 35380);
      });
    
      it("should use 8 elements for 41,766 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 41766);
      });
    
      it("should use 20 elements for 59,711 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 59711);
      });
    
      it("should update 2 elements for 40,636 gas.", () => {
        return testUpdateMany([0, 1], '11', 40636);
      });
    
      it("should update 3 elements for 43,230 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 43230);
      });
    
      it("should update 4 elements for 44,373 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 44373);
      });
    
      it("should update 8 elements for 54,370 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 54370);
      });
    
      it("should update 20 elements for 82,773 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 82773);
      });
    
      it("should use and update 2 elements for 41,068 gas.", () => {
        return testUseAndUpdateMany([0, 1], 41068);
      });
    
      it("should use and update 3 elements for 43,548 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 43548);
      });
    
      it("should use and update 4 elements for 44,578 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 44578);
      });
    
      it("should use and update 8 elements for 54,169 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 54169);
      });
    
      it.only("should use and update 20 elements for 81,273 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 81273);
      });
    
      it("should append 1 new element for 30,948 gas.", async () => {
        return testAppendOne('22', 30948);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 4,205,744 gas.", () => {
        return testAppendOneConsecutively(100, '22', 4205744);
      });
    
      it(`should append 2 new elements, for 34,825 gas.`, async () => {
        return testAppendMany(2, '22', 34825);
      });
    
      it(`should append 3 new elements, for 36,030 gas.`, async () => {
        return testAppendMany(3, '22', 36030);
      });
    
      it(`should append 4 new elements, for 37,255 gas.`, async () => {
        return testAppendMany(4, '22', 37255);
      });
    
      it(`should append 8 new elements, for 42,424 gas.`, async () => {
        return testAppendMany(8, '22', 42424);
      });
    
      it(`should append 20 new elements, for 58,506 gas.`, async () => {
        return testAppendMany(20, '22', 58506);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 6,349,688 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 6349688);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 8,420,984 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 8420984);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 10,492,256 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 10492256);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 18,776,792 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 18776792);
      });
    
      it("should use, update, and append 2 new elements for 51,119 gas.", () => {
        return testUseUpdateAndAppendMany([0, 19], 51119);
      });
    
      it("should use, update, and append 3 new elements for 52,966 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 19], 52966);
      });
    
      it("should use, update, and append 4 new elements for 56,371 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 19], 56371);
      });
    
      it("should use, update, and append 8 new elements for 65,722 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 65722);
      });
    
      it("should use, update, and append 20 new elements for 104,963 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 104963);
      });
    
      it.skip("should use, update, and append 2 elements, 100 times consecutively, for 7,645,388 gas.", () => {
        return testUseUpdateAndAppendManyConsecutively(100, 33, 2, 7645388);
      });
    
      it.skip("should use, update, and append 8 elements, 100 times consecutively, for 23,643,980 gas.", () => {
        return testUseUpdateAndAppendManyConsecutively(100, 33, 8, 23643980);
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
    
      it("should use 1 element for 32,097 gas.", () => {
        return testUseOne(0, 32097);
      });
    
      it("should update 1 element for 38,610 gas.", () => {
        return testUpdateOne(0, '11', 38610);
      });
    
      it("should use and update 1 element for 39,461 gas.", () => {
        return testUseAndUpdateOne(0, 39461);
      });
    
      it("should use 2 elements for 36,785 gas.", () => {
        return testUseMany([0, 1], 36785);
      });
    
      it("should use 3 elements for 38,473 gas.", () => {
        return testUseMany([0, 1, 2], 38473);
      });
    
      it("should use 4 elements for 38,982 gas.", () => {
        return testUseMany([0, 1, 2, 3], 38982);
      });
    
      it("should use 8 elements for 48,126 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 48126);
      });
    
      it("should use 20 elements for 72,008 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 72008);
      });
  
      it("should use 100 elements for 204,053 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), 204053);
      });
    
      it("should update 2 elements for 45,162 gas.", () => {
        return testUpdateMany([0, 1], '11', 45162);
      });
    
      it("should update 3 elements for 47,765 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 47765);
      });
    
      it("should update 4 elements for 48,909 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 48909);
      });
    
      it("should update 8 elements for 62,431 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 62431);
      });
    
      it("should update 20 elements for 98,358 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 98358);
      });
  
      it("should update 100 elements for 304,166 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 304166);
      });
    
      it("should use and update 2 elements for 45,593 gas.", () => {
        return testUseAndUpdateMany([0, 1], 45593);
      });
    
      it("should use and update 3 elements for 48,083 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 48083);
      });
    
      it("should use and update 4 elements for 49,114 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 49114);
      });
    
      it("should use and update 8 elements for 62,208 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 62208);
      });
    
      it("should use and update 20 elements for 96,824 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 96824);
      });
  
      it("should use and update 100 elements for 293,634 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 293634);
      });
    
      it("should append 1 new element for 31,995 gas.", async () => {
        return testAppendOne('22', 31995);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 4,205,744 gas.", () => {
        return testAppendOneConsecutively(100, '22', 4205744);
      });
    
      it(`should append 2 new elements, for 36,869 gas.`, async () => {
        return testAppendMany(2, '22', 36869);
      });
    
      it(`should append 3 new elements, for 38,085 gas.`, async () => {
        return testAppendMany(3, '22', 38085);
      });
    
      it(`should append 4 new elements, for 39,299 gas.`, async () => {
        return testAppendMany(4, '22', 39299);
      });
    
      it(`should append 8 new elements, for 44,354 gas.`, async () => {
        return testAppendMany(8, '22', 44354);
      });
    
      it(`should append 20 new elements, for 60,091 gas.`, async () => {
        return testAppendMany(20, '22', 60091);
      });
  
      it(`should append 100 new elements, for 166,097 gas.`, async () => {
        return testAppendMany(100, '22', 166097);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 6,349,688 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 6349688);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 8,420,984 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 8420984);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 10,492,256 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 10492256);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 18,776,792 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 18776792);
      });
    
      it("should use, update, and append 2 new elements for 61,371 gas.", () => {
        return testUseUpdateAndAppendMany([0, 199], 61371);
      });
    
      it("should use, update, and append 3 new elements for 63,229 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 199], 63229);
      });
    
      it("should use, update, and append 4 new elements for 66,626 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 199], 66626);
      });
    
      it("should use, update, and append 8 new elements for 75,837 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 75837);
      });
    
      it("should use, update, and append 20 new elements for 122,532 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 122532);
      });
  
      it("should use, update, and append 100 new elements for 399,896 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 399896);
      });
    
      it.skip("should use, update, and append 2 elements, 100 times consecutively, for 7,645,388 gas.", () => {
        return testUseUpdateAndAppendManyConsecutively(100, 33, 2, 7645388);
      });
    
      it.skip("should use, update, and append 8 elements, 100 times consecutively, for 23,643,980 gas.", () => {
        return testUseUpdateAndAppendManyConsecutively(100, 33, 8, 23643980);
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
    
      it("should use 1 element for 34,715 gas.", () => {
        return testUseOne(0, 34715);
      });
    
      it("should update 1 element for 41,955 gas.", () => {
        return testUpdateOne(0, '11', 41955);
      });
    
      it("should use and update 1 element for 42,817 gas.", () => {
        return testUseAndUpdateOne(0, 42817);
      });
    
      it("should use 2 elements for 40,397 gas.", () => {
        return testUseMany([0, 1], 40397);
      });
    
      it("should use 3 elements for 42,074 gas.", () => {
        return testUseMany([0, 1, 2], 42074);
      });
    
      it("should use 4 elements for 42,573 gas.", () => {
        return testUseMany([0, 1, 2, 3], 42573);
      });
    
      it("should use 8 elements for 56,113 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 56113);
      });
    
      it("should use 20 elements for 76,463 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 76463);
      });
  
      it("should use 100 elements for 212,078 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), 212078);
      });
    
      it("should update 2 elements for 49,696 gas.", () => {
        return testUpdateMany([0, 1], '11', 49696);
      });
    
      it("should update 3 elements for 52,301 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 52301);
      });
    
      it("should update 4 elements for 53,412 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 53412);
      });
    
      it("should update 8 elements for 72,454 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 72454);
      });
    
      it("should update 20 elements for 103,948 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 103948);
      });
  
      it("should update 100 elements for 314,187 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 314187);
      });
    
      it("should use and update 2 elements for 50,116 gas.", () => {
        return testUseAndUpdateMany([0, 1], 50116);
      });
    
      it("should use and update 3 elements for 52,608 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 52608);
      });
    
      it("should use and update 4 elements for 53,628 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 53628);
      });
    
      it("should use and update 8 elements for 72,209 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 72209);
      });
    
      it("should use and update 20 elements for 102,370 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 102370);
      });
  
      it("should use and update 100 elements for 303,698 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 303698);
      });
    
      it("should append 1 new element for 35,159 gas.", async () => {
        return testAppendOne('22', 35159);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 4,205,744 gas.", () => {
        return testAppendOneConsecutively(100, '22', 4205744);
      });
    
      it(`should append 2 new elements, for 41,064 gas.`, async () => {
        return testAppendMany(2, '22', 41064);
      });
    
      it(`should append 3 new elements, for 42,258 gas.`, async () => {
        return testAppendMany(3, '22', 42258);
      });
    
      it(`should append 4 new elements, for 43,483 gas.`, async () => {
        return testAppendMany(4, '22', 43483);
      });
    
      it(`should append 8 new elements, for 48,538 gas.`, async () => {
        return testAppendMany(8, '22', 48538);
      });
    
      it(`should append 20 new elements, for 64,289 gas.`, async () => {
        return testAppendMany(20, '22', 64289);
      });
  
      it(`should append 100 new elements, for 170,658 gas.`, async () => {
        return testAppendMany(100, '22', 170658);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 6,349,688 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 6349688);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 8,420,984 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 8420984);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 10,492,256 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 10492256);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 18,776,792 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 18776792);
      });
    
      it("should use, update, and append 2 new elements for 75,340 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1999], 75340);
      });
    
      it("should use, update, and append 3 new elements for 77,209 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 1999], 77209);
      });
    
      it("should use, update, and append 4 new elements for 80,625 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 1999], 80625);
      });
    
      it("should use, update, and append 8 new elements for 89,786 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 89786);
      });
    
      it("should use, update, and append 20 new elements for 131,873 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 131873);
      });
  
      it("should use, update, and append 100 new elements for 414,274 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 414274);
      });
    
      it.skip("should use, update, and append 2 elements, 100 times consecutively, for 7,645,388 gas.", () => {
        return testUseUpdateAndAppendManyConsecutively(100, 33, 2, 7645388);
      });
    
      it.skip("should use, update, and append 8 elements, 100 times consecutively, for 23,643,980 gas.", () => {
        return testUseUpdateAndAppendManyConsecutively(100, 33, 8, 23643980);
      });
    });
  });

  describe("Merkle_Storage_Using_Lib", async accounts => {
    before(async () => {
      contractInstance = await Merkle_Storage_Using_Lib.new();
      const elements = generateElements(20, { seed: 'ff' });
      merkleTree = new MerkleTree(elements, unsortedOptions);
      await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
    });
  
    it("should get indices for 2 elements for 30,000 gas.", () => {
      return testGetIndices([0, 1], 30000, unsortedOptions);
    });

    it("should get indices for 2 elements for 30,000 gas.", () => {
      return testGetIndices([2, 7, 8, 15, 19], 30000, unsortedOptions);
    });
  });
});
