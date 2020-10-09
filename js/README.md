# merkle-trees-js (An appendable, compact multi-provable, Merkle tree class)

## The Goal ##

A robust and well tested class to be used as the basis for dynamic lists (an eventually nested objects) to roll up to one Merkle root.
<br>
<br>

## Installing and Using ##

`npm install merkle-trees` or `yarn add merkle-trees`

```js
const { MerkleTree } = require('merkle-trees/js');
```
<br>

## API / Documentation (best read top to bottom)

_NOTE: Documentation will not cover examples of Merkle trees with sorted hashing (where node pairs are ordered before hashing). While proofs for such Merkle trees are slightly smaller and cheaper, they lack some functionality. See FAQ._

_NOTE: Documentation will not cover examples of balanced Merkle trees (where the number of elements is a power of 2). These trees do not support appending elements, and are thus rather uninteresting here._

### Merkle Tree Construction ###

Will construct a Merkle Tree object from a set of elements, with tree options.
The tree's effective root is the hash of the element count and the element root.

```js
const { MerkleTree } = require('merkle-trees/js');

const treeOptions = {
  unbalanced: true,     // H(i, j) = i, when j = unset/null (default = true)
  sortedHash: false,    // H(i, j) = H(j, i), i and j are sorted at hash-time (default = false)
  elementPrefix: '00'   // Leaf prefix for to prevent second pre-image attack (default = 0x00)
};

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);

console.log(myTree.root);                         // appendable tree root (Buffer)
console.log(myTree.elementRoot);                  // element merkle root (Buffer)
console.log(myTree.depth);                        // depth of the Merkle tree
console.log(myTree.elements);                     // copies of elements (array of Buffers)
console.log(myTree.minimumCombinedProofIndex);    // minimum index needed for a Combined-Proof
```
<br>

### Single Element Proofs ###

#### Single Existence Proof ####

A Merkle proof can be generated to prove the existence of a single element at a specific index.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);

const proofOptions = {
  compact: false,   // reduces ancillary proof elements to a single array of 32-byte Buffers
};

const compactProofOptions = { compact: true };

// Generate normal and compact proofs of element at index 14
const proof1 = myTree.generateSingleProof(14, proofOptions});
const proof2 = myTree.generateSingleProof(14, compactProofOptions});

const {
  root,             // the root of the Merkle tree (32-byte Buffer)
  index,            // the index of the element being proven (same as passed in)
  element,          // clone of the element being proven (32-byte Buffer)
  elementCount,     // the number of elements in the tree
  decommitments,    // witness data needed recompute the root (array of 32-byte Buffers)
} = proof1;

const {
  root,
  index,
  element,
  compactProof,     // ancillary proof elements (array of 32-byte Buffers)
} = proof2;

// Properties of the tree need to be passed as options to the static method
console.log(MerkleTree.verifySingleProof(proof1, treeOptions));     // true

// Compact proof automatically detected
console.log(MerkleTree.verifySingleProof(proof2, treeOptions));     // true
```
<br>

#### Single Update Proof ####

The same Merkle proof can be generated to prove and update an element, thereby computing a new root.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);

const proofOptions = { compact: true };

// UpdateElement is a 32-byte Buffer, to replace element at index 14
const proof = myTree.generateSingleUpdateProof(14, updateElement, proofOptions});

const {
  root,
  index,
  element,
  updateElement,    // the element being updated (32-byte Buffer)
  compactProof,
} = proof;

console.log(MerkleTree.verifySingleProof(proof, treeOptions));    // true

// Returns the updated merkle tree's root. This will throw if the proof is invalid.
const { root: newRoot } = myTree.updateWithSingleProof(proof, treeOptions);

// Create a new and updated set of elements
const newElements = elements.map(Buffer.from);
newElements[14] = updateElement;

// Build a new tree with the update set of elements
const myTreeTree = new MerkleTree(newElements, treeOptions);
console.log(newRoot.equals(myTreeTree.root));   // true
```
<br>

#### Update a Single Element in a Tree ####

A clean(er) way to update a single element in a Merkle tree.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true };

// Returns the updated Merkle tree and the proof.
const { newMerkleTree, proof } = myTree.updateSingle(14, updateElement, proofOptions});
const { root } = myTree.updateWithSingleProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));   // true
```
<br>
<br>

### Multiple Element Proofs ###

_Note: There are 2 types of Multi-Proofs. The one being demonstrated here does not inherently prove the elements' indices (although this library supports a method to provably infer indices from the resulting proof), and instead is a smaller and cheaper proof. The one not being demonstrated here, while larger and more expensive, proves the indices as well, by default. While it is supported by this library (see tests), it will not be covered in this documentation (yet)._

#### Multi Existence Proof ####

A Merkle proof can be generated to prove the existence of several elements.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);

const proofOptions1 = {
  compact: false,
  indexed: false,   // request proof that does not contain indices
};

const proofOptions2 = { compact: true, indexed: false };

// Generate normal and compact proof of elements at indices 3, 14, and 18
const proof1 = myTree.generateMultiProof([3, 14, 18], proofOptions1});
const proof2 = myTree.generateMultiProof([3, 14, 18], proofOptions2});

const {
  root,             // the root of the Merkle tree (32-byte Buffer)
  elements,         // the elements being proven (array of 32-byte Buffers)
  elementCount,     // the number of elements in the tree
  flags,            // hash flags required for the proof (array fo Booleans)
  skips,            // skip flags required for the proof (array fo Booleans)
  orders,           // order flags required for the proof (array fo Booleans)
  decommitments,    // witness data needed recompute the root (array of 32-byte Buffers)
} = proof1;

const {
  root,
  elements,
  compactProof      // ancillary proof elements (array of 32-byte Buffers)
} = proof2;

console.log(MerkleTree.verifyMultiProof(proof1, treeOptions));    // true
console.log(MerkleTree.verifyMultiProof(proof2, treeOptions));     // true
```
<br>

#### Multi Update Proof ####

The same Merkle proof can be generated to prove and update several elements, thereby computing a new root.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);

const proofOptions = { compact: true, indexed: false };

// Generate compact multi proof to replace elements at indices 3, 14, and 18 with
// updateElements (an array of 32-byte Buffers)
const proof = myTree.generateMultiUpdateProof([3, 14, 18], updateElements, proofOptions});

const {
  root,
  elements,
  updateElements,   // the elements to be updated (array of 32-byte Buffers)
  compactProof,
} = proof;

console.log(MerkleTree.verifyMultiProof(proof, treeOptions));   // true

// Get the root of the updated Merkle tree. This will throw if the proof is invalid.
const { root } = myTree.updateWithMultiProof(proof, treeOptions);

// Create a new and updated set of elements
const newElements = elements.map(Buffer.from);
newElements[3] = updateElement[0];
newElements[14] = updateElement[1];
newElements[18] = updateElement[2];

// Build a new tree with the update set of elements
const myTreeTree = new MerkleTree(newElements, treeOptions);
console.log(root.equals(myTreeTree.root));    // true
```
<br>

#### Update Several Elements in a Tree ####

A clean(er) way to update several elements in a Merkle tree.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true, indexed: false };

// Returns the updated Merkle tree and the proof.
const { newMerkleTree, proof } = myTree.updateMulti([3, 14, 18], updateElement, proofOptions});
const { root } = myTree.updateWithMultiProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));   // true
```
<br>
<br>


### Single and Multiple Element Append Proofs ###

#### Generate an Append Proof ####

A Merkle proof can be generated to enable appending an arbitrary number of elements to a Merkle tree.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);

const proofOptions = { compact: false };
const compactProofOptions = { compact: true };

// Generate a normal and compact append proof
const proof1 = myTree.generateAppendProof(proofOptions});
const proof2 = myTree.generateAppendProof(compactProofOptions});

const {
  root,             // the root of the Merkle tree (32-byte Buffer)
  elementCount,     // the number of elements in the tree
  decommitments,    // witness data needed recompute the root (array of 32-byte Buffers)
} = proof1;

const {
  root,
  compactProof,     // ancillary proof elements (array of 32-byte Buffers)
} = proof2;

console.log(MerkleTree.verifyAppendProof(proof1, treeOptions));   // true
console.log(MerkleTree.verifyAppendProof(proof2, treeOptions));   // true
```
<br>

#### Single And Multiple Append Proof ####

The same Merkle proof can be generated to prove and update an element, thereby computing a new root.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true };

// Generate a compact append proof to append appendElement (a 32-byte Buffer)
const proof1 = myTree.generateSingleAppendProof(appendElement, proofOptions});

// Generate a compact append proof to append appendElements (an array of 32-byte Buffers)
const proof2 = myTree.generateSingleAppendProof(appendElements, proofOptions});

const {
  root,
  appendElement,    // the element being appended (32-byte Buffer)
  compactProof,
} = proof1;

const {
  root,
  appendElements,   // the elements being appended (array of 32-byte Buffers)
  compactProof,
} = proof2;

console.log(MerkleTree.verifyAppendProof(proof1, treeOptions));   // true
console.log(MerkleTree.verifyAppendProof(proof2, treeOptions));   // true

// Get the root of the updated Merkle tree. This will throw if the proof is invalid.
const { root: newRoot1 } = myTree.appendWithAppendProof(proof1, treeOptions);

// Get the root of the updated Merkle tree. This will throw if the proof is invalid.
const { root: newRoot2 } = myTree.appendWithAppendProof(proof2, treeOptions);

// Create new and updated sets of elements, with one and several appended elements, respectively
const newElements1 = elements.concat(appendElement);
const newElements2 = elements.concat(appendElements);

// Build a new tree with the new elements (with the appended element)
const myTreeTree1 = new MerkleTree(newElements1, treeOptions);
console.log(newRoot1.equals(myTreeTree1.root));   // true

// Build a new tree with the new elements (with the appended elements)
const myTreeTree2 = new MerkleTree(newElements2, treeOptions);
console.log(newRoot2.equals(myTreeTree2.root));   // true
```
<br>

#### Append One or More Elements to a Tree ####

A clean(er) way to append a single or many elements to a Merkle tree.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true };

// Returns the updated Merkle tree and the proof.
const { newMerkleTree, proof } = myTree.appendSingle(appendElement, proofOptions});
const { root, elementCount } = myTree.appendWithAppendProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                   // true
console.log(elementCount === newMerkleTree.elements.length);    // true
```

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true };

// Returns the updated Merkle tree and the proof.
const { newMerkleTree, proof } = myTree.appendMulti(appendElements, proofOptions});
const { root, elementCount } = myTree.appendWithAppendProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                   // true
console.log(elementCount === newMerkleTree.elements.length);    // true
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
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true };

// Use (prove) element at index 15 and append an array of elements.
// Returns the updated Merkle tree and the proof.
// Will throw if the index is less than myTree.minimumCombinedProofIndex
const { newMerkleTree, proof } = myTree.useAndAppend(15, appendElements, proofOptions);

// Proof contains an index and an element, since the underlying proof is a Single Proof
const { root, index, element, appendElements, compactProof } = proof;
console.log(MerkleTree.verifyCombinedProof(proof, treeOptions));    // true

// Get the root and size of the updated Merkle tree. This will throw if the proof is invalid.
const { root, elementCount } = myTree.appendWithCombinedProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                   // true
console.log(elementCount === newMerkleTree.elements.length);    // true
```

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true };

// Update elements at indices 3, 14, and 18 and append one element.
// Returns the updated Merkle tree and the proof.
// Will throw if last index is less than myTree.minimumCombinedProofIndex
const { newMerkleTree, proof } = myTree.updateAndAppend(
  [3, 14, 18],
  updateElements,
  appendElement,
  proofOptions
);

// proof contains elements, since the underlying proof is a Multi Proof
const { root, elements, appendElement, compactProof } = proof;
console.log(MerkleTree.verifyCombinedProof(proof, treeOptions));    // true

// Get the root and size of the updated Merkle tree. This will throw if the proof is invalid.
const { root, elementCount } = myTree.appendWithCombinedProof(proof, treeOptions);
console.log(root.equals(newMerkleTree.root));                   // true
console.log(elementCount === newMerkleTree.elements.length);    // true
```
<br>
<br>

### Inferring Indices ###

Infer element indices from a Multi proof that does not explicitly prove the indices of the elements.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);
const proofOptions = { compact: true, indexed: false };

// Generate a compact multi proof that does not explicitly contain indices
const proof = myTree.generateMultiProof([3, 14, 18], proofOptions);

// As expected,. indices are not part of the proof.
const { root, elements, compactProof } = proof;

// Infer the indices of the elements being proven, using the proof itself.
// This can be done with MerkleTree.getCombinedProofIndices as well
console.log(MerkleTree.getMultiProofIndices(proof, treeOptions));   // [3, 14, 18]
```
<br>
<br>

### Size Proof ###

Generate a proof of the Merkle tree's size. The simple way relies on the fact that the tree's size is already hashed into the root, and thus only the element root and tree size is needed. The non-simple way generates a Single proof for the tree's last element as well.

```js
const { MerkleTree } = require('merkle-trees/js');
const treeOptions = { unbalanced: true, sortedHash: false, elementPrefix: '00' };

// In this case, elements is an array of 32-byte Buffers (not shown)
const myTree = new MerkleTree(elements, treeOptions);

const simpleProofOptions = { compact: true, simple: true };
const proofOptions = { compact: true, simple: false };

// Generate simple and "non-simple" size proof.
const proof1 = myTree.generateSizeProof(simpleProofOptions);
const proof2 = myTree.generateSizeProof(proofOptions);

// Simple size proof only needs size and element root.
const { root, elementCount, elementRoot } = proof2;

// Non-simple size proof needs size and proof of last element.
const { root, elementCount, compactProof } = proof1;

console.log(MerkleTree.verifySizeProof(proof1, treeOptions));   // true
console.log(MerkleTree.verifySizeProof(proof1, treeOptions));   // true
```
<br>
<br>

## Various TODOs and Notes (In Order of Priority) ##

- [ ] Partial Tree documentation and more testing
- [ ] Consolidate single/multi update function (or de-consolidate everything... hmm...)
- [ ] option to output all data as eth-compatible prefixed hex strings
- [ ] deleting elements (from the end)
- [ ] test how null/undefined elements before the append index affect trees/proofs
- [ ] TypeScript (possibly with a Proof class)
- [ ] index-less (existence-only) single-proofs
- [ ] support index-less (compact existence-only) single-proofs
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
- [ ] explore efficiency of separate boolean-array, in the multi-proof, to inform when to take a hash as an append-decommitment
- [ ] "Bring Your Own Hash Function" support
- [ ] serialize method (likely just elements, possibly redundant)
- [X] ~~support for arbitrary size elements (it already did, but tested now)~~
- [X] ~~Build an "incomplete", yet "useful", merkle tree from a proof (partial tree)~~
- [X] ~~unbalanced proofs for indexed multi-proofs (with tests)~~
- [X] ~~API documentation (you tell me, did I do a good job?)~~
- [X] ~~append one/many with a single or multi proof~~
- [X] ~~update one/many and append one/many~~
- [X] ~~explore combined and existence-only (flag) multi-proofs, without sorted hashing, (possibly separate set of hash order booleans)~~
- [X] ~~given hash order booleans, implement index inferring for multi-proofs without sorted hashing (it is possible)~~
- [X] ~~argument validation (i.e. parameter lengths, mutually exclusive options like indexed and compact)~~
- [X] ~~Size Proofs using Append-Proof~~
- [X] ~~Size Proofs using just element root (simple)~~
- [X] ~~Handle empty tree (no elements to start)~~
<br>
<br>

## Tests ##

```console
foo@bar:~$ nvm use 14
Now using node v14.12.0 (npm v6.14.8)
foo@bar:~$ yarn install
...
Done in 0.16s.
foo@bar:~$ yarn test
...
793 passing (16s)
```
<br>
<br>

## FAQ (Or things I suspect people will ask, but haven't yet) ##

__Q. What is really novel here?__
A. With respect to Merkle Trees, Single Proofs are not novel, and neither are Multi Proofs (both the indexed and non-indexed/flag-based variants). Merkle Mountain Ranges already support the concept of an unbalanced number of elements, and the ability to append elements. What I believe is novel here is:
* A consistent/elegant algorithm that does not need to "bag the peaks" of balanced sub-tress, as a final step (like MMRs)
* A method to prove the size of an unbalanced tree
* A algorithm to append an arbitrary number of elements in one go, with one simple proof
* A algorithm to infer the proof needed to append elements, from a single or multi proof
* A way to easily determine the minimum index to be proven to generate a single or multi proof in which an append proof can be inferred
* An algorithm to infer the indices from a non-indexed/flag-based multi proof, reducing proof size, yet maintaining the benefits of indexed multi proofs
<br>
<br>

__Q. What can Merkle trees with the `sortedHash` option _not_ do?__

A. They can't be used to generate Multi-Poofs where proving or inferring indices is possible and they can't be used to generate "non-simple" size proofs.
<br>
<br>

__Q. Can I use elements that are longer or shorter than 32 bytes?__

A. Technically, yes, although I have not tested it at all. I will, eventually, though. Also, the compatible smart contracts assume all elements are `bytes32`, so the smart contracts will no longer be compatible without fire hashing the elements yourself, down to 32-bytes.
<br>
<br>

__Q. Where's all your math and technical documentation?__

A. I'd like to know the same! If you are up to it, feel free to reach out and I can explain it all in depth, and perhaps you can help me write it? It's not really my strong suit.
<br>
<br>

__Q. Is this library stable, robust, or "guaranteed" to work?__

A. "Yes", but No. I'm always adding to the test cases, and brute forcing consecutive uses, and so far have not seen it fail when it should have succeeded. However, I have not yet implemented tests to check that it fails when it should fail. Feel free put it through the paces and open an issue if you notice something odd or broken.
<br>
<br>

__Q. Why doesn't this Merkle Tree construct or library have a fancy or fun name?__

A. I couldn't think of one. Please suggest. I beg of you.
<br>
<br>
