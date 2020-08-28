const chai = require('chai');
const { expect } = chai;

const { generateElements, randomNumberGenerator } = require('./helpers');
const MerkleTree = require('../../js');

const Merkle_Storage = artifacts.require("Merkle_Storage");

const options = {
  unbalanced: true,
  sortedHash: true,
  elementPrefix: '0000000000000000000000000000000000000000000000000000000000000000',
  indexed: false,
  compact: true,
};

let contractInstance = null;
let merkleTree = null

const testUseOne = async (index, expectedGas) => {
  const { elementCount, element, decommitments } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexDecommitments = decommitments.map(d => '0x' + d.toString('hex'));
  const { receipt } = await contractInstance.use_one(elementCount, index, hexElement, hexDecommitments);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, expectedGas) => {
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
  const { elementCount, elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many(elementCount, hexElements, hexCompactProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, expectedGas) => {
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

const testUseAndUpdateMany = async (indices, expectedGas) => {
  const { elementCount, elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_many(elementCount, hexElements, hexCompactProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOne = async (seed, expectedGas) => {
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

const testAppendOneConsecutively = async (iterations, seed, expectedGas) => {
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

const testAppendMany = async (appendSize, seed, expectedGas) => {
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

const testUseUpdateAndAppendMany = async (indices, expectedGas) => {
  const { elementCount, elements, compactProof } = merkleTree.generateCombinedProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexCompactProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_and_append_many(elementCount, hexElements, hexCompactProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendManyConsecutively = async (iterations, seed, count, expectedGas) => {
  // TODO: can't be tested without duplicating the update and append element logic here
  return;
};

describe("Merkle_Storage", async accounts => {
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

  it("should use 2 elements for 32,995 gas.", () => {
    return testUseMany([0, 1], 32995);
  });

  it("should use 3 elements for 34,630 gas.", () => {
    return testUseMany([0, 1, 2], 34630);
  });

  it("should use 4 elements for 35,111 gas.", () => {
    return testUseMany([0, 1, 2, 3], 35111);
  });

  it("should use 8 elements for 41,730 gas.", () => {
    return testUseMany([0, 1, 2, 3, 12, 13, 14, 15], 41730);
  });

  it("should update 2 elements for 41,093 gas.", () => {
    return testUpdateMany([0, 1], '11', 41093);
  });

  it("should update 3 elements for 43,631 gas.", () => {
    return testUpdateMany([0, 1, 2], '11', 43631);
  });

  it("should update 4 elements for 44,746 gas.", () => {
    return testUpdateMany([0, 1, 2, 3], '11', 44746);
  });

  it("should update 8 elements for 54,994 gas.", () => {
    return testUpdateMany([0, 1, 2, 3, 12, 13, 14, 15], '11', 54994);
  });

  it("should use and update 2 element for 41,509 gas.", () => {
    return testUseAndUpdateMany([0, 1], 41509);
  });

  it("should use and update 3 element for 43,906 gas.", () => {
    return testUseAndUpdateMany([0, 1, 2], 43906);
  });

  it("should use and update 4 element for 44,880 gas.", () => {
    return testUseAndUpdateMany([0, 1, 2, 3], 44880);
  });

  it("should use and update 8 element for 54,577 gas.", () => {
    return testUseAndUpdateMany([0, 1, 2, 3, 12, 13, 14, 15], 54577);
  });

  it("should append 1 new element for 31,577 gas.", async () => {
    return testAppendOne('22', 31577);
  });

  it("should append 1 new element, 100 times consecutively, for 3,325,643 gas.", () => {
    return testAppendOneConsecutively(100, '22', 3325643);
  });

  it(`should append 2 new elements, for 35,387 gas.`, async () => {
    return testAppendMany(2, '22', 35387);
  });

  it(`should append 3 new elements, for 36,564 gas.`, async () => {
    return testAppendMany(3, '22', 36564);
  });

  it(`should append 4 new elements, for 37,761 gas.`, async () => {
    return testAppendMany(4, '22', 37761);
  });

  it(`should append 8 new elements, for 42,818 gas.`, async () => {
    return testAppendMany(8, '22', 42818);
  });

  it("should append 2 new elements, 100 times consecutively, for 3,757,996 gas.", () => {
    return testAppendManyConsecutively(100, 2, '22', 3757996);
  });

  it("should append 3 new elements, 100 times consecutively, for 3,980,721 gas.", () => {
    return testAppendManyConsecutively(100, 3, '22', 3980721);
  });

  it("should append 4 new elements, 100 times consecutively, for 4,008,213 gas.", () => {
    return testAppendManyConsecutively(100, 4, '22', 4008213);
  });

  it("should append 8 new elements, 100 times consecutively, for 4,650,011 gas.", () => {
    return testAppendManyConsecutively(100, 8, '22', 4650011);
  });

  it("should use, update, and append 2 new elements for 51,313 gas.", () => {
    return testUseUpdateAndAppendMany([0, 19], 51313);
  });

  it("should use, update, and append 3 new elements for 53,072 gas.", () => {
    return testUseUpdateAndAppendMany([0, 1, 19], 53072);
  });

  it("should use, update, and append 4 new elements for 56,329 gas.", () => {
    return testUseUpdateAndAppendMany([0, 1, 2, 19], 56329);
  });

  it("should use, update, and append 8 new elements for 69,710 gas.", () => {
    return testUseUpdateAndAppendMany([0, 1, 2, 3, 12, 13, 14, 19], 69710);
  });

  it.skip("should use, update, and append 2 elements, 100 times consecutively, for 7,645,388 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 2, 7645388);
  });

  it.skip("should use, update, and append 8 elements, 100 times consecutively, for 23,643,980 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 8, 23643980);
  });
});
