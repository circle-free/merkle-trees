const assert = require('assert');

const { hashNode, getHashFunction, to32ByteBuffer } = require('./utils');
const Common = require('./common');
const SingleProofs = require('./single-proofs');
const MultiIndexedProofs = require('./index-multi-proofs');
const MultiFlagProofs = require('./flag-multi-proofs');
const AppendProofs = require('./append-proofs');
const CombinedProofs = require('./combined-proofs');

class MerkleTree {
  constructor(elements, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    this._leafCount = MerkleTree.getLeafCountFromElements(elements);

    assert(unbalanced || elements.length === this._leafCount, 'Incorrect element count for balanced tree.');

    this._elementPrefix = Buffer.from(elementPrefix, 'hex');
    this._sortedHash = sortedHash;
    this._unbalanced = unbalanced;
    this._elements = elements.map(Buffer.from);
    this._depth = MerkleTree.getDepthFromElements(this._elements);

    const leafs = Array(this._leafCount).fill(null);
    this._elements.forEach((element, index) => (leafs[index] = hashNode(this._elementPrefix, element)));

    const hashFunction = getHashFunction(this._unbalanced, this._sortedHash);
    const { tree } = Common.buildTree({ leafs }, { hashFunction });

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
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const params = { elementCount, index, leaf, decommitments };
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot } = SingleProofs.getRoot(params, opts);

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  static updateWithSingleProof({ root, elementCount, index, element, newElement, decommitments }, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const newLeaf = hashNode(prefixBuffer, newElement);
    const params = { elementCount, index, leaf, newLeaf, decommitments };
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, newRoot } = SingleProofs.getNewRoot(params, opts);

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(elementCount, newRoot) };
  }

  static verifyMultiProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(!unbalanced || !parameters.indices, 'Indexed Multi-Proofs for unbalanced trees not yet supported.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, leafCount: parameters.elementCount }, parameters);
    const opts = { hashFunction, sortedHash };
    const rootRecoverer = parameters.indices ? MultiIndexedProofs.getRoot : MultiFlagProofs.getRoot;
    const { root: recoveredRoot } = rootRecoverer(params, opts);

    return MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, recoveredRoot);
  }

  static updateWithMultiProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(!unbalanced || !parameters.indices, 'Indexed Multi-Proofs for unbalanced trees not yet supported.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const newLeafs = parameters.newElements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, newLeafs, leafCount: parameters.elementCount }, parameters);
    const opts = { hashFunction, sortedHash };
    const newRootRecoverer = parameters.indices ? MultiIndexedProofs.getNewRoot : MultiFlagProofs.getNewRoot;
    const { root: recoveredRoot, newRoot } = newRootRecoverer(params, opts);

    assert(MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(parameters.elementCount, newRoot) };
  }

  static verifyAppendProof({ root, elementCount, decommitments }, options = {}) {
    const { sortedHash = true, unbalanced = true } = options;

    assert(unbalanced, 'Append-Proofs not supported for unbalanced tress.');

    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const params = { elementCount, decommitments };
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot } = AppendProofs.getRoot(params, opts);

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  static appendSingleWithProof({ root, elementCount, newElement, decommitments }, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(unbalanced, 'Append-Proofs not supported for unbalanced tress.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const newLeaf = hashNode(prefixBuffer, newElement);
    const newElementCount = elementCount + 1;
    const hashFunction = getHashFunction(true, sortedHash);
    const params = { newLeaf, elementCount, decommitments };
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, newRoot } = AppendProofs.getNewRoot(params, opts);

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount };
  }

  static appendMultiWithProof({ root, elementCount, newElements, decommitments }, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(unbalanced, 'Append-Proofs not supported for unbalanced tress.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const newLeafs = newElements.map((element) => hashNode(prefixBuffer, element));
    const newElementCount = elementCount + newElements.length;
    const hashFunction = getHashFunction(true, sortedHash);
    const params = { newLeafs, elementCount, decommitments };
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, newRoot } = AppendProofs.getNewRoot(params, opts);

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount };
  }

  static verifyCombinedProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(unbalanced, 'Combined-Proofs not supported for unbalanced tress.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(true, sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs }, parameters);
    const opts = { hashFunction, sortedHash };
    const { root } = CombinedProofs.getRoot(params, opts);
    return MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, root);
  }

  static updateAndAppendWithCombinedProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(unbalanced, 'Combined-Proofs not supported for unbalanced tress.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const newElementCount = parameters.elementCount + parameters.appendElements.length;
    const hashFunction = getHashFunction(true, sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const updateLeafs = parameters.updateElements.map((element) => hashNode(prefixBuffer, element));
    const appendLeafs = parameters.appendElements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, updateLeafs, appendLeafs }, parameters);
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, newRoot } = CombinedProofs.getNewRoot(params, opts);

    assert(MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, recoveredRoot), 'Invalid Proof.');

    return {
      root: MerkleTree.computeMixedRoot(parameters.elementCount + appendLeafs.length, newRoot),
      elementCount: newElementCount,
    };
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

  get minimumCombinedProofIndex() {
    return CombinedProofs.getMinimumIndex(this._elements.length);
  }

  generateSingleProof(index, options = {}) {
    assert(index < this._elements.length, 'Index out of range.');

    const params = { tree: this._tree, index };
    const proof = SingleProofs.generate(params, options);

    const base = {
      root: Buffer.from(this._tree[0]),
      elementCount: this._elements.length,
      index,
      element: Buffer.from(this._elements[index]),
    };

    return Object.assign(base, proof);
  }

  generateSingleUpdateProof(index, element, options = {}) {
    return Object.assign({ newElement: Buffer.from(element) }, this.generateSingleProof(index, options));
  }

  updateSingle(index, element, proofOptions = {}) {
    const newElements = this._elements.map((e, i) => (i === index ? element : e));

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateSingleUpdateProof(index, element, proofOptions),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  generateMultiProof(indices, options = {}) {
    const { indexed = false, compact = true } = options;

    assert(!indexed || !this._unbalanced, 'Indexed Multi-Proofs for unbalanced trees not yet supported.');

    indices.forEach((index, i) => {
      assert(index < this._elements.length, 'Index out of range.');
      assert(indices.indexOf(index) === i, 'Duplicate in indices.');
    });

    const params = { tree: this._tree, indices };
    const proofOptions = { unbalanced: this._unbalanced, sortedHash: this._sortedHash, compact };
    const proofGenerator = indexed ? MultiIndexedProofs.generate : MultiFlagProofs.generate;
    const proof = proofGenerator(params, proofOptions);
    const elements = indices.map((index) => Buffer.from(this._elements[index]));

    const base = {
      root: Buffer.from(this._tree[0]),
      elementCount: this._elements.length,
      elements,
    };

    return Object.assign(base, proof);
  }

  generateMultiUpdateProof(indices, elements, options = {}) {
    assert(indices.length === elements.length, 'Indices and element count mismatch.');
    const newElements = elements.map(Buffer.from);

    return Object.assign({ newElements }, this.generateMultiProof(indices, options));
  }

  updateMulti(indices, elements, proofOptions = {}) {
    const newElements = this.elements.map((e, i) => {
      const index = indices.indexOf(i);

      return index >= 0 ? elements[index] : e;
    });

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateMultiUpdateProof(indices, elements, proofOptions),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  generateAppendProof(options = {}) {
    assert(this._unbalanced, 'Can only generate Append-Proofs for unbalanced trees.');

    const params = { tree: this._tree, elementCount: this._elements.length };
    const proof = AppendProofs.generate(params, options);

    return Object.assign({ root: Buffer.from(this._tree[0]) }, proof);
  }

  generateSingleAppendProof(element, options = {}) {
    return Object.assign({ newElement: Buffer.from(element) }, this.generateAppendProof(options));
  }

  generateMultiAppendProof(elements, options = {}) {
    assert(elements.length > 0, 'No elements provided.');

    return Object.assign({ newElements: elements.map(Buffer.from) }, this.generateAppendProof(options));
  }

  appendSingle(element, proofOptions = {}) {
    const newElements = this.elements.map((e) => e);
    newElements.push(element);

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateSingleAppendProof(element, proofOptions),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  appendMulti(elements, proofOptions = {}) {
    const newElements = this.elements.concat(elements);

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateMultiAppendProof(elements, proofOptions),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  generateCombinedProof(indices, options = {}) {
    const { indexed = false, compact = true } = options;

    assert(!indexed, 'Indexed Combined-Proofs are not yet supported.');
    assert(this._unbalanced, 'Can only generate Combined-Proofs for unbalanced trees.');

    indices.forEach((index, i) => {
      assert(index < this._elements.length, 'Index out of range.');
      assert(indices.indexOf(index) === i, 'Duplicate in indices.');
    });

    const elementCount = this._elements.length;
    const minimumIndex = CombinedProofs.getMinimumIndex(elementCount);
    assert(indices[indices.length - 1] >= minimumIndex, `Last index must be larger than ${minimumIndex}.`);

    const params = { tree: this._tree, indices };
    const proofOptions = { sortedHash: this._sortedHash, compact };
    const proof = CombinedProofs.generate(params, proofOptions);
    const elements = indices.map((index) => Buffer.from(this._elements[index]));

    const base = {
      root: Buffer.from(this._tree[0]),
      elementCount,
      elements,
    };

    return Object.assign(base, proof);
  }

  generateMultiAppendUpdateProof(indices, updateElements, appendElements, options = {}) {
    assert(indices.length > 0, 'No elements provided to be proven');
    assert(indices.length === updateElements.length, 'Indices and update element count mismatch.');
    assert(appendElements.length > 0, 'No elements provided to be appended.');

    const base = {
      updateElements: updateElements.map(Buffer.from),
      appendElements: appendElements.map(Buffer.from),
    };

    return Object.assign(base, this.generateCombinedProof(indices, options));
  }

  updateAndAppendMulti(indices, updateElements, appendElements, proofOptions = {}) {
    const { newMerkleTree: updatedTree } = this.updateMulti(indices, updateElements, proofOptions);
    const { newMerkleTree } = updatedTree.appendMulti(appendElements, proofOptions);

    return {
      proof: this.generateMultiAppendUpdateProof(indices, updateElements, appendElements, proofOptions),
      newMerkleTree,
    };
  }
}

module.exports = MerkleTree;
