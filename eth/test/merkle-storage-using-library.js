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
    
      it("should use 1 element for 29,402 gas.", () => {
        return testUseOne(0, 29402, sortedOptions);
      });
    
      it("should update 1 element for 34,870 gas.", () => {
        return testUpdateOne(0, '11', 34870, sortedOptions);
      });
    
      it("should use and update 1 element for 35,713 gas.", () => {
        return testUseAndUpdateOne(0, 35713, sortedOptions);
      });
    
      it("should use 2 elements for 32,514 gas.", () => {
        return testUseMany([0, 1], 32514, sortedOptions);
      });
    
      it("should use 3 elements for 34,040 gas.", () => {
        return testUseMany([0, 1, 2], 34040, sortedOptions);
      });
    
      it("should use 4 elements for 34,549 gas.", () => {
        return testUseMany([0, 1, 2, 3], 34549, sortedOptions);
      });
    
      it("should use 8 elements for 40,309 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 40309, sortedOptions);
      });
    
      it("should use 20 elements for 56,803 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 56803, sortedOptions);
      });
    
      it("should update 2 elements for 39,664 gas.", () => {
        return testUpdateMany([0, 1], '11', 39664, sortedOptions);
      });
    
      it("should update 3 elements for 42,110 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 42110, sortedOptions);
      });
    
      it("should update 4 elements for 43,261 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 43261, sortedOptions);
      });
    
      it("should update 8 elements for 52,652 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 52652, sortedOptions);
      });
    
      it("should update 20 elements for 79,591 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 79591, sortedOptions);
      });
    
      it("should use and update 2 elements for 40,073 gas.", () => {
        return testUseAndUpdateMany([0, 1], 40511, sortedOptions);
      });
    
      it("should use and update 3 elements for 42,406 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 42406, sortedOptions);
      });
    
      it("should use and update 4 elements for 43,456 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 43456, sortedOptions);
      });
    
      it("should use and update 8 elements for 52,384 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 52384, sortedOptions);
      });
    
      it("should use and update 20 elements for 77,954 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 77954, sortedOptions);
      });
    
      it("should append 1 new element for 30,899 gas.", async () => {
        return testAppendOne('22', 30899, sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 3,238,644 gas.", () => {
        return testAppendOneConsecutively(100, '22', 3238644, sortedOptions);
      });
    
      it(`should append 2 new elements, for 34,763 gas.`, async () => {
        return testAppendMany(2, '22', 34763, sortedOptions);
      });
    
      it(`should append 3 new elements, for 35,915 gas.`, async () => {
        return testAppendMany(3, '22', 35915, sortedOptions);
      });
    
      it(`should append 4 new elements, for 37,064 gas.`, async () => {
        return testAppendMany(4, '22', 37064, sortedOptions);
      });
    
      it(`should append 8 new elements, for 42,090 gas.`, async () => {
        return testAppendMany(8, '22', 42090, sortedOptions);
      });
    
      it(`should append 20 new elements, for 57,640 gas.`, async () => {
        return testAppendMany(20, '22', 57640, sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 3,683,860 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 3683860, sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 3,901,542 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 3901542, sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 3,932,108 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 3932108, sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 4,563,952 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 4563952, sortedOptions);
      });
    
      it("should use, update, and append 2 new elements for 49,643 gas.", () => {
        return testUseUpdateAndAppendMany([0, 19], 49643, sortedOptions);
      });
    
      it("should use, update, and append 3 new elements for 51,460 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 19], 51460, sortedOptions);
      });
    
      it("should use, update, and append 4 new elements for 54,654 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 19], 54654, sortedOptions);
      });
    
      it("should use, update, and append 8 new elements for 63,728 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 63728, sortedOptions);
      });
    
      it("should use, update, and append 20 new elements for 101,087 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 101087, sortedOptions);
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
    
      it("should use 1 element for 31,895 gas.", () => {
        return testUseOne(0, 31895, sortedOptions);
      });
    
      it("should update 1 element for 37,873 gas.", () => {
        return testUpdateOne(0, '11', 37873, sortedOptions);
      });
    
      it("should use and update 1 element for 38,716 gas.", () => {
        return testUseAndUpdateOne(0, 38716, sortedOptions);
      });
    
      it("should use 2 elements for 35,675 gas.", () => {
        return testUseMany([0, 1], 35675, sortedOptions);
      });
    
      it("should use 3 elements for 37,212 gas.", () => {
        return testUseMany([0, 1, 2], 37212, sortedOptions);
      });
    
      it("should use 4 elements for 37,721 gas.", () => {
        return testUseMany([0, 1, 2, 3], 37721, sortedOptions);
      });
    
      it("should use 8 elements for 45,839 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 45839, sortedOptions);
      });
    
      it("should use 20 elements for 67,675 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 67675, sortedOptions);
      });
  
      it("should use 100 elements for 188,945 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), 188945, sortedOptions);
      });
    
      it("should update 2 elements for 43,527 gas.", () => {
        return testUpdateMany([0, 1], '11', 43527, sortedOptions);
      });
    
      it("should update 3 elements for 45,983 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 45983, sortedOptions);
      });
    
      it("should update 4 elements for 47,135 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 47135, sortedOptions);
      });
    
      it("should update 8 elements for 59,446 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 59446, sortedOptions);
      });
    
      it("should update 20 elements for 92,866 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 92866, sortedOptions);
      });
  
      it("should update 100 elements for 285,807 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 285807, sortedOptions);
      });
    
      it("should use and update 2 elements for 43,936 gas.", () => {
        return testUseAndUpdateMany([0, 1], 43936, sortedOptions);
      });
    
      it("should use and update 3 elements for 46,279 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 46279, sortedOptions);
      });
    
      it("should use and update 4 elements for 47,330 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 47330, sortedOptions);
      });
    
      it("should use and update 8 elements for 59,202 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 59202, sortedOptions);
      });
    
      it("should use and update 20 elements for 91,266 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 91266, sortedOptions);
      });
  
      it("should use and update 100 elements for 275,299 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 275299, sortedOptions);
      });
    
      it("should append 1 new element for 31,828 gas.", async () => {
        return testAppendOne('22', 31828, sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 3,319,848 gas.", () => {
        return testAppendOneConsecutively(100, '22', 3319848, sortedOptions);
      });
    
      it(`should append 2 new elements, for 36,743 gas.`, async () => {
        return testAppendMany(2, '22', 36743, sortedOptions);
      });
    
      it(`should append 3 new elements, for 37,883 gas.`, async () => {
        return testAppendMany(3, '22', 37883, sortedOptions);
      });
    
      it(`should append 4 new elements, for 39,044 gas.`, async () => {
        return testAppendMany(4, '22', 39044, sortedOptions);
      });
    
      it(`should append 8 new elements, for 43,956 gas.`, async () => {
        return testAppendMany(8, '22', 43956, sortedOptions);
      });
    
      it(`should append 20 new elements, for 59,185 gas.`, async () => {
        return testAppendMany(20, '22', 59185, sortedOptions);
      });
  
      it(`should append 100 new elements, for 161,732 gas.`, async () => {
        return testAppendMany(100, '22', 161732, sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 3,808,052 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 3808052, sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 4,020,150 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 4020150, sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 4,019,625 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 4019625, sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 4,518,610 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 4518610, sortedOptions);
      });
    
      it("should use, update, and append 2 new elements for 58,737 gas.", () => {
        return testUseUpdateAndAppendMany([0, 199], 58737, sortedOptions);
      });
    
      it("should use, update, and append 3 new elements for 60,542 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 199], 60542, sortedOptions);
      });
    
      it("should use, update, and append 4 new elements for 63,774 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 199], 63774, sortedOptions);
      });
    
      it("should use, update, and append 8 new elements for 72,684 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 72684, sortedOptions);
      });
    
      it("should use, update, and append 20 new elements for 116,570 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 116570, sortedOptions);
      });
  
      it("should use, update, and append 100 new elements for 378,820 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 378820, sortedOptions);
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
    
      it("should use 1 element for 34,400 gas.", () => {
        return testUseOne(0, 34400, sortedOptions);
      });
    
      it("should update 1 element for 40,876 gas.", () => {
        return testUpdateOne(0, '11', 40876, sortedOptions);
      });
    
      it("should use and update 1 element for 41,707 gas.", () => {
        return testUseAndUpdateOne(0, 41707, sortedOptions);
      });
    
      it("should use 2 elements for 38,857 gas.", () => {
        return testUseMany([0, 1], 38857, sortedOptions);
      });
    
      it("should use 3 elements for 40,383 gas.", () => {
        return testUseMany([0, 1, 2], 40383, sortedOptions);
      });
    
      it("should use 4 elements for 40,882 gas.", () => {
        return testUseMany([0, 1, 2, 3], 40882, sortedOptions);
      });
    
      it("should use 8 elements for 52,959 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseMany(firstHalf.concat(secondHalf), 52959, sortedOptions);
      });
    
      it("should use 20 elements for 71,624 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseMany(firstHalf.concat(secondHalf), 71624, sortedOptions);
      });
  
      it("should use 100 elements for 196,010 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseMany(firstHalf.concat(secondHalf), 196010, sortedOptions);
      });
    
      it("should update 2 elements for 47,422 gas.", () => {
        return testUpdateMany([0, 1], '11', 47422, sortedOptions);
      });
    
      it("should update 3 elements for 49,857 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 49857, sortedOptions);
      });
    
      it("should update 4 elements for 51,022 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 51022, sortedOptions);
      });
    
      it("should update 8 elements for 68,111 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 68111, sortedOptions);
      });
    
      it("should update 20 elements for 97,622 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 97622, sortedOptions);
      });
  
      it("should update 100 elements for 294,469 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 294469, sortedOptions);
      });
    
      it("should use and update 2 elements for 47,843 gas.", () => {
        return testUseAndUpdateMany([0, 1], 47843, sortedOptions);
      });
    
      it("should use and update 3 elements for 50,165 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2], 50165, sortedOptions);
      });
    
      it("should use and update 4 elements for 51,205 gas.", () => {
        return testUseAndUpdateMany([0, 1, 2, 3], 51205, sortedOptions);
      });
    
      it("should use and update 8 elements for 67,890 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 67890, sortedOptions);
      });
    
      it("should use and update 20 elements for 96,069 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 96069, sortedOptions);
      });
  
      it("should use and update 100 elements for 283,914 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseAndUpdateMany(firstHalf.concat(secondHalf), 283914, sortedOptions);
      });
    
      it("should append 1 new element for 34,615 gas.", async () => {
        return testAppendOne('22', 34615, sortedOptions);
      });
    
      it.skip("should append 1 new element, 100 times consecutively, for 3,453,012 gas.", () => {
        return testAppendOneConsecutively(100, '22', 3453012, sortedOptions);
      });
    
      it(`should append 2 new elements, for 40,631 gas.`, async () => {
        return testAppendMany(2, '22', 40631, sortedOptions);
      });
    
      it(`should append 3 new elements, for 41,795 gas.`, async () => {
        return testAppendMany(3, '22', 41795, sortedOptions);
      });
    
      it(`should append 4 new elements, for 42,944 gas.`, async () => {
        return testAppendMany(4, '22', 42944, sortedOptions);
      });
    
      it(`should append 8 new elements, for 47,856 gas.`, async () => {
        return testAppendMany(8, '22', 47856, sortedOptions);
      });
    
      it(`should append 20 new elements, for 63,052 gas.`, async () => {
        return testAppendMany(20, '22', 63052, sortedOptions);
      });
  
      it(`should append 100 new elements, for 165,941 gas.`, async () => {
        return testAppendMany(100, '22', 165941, sortedOptions);
      });
    
      it.skip("should append 2 new elements, 100 times consecutively, for 3,978,804 gas.", () => {
        return testAppendManyConsecutively(100, 2, '22', 3978804, sortedOptions);
      });
    
      it.skip("should append 3 new elements, 100 times consecutively, for 4,170,926 gas.", () => {
        return testAppendManyConsecutively(100, 3, '22', 4170926, sortedOptions);
      });
    
      it.skip("should append 4 new elements, 100 times consecutively, for 4,172,891 gas.", () => {
        return testAppendManyConsecutively(100, 4, '22', 4172891, sortedOptions);
      });
    
      it.skip("should append 8 new elements, 100 times consecutively, for 4,648,505 gas.", () => {
        return testAppendManyConsecutively(100, 8, '22', 4648505, sortedOptions);
      });
    
      it("should use, update, and append 2 new elements for 71,164 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1999], 71164, sortedOptions);
      });
    
      it("should use, update, and append 3 new elements for 72,957 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 1999], 72957, sortedOptions);
      });
    
      it("should use, update, and append 4 new elements for 76,140 gas.", () => {
        return testUseUpdateAndAppendMany([0, 1, 2, 1999], 76140, sortedOptions);
      });
    
      it("should use, update, and append 8 new elements for 85,161 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 85161, sortedOptions);
      });
    
      it("should use, update, and append 20 new elements for 124,867 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 124867, sortedOptions);
      });
  
      it("should use, update, and append 100 new elements for 391,564 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUseUpdateAndAppendMany(firstHalf.concat(secondHalf), 391564, sortedOptions);
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
    
      it("should use 1 element for 31,769 gas.", () => {
        return testUseOne(0, 31769, unsortedOptions);
      });
    
      it("should update 1 element for 37,651 gas.", () => {
        return testUpdateOne(0, '11', 37651, unsortedOptions);
      });
    
      it("should use and update 1 element for 38,512 gas.", () => {
        return testUseAndUpdateOne(0, 38512, unsortedOptions);
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
    
      it("should update 2 elements for 43,361 gas.", () => {
        return testUpdateMany([0, 1], '11', 43361, unsortedOptions);
      });
    
      it("should update 3 elements for 45,755 gas.", () => {
        return testUpdateMany([0, 1, 2], '11', 45755, unsortedOptions);
      });
    
      it("should update 4 elements for 46,891 gas.", () => {
        return testUpdateMany([0, 1, 2, 3], '11', 46891, unsortedOptions);
      });
    
      it("should update 8 elements for 59,001 gas.", () => {
        const firstHalf = Array.from(Array(4).keys());
        const secondHalf = Array.from(Array(4).keys()).map(i => elementCount - 4 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 59001, unsortedOptions);
      });
    
      it("should update 20 elements for 91,581 gas.", () => {
        const firstHalf = Array.from(Array(10).keys());
        const secondHalf = Array.from(Array(10).keys()).map(i => elementCount - 10 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 91581, unsortedOptions);
      });
  
      it("should update 100 elements for 279,692 gas.", () => {
        const firstHalf = Array.from(Array(50).keys());
        const secondHalf = Array.from(Array(50).keys()).map(i => elementCount - 50 + i);
        return testUpdateMany(firstHalf.concat(secondHalf), '11', 279692, unsortedOptions);
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
    
      it("should append 1 new element, 100 times consecutively, for 3,277,832 gas.", () => {
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
