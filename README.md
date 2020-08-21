# merkle-trees

`merkle-trees/js` in the `js` directory for the compact-multi-proof appendable Merkle tree class.

`merkle-trees/eth` in the `eth` directory for compatible smart contracts and library.


## A glimpse ##

```js
const MerkleTree = require('merkle-trees/js');

const elementCount = 20;
const indices = [19, 14, 13, 12, 3, 2, 1, 0];
const elements = generateElements(elementCount, { seed: 'ff' });  // 20 32-byte Buffers

// Launch a simple storage contract with 20 elements in storage
const simpleStorageContractInstance = await Simple_Storage.new();
const hexElements = elements.map(e => '0x' + e.toString('hex'));
await simpleStorageContractInstance.append_many(0, hexElements);

// use the elements at the 8 above indices, update them, and append 8 more
const { receipt: simpleStorageReceipt } = await simpleStorageContractInstance.use_and_update_and_append_many(indices, elementCount);
console.log(simpleStorageReceipt.gasUsed); // 236,384

// Launch a merkle storage contract with just the Merkle root of the 20 elements in storage
const merkleStorageContractInstance = await Merkle_Storage.new();
merkleTree = new MerkleTree(elements, options);
await merkleStorageContractInstance._debug_set_root('0x' + merkleTree.root.toString('hex'));

// Prepare the compact multi-proof
const { elements, proof } = merkleTree.generateCombinedProof(indices, { bitFlags: true });
const hexElements = elements.map(e => '0x' + e.toString('hex'));
const hexProof = proof.map(p => '0x' + p.toString('hex'));

// use the elements at the 8 above indices (by proving them), update them, append 8 more, and save the merkle root to storage
const { receipt: merkleStorageReceipt } = await merkleStorageContractInstance.use_and_update_and_append_many(elementCount, hexElements, hexProof);
console.log(merkleStorageReceipt.gasUsed); // 70,408  (less than 30% the cost)

const retrievedRoot = await contractInstance.root();
console.log(retrievedRoot === '0x' + merkleTree.root.toString('hex'));  // true
```
