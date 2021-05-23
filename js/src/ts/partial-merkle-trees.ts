import { hashNode, getHashFunction, to32ByteBuffer, from32ByteBuffer } from './utils'
import { MerkleTree } from './merkle-trees'
import * as Common from './common'
import * as SingleProofs from './single-proofs'
import * as MultiIndexedProofs from './index-multi-proofs'

export class PartialMerkleTree extends MerkleTree {
  _elements: Array<Buffer>
  _tree: Array<Buffer>
  _depth: number

  constructor(elements: Array<Buffer>, tree: Array<Buffer>, options?: Common.proofOptions) {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (tree.length <= 1) throw new Error('Cannot create empty Partial Tree.')
    if (tree.length >> 1 !== Common.getBalancedLeafCount(elements.length)) throw new Error('Element and tree mismatch.')

    super([], options)
    this._elements = elements.map((e) => e && Buffer.from(e))
    this._tree = tree.map((n) => n && Buffer.from(n))
    this._depth = Common.getDepth(elements.length)
    this._tree[0] = MerkleTree.computeMixedRoot(elements.length, tree[1])
  }

  static fromSingleProof(proof: Common.proof, options?: Common.proofOptions): PartialMerkleTree {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, proof.element)
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction }, options)
    const { tree, elementCount: recoveredElementCount } = SingleProofs.getPartialTree(proof.index, leaf, proof.compactProof, proof.elementCount, proof.decommitments, opts)

    const partialElements = Array(recoveredElementCount).fill(null)
    partialElements[proof.index] = proof.element

    return new PartialMerkleTree(partialElements, tree, options)
  }

  static fromSingleUpdateProof(proof: Common.updateProof, options?: Common.proofOptions): PartialMerkleTree {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return PartialMerkleTree.fromSingleProof({ index: proof.index, element: proof.updateElement, elementCount: proof.elementCount, compactProof: proof.compactProof, decommitments: proof.decommitments }, options)
  }

  static fromMultiProof(proof: Common.proof, options?: Common.proofOptions): PartialMerkleTree {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (proof.indices.length <= 0 && options.sortedHash) throw new Error('Cannot build sorted-hash Partial Tree from existence-only multi-proof.')

    proof.indices = proof.indices ?? super.getMultiProofIndices({ elementCount: proof.elementCount, compactProof: proof.compactProof, flags: proof.flags, skips: proof.skips, orders: proof.orders })
    proof.compactProof = !proof.indices && proof.compactProof
      ? [proof.compactProof[0]].concat(proof.compactProof.slice(4))
      : proof.compactProof

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leafs = proof.elements.map((element) => hashNode(prefixBuffer, element))
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction }, options)
    const { tree, elementCount: recoveredElementCount } = MultiIndexedProofs.getPartialTree(proof.indices, leafs, proof.compactProof, proof.elementCount, proof.decommitments, opts)

    const partialElements = Array(recoveredElementCount).fill(null)
    proof.indices.forEach((index, i) => (partialElements[index] = proof.elements[i]))

    return new PartialMerkleTree(partialElements, tree, options)
  }

  static fromMultiUpdateProof(proof: Common.updateProof, options?: Common.proofOptions): PartialMerkleTree {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return PartialMerkleTree.fromMultiProof({ indices: proof.indices, elements: proof.updateElements, elementCount: proof.elementCount, compactProof: proof.compactProof, decommitments: proof.decommitments, flags: proof.flags, skips: proof.skips, orders: proof.orders }, options)
  }

  static fromAppendProof(proof: Common.appendProof, options?: Common.proofOptions): PartialMerkleTree {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (!proof.appendElement && !proof.appendElements) throw new Error('Append elements required.')

    const index = proof.elementCount ?? from32ByteBuffer(proof.compactProof[0])
    const element = proof.appendElement ?? proof.appendElements[0]

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, element)

    if (proof.compactProof) {
      proof.compactProof[0] = to32ByteBuffer(index + 1)
    }

    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction }, options)
    const { tree } = SingleProofs.getPartialTree(index, leaf, proof.compactProof, proof.elementCount, proof.decommitments, opts)

    const partialElements = Array(index)
      .fill(null)
      .concat(proof.appendElement ?? proof.appendElements)

    const leafs = partialElements.map((element) => element && hashNode(prefixBuffer, element))
    const newTree = Common.getGrownTree(tree, leafs, opts)

    return new PartialMerkleTree(partialElements, newTree, options)
  }

  // TODO: from combined proofs

  get elements(): Array<Buffer> {
    return this._elements.map((e) => e && Buffer.from(e))
  }

  generateSingleProof(index: number, options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')
    if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
    if (!this._elements[index]) throw new Error('Partial tree does not have element.')

    return super.generateSingleProof(index, options)
  }

  generateSingleUpdateProof(index: number, updateElement: Buffer, options?: Common.proofOptions): Common.updateProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')
    if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
    if (!this._elements[index]) throw new Error('Partial tree does not have element.')

    return super.generateSingleUpdateProof(index, updateElement, options)
  }

  updatePartialSingle(index: number, updateElement: Buffer, options?: Common.proofOptions): { proof: Common.updateProof, newPartialTree: PartialMerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return {
      proof: this.generateSingleUpdateProof(index, updateElement, options),
      newPartialTree: this.set(index, updateElement),
    }
  }

  generateMultiProof(indices: Array<number>, options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    indices.forEach((index) => {
      if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
      if (!this._elements[index]) throw new Error('Partial tree does not have element.')
    })

    return super.generateMultiProof(indices, options)
  }

  generateMultiUpdateProof(indices: Array<number>, updateElements: Array<Buffer>, options?: Common.proofOptions): Common.updateProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    indices.forEach((index) => {
      if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
      if (!this._elements[index]) throw new Error('Partial tree does not have element.')
    })

    return super.generateMultiUpdateProof(indices, updateElements, options)
  }

  updatePartialMulti(indices: Array<number>, updateElements: Array<Buffer>, options?: Common.proofOptions): { proof: Common.updateProof, newPartialTree: PartialMerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return {
      proof: this.generateMultiUpdateProof(indices, updateElements, options),
      newPartialTree: this.set(indices, updateElements),
    }
  }

  generateAppendProof(options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return super.generateAppendProof(options)
  }

  generateSingleAppendProof(appendElement: Buffer, options?: Common.proofOptions): Common.appendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return super.generateSingleAppendProof(appendElement, options)
  }

  generateMultiAppendProof(appendElements: Array<Buffer>, options?: Common.proofOptions): Common.appendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return super.generateMultiAppendProof(appendElements, options)
  }

  appendPartialSingle(appendElement: Buffer, options?: Common.proofOptions): { proof: Common.appendProof, newPartialTree: PartialMerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return {
      proof: this.generateSingleAppendProof(appendElement, options),
      newPartialTree: this.append(appendElement),
    }
  }

  appendPartialMulti(appendElements: Array<Buffer>, options?: Common.proofOptions): { proof: Common.appendProof, newPartialTree: PartialMerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return {
      proof: this.generateMultiAppendProof(appendElements, options),
      newPartialTree: this.append(appendElements),
    }
  }

  generateCombinedProof(indices: Array<number>, options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length < 0) throw new Error('Tree has no known elements.')

    if (!Array.isArray(indices)) {
      if (indices < 0 || indices > this._elements.length) throw new Error('Index out of range.')
      if (!this._elements[indices]) throw new Error('Partial tree does not have element.')
    } else {
      indices.forEach((index) => {
        if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
        if (!this._elements[index]) throw new Error('Partial tree does not have element.')
      })
    }

    return super.generateCombinedProof(indices, options)
  }

  generatePartialUpdateAppendProof(indices: Array<number>, updateElements: Array<Buffer>, appendElements: Array<Buffer>, options?: Common.proofOptions): Common.updateAndAppendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    if (!Array.isArray(indices)) {
      if (indices < 0 || indices >= this._elements.length) throw new Error('Index out of range.')
      if (!this._elements[indices]) throw new Error('Partial tree does not have element.')
    } else {
      indices.forEach((index) => {
        if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
        if (!this._elements[index]) throw new Error('Partial tree does not have element.')
      })
    }

    return super.generateUpdateAppendProof({ indices, updateElements, appendElements }, options)
  }

  generatePartialUseAppendProof(indices: Array<number>, appendElements: Array<Buffer>, options?: Common.proofOptions): Common.appendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    if (!Array.isArray(indices)) {
      if (indices < 0 || indices >= this._elements.length) throw new Error('Index out of range.')
      if (!this._elements[indices]) throw new Error('Partial tree does not have element.')
    } else {
      indices.forEach((index) => {
        if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
        if (!this._elements[index]) throw new Error('Partial tree does not have element.')
      })
    }

    return super.generateUseAppendProof({ indices, appendElements }, options)
  }

  updatePartialAndAppend(indices: Array<number>, updateElements: Array<Buffer>, appendElements: Array<Buffer>, options?: Common.proofOptions): { proof: Common.updateAndAppendProof, newPartialTree: PartialMerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return {
      proof: this.generateUpdateAppendProof({ indices, updateElements, appendElements }, options),
      newPartialTree: this.set(indices, updateElements).append(appendElements),
    }
  }

  usePartialAndAppend(indices: Array<number>, appendElements: Array<Buffer>, options?: Common.proofOptions): { proof: Common.appendProof, newPartialTree: PartialMerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    return {
      proof: this.generateUseAppendProof({ indices, appendElements }, options),
      newPartialTree: this.append(appendElements),
    }
  }

  generateSizeProof(options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const { simple = true } = options
    if (!simple && this._elements.length <= 0) throw new Error('Tree has no known elements.')
    return super.generateSizeProof(options)
  }

  has(indices: Array<number>): boolean {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')
    if (!Array.isArray(indices)) return this.has([indices])

    return indices.reduce((haveAll: boolean, index) => {
      if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
      return haveAll && this._elements[index] !== null
    }, true)
  }

  check(indices: Array<number> | number, elements: Array<Buffer> | Buffer): Array<boolean> {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    if (!Array.isArray(indices) && !Array.isArray(elements)) return this.check([indices], [elements])
    else if (!Array.isArray(elements)) return this.check(indices, [elements])
    else if (!Array.isArray(indices)) return this.check([indices], elements)

    indices.forEach((index) => {
      if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
    })

    const leafs = elements.map((element) => hashNode(this._elementPrefix, element))

    return Common.checkElements(this._tree, indices, leafs)
  }

  set(indices: Array<number> | number, elements: Array<Buffer> | Buffer): PartialMerkleTree {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    if (!Array.isArray(indices) && !Array.isArray(elements)) return this.set([indices], [elements])
    Array.isArray(indices) && indices.forEach((index) => {
      if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
    })

    const newElements = this.elements
    const elementArray = Array.isArray(elements) ? elements : Array<Buffer>()
    Array.isArray(indices) && indices.forEach((index, i) => {
      newElements[index] = elementArray[i]
    })

    const leafs = newElements.map((element) => element && hashNode(this._elementPrefix, element))
    const hashFunction = getHashFunction(this._sortedHash)
    const treeOpts = Object.assign({}, Common.defaultTreeOptions, {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      hashFunction: hashFunction
    })
    const newTree = Common.getUpdatedTree(this._tree, leafs, treeOpts)

    const proofOpts = Object.assign({}, Common.defaultProofOptions, {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    })
    return new PartialMerkleTree(newElements, newTree, proofOpts)
  }

  append(elements: Array<Buffer> | Buffer): PartialMerkleTree {
    if (!Array.isArray(elements)) return this.append([elements])

    const elementArray = Array.isArray(elements) ? elements : Array<Buffer>()
    const newElements = this.elements.concat(elementArray)
    const leafs = newElements.map((element) => element && hashNode(this._elementPrefix, element))
    const hashFunction = getHashFunction(this._sortedHash)

    const treeOpts = Object.assign({}, Common.defaultTreeOptions, {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      hashFunction: hashFunction
    })
    const newTree = Common.getGrownTree(this._tree, leafs, treeOpts)

    const proofOpts = Object.assign({}, Common.defaultProofOptions, {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    })
    return new PartialMerkleTree(newElements, newTree, proofOpts)
  }
}

