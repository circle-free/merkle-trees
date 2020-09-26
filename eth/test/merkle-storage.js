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
  const { element, compactProof } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_one(index, hexElement, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, expectedGas) => {
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

const testUseAndUpdateOne = async (index, expectedGas) => {
  const { element, compactProof } = merkleTree.generateSingleProof(index, options);
  const hexElement = '0x' + element.toString('hex');
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_one(index, hexElement, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseMany = async (indices, expectedGas) => {
  const { elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_many(hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, expectedGas) => {
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

const testUseAndUpdateMany = async (indices, expectedGas) => {
  const { elements, compactProof } = merkleTree.generateMultiProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_many(hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testAppendOne = async (seed, expectedGas) => {
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

const testAppendOneConsecutively = async (iterations, seed, expectedGas) => {
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

const testAppendMany = async (appendSize, seed, expectedGas) => {
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
    const { compactProof } = proof;
    merkleTree = newMerkleTree;
    const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
    const { receipt } = await contractInstance.append_many(hexNewElements, hexProof);
    cumulativeGasUsed = cumulativeGasUsed + receipt.gasUsed;
  }

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendMany = async (indices, expectedGas) => {
  const { elements, compactProof } = merkleTree.generateCombinedProof(indices, options);
  const hexElements = elements.map(e => '0x' + e.toString('hex'));
  const hexProof = compactProof.map(p => '0x' + p.toString('hex'));
  const { receipt } = await contractInstance.use_and_update_and_append_many(hexElements, hexProof);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedRoot = await contractInstance.root();

  expect(retrievedRoot).to.not.equal('0x' + merkleTree.root.toString('hex'));
};

const testUseUpdateAndAppendManyConsecutively = async (iterations, seed, count, expectedGas) => {
  // TODO: can't be tested without duplicating the update and append element logic here
  return;
};

describe.skip("Merkle_Storage", async accounts => {
  beforeEach(async () => {
    contractInstance = await Merkle_Storage.new();
    const elements = generateElements(20, { seed: 'ff' });
    merkleTree = new MerkleTree(elements, options);
    await contractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));
  });

  it("should use 1 element for 29,426 gas.", () => {
    return testUseOne(0, 29426);
  });

  it("should update 1 element for 35,869 gas.", () => {
    return testUpdateOne(0, '11', 35869);
  });

  it("should use and update 1 element for 36,782 gas.", () => {
    return testUseAndUpdateOne(0, 36782);
  });

  it("should use 2 elements for 33,034 gas.", () => {
    return testUseMany([0, 1], 33034);
  });

  it("should use 3 elements for 34,669 gas.", () => {
    return testUseMany([0, 1, 2], 34669);
  });

  it("should use 4 elements for 35,150 gas.", () => {
    return testUseMany([0, 1, 2, 3], 35150);
  });

  it("should use 8 elements for 41,769 gas.", () => {
    return testUseMany([0, 1, 2, 3, 12, 13, 14, 15], 41769);
  });

  it("should update 2 elements for 41,099 gas.", () => {
    return testUpdateMany([0, 1], '11', 41099);
  });

  it("should update 3 elements for 43,636 gas.", () => {
    return testUpdateMany([0, 1, 2], '11', 43636);
  });

  it("should update 4 elements for 44,739 gas.", () => {
    return testUpdateMany([0, 1, 2, 3], '11', 44739);
  });

  it("should update 8 elements for 55,000 gas.", () => {
    return testUpdateMany([0, 1, 2, 3, 12, 13, 14, 15], '11', 55000);
  });

  it("should use and update 2 element for 41,511 gas.", () => {
    return testUseAndUpdateMany([0, 1], 41511);
  });

  it("should use and update 3 element for 43,907 gas.", () => {
    return testUseAndUpdateMany([0, 1, 2], 43907);
  });

  it("should use and update 4 element for 44,881 gas.", () => {
    return testUseAndUpdateMany([0, 1, 2, 3], 44881);
  });

  it("should use and update 8 element for 54,579 gas.", () => {
    return testUseAndUpdateMany([0, 1, 2, 3, 12, 13, 14, 15], 54579);
  });

  it("should append 1 new element for 31,571 gas.", async () => {
    return testAppendOne('22', 31571);
  });

  it("should append 1 new element, 100 times consecutively, for 3,319,303 gas.", () => {
    return testAppendOneConsecutively(100, '22', 3319303);
  });

  it(`should append 2 new elements, for 35,411 gas.`, async () => {
    return testAppendMany(2, '22', 35411);
  });

  it(`should append 3 new elements, for 36,588 gas.`, async () => {
    return testAppendMany(3, '22', 36588);
  });

  it(`should append 4 new elements, for 37,785 gas.`, async () => {
    return testAppendMany(4, '22', 37785);
  });

  it(`should append 8 new elements, for 42,842 gas.`, async () => {
    return testAppendMany(8, '22', 42842);
  });

  it("should append 2 new elements, 100 times consecutively, for 3,759,828 gas.", () => {
    return testAppendManyConsecutively(100, 2, '22', 3759828);
  });

  it("should append 3 new elements, 100 times consecutively, for 3,982,273 gas.", () => {
    return testAppendManyConsecutively(100, 3, '22', 3982273);
  });

  it("should append 4 new elements, 100 times consecutively, for 4,010,093 gas.", () => {
    return testAppendManyConsecutively(100, 4, '22', 4010093);
  });

  it("should append 8 new elements, 100 times consecutively, for 4,651,523 gas.", () => {
    return testAppendManyConsecutively(100, 8, '22', 4651523);
  });

  it("should use, update, and append 2 new elements for 51,481 gas.", () => {
    return testUseUpdateAndAppendMany([0, 19], 51481);
  });

  it("should use, update, and append 3 new elements for 53,241 gas.", () => {
    return testUseUpdateAndAppendMany([0, 1, 19], 53241);
  });

  it("should use, update, and append 4 new elements for 56,498 gas.", () => {
    return testUseUpdateAndAppendMany([0, 1, 2, 19], 56498);
  });

  it("should use, update, and append 8 new elements for 69,878 gas.", () => {
    return testUseUpdateAndAppendMany([0, 1, 2, 3, 12, 13, 14, 19], 69878);
  });

  it.skip("should use, update, and append 2 elements, 100 times consecutively, for 7,645,388 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 2, 7645388);
  });

  it.skip("should use, update, and append 8 elements, 100 times consecutively, for 23,643,980 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 8, 23643980);
  });
});
