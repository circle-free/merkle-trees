# merkle-trees

`merkle-trees/js` for the compact-multi-proof appendable Merkle tree class.

`merkle-trees/eth` for compatible smart contracts and library.


## A glimpse ##

Quick example of gas savings of using appendable merkle tree library and smart contracts, over storing elements normally.

```js
const { MerkleTree } = require('merkle-trees/js');

const elementCount = 200;

// The 200 elements the contracts will start with (array of 32-byte Buffers)
const elements = generateElements(elementCount, { seed: 'ff' });

// Convert to 0x-prefixed hex strings
const hexElements = elements.map(e => '0x' + e.toString('hex'));

// The 20 indices to be updated (and therefore proved)
const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199];

// The elements to update with (array of 32-byte Buffers)
const updateElements = generateElements(indices.length, { seed: '11' });

// Convert to 0x-prefixed hex strings
const hexUpdateElements = updateElements.map(e => '0x' + e.toString('hex'));

// The 20 elements to be appended (array of 32-byte Buffers)
const appendElements = generateElements(20, { seed: '22' });

// Convert to 0x-prefixed hex strings
const hexAppendElements = appendElements.map(e => '0x' + e.toString('hex'));

// Launch a simple storage contract
const simpleStorageInstance = await Simple_Storage.new();

// Append the first 200 elements
const result1 = await simpleStorageInstance.append_many(hexElements);
console.log(result1.receipt.gasUsed);   // 4,200,282 gas used

// Use the elements at the 20 above indices, update them, and append 20 more
const result2 = await simpleStorageInstance.update_many_and_append_many(
  indices,
  hexElements,
  hexUpdateElements,
  hexAppendElements
);

console.log(result2.receipt.gasUsed);   // 582,667 gas used

// Launch a contract (using this merkle library) with empty storage
const merkleStorageInstance = await Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Standard.new();

// Create empty Merkle Tree object
const merkleOptions = {
  compact: true,
  elementPrefix: '00',
};

let merkleTree = new MerkleTree([], merkleOptions);

// Append the first 200 elements to the Merkle Tree
const appendMultiResult = merkleTree.appendMulti(elements, merkleOptions);

// Returned object contains new merkle tree and append proof
const { newMerkleTree: newMerkleTree1, proof: appendProof } = appendMultiResult;

// Proof returns needed proof arguments (array of 32-byte Buffers)
const { compactProof: compactAppendProof } = appendProof;

// Convert to 0x-prefixed hex strings
const hexAppendProof = compactAppendProof.map(p => '0x' + p.toString('hex'));

// Append the first 200 elements to the merkle storage
const result3 = await merkleStorageInstance.append_many(hexElements, hexAppendProof);
console.log(result3.receipt.gasUsed);   // 259,071 gas used (6.2% the gas cost!!)

// Since the contract storage is updated, overwrite the merkle tree with the new one
merkleTree = newMerkleTree1;

// Compare contract and local merkle roots
const retrievedRoot1 = await merkleStorageInstance.root();
console.log('0x' + merkleTree.root.toString('hex') === retrievedRoot1);   // true

// Use the elements at the 20 above indices, update them, and append 20 more elements
const updateAndAppendProof = merkleTree.updateAndAppend(
  indices,
  updateElements,
  appendElements,
  merkleOptions
);

// Returned object contains new merkle tree and combined proof
const { newMerkleTree: newMerkleTree2, proof: combinedProof } = updateAndAppendProof;

// Proof returns needed proof arguments (array of 32-byte Buffers)
const { compactProof: compactCombinedProof } = combinedProof;

// Convert to 0x-prefixed hex strings
const hexCombinedProof = compactCombinedProof.map(p => '0x' + p.toString('hex'));

// Use the elements at the 20 above indices, update them, and append 20 more
const result4 = await contractInstance.update_many_and_append_many(
  hexElements,
  hexUpdateElements,
  hexAppendElements,
  hexCombinedProof
);

console.log(result4.receipt.gasUsed);   // 131,877 gas used (22.6% the gas cost!!)

// Since the contract storage is updated, overwrite the merkle tree with the new one
merkleTree = newMerkleTree2;

// Compare merkle roots
const retrievedRoot2 = await merkleStorageInstance.root();
console.log('0x' + merkleTree.root.toString('hex') === retrievedRoot2);   // true
```

For more, see `js` directory, `eth` directory, and `tests`.
