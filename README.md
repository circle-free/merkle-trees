# merkle-trees

`merkle-trees/js` in the `js` directory for the compact-multi-proof appendable Merkle tree class.

`merkle-trees/eth` in the `eth` directory for compatible smart contracts and library.


## A glimpse ##

```js
const MerkleTree = require('merkle-trees/js');

// The 200 elements the contracts will start with
const elementCount = 200;
const elements = generateElements(elementCount, { seed: 'ff' });                // 200 "random" 32-byte Buffers
const hexElements = elements.map(e => '0x' + e.toString('hex'));

// The 20 indices to be updated, and the elements to update with
const updateIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199];
const updateElements = generateElements(updateIndices.length, { seed: '11' });  // 20 "random" 32-byte Buffers
const hexUpdateElements = updateElements.map(e => '0x' + e.toString('hex'));

// The 20 elements to be appended
const appendElements = generateElements(20, { seed: '22' });                    // 20 "random" 32-byte Buffers
const hexAppendElements = appendElements.map(e => '0x' + e.toString('hex'));

// Launch a simple storage contract and append the first 200 elements
const simpleStorageInstance = await Simple_Storage.new();
const { receipt: simpleStorageDeployReceipt } = await simpleStorageInstance.append_many(hexElements);
console.log(simpleStorageDeployReceipt.gasUsed);                                // 4,184,952 gas used

// Use the elements at the 20 above indices, update them, and append 20 more elements
const { receipt: simpleStorageReceipt } = await simpleStorageInstance.update_many_and_append_many(indices, hexElements, hexUpdateElements, hexAppendElements);
console.log(simpleStorageReceipt.gasUsed);                                      // 577,727 gas used

// Launch a contract (using this merkle library) with empty storage (and empty merkle tree)
const merkleStorageInstance = await Merkle_Storage_Using_Library.new();
const merkleOptions = { unbalance: true, compact: true };
let merkleTree = new MerkleTree([], merkleOptions);

// Append the first 200 elements
const { newMerkleTree: newMerkleTree1, proof: appendProof } = merkleTree.appendMulti(elements, merkleOptions);
const { compactProof: appendCompactProof } = appendProof;
const hexAppendProof = appendCompactProof.map(p => '0x' + p.toString('hex'));
const { receipt: merkleAppendReceipt } = await merkleStorageInstance.append_many(hexElements, hexAppendProof);
merkleTree = newMerkleTree1;
console.log(merkleAppendReceipt.gasUsed);                                       // 245,694 gas used (5.87% the gas cost!!)

// Compare merkle roots
const retrievedRoot1 = await merkleStorageInstance.root();
console.log(merkleTree.root.toString('hex') === retrievedRoot1.slice(2));       // true

// Use the elements at the 20 above indices, update them, and append 20 more elements
const { newMerkleTree: newMerkleTree2, proof: combinedProof } = merkleTree.updateAndAppend(indices, updateElements, appendElements, merkleOptions);
const { compactProof: compactCombinedProof } = combinedProof;
const hexCombinedProof = compactCombinedProof.map(p => '0x' + p.toString('hex'));
const { receipt: merkleCombinedReceipt } = await contractInstance.update_many_and_append_many(hexElements, hexUpdateElements, hexAppendElements, hexCombinedProof);
merkleTree = newMerkleTree2;
console.log(merkleCombinedReceipt.gasUsed);                                     // 122,496 gas used (21.20% the gas cost!!)

// Compare merkle roots
const retrievedRoot2 = await merkleStorageInstance.root();
console.log(merkleTree.root.toString('hex') === retrievedRoot2.slice(2));       // true
```

For more, see `js` directory, `eth` directory, and `tests`.
