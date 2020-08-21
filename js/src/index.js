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

    this._elementPrefix = Buffer.from(elementPrefix, 'hex');
    this._sortedHash = sortedHash;
    this._unbalanced = unbalanced;
    this._elements = elements.map(Buffer.from);
    this._depth = MerkleTree.getDepthFromElements(this._elements);
    this._leafCount = MerkleTree.getLeafCountFromElements(this._elements);

    assert(this._unbalanced || this._elements.length === this._leafCount, 'Incorrect element count for balanced tree.');

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
    const { root: recoveredRoot } = SingleProofs.getRoot({ elementCount, index, leaf, decommitments, hashFunction });

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  static updateWithSingleProof({ root, elementCount, index, element, newElement, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const newLeaf = hashNode(prefixBuffer, newElement);

    const { root: recoveredRoot, newRoot } = SingleProofs.getNewRoot({
      elementCount,
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

    const { root: recoveredRoot } = parameters.indices
      ? MultiIndexedProofs.getRoot(params)
      : MultiFlagProofs.getRoot(params);

    return MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, recoveredRoot);
  }

  static updateWithMultiProof(parameters, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const newLeafs = parameters.newElements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, newLeafs, hashFunction, leafCount: parameters.elementCount }, parameters);

    const { root: recoveredRoot, newRoot } = parameters.indices
      ? MultiIndexedProofs.getNewRoot(params)
      : MultiFlagProofs.getNewRoot(params);

    assert(MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(parameters.elementCount, newRoot) };
  }

  static verifyAppendProof({ root, elementCount, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false } = options;
    const hashFunction = getHashFunction(unbalanced, sortedHash);

    const { root: recoveredRoot } = AppendProofs.getRoot({ elementCount, decommitments, hashFunction });

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  static appendSingleWithProof({ root, elementCount, newElement, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const newLeaf = hashNode(prefixBuffer, newElement);
    const newElementCount = elementCount + 1;
    const hashFunction = getHashFunction(unbalanced, sortedHash);

    const { root: recoveredRoot, newRoot } = AppendProofs.getNewRoot({
      newLeaf,
      elementCount,
      decommitments,
      hashFunction,
    });

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount };
  }

  static appendMultiWithProof({ root, elementCount, newElements, decommitments }, options = {}) {
    const { sortedHash = false, unbalanced = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const newLeafs = newElements.map((element) => hashNode(prefixBuffer, element));
    const newElementCount = elementCount + newElements.length;
    const hashFunction = getHashFunction(unbalanced, sortedHash);

    const { root: recoveredRoot, newRoot } = AppendProofs.getNewRoot({
      newLeafs,
      elementCount,
      decommitments,
      hashFunction,
    });

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount };
  }

  static verifyCombinedProof(parameters, options = {}) {
    const { elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(true, true);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, hashFunction }, parameters);
    const { root } = CombinedProofs.getRoot(params);
    return MerkleTree.verifyMixedRoot(parameters.root, parameters.elementCount, root);
  }

  static updateAndAppendWithCombinedProof(parameters, options = {}) {
    const { elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const newElementCount = parameters.elementCount + parameters.appendElements.length;
    const hashFunction = getHashFunction(true, true);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const updateLeafs = parameters.updateElements.map((element) => hashNode(prefixBuffer, element));
    const appendLeafs = parameters.appendElements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, updateLeafs, appendLeafs, hashFunction }, parameters);
    const { root: recoveredRoot, newRoot } = CombinedProofs.getNewRoot(params);

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

    const proof = SingleProofs.generate({ tree: this._tree, index });

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
    assert(index < this._elements.length, 'Index out of range.');

    const newElements = this._elements.map((e, i) => (i === index ? element : e));

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      newMerkleTree: new MerkleTree(newElements, treeOptions),
      proof: this.generateSingleUpdateProof(index, element, proofOptions),
    };
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
    };

    return Object.assign(base, proof);
  }

  generateMultiUpdateProof(indices, elements, options = {}) {
    const newElements = elements.map(Buffer.from);

    return Object.assign({ newElements }, this.generateMultiProof(indices, options));
  }

  updateMulti(indices, elements, proofOptions = {}) {
    indices.forEach((index, i) => {
      assert(index < this._elements.length, 'Index out of range.');
      assert(indices.indexOf(index) === i, 'Duplicate in indices.');
    });

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
      newMerkleTree: new MerkleTree(newElements, treeOptions),
      proof: this.generateMultiUpdateProof(indices, elements, proofOptions),
    };
  }

  generateAppendProof(options = {}) {
    const params = { tree: this._tree, elementCount: this._elements.length };
    const proof = AppendProofs.generate(params);

    return Object.assign({ root: Buffer.from(this._tree[0]) }, proof);
  }

  generateSingleAppendProof(element, options = {}) {
    return Object.assign({ newElement: Buffer.from(element) }, this.generateAppendProof(options));
  }

  generateMultiAppendProof(elements, options = {}) {
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
      newMerkleTree: new MerkleTree(newElements, treeOptions),
      proof: this.generateSingleAppendProof(element, proofOptions),
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
      newMerkleTree: new MerkleTree(newElements, treeOptions),
      proof: this.generateMultiAppendProof(elements, proofOptions),
    };
  }

  generateCombinedProof(indices, options = {}) {
    const elementCount = this._elements.length;
    const minimumIndex = CombinedProofs.getMinimumIndex(elementCount);
    assert(indices[0] >= minimumIndex, `First index must be larger than ${minimumIndex}.`);

    const { bitFlags = false } = options;
    const parameters = { tree: this._tree, indices, bitFlags };
    const proof = CombinedProofs.generate(parameters);
    const elements = indices.map((index) => Buffer.from(this._elements[index]));

    const base = {
      root: Buffer.from(this._tree[0]),
      elementCount,
      elements,
    };

    return Object.assign(base, proof);
  }

  generateMultiAppendUpdateProof(indices, updateElements, appendElements, options = {}) {
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
      newMerkleTree,
      proof: this.generateMultiAppendUpdateProof(indices, updateElements, appendElements, proofOptions),
    };
  }
}

module.exports = MerkleTree;
