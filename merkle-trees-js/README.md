# Merkle Tree Class


## Generic Merkle Tree Construction ##

Will construct a Merkle Tree object from a set of elements with the following options:

* unbalanced (default = true), such that Hash ( i , j ) = i when j = unset/null.
* sortedHash (default = true), such that Hash ( i , j ) = Hash ( j, i ), since i and j are sorted at hash-time only.
* hash prefix (default = 0x00) for hashing elements into nodes (preventing the second pre-image attack).

The tree's exposed root is the hash of the element count and the element root (which is not exposed).

```js
const MerkleTree = require('./src');

const options = { unbalanced: true, sortedHash: true, elementPrefix: '00' };

const myTree = new MerkleTree(someArrayOf32ByteBuffers, options);
console.log(myTree.root);   // hash of someArrayOf32ByteBuffers.length with element merkle root
console.log(myTree.elements);   // copies of items in someArrayOf32ByteBuffers
```


## Single Element Proofs ##

* Merkle proof can be generated to prove the existence of a single element at a specific index.
* Proof of existence of a single element, without its index, will be implemented soon.
* Single-element Merkle proof can be used to update the root with a replacement element.

```js
const MerkleTree = require('./src');

const myTree = new MerkleTree(someArrayOf32ByteBuffers);

// merkleTree is immutable, so it will give you back a new tree and a proof
const { newMerkleTree: myUpdatedTree, proof } = myTree.updateSingle(0, someNew32ByteBuffer);
const { index, element, ... } = proof;

const proofIsValid = MerkleTree.verifySingleProof(proof);
console.log(`Element ${element.toString('hex')} at index ${index} does ${proofIsValid ? '' : 'not'} exists.`); // it does

const { root } = MerkleTree.updateWithSingleProof(proof);
console.log(myUpdatedTree.root.equals(root)); // true
```


## Multiple Element Proofs ##

* Merkle proof can be generated to prove the existence of several elements at specific indices.
* Merkle proof can be generated to prove the existence of several elements, without their specific indices.
* Multi-element Merkle proof can be used to update the root with a replacement elements.

```js
const MerkleTree = require('./src');

const myTree = new MerkleTree(someArrayOf32ByteBuffers);

const options = { indexed: false };
// merkleTree is immutable, so it will give you back a new tree and a proof
const { newMerkleTree: myUpdatedTree, proof } = myTree.updateMulti([20, 9, 2], someArrayOf32ByteBuffersOfLength3, options);
const { elements, ... } = proof;

const proofIsValid = MerkleTree.verifyMultiProof(proof, options);
console.log(`Elements ${elements.map(e => e.toString('hex'))} do ${proofIsValid ? '' : 'not'} exist.`); // they do

const { root } = MerkleTree.updateWithMultiProof(proof, options);
console.log(myUpdatedTree.root.equals(root)); // still true
```


## Single and Multiple Element Append Proofs ##

* For unbalanced Merkle Trees, Merkle proof can be generated to update a root by appending a single element.
* For unbalanced Merkle Trees, Merkle proof can be generated to update a root by appending multiple elements.

```js
const MerkleTree = require('./src');

const myTree = new MerkleTree(someArrayOf32ByteBuffers);

const options = { indexed: false };
// merkleTree is immutable, so it will give you back a new tree and a proof
const { newMerkleTree: myUpdatedTree, proof } = myTree.appendMulti(someArrayOf32ByteBuffersOfLength4, options);

const proofIsValid = MerkleTree.verifyAppendProof(proof, options);
console.log(`The proof is ${proofIsValid ? '' : 'not'} sufficient to append items.`); // it is

const { root } = MerkleTree.appendMultiWithProof(proof, options);
console.log(myUpdatedTree.root.equals(root)); // still true

const myOtherTree = new MerkleTree(someArrayOf32ByteBuffers.concat(someArrayOf32ByteBuffersOfLength4));
console.log(myUpdatedTree.root.equals(myOtherTree.root)); // very much still true

console.log(`myTree had ${myTree.elements.length} elements, an now myUpdatedTree has ${myUpdatedTree.elements.length}.`);
```


## Multiple Element Update and Append Proofs ##

* For unbalanced Merkle Trees, Merkle proof can be generated to update a root by updating and appending multiple elements.
* Limitation is that one of the elements being proven (or updated) must be within a certain range from the end/right.

```js
const MerkleTree = require('./src');

const myTree = new MerkleTree(someArrayOf32ByteBuffersOfLength20);

const options = { indexed: false };

const oneIndexMustBeEqualOrGreaterThanThis = myTree.minimumCombinedProofIndex;  // 16 in this case

// merkleTree is immutable, so it will give you back a new tree and a proof
const { newMerkleTree, proof } = myTree.updateAndAppendMulti([17, 9, 2], ThreeBuffers, SixBuffers, options);

const proofIsValid = MerkleTree.verifyCombinedProof(proof, options);
console.log(`The proof is ${proofIsValid ? '' : 'not'} sufficient to update and append items.`); // it is

const { root } = MerkleTree.updateAndAppendWithCombinedProof(proof, options);
console.log(newMerkleTree.root.equals(root)); // still true
```


## Unbalanced Tree Optimizations ##

Given an unbalanced tree, where elements to the right of the append index do not exist, there may be some single and multi-proof optimizations, particularly with verifications.


## The Goal ##

A robust and well tested class to be used as the basis for dynamic lists (an eventually nested objects) to roll up to one Merkle root.
