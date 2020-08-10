const assert = require('assert');
const { hashNode, getHashFunction, to32ByteBuffer, bitCount32 } = require('./utils');
const Common = require('./common');
const SingleProofs = require('./single-proofs');
const MultiIndexedProofs = require('./multi-indexed-proofs');
const MultiFlagProofs = require('./multi-flag-proofs');
const AppendProofs = require('./append-proofs');

class MerkleTree {
  constructor(elements, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    this._elementPrefix = Buffer.from(elementPrefix, 'hex');
    this._sortedHash = sortedHash;
    this._unbalanced = unbalanced;
    this._elements = elements.map(Buffer.from);
    this._depth = MerkleTree.getDepthFromElements(this._elements);
    this._leafCount = MerkleTree.getLeafCountFromElements(this._elements);

    assert(this._unbalanced || this._elements.length === this._leafCount, 'Incorrect element count for balanced tree');

    const leafs = Array(this._leafCount).fill(null);
    this._elements.forEach((element, index) => (leafs[index] = hashNode(this._elementPrefix, element)));
    const hashFunction = getHashFunction(this._unbalanced, this._sortedHash);
    const { tree } = Common.buildTree({ leafs, hashFunction });

    this._tree = tree;
    this._tree[0] = MerkleTree.computeMixedRoot(this._elements.length, this._tree[1]);
  }

  static getDepthFromElementCount(elementCount) {
    return Common.getDepthFromElementCount(elementCount);
  }

  static getDepthFromElements(elements) {
    return MerkleTree.getDepthFromElementCount(elements.length);
  }

  static getLeafCountFromElementCount(elementCount) {
    return Common.getLeafCountFromElementCount(elementCount);
  }

  static getLeafCountFromElements(elements) {
    return MerkleTree.getLeafCountFromElementCount(elements.length);
  }

  static verifySingleProof({ root, elementCount, index, element, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const { root: recoveredRoot } = SingleProofs.getRoot({ index, leaf, decommitments, hashFunction });

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  static updateWithSingleProof({ root, elementCount, index, element, newElement, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const newLeaf = hashNode(prefixBuffer, newElement);

    const { root: recoveredRoot, newRoot } = SingleProofs.getNewRoot({
      index,
      leaf,
      newLeaf,
      decommitments,
      hashFunction,
    });

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(elementCount, newRoot) };
  }

  static verifyMultiProof(parameters, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, hashFunction, leafCount: parameters.elementCount }, parameters);

    const { root: recoveredRoot } = parameters.flags
      ? MultiFlagProofs.getRoot(params)
      : MultiIndexedProofs.getRoot(params);

    return MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, recoveredRoot);
  }

  static updateWithMultiProof(parameters, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const newLeafs = parameters.newElements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, newLeafs, hashFunction, leafCount: parameters.elementCount }, parameters);

    const { root: recoveredRoot, newRoot } = parameters.flags
      ? MultiFlagProofs.getNewRoot(params)
      : MultiIndexedProofs.getNewRoot(params);

    assert(MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(parameters.elementCount, newRoot) };
  }

  static verifyAppendProof({ root, elementCount, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false } = options;
    const hashFunction = getHashFunction(unbalanced, sortedHash);

    if (decommitments.length !== bitCount32(elementCount)) return false;

    const { root: recoveredRoot } = AppendProofs.getRoot({ elementCount, decommitments, hashFunction });

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  static appendElementWithProof({ root, elementCount, newElement, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const newLeaf = hashNode(prefixBuffer, newElement);
    const newElementCount = elementCount + 1;
    const hashFunction = getHashFunction(unbalanced, sortedHash);

    if (decommitments.length !== bitCount32(elementCount)) return false;

    const { root: recoveredRoot, newRoot } = AppendProofs.getNewRoot({
      newLeaf,
      elementCount,
      decommitments,
      hashFunction,
    });

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount };
  }

  static computeMixedRoot(elementCount, root) {
    return hashNode(to32ByteBuffer(elementCount), root);
  }

  static verifyMixedRoot(mixedRoot, elementCount, root) {
    return MerkleTree.computeMixedRoot(elementCount, root).equals(mixedRoot);
  }

  get elementRoot() {
    return Buffer.from(this._tree[1]);
  }

  get root() {
    return Buffer.from(this._tree[0]);
  }

  get depth() {
    return this._depth;
  }

  get elements() {
    return this._elements.map(Buffer.from);
  }

  generateSingleProof(index) {
    assert(index < this._elements.length, 'Index out of range.');

    const { decommitments } = SingleProofs.generate({ tree: this._tree, index });

    return {
      root: Buffer.from(this._tree[0]),
      elementCount: this._elements.length,
      index,
      element: Buffer.from(this._elements[index]),
      decommitments,
    };
  }

  generateSingleUpdateProof(index, element) {
    return Object.assign({ newElement: Buffer.from(element) }, this.generateSingleProof(index));
  }

  updateSingle(index, element) {
    assert(index < this._elements.length, 'Index out of range.');

    const newElements = this._elements.map((e, i) => (i === index ? element : e));

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }

  generateMultiProof(indices, options = {}) {
    const { indexed = false, bitFlags = false } = options;
    const parameters = { tree: this._tree, indices, bitFlags };
    const proof = indexed ? MultiIndexedProofs.generate(parameters) : MultiFlagProofs.generate(parameters);
    const elements = indices.map((index) => Buffer.from(this._elements[index]));

    const base = {
      root: Buffer.from(this._tree[0]),
      elementCount: this._elements.length,
      elements,
      indices: indices.slice(),
    };

    return Object.assign(base, proof);
  }

  generateMultiUpdateProof(indices, elements, options = {}) {
    const newElements = elements.map(Buffer.from);
    return Object.assign({ newElements }, this.generateMultiProof(indices, options));
  }

  updateMulti(indices, elements) {
    // TODO: Filter or throw on duplicate indices
    indices.forEach((index) => {
      assert(index < this._elements.length, 'Index out of range.');
    });

    const newElements = this.elements.map((e, i) => {
      const index = indices.indexOf(i);

      return index >= 0 ? elements[index] : e;
    });

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }

  generateAppendProof() {
    const elementCount = this._elements.length;
    const { decommitments } = AppendProofs.generate({ tree: this._tree, elementCount });

    return { root: Buffer.from(this._tree[0]), elementCount, decommitments };
  }

  generateSingleAppendProof(element) {
    return Object.assign({ newElement: Buffer.from(element) }, this.generateAppendProof());
  }

  appendSingle(element) {
    const newElements = this.elements.map((e) => e);
    newElements.push(element);

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }

  appendMulti(elements) {
    const newElements = this.elements.map((e) => e).concat(elements);

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }
}

module.exports = MerkleTree;

// TODO: serialize method (just elements?)
// TODO: update/append methods can return proof and new Merkle Tree
// TODO: check/match paramter lengths on multi methods
// TODO: consider splitting up single proof methods into
//       - proving that an element is in the set (flag based)
//       - proving that an element exist at specific index (index based)
// TODO: consider splitting up multi proof method into
//       - proving that elements are in the set (flag based)
//       - proving that elements exist at specific indices (index based)
// TODO: consider a Proof class
// TODO: implement appendElementsWithProof
// TODO: verify and update single proof can probably be cheaper with sortedHash given that element count is required
