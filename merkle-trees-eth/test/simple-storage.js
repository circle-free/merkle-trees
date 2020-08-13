const chai = require('chai');
const { expect } = chai;

const { generateElements } = require('./helpers');

const Simple_Storage = artifacts.require("Simple_Storage");

describe("Simple_Storage", async accounts => {
  let contractInstance = null;

  beforeEach(async () => {
    contractInstance = await Simple_Storage.new();
    const index = 0;
    const element = generateElements(1, { seed: 1 })[0];
    const hexElement = '0x' + element.toString('hex');
    await contractInstance.update_one(index, hexElement);
  });

  it("should append 1 new element at 1 new index for 42,058 gas.", async () => {
    const index = 1;
    const newElement = generateElements(1, { seed: 2 })[0];
    const hexNewElement = '0x' + newElement.toString('hex');
    const { receipt } = await contractInstance.update_one(index, hexNewElement);

    expect(receipt.gasUsed).to.equal(42058);
    
    const retrievedElement = await contractInstance.elements(1);

    expect(retrievedElement).to.equal(hexNewElement);
  });

  it("should append 1 new element at 1 new index, 100 times consecutively, for 4,205,680 gas.", async () => {
    const newElements = generateElements(100, { seed: 3 });

    const cumulativeGasUsed = await newElements.reduce(async (cGasUsed, newElement, i) => {
      const cumulativeGasUsed = await cGasUsed;
      const hexNewElement = '0x' + newElement.toString('hex');
      const { receipt } = await contractInstance.update_one(i + 1, hexNewElement);
      
      return cumulativeGasUsed + receipt.gasUsed;
    }, 0);

    expect(cumulativeGasUsed).to.equal(4205680);
    
    Array(10).fill(0).map((_, i) => 10*(i+1)).forEach(async (index) => {
      const retrievedElement = await contractInstance.elements(index);
      const hexElement = '0x' + newElements[index - 1].toString('hex');

      expect(retrievedElement).to.equal(hexElement);
    });
  });

  it(`should append 5 new elements at 5 respective new indices, for 126,999 gas.`, async () => {
    const newElementCount = 5;
    const newElements = generateElements(newElementCount, { seed: 2 });
    const indices = newElements.map((_, i) => 1 + i);
    const hexNewElements = newElements.map(element => '0x' + element.toString('hex'));
    const { receipt } = await contractInstance.update_many(indices, hexNewElements);

    expect(receipt.gasUsed).to.equal(126999);
    
    const retrievedElement = await contractInstance.elements(5);

    expect(retrievedElement).to.equal(hexNewElements[newElementCount - 1]);
  });

  it(`should append 5 new elements at 5 respective new indices, 100 times consecutively, for 12,703,296 gas.`, async () => {
    const newElementCount = 5;

    const newHexElementsMatrix = Array.from({ length: 100 }, (_, i) => {
      const elements = generateElements(newElementCount, { seed: 3 + i });

      return elements.map(element => '0x' + element.toString('hex'));
    });

    const indicesMatrix = Array.from({ length: 100 }, (_, i) => {
      return Array.from({ length: newElementCount }, (_, j) => 6 + i*newElementCount + j);
    });

    const cumulativeGasUsed = await indicesMatrix.reduce(async (cGasUsed, indices, i) => {
      const cumulativeGasUsed = await cGasUsed;
      const hexNewElements = newHexElementsMatrix[i];
      const { receipt } = await contractInstance.update_many(indices, hexNewElements);
      
      return cumulativeGasUsed + receipt.gasUsed;
    }, 0);

    expect(cumulativeGasUsed).to.equal(12703296);
    
    Array(11).fill(0).map((_, i) => 50*(i+1) + newElementCount).forEach(async (index) => {
      const retrievedElement = await contractInstance.elements(index);
      const hexElement = '0x' + elements[index - newElementCount - 1].toString('hex');

      expect(retrievedElement).to.equal(hexElement);
    });
  });
});
