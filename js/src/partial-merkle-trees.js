const assert = require('assert');

const { hashNode, getHashFunction, to32ByteBuffer } = require('./utils');
const MerkleTree = require('./merkle-trees');
const Common = require('./common');
const SingleProofs = require('./single-proofs');
const MultiIndexedProofs = require('./index-multi-proofs');
const MultiFlagProofs = require('./flag-multi-proofs');
const AppendProofs = require('./append-proofs');
const CombinedProofs = require('./combined-proofs');

class PartialMerkleTree extends MerkleTree {
  constructor(elements, tree, options) {
    super([], options);

    this._elements = elements.map((e) => e && Buffer.from(e));
    this._tree = tree.map((n) => n && Buffer.from(n));
    this._depth = Common.getDepth(elements.length);
    this._tree[0] = MerkleTree.computeMixedRoot(elements.length, tree[1]);
  }

  static fromSingleProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;
    const { index, element } = parameters;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leaf = hashNode(prefixBuffer, element);
    const params = Object.assign({ leaf }, parameters);
    const opts = { hashFunction, sortedHash };
    const { tree, elementCount } = SingleProofs.getPartialTree(params, opts);

    const partialElements = Array(elementCount).fill(null);
    partialElements[index] = element;

    return new PartialMerkleTree(partialElements, tree, options);
  }

  static fromSingleUpdateProof(parameters, options = {}) {
    const { updateElement } = parameters;
    const params = Object.assign({}, parameters, { element: updateElement });

    return PartialMerkleTree.fromSingleProof(params, options);
  }

  static fromMultiProof(parameters, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;

    assert(parameters.indices || !sortedHash, 'Cannot build sorted-hash Partial Tree from existence-only multi-proof.');

    const { elements } = parameters;
    const indices = parameters.indices ?? super.getMultiProofIndices(parameters);

    const compactProof =
      !parameters.indices && parameters.compactProof
        ? [parameters.compactProof[0]].concat(parameters.compactProof.slice(4))
        : parameters.compactProof;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(unbalanced, sortedHash);
    const leafs = elements.map((element) => hashNode(prefixBuffer, element));
    const params = Object.assign({ leafs }, parameters, { indices, compactProof });
    const opts = { hashFunction, sortedHash };
    const { tree, elementCount } = MultiIndexedProofs.getPartialTree(params, opts);

    const partialElements = Array(elementCount).fill(null);
    indices.forEach((index, i) => (partialElements[index] = elements[i]));

    return new PartialMerkleTree(partialElements, tree, options);
  }

  static fromMultiUpdateProof(parameters, options = {}) {
    const { updateElements } = parameters;
    const params = Object.assign({}, parameters, { elements: updateElements });

    return PartialMerkleTree.fromMultiProof(params, options);
  }

  get elements() {
    return this._elements.map((e) => e && Buffer.from(e));
  }

  generateSingleProof(index, options = {}) {
    assert(this._elements[index], 'Partial tree does not have element.');

    return super.generateSingleProof(index, options);
  }

  generateSingleUpdateProof(index, updateElement, options = {}) {
    assert(this._elements[index], 'Partial tree does not have element.');

    return super.generateSingleUpdateProof(index, updateElement, options);
  }

  updateSingle(index, updateElement, options = {}) {
    const proof = this.generateSingleUpdateProof(index, updateElement, options);
    const newPartialTree = PartialMerkleTree.fromSingleUpdateProof(proof, options);

    return { proof, newPartialTree };
  }

  generateMultiProof(indices, options = {}) {
    indices.forEach((index) => {
      assert(this._elements[index], 'Partial tree does not have element.');
    });

    return super.generateMultiProof(indices, options);
  }

  generateMultiUpdateProof(indices, updateElements, options = {}) {
    indices.forEach((index) => {
      assert(this._elements[index], 'Partial tree does not have element.');
    });

    return super.generateMultiUpdateProof(indices, updateElements, options);
  }

  updateMulti(indices, updateElements, options = {}) {
    const proof = this.generateMultiUpdateProof(indices, updateElements, options);
    const newPartialTree = PartialMerkleTree.fromMultiUpdateProof(proof, options);

    return { proof, newPartialTree };
  }

  // TODO: override non-functional methods
}

module.exports = PartialMerkleTree;
