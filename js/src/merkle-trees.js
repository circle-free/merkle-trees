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
    const { sortedHash = false, unbalanced = true, elementPrefix = '00' } = options;

    this._elementPrefix = Buffer.from(elementPrefix, 'hex');
    this._sortedHash = sortedHash;
    this._unbalanced = unbalanced;
    this._elements = elements.map(Buffer.from);

    if (elements.length === 0) {
      this._depth = 0;
      this._tree = [];

      return;
    }

    const balancedLeafCount = Common.getBalancedLeafCount(this._elements.length);
    assert(unbalanced || elements.length === balancedLeafCount, 'Incorrect element count for balanced tree.');

    const leafs = this._elements.map((element) => hashNode(this._elementPrefix, element));

    const hashFunction = getHashFunction(this._sortedHash);
    const { tree, depth } = Common.buildTree(leafs, { hashFunction });

    this._tree = tree;
    this._depth = depth;
    this._tree[0] = MerkleTree.computeMixedRoot(this._elements.length, this._tree[1]);
  }

  static verifySingleProof(parameters, options = {}) {
    const { sortedHash = true, elementPrefix = '00' } = options;
    const { root, element } = parameters;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const params = Object.assign({ leaf }, parameters);
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, elementCount } = SingleProofs.getRoot(params, opts);

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  static updateWithSingleProof(parameters, options = {}) {
    const { sortedHash = true, elementPrefix = '00' } = options;
    const { root, element, updateElement } = parameters;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const updateLeaf = hashNode(prefixBuffer, updateElement);
    const params = Object.assign({ leaf, updateLeaf }, parameters);
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, newRoot, elementCount } = SingleProofs.getNewRoot(params, opts);

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(elementCount, newRoot) };
  }

  static verifyMultiProof(parameters, options = {}) {
    const { sortedHash = true, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs }, parameters);
    const opts = { hashFunction, sortedHash };
    const rootRecoverer = parameters.indices ? MultiIndexedProofs.getRoot : MultiFlagProofs.getRoot;
    const { root: recoveredRoot, elementCount } = rootRecoverer(params, opts);

    return MerkleTree.verifyMixedRoot(parameters.root, elementCount, recoveredRoot);
  }

  static getMultiProofIndices(parameters) {
    const params = Object.assign({ leafCount: parameters.elements.length }, parameters);
    return MultiFlagProofs.getIndices(params).indices;
  }

  static updateWithMultiProof(parameters, options = {}) {
    const { sortedHash = true, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);
    const leafs = parameters.elements.map((element) => hashNode(prefixBuffer, element));
    const updateLeafs = parameters.updateElements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs, updateLeafs }, parameters);
    const opts = { hashFunction, sortedHash };
    const newRootRecoverer = parameters.indices ? MultiIndexedProofs.getNewRoot : MultiFlagProofs.getNewRoot;
    const { root: recoveredRoot, newRoot, elementCount } = newRootRecoverer(params, opts);

    assert(MerkleTree.verifyMixedRoot(parameters.root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(elementCount, newRoot) };
  }

  static verifyAppendProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true } = options;

    assert(unbalanced, 'Append-Proofs not supported for balanced trees.');

    if (parameters.root.equals(to32ByteBuffer(0))) return true;

    const hashFunction = getHashFunction(sortedHash);
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, elementCount } = AppendProofs.getRoot(parameters, opts);

    return MerkleTree.verifyMixedRoot(parameters.root, elementCount, recoveredRoot);
  }

  static appendWithAppendProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;
    const { root, appendElement, appendElements } = parameters;

    assert(unbalanced, 'Append-Proofs not supported for balanced trees.');

    if (root.equals(to32ByteBuffer(0))) {
      const treeOptions = { sortedHash, unbalanced, elementPrefix };
      const merkleTree = new MerkleTree(appendElements || [appendElement], treeOptions);
      return { root: merkleTree.root, elementCount: appendElements?.length ?? 1 };
    }

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const params = Object.assign({}, parameters);

    if (appendElement) {
      const appendLeaf = hashNode(prefixBuffer, appendElement);
      Object.assign(params, { appendLeaf });
    } else {
      const appendLeafs = appendElements.map((element) => hashNode(prefixBuffer, element));
      Object.assign(params, { appendLeafs });
    }

    const hashFunction = getHashFunction(sortedHash);
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, newRoot, elementCount } = AppendProofs.getNewRoot(params, opts);
    const newElementCount = elementCount + (appendElements?.length ?? 1);

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount };
  }

  static appendWithCombinedProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;
    const { root, element, elements, appendElement, appendElements } = parameters;

    assert(unbalanced, 'Combined-Proofs not supported for balanced trees.');

    if (root.equals(to32ByteBuffer(0))) {
      const treeOptions = { sortedHash, unbalanced, elementPrefix };
      const merkleTree = new MerkleTree(appendElements || [appendElement], treeOptions);
      return { root: merkleTree.root, elementCount: appendElements?.length ?? 1 };
    }

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const params = Object.assign({}, parameters);

    if (element) {
      const leaf = hashNode(prefixBuffer, element);
      Object.assign(params, { leaf });
    } else {
      const leafs = elements.map((element) => hashNode(prefixBuffer, element));
      Object.assign(params, { leafs });
    }

    const hashFunction = getHashFunction(sortedHash);
    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, elementCount, appendDecommitments } = CombinedProofs.getRoot(params, opts);

    const appends = appendElement
      ? hashNode(prefixBuffer, appendElement)
      : appendElements.map((element) => hashNode(prefixBuffer, element));

    const appendFunction = appendElement ? AppendProofs.appendSingle : AppendProofs.appendMulti;
    const newRoot = appendFunction(appends, elementCount, appendDecommitments, opts);
    const newElementCount = elementCount + (appendElements?.length ?? 1);

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount };
  }

  static verifyCombinedProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(unbalanced, 'Combined-Proofs not supported for balanced trees.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);

    const params = Object.assign({}, parameters);

    if (parameters.element) {
      Object.assign(params, { leaf: hashNode(prefixBuffer, parameters.element) });
    } else {
      const leafs = parameters.elements.map((e) => hashNode(prefixBuffer, e));
      Object.assign(params, { leafs });
    }

    const opts = { hashFunction, sortedHash };
    const { root, elementCount } = CombinedProofs.getRoot(params, opts);
    return MerkleTree.verifyMixedRoot(parameters.root, elementCount, root);
  }

  static getCombinedProofIndices(parameters) {
    return MerkleTree.getMultiProofIndices(parameters);
  }

  static updateAndAppendWithCombinedProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(unbalanced, 'Combined-Proofs not supported for balanced trees.');

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);

    const { root, element, elements, updateElement, updateElements, appendElement, appendElements } = parameters;

    const params = Object.assign({}, parameters);

    if (updateElement) {
      const leaf = hashNode(prefixBuffer, element);
      const updateLeaf = hashNode(prefixBuffer, updateElement);
      Object.assign(params, { leaf, updateLeaf });
    } else {
      const leafs = elements.map((e) => hashNode(prefixBuffer, e));
      const updateLeafs = updateElements.map((element) => hashNode(prefixBuffer, element));
      Object.assign(params, { leafs, updateLeafs });
    }

    const opts = { hashFunction, sortedHash };
    const { root: recoveredRoot, elementCount, appendDecommitments } = CombinedProofs.getNewRoot(params, opts);

    const appends = appendElement
      ? hashNode(prefixBuffer, appendElement)
      : appendElements.map((element) => hashNode(prefixBuffer, element));

    const appendFunction = appendElement ? AppendProofs.appendSingle : AppendProofs.appendMulti;
    const newRoot = appendFunction(appends, elementCount, appendDecommitments, opts);

    const appendCount = appendElements?.length || 1;
    const newElementCount = elementCount + appendCount;

    assert(MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot), 'Invalid Proof.');

    return {
      root: MerkleTree.computeMixedRoot(newElementCount, newRoot),
      elementCount: newElementCount,
    };
  }

  static computeMixedRoot(elementCount, root) {
    return hashNode(to32ByteBuffer(elementCount), root);
  }

  static verifyMixedRoot(mixedRoot, elementCount, root) {
    return MerkleTree.computeMixedRoot(elementCount, root).equals(mixedRoot);
  }

  static verifySizeProof(parameters, options = {}) {
    const { sortedHash = true } = options;
    const { root, elementCount, elementRoot, compactProof, decommitments = compactProof } = parameters;

    if (root.equals(to32ByteBuffer(0)) && elementCount === 0) return true;

    if (elementRoot) return MerkleTree.verifyMixedRoot(root, elementCount, elementRoot);

    assert(!sortedHash, 'Can only verify simple Size Proofs for sorted hashed trees.');

    const hashFunction = getHashFunction(sortedHash);
    const opts = { hashFunction, sortedHash };
    const params = { elementCount, decommitments };
    const { root: recoveredRoot } = AppendProofs.getRoot(params, opts);

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot);
  }

  get root() {
    return this._elements.length ? Buffer.from(this._tree[0]) : to32ByteBuffer(0);
  }

  get elementRoot() {
    return this._elements.length ? Buffer.from(this._tree[1]) : to32ByteBuffer(0);
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
    assert(this._elements.length > 0, 'Tree is empty.');
    assert(index >= 0 && index < this._elements.length, 'Index out of range.');

    const params = { tree: this._tree, elementCount: this._elements.length, index };
    const proof = SingleProofs.generate(params, options);
    const base = { root: this.root, element: Buffer.from(this._elements[index]) };

    return Object.assign(base, proof);
  }

  generateSingleUpdateProof(index, updateElement, options = {}) {
    const base = { updateElement: Buffer.from(updateElement) };

    return Object.assign(base, this.generateSingleProof(index, options));
  }

  updateSingle(index, updateElement, options = {}) {
    const newElements = this._elements.map((e, i) => (i === index ? updateElement : e));

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateSingleUpdateProof(index, updateElement, options),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  generateMultiProof(indices, options = {}) {
    assert(this._elements.length > 0, 'Tree is empty.');

    const { indexed = false, compact = false } = options;

    indices.forEach((index, i) => {
      assert(index >= 0 && index < this._elements.length, 'Index out of range.');
      assert(indices.indexOf(index) === i, 'Duplicate in indices.');
    });

    const params = { tree: this._tree, elementCount: this._elements.length, indices };
    const proofOptions = { unbalanced: this._unbalanced, sortedHash: this._sortedHash, compact };
    const proofGenerator = indexed ? MultiIndexedProofs.generate : MultiFlagProofs.generate;
    const proof = proofGenerator(params, proofOptions);
    const elements = indices.map((index) => Buffer.from(this._elements[index]));
    const base = { root: this.root, elements };

    return Object.assign(base, proof);
  }

  generateMultiUpdateProof(indices, updateElements, options = {}) {
    assert(indices.length === updateElements.length, 'Indices and element count mismatch.');
    const base = { updateElements: updateElements.map(Buffer.from) };

    return Object.assign(base, this.generateMultiProof(indices, options));
  }

  updateMulti(indices, updateElements, options = {}) {
    const newElements = this.elements.map((e, i) => {
      const index = indices.indexOf(i);

      return index >= 0 ? updateElements[index] : e;
    });

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateMultiUpdateProof(indices, updateElements, options),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  generateAppendProof(options = {}) {
    assert(this._unbalanced, 'Can only generate Append-Proofs for unbalanced trees.');

    const { compact } = options;

    if (this._elements.length === 0) {
      return compact
        ? { root: this.root, compactProof: [to32ByteBuffer(0)] }
        : { root: this.root, elementCount: 0, decommitments: [] };
    }

    const params = { tree: this._tree, elementCount: this._elements.length };
    const proof = AppendProofs.generate(params, options);

    return Object.assign({ root: this.root }, proof);
  }

  generateSingleAppendProof(appendElement, options = {}) {
    const base = { appendElement: Buffer.from(appendElement) };

    return Object.assign(base, this.generateAppendProof(options));
  }

  generateMultiAppendProof(appendElements, options = {}) {
    assert(appendElements.length > 0, 'No elements provided.');
    const base = { appendElements: appendElements.map(Buffer.from) };

    return Object.assign(base, this.generateAppendProof(options));
  }

  appendSingle(appendElement, options = {}) {
    const newElements = this.elements.map((e) => e);
    newElements.push(appendElement);

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateSingleAppendProof(appendElement, options),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  appendMulti(appendElements, options = {}) {
    const newElements = this.elements.concat(appendElements);

    const treeOptions = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return {
      proof: this.generateMultiAppendProof(appendElements, options),
      newMerkleTree: new MerkleTree(newElements, treeOptions),
    };
  }

  generateCombinedProof(indices, options = {}) {
    assert(this._elements.length > 0, 'Tree is empty.');

    const { indexed = false, compact = true } = options;

    assert(!indexed, 'Indexed Combined-Proofs are not yet supported.');
    assert(this._unbalanced, 'Can only generate Combined-Proofs for unbalanced trees.');

    const elementCount = this._elements.length;
    const minimumIndex = CombinedProofs.getMinimumIndex(elementCount);
    const params = { tree: this._tree, elementCount };

    if (Array.isArray(indices)) {
      indices.forEach((index, i) => {
        assert(index < this._elements.length, 'Index out of range.');
        assert(indices.indexOf(index) === i, 'Duplicate in indices.');
      });

      assert(indices[indices.length - 1] >= minimumIndex, `Last index must be larger than ${minimumIndex}.`);
      Object.assign(params, { indices });
    } else {
      assert(indices < this._elements.length, 'Index out of range.');
      assert(indices >= minimumIndex, `Index must be larger than ${minimumIndex}.`);
      Object.assign(params, { index: indices });
    }

    const proofOptions = { sortedHash: this._sortedHash, compact };
    const proof = CombinedProofs.generate(params, proofOptions);
    const base = { root: this.root };

    if (Array.isArray(indices)) {
      const elements = indices.map((index) => Buffer.from(this._elements[index]));
      Object.assign(base, { elements });
    } else {
      const element = Buffer.from(this._elements[indices]);
      Object.assign(base, { element });
    }

    return Object.assign(base, proof);
  }

  generateUpdateAppendProof(indices, updateElements, appendElements, options = {}) {
    assert(Array.isArray(indices) === Array.isArray(updateElements), 'Indices and update mismatch.');
    assert(Number.isInteger(indices) || indices.length > 0, 'No elements provided to be proven');
    assert(
      Number.isInteger(indices) || indices.length === updateElements.length,
      'Indices and update element count mismatch.'
    );
    assert(!Array.isArray(appendElements) || appendElements.length > 0, 'No elements provided to be appended.');

    const base = {};

    Array.isArray(updateElements)
      ? Object.assign(base, { updateElements: updateElements.map(Buffer.from) })
      : Object.assign(base, { updateElement: Buffer.from(updateElements) });

    Array.isArray(appendElements)
      ? Object.assign(base, { appendElements: appendElements.map(Buffer.from) })
      : Object.assign(base, { appendElement: Buffer.from(appendElements) });

    return Object.assign(base, this.generateCombinedProof(indices, options));
  }

  generateUseAppendProof(indices, appendElements, options = {}) {
    assert(Number.isInteger(indices) || indices.length > 0, 'No elements provided to be proven');
    assert(!Array.isArray(appendElements) || appendElements.length > 0, 'No elements provided to be appended.');

    const base = {};

    Array.isArray(appendElements)
      ? Object.assign(base, { appendElements: appendElements.map(Buffer.from) })
      : Object.assign(base, { appendElement: Buffer.from(appendElements) });

    return Object.assign(base, this.generateCombinedProof(indices, options));
  }

  updateAndAppend(indices, updateElements, appendElements, options = {}) {
    const { newMerkleTree: updatedTree } = Array.isArray(updateElements)
      ? this.updateMulti(indices, updateElements, options)
      : this.updateSingle(indices, updateElements, options);

    const { newMerkleTree } = Array.isArray(appendElements)
      ? updatedTree.appendMulti(appendElements, options)
      : updatedTree.appendSingle(appendElements, options);

    return {
      proof: this.generateUpdateAppendProof(indices, updateElements, appendElements, options),
      newMerkleTree,
    };
  }

  useAndAppend(indices, appendElements, options = {}) {
    const { newMerkleTree } = Array.isArray(appendElements)
      ? this.appendMulti(appendElements, options)
      : this.appendSingle(appendElements, options);

    return {
      proof: this.generateUseAppendProof(indices, appendElements, options),
      newMerkleTree,
    };
  }

  generateSizeProof(options = {}) {
    const { compact = false, simple = true } = options;
    const elementCount = this._elements.length;

    if (elementCount === 0) {
      const root = to32ByteBuffer(0);
      const elementRoot = to32ByteBuffer(0);

      if (simple) return { root, elementCount, elementRoot };

      assert(!this._sortedHash, 'Can only generate simple Size Proofs for sorted hashed trees.');

      return compact ? { root, elementCount, compactProof: [] } : { root, elementCount, decommitments: [] };
    }

    if (simple) return { root: this.root, elementCount, elementRoot: this.elementRoot };

    assert(!this._sortedHash, 'Can only generate simple Size Proofs for sorted hashed trees.');

    const params = { tree: this._tree, elementCount };
    const proofOptions = Object.assign({}, options, { compact: false });
    const proof = AppendProofs.generate(params, proofOptions);
    const decommitments = proof.decommitments;

    if (compact) return { root: this.root, elementCount, compactProof: decommitments };

    return { root: this.root, elementCount, decommitments };
  }
}

module.exports = MerkleTree;
