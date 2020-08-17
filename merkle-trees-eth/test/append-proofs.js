const chai = require('chai');
const { expect } = chai;

const { generateElements } = require('./helpers');
const MerkleTree = require('../../merkle-trees-js/src');

const Append_Proofs = artifacts.require("Append_Proofs");

describe("Append_Proofs", async accounts => {
  const options = {
    unbalanced: true,
    sortedHash: false,
    elementPrefix: '0000000000000000000000000000000000000000000000000000000000000000',
  };

  let contractInstance = null;
  let merkleTree = null;

  beforeEach(async () => {
    contractInstance = await Append_Proofs.new();
    const elements = generateElements(1, { seed: 1 });
    merkleTree = new MerkleTree(elements, options);
    await contractInstance.set_root('0x' + merkleTree.root.toString('hex'));
  });

  it("should append 1 new element for 29,616 gas.", async () => {
    const newElement = generateElements(1, { seed: 2 })[0];
    const hexNewElement = '0x' + newElement.toString('hex');
    const { decommitments: appendDecommitments } = merkleTree.generateSingleAppendProof(newElement);
    const hexAppendDecommitments = appendDecommitments.map(d => '0x' + d.toString('hex'));
    const { receipt: appendReceipt } = await contractInstance.append_one(1, hexNewElement, hexAppendDecommitments);

    expect(appendReceipt.gasUsed).to.equal(29616);

    const newMerkleTree = merkleTree.appendSingle(newElement);
    const retrievedRoot = await contractInstance.root();
    expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

    // Can't do this until SingleProofs lib supports unbalanced trees
    // const { decommitments: verifyDecommitments } = newMerkleTree.generateSingleProof(1);
    // const hexVerifyDecommitments = verifyDecommitments.map(d => '0x' + d.toString('hex'));
    // const newElementExists = await contractInstance.verify_one.call(2, 1, hexNewElement, hexVerifyDecommitments);
    // expect(newElementExists).to.equal(true);
  });

  it("should append 1 new element, 100 times consecutively, for 3,151,740 gas.", async () => {
    const newElements = generateElements(100, { seed: 3 });

    const cumulativeGasUsed = await newElements.reduce(async (cGasUsed, newElement, i) => {
      const cumulativeGasUsed = await cGasUsed;
      const hexNewElement = '0x' + newElement.toString('hex');
      const { decommitments: appendDecommitments } = merkleTree.generateSingleAppendProof(newElement);
      const hexAppendDecommitments = appendDecommitments.map(d => '0x' + d.toString('hex'));
      const { receipt } = await contractInstance.append_one(1 + i, hexNewElement, hexAppendDecommitments);
      merkleTree = merkleTree.appendSingle(newElement);
      
      return cumulativeGasUsed + receipt.gasUsed;
    }, 0);

    expect(cumulativeGasUsed).to.equal(3151740);

    const retrievedRoot = await contractInstance.root();
    expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));
    
    // Can't do this until SingleProofs lib supports unbalanced trees
    // Array(10).fill(0).map((_, i) => 10*(i+1)).forEach(async (index) => {
    //   const { decommitments: verifyDecommitments, element } = merkleTree.generateSingleProof(index);
    //   const hexVerifyDecommitments = verifyDecommitments.map(d => '0x' + d.toString('hex'));
    //   const hexElement = '0x' + element.toString('hex');
    //   const elementExists = await contractInstance.verify_one.call(101, index, hexElement, hexVerifyDecommitments);
    //   expect(elementExists).to.equal(true);
    // });
  });

  it(`should append 5 new elements, for 35,648 gas.`, async () => {
    const newElementCount = 5;
    const newElements = generateElements(newElementCount, { seed: 2 });
    const hexNewElements = newElements.map(element => '0x' + element.toString('hex'));
    const { decommitments: appendDecommitments } = merkleTree.generateMultiAppendProof(newElements);
    const hexAppendDecommitments = appendDecommitments.map(d => '0x' + d.toString('hex'));
    const { receipt: appendReceipt } = await contractInstance.append_many(1, hexNewElements, hexAppendDecommitments);

    expect(appendReceipt.gasUsed).to.equal(35648);
    
    const newMerkleTree = merkleTree.appendMulti(newElements);
    const retrievedRoot = await contractInstance.root();
    expect(retrievedRoot).to.equal('0x' + newMerkleTree.root.toString('hex'));

    // Can't do this until SingleProofs lib supports unbalanced trees
    // const { decommitments: verifyDecommitments } = newMerkleTree.generateSingleProof(5);
    // const hexVerifyDecommitments = verifyDecommitments.map(d => '0x' + d.toString('hex'));
    // const newElementExists = await contractInstance.verify_one.call(2, 5, hexNewElement, hexVerifyDecommitments);
    // expect(newElementExists).to.equal(true);
  });

  it(`should append 5 new elements at 5 respective new indices, 100 times consecutively, for 4,068,121 gas.`, async () => {
    const newElementCount = 5;
    const newElements = Array.from({ length: 100 }, (_, i) => generateElements(newElementCount, { seed: 3 + i }));

    const cumulativeGasUsed = await newElements.reduce(async (cGasUsed, newElements, i) => {
      const cumulativeGasUsed = await cGasUsed;
      const hexNewElements = newElements.map(element => '0x' + element.toString('hex'));;
      const { decommitments: appendDecommitments } = merkleTree.generateMultiAppendProof(newElements);
      const hexAppendDecommitments = appendDecommitments.map(d => '0x' + d.toString('hex'));
      const { receipt } = await contractInstance.append_many(1 + i*newElementCount, hexNewElements, hexAppendDecommitments);
      merkleTree = merkleTree.appendMulti(newElements);
      
      return cumulativeGasUsed + receipt.gasUsed;
    }, 0);

    const retrievedRoot = await contractInstance.root();
    expect(retrievedRoot).to.equal('0x' + merkleTree.root.toString('hex'));

    expect(cumulativeGasUsed).to.equal(4068121);
    
    // Can't spot check until SingleProofs lib supports unbalanced trees
  });
});
