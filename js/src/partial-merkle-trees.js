const assert = require('assert');

const { hashNode, getHashFunction, to32ByteBuffer, from32ByteBuffer } = require('./utils');
const MerkleTree = require('./merkle-trees');
const Common = require('./common');
const SingleProofs = require('./single-proofs');
const MultiIndexedProofs = require('./index-multi-proofs');

class PartialMerkleTree extends MerkleTree {
  constructor(elements, tree, options) {
    assert(tree.length > 1, 'Cannot create empty Partial Tree.');
    assert(tree.length >> 1 === Common.getBalancedLeafCount(elements.length), 'Element and tree mismatch.');

    super([], options);

    this._elements = elements.map((e) => e && Buffer.from(e));
    this._tree = tree.map((n) => n && Buffer.from(n));
    this._depth = Common.getDepth(elements.length);
    this._tree[0] = MerkleTree.computeMixedRoot(elements.length, tree[1]);
  }

  static fromSingleProof(parameters, options = {}) {
    const { sortedHash = true, elementPrefix = '00' } = options;
    const { index, element } = parameters;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);
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
    const { sortedHash = true, elementPrefix = '00' } = options;

    assert(parameters.indices || !sortedHash, 'Cannot build sorted-hash Partial Tree from existence-only multi-proof.');

    const { elements } = parameters;
    const indices = parameters.indices ?? super.getMultiProofIndices(parameters);

    const compactProof =
      !parameters.indices && parameters.compactProof
        ? [parameters.compactProof[0]].concat(parameters.compactProof.slice(4))
        : parameters.compactProof;

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);
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

  static fromAppendProof(parameters, options = {}) {
    const { sortedHash = true, elementPrefix = '00' } = options;
    const { compactProof, appendElement, appendElements } = parameters;

    assert(appendElement || appendElements, 'Append elements required.');

    const index = parameters.elementCount ?? from32ByteBuffer(compactProof[0]);
    const element = appendElement ?? appendElements[0];

    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashFunction = getHashFunction(sortedHash);
    const leaf = hashNode(prefixBuffer, element);

    if (compactProof) {
      compactProof[0] = to32ByteBuffer(index + 1);
    }

    const params = Object.assign({ index, leaf }, parameters, { compactProof, elementCount: index + 1 });
    const opts = { hashFunction, sortedHash };
    const { tree } = SingleProofs.getPartialTree(params, opts);

    const partialElements = Array(index)
      .fill(null)
      .concat(appendElement ?? appendElements);

    const leafs = partialElements.map((element) => element && hashNode(prefixBuffer, element));
    const newTree = Common.getGrownTree({ tree, leafs }, { hashFunction });

    return new PartialMerkleTree(partialElements, newTree, options);
  }

  // TODO: from combined proofs

  get elements() {
    return this._elements.map((e) => e && Buffer.from(e));
  }

  generateSingleProof(index, options = {}) {
    assert(this._elements.length > 0, 'Tree has no known elements.');
    assert(index >= 0 && index < this._elements.length, 'Index out of range.');
    assert(this._elements[index], 'Partial tree does not have element.');

    return super.generateSingleProof(index, options);
  }

  generateSingleUpdateProof(index, updateElement, options = {}) {
    assert(this._elements.length > 0, 'Tree has no known elements.');
    assert(index >= 0 && index < this._elements.length, 'Index out of range.');
    assert(this._elements[index], 'Partial tree does not have element.');

    return super.generateSingleUpdateProof(index, updateElement, options);
  }

  updateSingle(index, updateElement, options = {}) {
    return {
      proof: this.generateSingleUpdateProof(index, updateElement, options),
      newPartialTree: this.set(index, updateElement),
    };
  }

  generateMultiProof(indices, options = {}) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    indices.forEach((index) => {
      assert(index >= 0 && index < this._elements.length, 'Index out of range.');
      assert(this._elements[index], 'Partial tree does not have element.');
    });

    return super.generateMultiProof(indices, options);
  }

  generateMultiUpdateProof(indices, updateElements, options = {}) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    indices.forEach((index) => {
      assert(index >= 0 && index < this._elements.length, 'Index out of range.');
      assert(this._elements[index], 'Partial tree does not have element.');
    });

    return super.generateMultiUpdateProof(indices, updateElements, options);
  }

  updateMulti(indices, updateElements, options = {}) {
    return {
      proof: this.generateMultiUpdateProof(indices, updateElements, options),
      newPartialTree: this.set(indices, updateElements),
    };
  }

  generateAppendProof(options = {}) {
    return super.generateAppendProof(options);
  }

  generateSingleAppendProof(appendElement, options) {
    return super.generateSingleAppendProof(appendElement, options);
  }

  generateMultiAppendProof(appendElements, options = {}) {
    return super.generateMultiAppendProof(appendElements, options);
  }

  appendSingle(appendElement, options = {}) {
    return {
      proof: this.generateSingleAppendProof(appendElement, options),
      newPartialTree: this.append(appendElement),
    };
  }

  appendMulti(appendElements, options = {}) {
    return {
      proof: this.generateMultiAppendProof(appendElements, options),
      newPartialTree: this.append(appendElements),
    };
  }

  generateCombinedProof(indices, options = {}) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    if (!Array.isArray(indices)) {
      assert(indices >= 0 && indices < this._elements.length, 'Index out of range.');
      assert(this._elements[indices], 'Partial tree does not have element.');
    } else {
      indices.forEach((index) => {
        assert(index >= 0 && index < this._elements.length, 'Index out of range.');
        assert(this._elements[index], 'Partial tree does not have element.');
      });
    }

    return super.generateCombinedProof(indices, options);
  }

  generateUpdateAppendProof(indices, updateElements, appendElements, options = {}) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    if (!Array.isArray(indices)) {
      assert(indices >= 0 && indices < this._elements.length, 'Index out of range.');
      assert(this._elements[indices], 'Partial tree does not have element.');
    } else {
      indices.forEach((index) => {
        assert(index >= 0 && index < this._elements.length, 'Index out of range.');
        assert(this._elements[index], 'Partial tree does not have element.');
      });
    }

    return super.generateUpdateAppendProof(indices, updateElements, appendElements, options);
  }

  generateUseAppendProof(indices, appendElements, options = {}) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    if (!Array.isArray(indices)) {
      assert(indices >= 0 && indices < this._elements.length, 'Index out of range.');
      assert(this._elements[indices], 'Partial tree does not have element.');
    } else {
      indices.forEach((index) => {
        assert(index >= 0 && index < this._elements.length, 'Index out of range.');
        assert(this._elements[index], 'Partial tree does not have element.');
      });
    }

    return super.generateUseAppendProof(indices, appendElements, options);
  }

  updateAndAppend(indices, updateElements, appendElements, options = {}) {
    return {
      proof: this.generateUpdateAppendProof(indices, updateElements, appendElements, options),
      newPartialTree: this.set(indices, updateElements).append(appendElements),
    };
  }

  useAndAppend(indices, appendElements, options = {}) {
    return {
      proof: this.generateUseAppendProof(indices, appendElements, options),
      newPartialTree: this.append(appendElements),
    };
  }

  generateSizeProof(options = {}) {
    const { simple = true } = options;
    assert(simple || this._elements.length > 0, 'Tree has no known elements.');

    return super.generateSizeProof(options);
  }

  has(indices) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    if (!Array.isArray(indices)) return this.has([indices]);

    return indices.reduce((haveAll, index) => {
      assert(index >= 0 && index < this._elements.length, 'Index out of range.');

      return haveAll && this._elements[index] !== null;
    }, true);
  }

  check(indices, elements) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    if (!Array.isArray(indices)) return this.check([indices], [elements])[0];

    indices.forEach((index) => {
      assert(index >= 0 && index < this._elements.length, 'Index out of range.');
    });

    const leafs = elements.map((element) => hashNode(this._elementPrefix, element));

    return Common.checkElements({ tree: this._tree, indices, leafs });
  }

  set(indices, elements) {
    assert(this._elements.length > 0, 'Tree has no known elements.');

    if (!Array.isArray(indices)) return this.set([indices], [elements]);

    indices.forEach((index) => {
      assert(index >= 0 && index < this._elements.length, 'Index out of range.');
    });

    const newElements = this.elements;
    indices.forEach((index, i) => {
      newElements[index] = elements[i];
    });

    const leafs = newElements.map((element) => element && hashNode(this._elementPrefix, element));
    const hashFunction = getHashFunction(this._sortedHash);
    const newTree = Common.getUpdatedTree({ tree: this._tree, leafs }, { hashFunction });

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new PartialMerkleTree(newElements, newTree, options);
  }

  append(elements) {
    if (!Array.isArray(elements)) return this.append([elements]);

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    const newElements = this.elements.concat(elements);
    const leafs = newElements.map((element) => element && hashNode(this._elementPrefix, element));
    const hashFunction = getHashFunction(this._sortedHash);
    const newTree = Common.getGrownTree({ tree: this._tree, leafs }, { hashFunction });

    return new PartialMerkleTree(newElements, newTree, options);
  }
}

module.exports = PartialMerkleTree;
