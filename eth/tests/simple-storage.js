const fs = require('fs');
const chai = require('chai');
const { expect } = chai;

const gasCosts = require('./fixtures/simple-gas-costs.json');
const { generateElements } = require('./helpers');

const Simple_Storage = artifacts.require('Simple_Storage');

let contractInstance = null;
let elementCount = null;

const testUseOne = async (index) => {
  const gasFixtureString = `${elementCount}_testUseOne_${index}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { receipt } = await contractInstance.use_one(index);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseMany = async (indices) => {
  const gasFixtureString = `${elementCount}_testUseMany_${indices.join('-')}`;
  const expectedGas = gasCosts[gasFixtureString];

  const { receipt } = await contractInstance.use_many(indices);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOne = async (index, seed) => {
  const gasFixtureString = `${elementCount}_testUpdateOne_${index}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const { receipt } = await contractInstance.update_one(index, hexUpdateElement);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateMany = async (indices, seed) => {
  const gasFixtureString = `${elementCount}_testUpdateMany_${indices.join('-')}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed });
  const hexUpdateElements = updateElements.map((e) => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.update_many(indices, hexUpdateElements);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testAppendOne = async (seed) => {
  const gasFixtureString = `${elementCount}_testAppendOne_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { receipt } = await contractInstance.append_one(hexAppendElement);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testAppendMany = async (appendSize, seed) => {
  const gasFixtureString = `${elementCount}_testAppendMany_${appendSize}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.append_many(hexAppendElements);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseOneAndAppendOne = async (index, seed) => {
  const gasFixtureString = `${elementCount}_testUseOneAndAppendOne_${index}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { receipt } = await contractInstance.use_one_and_append_one(index, hexAppendElement);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseOneAndAppendMany = async (index, appendSize, seed) => {
  const gasFixtureString = `${elementCount}_testUseOneAndAppendMany_${index}_${appendSize}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.use_one_and_append_many(index, hexAppendElements);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseManyAndAppendOne = async (indices, seed) => {
  const gasFixtureString = `${elementCount}_testUseManyAndAppendOne_${indices.join('-')}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElement = generateElements(1, { seed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { receipt } = await contractInstance.use_many_and_append_one(indices, hexAppendElement);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUseManyAndAppendMany = async (indices, appendSize, seed) => {
  const gasFixtureString = `${elementCount}_testUseManyAndAppendMany_${indices.join('-')}_${appendSize}_${seed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const appendElements = generateElements(appendSize, { seed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.use_many_and_append_many(indices, hexAppendElements);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOneAndAppendOne = async (index, updateSeed, appendSeed) => {
  const gasFixtureString = `${elementCount}_testUpdateOneAndAppendOne_${index}_${updateSeed}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed: updateSeed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const appendElement = generateElements(1, { seed: appendSeed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { receipt } = await contractInstance.update_one_and_append_one(index, hexUpdateElement, hexAppendElement);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateOneAndAppendMany = async (index, updateSeed, appendSize, appendSeed) => {
  const gasFixtureString = `${elementCount}_testUpdateOneAndAppendMany_${index}_${updateSeed}_${appendSize}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElement = generateElements(1, { seed: updateSeed })[0];
  const hexUpdateElement = '0x' + updateElement.toString('hex');
  const appendElements = generateElements(appendSize, { seed: appendSeed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.update_one_and_append_many(index, hexUpdateElement, hexAppendElements);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateManyAndAppendOne = async (indices, updateSeed, appendSeed) => {
  const gasFixtureString = `${elementCount}_testUpdateOneAndAppendMany_${indices.join(
    '-'
  )}_${updateSeed}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed: updateSeed });
  const hexUpdateElements = updateElements.map((e) => '0x' + e.toString('hex'));
  const appendElement = generateElements(1, { seed: appendSeed })[0];
  const hexAppendElement = '0x' + appendElement.toString('hex');
  const { receipt } = await contractInstance.update_many_and_append_one(indices, hexUpdateElements, hexAppendElement);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

const testUpdateManyAndAppendMany = async (indices, updateSeed, appendSize, appendSeed) => {
  const gasFixtureString = `${elementCount}_testUpdateManyAndAppendMany_${indices.join(
    '-'
  )}_${updateSeed}_${appendSize}_${appendSeed}`;
  const expectedGas = gasCosts[gasFixtureString];

  const updateElements = generateElements(indices.length, { seed: updateSeed });
  const hexUpdateElements = updateElements.map((e) => '0x' + e.toString('hex'));
  const appendElements = generateElements(appendSize, { seed: appendSeed });
  const hexAppendElements = appendElements.map((e) => '0x' + e.toString('hex'));
  const { receipt } = await contractInstance.update_many_and_append_many(indices, hexUpdateElements, hexAppendElements);

  gasCosts[gasFixtureString] = receipt.gasUsed;

  expect(receipt.gasUsed).to.equal(expectedGas);
};

describe.skip('Simple Storage', async () => {
  after(() => {
    fs.writeFileSync('./eth/tests/fixtures/simple-gas-costs.json', JSON.stringify(gasCosts, null, ' ').concat('\n'));
  });

  describe('Starting with 200 elements', async () => {
    beforeEach(async () => {
      contractInstance = await Simple_Storage.new();
      const seed = 'ff';
      const elements = generateElements(200, { seed });
      const hexElements = elements.map((e) => '0x' + e.toString('hex'));
      const { receipt } = await contractInstance.append_many(hexElements);
      elementCount = 200;

      const gasFixtureString = `${elementCount}_constructAppendMany_${seed}`;
      gasCosts[gasFixtureString] = receipt.gasUsed;
    });

    it('should use 1 element.', () => {
      return testUseOne(0);
    });

    it('should use 2 elements.', () => {
      return testUseMany([0, 1]);
    });

    it('should use 5 elements.', () => {
      return testUseMany([0, 1, 2, 3, 4]);
    });

    it('should use 10 elements.', () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map((i) => elementCount - 5 + i);
      return testUseMany(firstHalf.concat(secondHalf));
    });

    it('should use 20 elements.', () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map((i) => elementCount - 10 + i);
      return testUseMany(firstHalf.concat(secondHalf));
    });

    it('should update 1 element.', () => {
      return testUpdateOne(0, '11');
    });

    it('should update 2 elements.', () => {
      return testUpdateMany([0, 1], '11');
    });

    it('should update 5 elements.', () => {
      return testUpdateMany([0, 1, 2, 3, 4], '11');
    });

    it('should update 10 elements.', () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map((i) => elementCount - 5 + i);
      return testUpdateMany(firstHalf.concat(secondHalf), '11');
    });

    it('should update 20 elements.', () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map((i) => elementCount - 10 + i);
      return testUpdateMany(firstHalf.concat(secondHalf), '11');
    });

    it('should append 1 new element.', async () => {
      return testAppendOne('22');
    });

    it(`should append 2 new elements.`, async () => {
      return testAppendMany(2, '22');
    });

    it(`should append 5 new elements.`, async () => {
      return testAppendMany(5, '22');
    });

    it(`should append 10 new elements.`, async () => {
      return testAppendMany(10, '22');
    });

    it(`should append 20 new elements.`, async () => {
      return testAppendMany(20, '22');
    });

    it(`should use 1 element and append 1 element.`, async () => {
      return testUseOneAndAppendOne(0, '22');
    });

    it(`should use 1 element and append 2 elements.`, async () => {
      return testUseOneAndAppendMany(0, 2, '22');
    });

    it(`should use 1 element and append 5 elements.`, async () => {
      return testUseOneAndAppendMany(0, 5, '22');
    });

    it(`should use 1 element and append 10 elements.`, async () => {
      return testUseOneAndAppendMany(0, 10, '22');
    });

    it(`should use 1 element and append 20 elements.`, async () => {
      return testUseOneAndAppendMany(0, 20, '22');
    });

    it(`should use 2 elements and append 1 element.`, async () => {
      return testUseManyAndAppendOne([0, 1], '22');
    });

    it(`should use 5 elements and append 1 element.`, async () => {
      return testUseManyAndAppendOne([0, 1, 2, 3, 4], '22');
    });

    it(`should use 10 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map((i) => elementCount - 5 + i);
      return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22');
    });

    it(`should use 20 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map((i) => elementCount - 10 + i);
      return testUseManyAndAppendOne(firstHalf.concat(secondHalf), '22');
    });

    it(`should use 2 elements and append 2 elements.`, async () => {
      return testUseManyAndAppendMany([0, 1], 2, '22');
    });

    it(`should use 5 elements and append 5 elements.`, async () => {
      return testUseManyAndAppendMany([0, 1, 2, 3, 4], 5, '22');
    });

    it(`should use 10 elements and append 10 elements.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map((i) => elementCount - 5 + i);
      return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 10, '22');
    });

    it(`should use 20 elements and append 20 elements.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map((i) => elementCount - 10 + i);
      return testUseManyAndAppendMany(firstHalf.concat(secondHalf), 20, '22');
    });

    it(`should update 1 element and append 1 element.`, async () => {
      return testUpdateOneAndAppendOne(0, '11', '22');
    });

    it(`should update 1 element and append 2 elements.`, async () => {
      return testUpdateOneAndAppendMany(0, '11', 2, '22');
    });

    it(`should update 1 element and append 5 elements.`, async () => {
      return testUpdateOneAndAppendMany(0, '11', 5, '22');
    });

    it(`should update 1 element and append 10 elements.`, async () => {
      return testUpdateOneAndAppendMany(0, '11', 10, '22');
    });

    it(`should update 1 element and append 20 elements.`, async () => {
      return testUpdateOneAndAppendMany(0, '11', 20, '22');
    });

    it(`should update 2 elements and append 1 element.`, async () => {
      return testUpdateManyAndAppendOne([0, 1], '11', '22');
    });

    it(`should update 5 elements and append 1 element.`, async () => {
      return testUpdateManyAndAppendOne([0, 1, 2, 3, 4], '11', '22');
    });

    it(`should update 10 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map((i) => elementCount - 5 + i);
      return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22');
    });

    it(`should update 20 elements and append 1 element.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map((i) => elementCount - 10 + i);
      return testUpdateManyAndAppendOne(firstHalf.concat(secondHalf), '11', '22');
    });

    it(`should update 2 elements and append 2 elements.`, async () => {
      return testUpdateManyAndAppendMany([0, 1], '11', 2, '22');
    });

    it(`should update 5 elements and append 5 elements.`, async () => {
      return testUpdateManyAndAppendMany([0, 1, 2, 3, 4], '11', 5, '22');
    });

    it(`should update 10 elements and append 10 elements.`, async () => {
      const firstHalf = Array.from(Array(5).keys());
      const secondHalf = Array.from(Array(5).keys()).map((i) => elementCount - 5 + i);
      return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 10, '22');
    });

    it(`should update 20 elements and append 20 elements.`, async () => {
      const firstHalf = Array.from(Array(10).keys());
      const secondHalf = Array.from(Array(10).keys()).map((i) => elementCount - 10 + i);
      return testUpdateManyAndAppendMany(firstHalf.concat(secondHalf), '11', 20, '22');
    });
  });
});
