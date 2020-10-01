# merkle-trees-js (An appendable, compact multi-provable, Merkle tree class)

## The Goal ##

A robust and well tested class to be used as the basis for dynamic lists (an eventually nested objects) to roll up to one Merkle root.
<br>

## Installing and Using ##

`npm install merkle-trees` or `yarn add merkle-trees`

```js
const MerkleTrees = require('merkle-trees/js');
```
<br>

## API / Documentation (best read top to bottom)

_NOTE: Documentation will not cover examples of Merkle trees with sorted hashing (where node pairs are ordered before hashing). While proofs for such Merkle trees are slightly smaller and cheaper, they lack some functionality. See FAQ._

_NOTE: Documentation will not cover examples of balanced Merkle trees (where the number of elements is a power of 2). These trees do not support appending elements, and are thus rather uninteresting here._

### Merkle Tree Construction ###

Will construct a Merkle Tree object from a set of elements, with tree options.
The tree's effective root is the hash of the element count and the element root.

```js
const MerkleTree = require('merkle-trees/js');

const treeOptions = {
  unbalanced: true,             // H(i, j) = i, when j = unset/null (default = true)
  sortedHash: false,             // H(i, j) = H(j, i), since i and j are sorted at hash-time (default = false)
  elementPrefix: '00'           // Hash prefix for hashing elements into nodes (prevents second pre-image attack) (default = 0x00)
};

const myTree = new MerkleTree(elements, treeOptions);   // elements is an array of 32-byte Buffers
console.log(myTree.root);                               // hash of elements.length with element merkle root (Buffer)
console.log(myTree.elementRoot);                        // element merkle root (Buffer)
console.log(myTree.depth);                              // effective depth of the Merkle tree
console.log(myTree.elements);                           // copies of items in elements (array of Buffers)
console.log(myTree.minimumCombinedProofIndex);          // minimum index needed for a "Combined-Proof" (see below)
```
<br>

### Single Element Proofs ###

#### Single Existence Proof ####

A Merkle proof can be generated to prove the existence of a single element at a specific index.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                       // say elements is an array of 20 32-byte Buffer

const proofOptions = {
  compact: false,               // reduces proof elements (other than what is being proven) to a single array of 32-byte Buffers
};

const compactProofOptions = { compact: true };

const proof1 = myTree.generateSingleProof(14, proofOptions});               // going to generate proof of element at index 14
const proof2 = myTree.generateSingleProof(14, compactProofOptions});

const {
  root,                         // the root of the Merkle tree (32-byte Buffer)
  index,                        // the index of the element being proven (same as passed in)
  element,                      // the element being proven (32-byte Buffer)
  elementCount,                 // the number of elements in the tree
  decommitments,                // the node values (witnesses) needed recompute the root (array of 32-byte Buffers)
} = proof1;

const {
  root,
  index,
  element,
  compactProof,                 // everything needed for the proof (other than what is being proven) (array of 32-byte Buffers)
} = proof2;

const proof1IsValid = MerkleTree.verifySingleProof(proof1, treeOptions);    // properties of the tree passed in via options
const proof2IsValid = MerkleTree.verifySingleProof(proof2, treeOptions);    // compact proof automatically detected

console.log(proof1IsValid);     // true
console.log(proof2IsValid);     // true
```
<br>

#### Single Update Proof ####

The same Merkle proof can be generated to prove and update an element, thereby computing a new root.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                               // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: true };
const proof = myTree.generateSingleUpdateProof(14, updateElement, proofOptions});   // updateElement is a 32-byte Buffer

const {
  root,
  index,
  element,
  updateElement,                                // the element being updated (32-byte Buffer)
  compactProof,
} = proof;

const proofIsValid = MerkleTree.verifySingleProof(proof, treeOptions);
console.log(proofIsValid);                      // true

const { root: newRoot } = myTree.updateWithSingleProof(proof, treeOptions);         // this will throw if the proof is invalid
console.log(newRoot);                           // the updated merkle tree's root

const newElements = elements.map(Buffer.from);
newElements[14] = updateElement;

const myTreeTree = new MerkleTree(newElements, treeOptions);
console.log(newRoot.equals(myTreeTree.root));   // true, since the root of a tree constructed with new set of elements matches
```
<br>

#### Update a Single Element in a Tree ####

A clean(er) way to update a single element in a Merkle tree.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                                     // say elements is an array of 20 32-byte Buffer
const proofOptions = { compact: true };
const { newMerkleTree, proof } = myTree.updateSingle(14, updateElement, proofOptions});   // returns the updated Merkle tree and the proof
const { root } = myTree.updateWithSingleProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                                             // true
```
<br>
<br>

### Multiple Element Proofs ###

_Note: There are 2 types of Multi-Proofs. The one being demonstrated here does not inherently prove the elements' indices (although this library supports a method to provably infer indices from the resulting proof), and instead is a smaller and cheaper proof. The one not being demonstrated here, while larger and more expensive, proves the indices as well, by default. While it is supported by this library (see tests), it will not be covered in this documentation (yet)._

#### Multi Existence Proof ####

A Merkle proof can be generated to prove the existence of several elements.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                       // say elements is an array of 20 32-byte Buffer

const proofOptions1 = {
  compact: false,
  indexed: false,                                                           // request proof that does not contain indices
};

const proofOptions2 = { compact: true, indexed: false };

const proof1 = myTree.generateMultiProof([3, 14, 18], proofOptions1});      // going to generate proof of element at indices 3, 14, and 18
const proof2 = myTree.generateMultiProof([3, 14, 18], proofOptions2});

const {
  root,                         // the root of the Merkle tree (32-byte Buffer)
  elements,                     // the elements being proven (array of 32-byte Buffers)
  elementCount,                 // the number of elements in the tree
  flags,                        // hash flags required for the proof (array fo Booleans)
  skips,                        // skip flags required for the proof (array fo Booleans)
  orders,                       // order flags required for the proof (array fo Booleans)
  decommitments,                // the node values (witnesses) needed recompute the root (array of 32-byte Buffers)
} = proof1;

const {
  root,
  elements,
  compactProof                  // everything needed for the proof (other than what is being proven) (array of 32-byte Buffers)
} = proof2;

const proof1IsValid = MerkleTree.verifyMultiProof(proof1, treeOptions);
const proof2IsValid = MerkleTree.verifyMultiProof(proof2, treeOptions);

console.log(proof1IsValid);     // true
console.log(proof2IsValid);     // true
```
<br>

#### Multi Update Proof ####

The same Merkle proof can be generated to prove and update several elements, thereby computing a new root.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                                         // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: true, indexed: false };
const proof = myTree.generateMultiUpdateProof([3, 14, 18], updateElements, proofOptions});    // updateElements is an array of 32-byte Buffers

const {
  elements,
  updateElements,                             // the elements to be updated (32-byte Buffer)
  compactProof,
} = proof;

const proofIsValid = MerkleTree.verifyMultiProof(proof, treeOptions);
console.log(proofIsValid);                    // true

const { root } = myTree.updateWithMultiProof(proof, treeOptions);                             // this will throw if the proof is invalid
console.log(root);                            // the updated merkle tree's root

const newElements = elements.map(Buffer.from);
newElements[3] = updateElement[0];
newElements[14] = updateElement[1];
newElements[18] = updateElement[2];

const myTreeTree = new MerkleTree(newElements, treeOptions);
console.log(root.equals(myTreeTree.root));    // true, since the root of a tree constructed with new set of elements matches
```
<br>

#### Update Several Elements in a Tree ####

A clean(er) way to update several elements in a Merkle tree.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                                             // say elements is an array of 20 32-byte Buffer
const proofOptions = { compact: true, indexed: false };
const { newMerkleTree, proof } = myTree.updateMulti([3, 14, 18], updateElement, proofOptions});   // returns the updated Merkle tree and the proof
const { root } = myTree.updateWithMultiProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                                                     // true
```
<br>
<br>


### Single and Multiple Element Append Proofs ###

#### Generate an Append Proof ####

A Merkle proof can be generated to enable appending an arbitrary number of elements to a Merkle tree.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                       // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: false };
const compactProofOptions = { compact: true };

const proof1 = myTree.generateAppendProof(proofOptions});
const proof2 = myTree.generateAppendProof(compactProofOptions});

const {
  root,                         // the root of the Merkle tree (32-byte Buffer)
  elementCount,                 // the number of elements in the tree
  decommitments,                // the node values (witnesses) needed recompute the root (array of 32-byte Buffers)
} = proof1;

const {
  root,
  compactProof,                 // everything needed for the proof (other than what is being proven) (array of 32-byte Buffers)
} = proof2;

const proof1IsValid = MerkleTree.verifyAppendProof(proof1, treeOptions);
const proof2IsValid = MerkleTree.verifyAppendProof(proof2, treeOptions);

console.log(proof1IsValid);     // true
console.log(proof2IsValid);     // true
```
<br>

#### Single And Multiple Append Proof ####

The same Merkle proof can be generated to prove and update an element, thereby computing a new root.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                               // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: true };
const proof1 = myTree.generateSingleAppendProof(appendElement, proofOptions});      // appendElement is a 32-byte Buffer
const proof2 = myTree.generateSingleAppendProof(appendElements, proofOptions});     // appendElements is an array of 32-byte Buffer2

const {
  root,
  appendElement,                                // the element being appended (32-byte Buffer)
  compactProof,
} = proof1;

const {
  root,
  appendElements,                               // the elements being appended (array of 32-byte Buffers)
  compactProof,
} = proof2;

const proof1IsValid = MerkleTree.verifyAppendProof(proof1, treeOptions);
console.log(proof1IsValid);                     // true

const proof2IsValid = MerkleTree.verifyAppendProof(proof2, treeOptions);
console.log(proof2IsValid);                     // true

const { root: newRoot1 } = myTree.appendWithAppendProof(proof1, treeOptions);       // this will throw if the proof is invalid
console.log(newRoot1);                          // the updated merkle tree's root (with the appended element)

const { root: newRoot2 } = myTree.appendWithAppendProof(proof2, treeOptions);
console.log(newRoot2);                          // the updated merkle tree's root (with the appended elements)

const newElements1 = elements.concat(appendElement);
const newElements2 = elements.concat(appendElements);

const myTreeTree1 = new MerkleTree(newElements1, treeOptions);
console.log(newRoot1.equals(myTreeTree1.root)); // true, since the root of a tree constructed with new set of elements matches

const myTreeTree2 = new MerkleTree(newElements2, treeOptions);
console.log(newRoot2.equals(myTreeTree2.root)); // true, since the root of a tree constructed with new set of elements matches
```
<br>

#### Append One or More Elements to a Tree ####

A clean(er) way to append a single or many elements to a Merkle tree.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                                     // say elements is an array of 20 32-byte Buffer
const proofOptions = { compact: true };
const { newMerkleTree, proof } = myTree.appendSingle(appendElement, proofOptions});       // returns the updated Merkle tree and the proof
const { root, elementCount } = myTree.appendWithAppendProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                                             // true
console.log(elementCount === newMerkleTree.elements.length);                              // true
```

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                                     // say elements is an array of 20 32-byte Buffer
const proofOptions = { compact: true };
const { newMerkleTree, proof } = myTree.appendMulti(appendElements, proofOptions});       // returns the updated Merkle tree and the proof
const { root, elementCount } = myTree.appendWithAppendProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                                             // true
console.log(elementCount === newMerkleTree.elements.length);                              // true
```
<br>
<br>



### Combined-Proofs ###

A Merkle proof can be generated to update a tree's root by using (proving) or updating an element, while simultaneously appending one or more elements. The catch is that one of the elements being proven (or updated) must be within a certain range from the end/right.

Therefore, it is possible to perform the possible proof permutations:
- use (prove) one element and append one element
- use (prove) one element and append several elements
- use (prove) several element and append one element
- use (prove) several element and append several elements
- update one element and append one element
- update one element and append several elements
- update several element and append one element
- update several element and append several elements

Below are just 2 examples of possible permutations.

_Note: Currently, the functions can take arrays or single elements as arguments, and return the appropriate proof and types. I am still debating if the whole library should behave this way (which reducing the API and its verbosity, but increases complexity and possible return types), or if everything should be explicit (which increases the API and its verbosity, but decreases complexity and possible return types)._

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                                               // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: true };

// use (prove) element at index 15 and append an array of elements
const { newMerkleTree, proof } = myTree.useAndAppend(15, appendElements, proofOptions);             // returns updated tree and proof

// proof contains an index and an element, since the underlying proof is a Single Proof
const { root, index, element, appendElements, compactProof } = proof;

const proofIsValid = MerkleTree.verifyCombinedProof(proof, treeOptions);
console.log(proofIsValid);                                      // true

const { root, elementCount } = myTree.appendWithCombinedProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                   // true
console.log(elementCount === newMerkleTree.elements.length);    // true
```

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                                               // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: true };

// update elements at indices 3, 14, and 18 and append one element
const { newMerkleTree, proof } = myTree.updateAndAppend([3, 14, 18], updateElements, appendElement, proofOptions);  // returns updated tree and proof

// proof contains elements, since the underlying proof is a Multi Proof
const { root, elements, appendElement, compactProof } = proof;

const proofIsValid = MerkleTree.verifyCombinedProof(proof, treeOptions);
console.log(proofIsValid);                                      // true

const { root, elementCount } = myTree.appendWithCombinedProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                   // true
console.log(elementCount === newMerkleTree.elements.length);    // true
```
<br>
<br>

### Inferring Indices ###

Infer element indices from a Multi proof that does not explicitly prove the indices of the elements.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);                   // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: true, indexed: false };
const proof = myTree.generateMultiProof([3, 14, 18], proofOptions);     // prove elements at indices 3, 14, 18
const { root, elements, compactProof } = proof;                         // indices are not part of the proof

// This can be done with MerkleTree.getCombinedProofIndices as well
const indices = MerkleTree.getMultiProofIndices(proof, treeOptions);
console.log(indices);                                                   // [3, 14, 18]
```
<br>
<br>

### Size Proof ###

Generate a proof of the Merkle tree's size. The simple way relies on the fact that the tree's size is already hashed into the root, and thus only the element root and tree size is needed. The non-simple way generates a Single proof for the tree's last element as well.

```js
const MerkleTree = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };
const myTree = new MerkleTree(elements, treeOptions);       // say elements is an array of 20 32-byte Buffer

const proofOptions = { compact: true, simple: false };
const simpleProofOptions = { compact: true, simple: true };

const proof1 = myTree.generateSizeProof(proofOptions);
const proof2 = myTree.generateSizeProof(simpleProofOptions);

const { root, elementCount, compactProof } = proof1;
const { root, elementCount, elementRoot } = proof2;

const proof1IsValid = MerkleTree.verifySizeProof(proof1, treeOptions);
console.log(proof1IsValid);                                 // true

const proof2IsValid = MerkleTree.verifySizeProof(proof1, treeOptions);
console.log(proof2IsValid);                                 // true
```
<br>
<br>

## Various TODOs and Notes (In Order of Priority) ##

- [ ] Consolidate single/multi update function (or de-consolidate everything... hmm...)
- [ ] option to output all data as eth-compatible prefixed hex strings
- [ ] deleting elements (from the end)
- [ ] support for arbitrary size elements
- [ ] TypeScript (possibly with a Proof class)
- [ ] index-less (existence-only) single-proofs
- [ ] support index-less (compact existence-only) single-proofs
- [ ] unbalanced proofs for indexed multi-proofs (with tests)
- [ ] enable compact proofs for "large" trees (proof hash count > 255) with multiple 32-byte flags, given stop bits
- [ ] bitCount256
- [ ] deleting elements at any point
- [ ] re-balancing a tree (that has undergone several deletions)
- [ ] explore, test, and document failure cases (or rather, cases with invalid proofs)
- [ ] consider separate set of js implementations easily translatable to solidity (16 local vars, no maps, etc)
- [ ] verify and update single proof can probably be cheaper with sortedHash given that element count is required
- [ ] some auto-magic mechanism that keeps prioritized elements "to the right"
- [ ] recursive proofs (arrays of arrays)
- [ ] recursive proofs (objects of objects)
- [ ] benchmarking
- [ ] giving options better names (i.e. flag > existence-proof vs. indexed > index-proof)
- [ ] visual documentation of how individual proofs work
- [ ] test how null/undefined elements before the append index affect trees/proofs
- [ ] explore efficiency of separate boolean-array, in the multi-proof, to inform when to take a hash as an append-decommitment
- [ ] Bring Your Own Hash Function
- [ ] serialize method (likely just elements, possibly redundant)
- [X] ~~API documentation (you tell me, did I do a good job?)~~
- [X] ~~append one/many with a single or multi proof~~
- [X] ~~update one/many and append one/many~~
- [X] ~~explore combined and existence-only (flag) multi-proofs, without sorted hashing, (possibly separate set of hash order booleans)~~
- [X] ~~given hash order booleans, implement index inferring for multi-proofs without sorted hashing (it is possible)~~
- [X] ~~argument validation (i.e. parameter lengths, mutually exclusive options like indexed and compact)~~
- [X] ~~Size Proofs using Append-Proof~~
- [X] ~~Size Proofs using just element root (simple)~~
- [X] ~~Handle empty tree (no elements to start)~~


## Tests ##

```console
foo@bar:~$ nvm use 14
Now using node v14.12.0 (npm v6.14.8)
foo@bar:~$ yarn install
...
Done in 0.16s.
foo@bar:~$ yarn test
...
630 passing (14s)
```

## FAQ ##

Q. What can Merkle trees with the `sortedHash` option not do?

A. They can't be used to generate Multi-Poofs where proving or inferring indices is possible and they can't be used to generate "non-simple" Size proofs.
