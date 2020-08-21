const chai = require('chai');
const { expect } = chai;

const { generateElements, randomNumberGenerator } = require('./helpers');

const Simple_Storage = artifacts.require("Simple_Storage");

let contractInstance = null;
let elementCount = 0;

const testUseOne = async (index, expectedGas) => {
  const { receipt } = await contractInstance.use_one(index);
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed, expectedGas) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { receipt } = await contractInstance.update_one(index, hexNewElement);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedElement = await contractInstance.items(index);

  expect(retrievedElement).to.equal(hexNewElement);
};

const testUseAndUpdateOne = async (index, expectedGas) => {
  const originalElement = await contractInstance.items(index);
  const { receipt } = await contractInstance.use_and_update_one(index);
  const updatedElement = await contractInstance.items(index);
  expect(receipt.gasUsed).to.equal(expectedGas);
  expect(originalElement).to.not.equal(updatedElement);
};

const testUseMany = async (indices, expectedGas) => {
  const { receipt } = await contractInstance.use_many(indices);
  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed, expectedGas) => {
  const newElements = generateElements(indices.length, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.update_many(indices, hexNewElements);

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedElement = await contractInstance.items(indices[0]);

  expect(retrievedElement).to.equal(hexNewElements[0]);
};

const testUseAndUpdateMany = async (indices, expectedGas) => {
  const originalElement = await contractInstance.items(indices[0]);
  const { receipt } = await contractInstance.use_and_update_many(indices);
  const updatedElement = await contractInstance.items(indices[0]);
  expect(receipt.gasUsed).to.equal(expectedGas);
  expect(originalElement).to.not.equal(updatedElement);
};

const testAppendOne = async (seed, expectedGas) => {
  const newElement = generateElements(1, { seed })[0];
  const hexNewElement = '0x' + newElement.toString('hex');
  const { receipt } = await contractInstance.append_one(elementCount, hexNewElement);
  elementCount = elementCount + 1;

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedElement = await contractInstance.items(elementCount - 1);

  expect(retrievedElement).to.equal(hexNewElement);
};

const testAppendOneConsecutively = async (iterations, seed, expectedGas) => {
  const newElements = generateElements(iterations, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));

  const cumulativeGasUsed = await hexNewElements.reduce(async (cGasUsed, hexNewElement) => {
    const cumulativeGasUsed = await cGasUsed;
    const { receipt } = await contractInstance.append_one(elementCount, hexNewElement);
    elementCount = elementCount + 1;
    
    return cumulativeGasUsed + receipt.gasUsed;
  }, 0);

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedElement = await contractInstance.items(elementCount - 1);

  expect(retrievedElement).to.equal(hexNewElements[iterations - 1]);
};

const testAppendMany = async (appendSize, seed, expectedGas) => {
  const newElements = generateElements(appendSize, { seed });
  const hexNewElements = newElements.map(e => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.append_many(elementCount, hexNewElements);
  elementCount = elementCount + appendSize;

  expect(receipt.gasUsed).to.equal(expectedGas);
  
  const retrievedElement = await contractInstance.items(elementCount - 1);

  expect(retrievedElement).to.equal(hexNewElements[appendSize - 1]);
};

const testAppendManyConsecutively = async (iterations, appendSize, seed, expectedGas) => {
  let cumulativeGasUsed = 0;

  const newHexElementsMatrix = Array(iterations).fill(null).map(() => {
    const newElements = generateElements(appendSize, { seed });
    seed = newElements[0].toString('hex');

    return newElements.map(e => '0x' + e.toString('hex'));
  });
  
  for (let i = 0; i < iterations; i++) {
    const { receipt } = await contractInstance.append_many(elementCount, newHexElementsMatrix[i]);
    elementCount = elementCount + appendSize;
    cumulativeGasUsed = cumulativeGasUsed + receipt.gasUsed;
  }

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedElement = await contractInstance.items(elementCount - 1);

  expect(retrievedElement).to.equal(newHexElementsMatrix[iterations - 1][appendSize - 1]);
};

const testUseUpdateAndAppendMany = async (indices, expectedGas) => {
  const originalElement1 = await contractInstance.items(indices[0]);
  const originalElement2 = await contractInstance.items(elementCount + indices.length - 1);
  const { receipt } = await contractInstance.use_and_update_and_append_many(indices, elementCount);
  elementCount = elementCount + indices.length;
  const updatedElement1 = await contractInstance.items(indices[0]);
  const updatedElement2 = await contractInstance.items(elementCount - 1);
  expect(receipt.gasUsed).to.equal(expectedGas);
  expect(originalElement1).to.not.equal(updatedElement1);
  expect(originalElement2).to.not.equal(updatedElement2);
};

const testUseUpdateAndAppendManyConsecutively = async (iterations, seed, count, expectedGas) => {
  const rng = randomNumberGenerator(seed);
  const originalElement = await contractInstance.items(elementCount + (iterations * count) - 1);
  let cumulativeGasUsed = 0;
  
  for (let i = 0; i < iterations; i++) {
    const indices = [elementCount - 1];

    while (indices.length < count) {
      const index = Math.floor(rng() * elementCount);
      
      if (!indices.includes(index)) indices.push(index);
    }

    indices.sort((a, b) => b - a);
    const { receipt } = await contractInstance.use_and_update_and_append_many(indices, elementCount);
    elementCount = elementCount + count;
    cumulativeGasUsed = cumulativeGasUsed + receipt.gasUsed;
  }

  expect(cumulativeGasUsed).to.equal(expectedGas);

  const retrievedElement = await contractInstance.items(elementCount - 1);

  expect(originalElement).to.not.equal(retrievedElement);
};

describe("Simple_Storage", async accounts => {
  beforeEach(async () => {
    contractInstance = await Simple_Storage.new();
    const elements = generateElements(20, { seed: 'ff' });
    const hexElements = elements.map(e => '0x' + e.toString('hex'));
    await contractInstance.append_many(0, hexElements);
    elementCount = 20;
  });

  it("should use 1 element for 23,513 gas.", () => {
    return testUseOne(0, 23513);
  });

  it("should update 1 element for 26,980 gas.", () => {
    return testUpdateOne(0, '11', 26980);
  });

  it("should use and update 1 element for 28,669 gas.", () => {
    return testUseAndUpdateOne(0, 28669);
  });

  it("should use 2 elements for 25,457 gas.", () => {
    return testUseMany([1, 0], 25457);
  });

  it("should use 3 elements for 26,677 gas.", () => {
    return testUseMany([2, 1, 0], 26677);
  });

  it("should use 4 elements for 27,897 gas.", () => {
    return testUseMany([3, 2, 1, 0], 27897);
  });

  it("should use 8 elements for 32,777 gas.", () => {
    return testUseMany([15, 14, 13, 12, 3, 2, 1, 0], 32777);
  });

  it("should update 2 elements for 34,399 gas.", () => {
    return testUpdateMany([1, 0], '11', 34399);
  });

  it("should update 3 elements for 40,304 gas.", () => {
    return testUpdateMany([2, 1, 0], '11', 40304);
  });

  it("should update 4 elements for 46,197 gas.", () => {
    return testUpdateMany([3, 2, 1, 0], '11', 46197);
  });

  it("should update 8 elements for 69,818 gas.", () => {
    return testUpdateMany([15, 14, 13, 12, 3, 2, 1, 0], '11', 69818);
  });

  it("should use and update 2 element for 36,008 gas.", () => {
    return testUseAndUpdateMany([1, 0], 36008);
  });

  it("should use and update 3 element for 42,479 gas.", () => {
    return testUseAndUpdateMany([2, 1, 0], 42479);
  });

  it("should use and update 4 element for 48,950 gas.", () => {
    return testUseAndUpdateMany([3, 2, 1, 0], 48950);
  });

  it("should use and update 8 element for 74,834 gas.", () => {
    return testUseAndUpdateMany([15, 14, 13, 12, 3, 2, 1, 0], 74834);
  });

  it("should append 1 new element for 42,059 gas.", async () => {
    return testAppendOne('22', 42059);
  });

  it("should append 1 new element, 100 times consecutively, for 4,205,744 gas.", () => {
    return testAppendOneConsecutively(100, '22', 4205744);
  });

  it(`should append 2 new elements, for 63,500 gas.`, async () => {
    return testAppendMany(2, '22', 63500);
  });

  it(`should append 3 new elements, for 84,212 gas.`, async () => {
    return testAppendMany(3, '22', 84212);
  });

  it(`should append 4 new elements, for 104,924 gas.`, async () => {
    return testAppendMany(4, '22', 104924);
  });

  it(`should append 8 new elements, for 187,772 gas.`, async () => {
    return testAppendMany(8, '22', 187772);
  });

  it("should append 2 new elements, 100 times consecutively, for 6,349,688 gas.", () => {
    return testAppendManyConsecutively(100, 2, '22', 6349688);
  });

  it("should append 3 new elements, 100 times consecutively, for 8,420,984 gas.", () => {
    return testAppendManyConsecutively(100, 3, '22', 8420984);
  });

  it("should append 4 new elements, 100 times consecutively, for 10,492,256 gas.", () => {
    return testAppendManyConsecutively(100, 4, '22', 10492256);
  });

  it("should append 8 new elements, 100 times consecutively, for 18,776,792 gas.", () => {
    return testAppendManyConsecutively(100, 8, '22', 18776792);
  });

  it("should use, update, and append 2 new elements for 76,442 gas.", () => {
    return testUseUpdateAndAppendMany([19, 0], 76442);
  });

  it("should use, update, and append 3 new elements for 103,099 gas.", () => {
    return testUseUpdateAndAppendMany([19, 1, 0], 103099);
  });

  it("should use, update, and append 4 new elements for 129,756 gas.", () => {
    return testUseUpdateAndAppendMany([19, 2, 1, 0], 129756);
  });

  it("should use, update, and append 8 new elements for 236,384 gas.", () => {
    return testUseUpdateAndAppendMany([19, 14, 13, 12, 3, 2, 1, 0], 236384);
  });

  it("should use, update, and append 2 elements, 100 times consecutively, for 7,645,388 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 2, 7645388);
  });

  it("should use, update, and append 8 elements, 100 times consecutively, for 23,643,980 gas.", () => {
    return testUseUpdateAndAppendManyConsecutively(100, 33, 8, 23643980);
  });
});
