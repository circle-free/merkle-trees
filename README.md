# merkle-trees

`merkle-trees/js` in the `js` directory for the compact-multi-proof appendable Merkle tree class.

`merkle-trees/eth` in the `eth` directory for compatible smart contracts and library.


## A glimpse ##

```js
const MerkleTree = require('merkle-trees/js');

const elementCount = 20;
const indices = [0, 1, 2, 3, 12, 13, 14, 19];
const elements = generateElements(elementCount, { seed: 'ff' });  // 20 32-byte Buffers

// Launch a simple storage contract with 20 elements in storage
const simpleStorageContractInstance = await Simple_Storage.new();
const hexElements = elements.map(e => '0x' + e.toString('hex'));
await simpleStorageContractInstance.append_many(0, hexElements);

// Use the elements at the 8 above indices, update them, and append 8 more
const { receipt: simpleStorageReceipt } = await simpleStorageContractInstance.use_and_update_and_append_many(indices, elementCount);
console.log(simpleStorageReceipt.gasUsed); // 236,384

// Launch a contract (using merkle library) with just the Merkle root of the 20 elements in storage
const merkleStorageContractInstance = await Merkle_Storage_Using_Library.new();
const merkleOptions = { unbalance: true };
merkleTree = new MerkleTree(elements, merkleOptions);
await merkleStorageContractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));

// Prepare the compact multi-proof
const proofOptions = { compact: true };
const { elements, compactProof } = merkleTree.generateCombinedProof(indices, proofOptions);
const hexElements = elements.map(e => '0x' + e.toString('hex'));
const hexProof = compactProof.map(p => '0x' + p.toString('hex'));

// With the proof, a contract can use the 8 items, update them however it wants, append (in this case) 8 more, and save the merkle root to storage
const { receipt: merkleStorageReceipt } = await merkleStorageContractInstance.use_and_update_and_append_many(elementCount, hexElements, hexProof);
console.log(merkleStorageReceipt.gasUsed); // 63,728  (less than 27% the cost)

const retrievedRoot = await contractInstance.root();
console.log(retrievedRoot);  // merkle root of the new set of elements, 8 of which were updated and 8 of which were newly appended
```

For more, see tests.
