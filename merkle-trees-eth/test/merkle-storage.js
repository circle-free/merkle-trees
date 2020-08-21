const chai = require('chai');
const { expect } = chai;

const { generateElements, randomNumberGenerator } = require('./helpers');
const MerkleTree = require('../../merkle-trees-js/src');

const Merkle_Storage = artifacts.require("Merkle_Storage");

const options = {
  unbalanced: true,
  sortedHash: true,
  elementPrefix: '0000000000000000000000000000000000000000000000000000000000000000',
  indexed: false,
  bitFlags: true,
};

let contractInstance = null;
let merkleTree = null

const testUseOne = async (index, expectedGas) => {
  const { elementCount, element, decommitments } = merkleTree.generateSingleProof(index);
  const hexElement = '0x' + element.toString('hex');
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.use_one(elementCount, index, hexElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, expectedGas) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { elementCount, element, decommitments } = merkleTree.generateSingleUpdateProof(index, newElement);
  const hexElement = '0x' + element.toString('hex');
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.update_one(elementCount, index, hexElement, hexNewElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);

  merkleTree = merkleTree.updateSingle(index, newElement);
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseAndUpdateOne = async (index, expectedGas) => {
  const { elementCount, element, decommitments } = merkleTree.generateSingleProof(index);
  const hexElement = '0x' + element.toString('hex');
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_one(elementCount, index, hexElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseMany = async (indices, expectedGas) => {
  const { elementCount, elements, proof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = proof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many(elementCount, hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, expectedGas) => {
  const newElements = generateElements(indices.length, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { elementCount, elements, proof } = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = proof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.update_many(elementCount, hexElements, hexNewElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  merkleTree = merkleTree.updateMulti(indices, newElements);
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseAndUpdateMany = async (indices, expectedGas) => {
  const { elementCount, elements, proof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = proof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_many(elementCount, hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOne = async (seed, expectedGas) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { elementCount, decommitments } = merkleTree.generateSingleAppendProof(newElement);
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.append_one(elementCount, hexNewElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  merkleTree = merkleTree.appendSingle(newElement);
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOneConsecutively = async (iterations, seed, expectedGas) => {
  const newElements = generateElements(iterations, { seed });

  const cumulativeGasUsed = await newElements.reduce(async (cGasUsed, newElement) => {
    const cumulativeGasUsed = await cGasUsed;
    const hexNewElement = '0x' + newElement.toString('hex');
    const { elementCount, decommitments } = merkleTree.generateSingleAppendProof(newElement);
    const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
    const { receipt } = await contractInstance.append_one(elementCount, hexNewElement, hexDecommitments);
    merkleTree = merkleTree.appendSingle(newElement);
    
    return cumulativeGasUsed + receipt.gasUsed;
  }, 0);

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendMany = async (appendSize, seed, expectedGas) => {
  const newElements = generateElements(appendSize, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { elementCount, decommitments } = merkleTree.generateMultiAppendProof(newElements);
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.append_many(elementCount, hexNewElements, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  merkleTree = merkleTree.appendMulti(newElements);
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendManyConsecutively = async (iterations, appendSize, seed, expectedGas) => {
  let cumulativeGasUsed = 0;

  const newElementsMatrix = Array(iterations).fill(null).map(() => {
    const newElements = generateElements(appendSize, { seed });
    seed = newElements[0].toString('hex');

    return newElements;
  });
  
  for (let i = 0; i < iterations; i++) {
    const newElements = newElementsMatrix[i];
    const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
    const { elementCount, decommitments } = merkleTree.generateMultiAppendProof(newElements);
    const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
    const { receipt } = await contractInstance.append_many(elementCount, hexNewElements, hexDecommitments);
    merkleTree = merkleTree.appendMulti(newElements);
    cumulativeGasUsed = cumulativeGasUsed + receipt.gasUsed;
  }

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendMany = async (indices, expectedGas) => {
  const { elementCount, elements, proof } = merkleTree.generateCombinedProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = proof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_and_append_many(elementCount, hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendManyConsecutively = async (iterations, seed, count, expectedGas) => {
  // TODO: can't be tested without duplicating the update and append element logic here
  return;
};

describe.only("Merkle_Storage", async accounts => {
  beforeEach(async () => {
    contractInstance = await Merkle_Storage.new();
    const elements = generateElements(20, { seed: 'ff' });
    merkleTree = new MerkleTree(elements, options);
    await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
  });

  it("should use 1 element for 29,297 gas.", () => {
    return testUseOne(0, 29297);
  });

  it("should update 1 element for 35,784 gas.", () => {
    return testUpdateOne(0, '11', 35784);
  });

  it("should use and update 1 element for 36,653 gas.", () => {
    return testUseAndUpdateOne(0, 36653);
  });

  it("should use 2 elements for 33,052 gas.", () => {
    return testUseMany([1, 0], 33052);
  });

  it("should use 3 elements for 34,687 gas.", () => {
    return testUseMany([2, 1, 0], 34687);
  });

  it("should use 4 elements for 35,146 gas.", () => {
    return testUseMany([3, 2, 1, 0], 35146);
  });

  it("should use 8 elements for 41,765 gas.", () => {
    return testUseMany([15, 14, 13, 12, 3, 2, 1, 0], 41765);
  });

  it("should update 2 elements for 41,101 gas.", () => {
    return testUpdateMany([1, 0], '11', 41101);
  });

  it("should update 3 elements for 43,600 gas.", () => {
    return testUpdateMany([2, 1, 0], '11', 43600);
  });

  it("should update 4 elements for 44,686 gas.", () => {
    return testUpdateMany([3, 2, 1, 0], '11', 44686);
  });

  it("should update 8 elements for 54,877 gas.", () => {
    return testUpdateMany([15, 14, 13, 12, 3, 2, 1, 0], '11', 54877);
  });

  it("should use and update 2 element for 41,506 gas.", () => {
    return testUseAndUpdateMany([1, 0], 41506);
  });

  it("should use and update 3 element for 43,886 gas.", () => {
    return testUseAndUpdateMany([2, 1, 0], 43886);
  });

  it("should use and update 4 element for 44,831 gas.", () => {
    return testUseAndUpdateMany([3, 2, 1, 0], 44831);
  });

  it("should use and update 8 element for 54,460 gas.", () => {
    return testUseAndUpdateMany([15, 14, 13, 12, 3, 2, 1, 0], 54460);
  });

  it("should append 1 new element for 31,577 gas.", async () => {
    return testAppendOne('22', 31577);
  });

  it("should append 1 new element, 100 times consecutively, for 3,325,643 gas.", () => {
    return testAppendOneConsecutively(100, '22', 3325643);
  });

  it(`should append 2 new elements, for 35,395 gas.`, async () => {
    return testAppendMany(2, '22', 35395);
  });

  it(`should append 3 new elements, for 36,576 gas.`, async () => {
    return testAppendMany(3, '22', 36576);
  });

  it(`should append 4 new elements, for 37,777 gas.`, async () => {
    return testAppendMany(4, '22', 37777);
  });

  it(`should append 8 new elements, for 42,850 gas.`, async () => {
    return testAppendMany(8, '22', 42850);
  });

  it("should append 2 new elements, 100 times consecutively, for 3,758,796 gas.", () => {
    return testAppendManyConsecutively(100, 2, '22', 3758796);
  });

  it("should append 3 new elements, 100 times consecutively, for 3,981,921 gas.", () => {
    return testAppendManyConsecutively(100, 3, '22', 3981921);
  });

  it("should append 4 new elements, 100 times consecutively, for 4,009,813 gas.", () => {
    return testAppendManyConsecutively(100, 4, '22', 4009813);
  });

  it("should append 8 new elements, 100 times consecutively, for 4,653,211 gas.", () => {
    return testAppendManyConsecutively(100, 8, '22', 4653211);
  });

  it("should use, update, and append 2 new elements for 51,666 gas.", () => {
    return testUseUpdateAndAppendMany([19, 0], 51666);
  });

  it("should use, update, and append 3 new elements for 53,436 gas.", () => {
    return testUseUpdateAndAppendMany([19, 1, 0], 53436);
  });

  it("should use, update, and append 4 new elements for 56,784 gas.", () => {
    return testUseUpdateAndAppendMany([19, 2, 1, 0], 56784);
  });

  it("should use, update, and append 8 new elements for 70,408 gas.", () => {
    return testUseUpdateAndAppendMany([19, 14, 13, 12, 3, 2, 1, 0], 70408);
  });

  it.skip("should use, update, and append 2 elements, 100 times consecutively, for 7,645,388 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 2, 7645388);
  });

  it.skip("should use, update, and append 8 elements, 100 times consecutively, for 23,643,980 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 8, 23643980);
  });
});
