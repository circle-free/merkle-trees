import { hashNode, getHashFunction, to32ByteBuffer, from32ByteBuffer } from './utils'
import { MerkleTree } from './merkle-trees'
import * as Common from './common'
import * as SingleProofs from './single-proofs'
import * as MultiIndexedProofs from './index-multi-proofs'

export class PartialMerkleTree extends MerkleTree {
  _elements: Array<Buffer>
  _tree: Array<Buffer>
  _depth: number

  constructor(elements: Array<Buffer>, tree: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions) {
    if (tree.length <= 1) throw new Error('Cannot create empty Partial Tree.')
    if (tree.length >> 1 !== Common.getBalancedLeafCount(elements.length)) throw new Error('Element and tree mismatch.')

    super([], options)
    this._elements = elements.map((e) => e && Buffer.from(e))
    this._tree = tree.map((n) => n && Buffer.from(n))
    this._depth = Common.getDepth(elements.length)
    this._tree[0] = MerkleTree.computeMixedRoot(elements.length, tree[1])
  }

  static fromSingleProof(index: number, element: Buffer, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): PartialMerkleTree {
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, element)
    const opts = Object.assign({ hashFunction }, options)
    const { tree, elementCount: recoveredElementCount } = SingleProofs.getPartialTree(index, leaf, compactProof, elementCount, decommitments, opts)

    const partialElements = Array(elementCount).fill(null)
    partialElements[index] = element

    return new PartialMerkleTree(partialElements, tree, options)
  }

  static fromSingleUpdateProof(index: number, updateElement: Buffer, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): PartialMerkleTree {
    return PartialMerkleTree.fromSingleProof(index, updateElement, elementCount, compactProof, decommitments, options)
  }

  static fromMultiProof(indices: Array<number>, elements: Array<Buffer>, leafCount: number, elementCount?: number, compactProof?: Array<Buffer>, decommitments?: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, options: Common.proofOptions = Common.defaultProofOptions): PartialMerkleTree {
    if (indices.length <= 0 && options.sortedHash) throw new Error('Cannot build sorted-hash Partial Tree from existence-only multi-proof.')

    indices = indices ?? super.getMultiProofIndices(leafCount, compactProof, flags, skips, orders)
    compactProof = !indices && compactProof
      ? [compactProof[0]].concat(compactProof.slice(4))
      : compactProof

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leafs = elements.map((element) => hashNode(prefixBuffer, element))
    const opts = Object.assign({ hashFunction }, options)
    const { tree, elementCount: recoveredElementCount } = MultiIndexedProofs.getPartialTree(indices, leafs, compactProof, elementCount, decommitments, opts)

    const partialElements = Array(elementCount).fill(null)
    indices.forEach((index, i) => (partialElements[index] = elements[i]))

    return new PartialMerkleTree(partialElements, tree, options)
  }

  static fromMultiUpdateProof(indices: Array<number>, updateElements: Array<Buffer>, leafCount: number, elementCount?: number, compactProof?: Array<Buffer>, decommitments?: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, options: Common.proofOptions = Common.defaultProofOptions): PartialMerkleTree {
    return PartialMerkleTree.fromMultiProof(indices, updateElements, leafCount, elementCount, compactProof, decommitments, flags, skips, orders, options)
  }

  static fromAppendProof(decommitments: Array<Buffer>, compactProof: Array<Buffer>, appendElement: Buffer, appendElements: Array<Buffer>, elementCount?: number, options: Common.proofOptions = Common.defaultProofOptions): PartialMerkleTree {
    if (!appendElement && !appendElements) throw new Error('Append elements required.')

    const index = elementCount ?? from32ByteBuffer(compactProof[0])
    const element = appendElement ?? appendElements[0]

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, element)

    if (compactProof) {
      compactProof[0] = to32ByteBuffer(index + 1)
    }

    const opts = Object.assign({ hashFunction }, options)
    const { tree } = SingleProofs.getPartialTree(index, leaf, compactProof, elementCount, decommitments, opts)

    const partialElements = Array(index)
      .fill(null)
      .concat(appendElement ?? appendElements)

    const leafs = partialElements.map((element) => element && hashNode(prefixBuffer, element))
    const newTree = Common.getGrownTree(tree, leafs, opts)

    return new PartialMerkleTree(partialElements, newTree, options)
  }

  // TODO: from combined proofs

  get elements(): Array<Buffer> {
    return this._elements.map((e) => e && Buffer.from(e))
  }

  generateSingleProof(index: number, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, element: Buffer, index: number, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer> } {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')
    if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
    if (!this._elements[index]) throw new Error('Partial tree does not have element.')

    return super.generateSingleProof(index, options)
  }

  generateSingleUpdateProof(index: number, updateElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, element: Buffer, updateElement: Buffer, index: number, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer> } {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')
    if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
    if (!this._elements[index]) throw new Error('Partial tree does not have element.')

    return super.generateSingleUpdateProof(index, updateElement, options)
  }

  updatePartialSingle(index: number, updateElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): { proof: { root: Buffer, element: Buffer, updateElement: Buffer, index: number, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer> }, newPartialTree: PartialMerkleTree } {
    return {
      proof: this.generateSingleUpdateProof(index, updateElement, options),
      newPartialTree: this.set(index, updateElement),
    }
  }

  generateMultiProof(indices: Array<number>, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, elements: Array<Buffer>, indices?: Array<number>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0> } {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    indices.forEach((index) => {
      if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
      if (!this._elements[index]) throw new Error('Partial tree does not have element.')
    })

    return super.generateMultiProof(indices, options)
  }

  generateMultiUpdateProof(indices: Array<number>, updateElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { updateElements: Array<Buffer>, root: Buffer, elements: Array<Buffer>, indices?: Array<number>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0> } {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    indices.forEach((index) => {
      if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')
      if (!this._elements[index]) throw new Error('Partial tree does not have element.')
    })

    return super.generateMultiUpdateProof(indices, updateElements, options)
  }

  updatePartialMulti(indices: Array<number>, updateElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: { updateElements: Array<Buffer>, root: Buffer, elements: Array<Buffer>, indices?: Array<number>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0> }, newPartialTree: PartialMerkleTree } {
    return {
      proof: this.generateMultiUpdateProof(indices, updateElements, options),
      newPartialTree: this.set(indices, updateElements),
    }
  }

  generateAppendProof(options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, compactProof?: Array<Buffer>, elementCount?: number, decommitments?: Array<Buffer> } {
    return super.generateAppendProof(options)
  }

  generateSingleAppendProof(appendElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): { appendElement: Buffer, root: Buffer, compactProof?: Array<Buffer>, elementCount?: number, decommitments?: Array<Buffer> } {
    return super.generateSingleAppendProof(appendElement, options)
  }

  generateMultiAppendProof(appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { appendElements: Array<Buffer>, root: Buffer, compactProof?: Array<Buffer>, elementCount?: number, decommitments?: Array<Buffer> } {
    return super.generateMultiAppendProof(appendElements, options)
  }

  appendPartialSingle(appendElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): { proof: { appendElement: Buffer, root: Buffer, compactProof?: Array<Buffer>, elementCount?: number, decommitments?: Array<Buffer> }, newPartialTree: PartialMerkleTree } {
    return {
      proof: this.generateSingleAppendProof(appendElement, options),
      newPartialTree: this.append(appendElement),
    }
  }

  appendPartialMulti(appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: { appendElements: Array<Buffer>, root: Buffer, compactProof?: Array<Buffer>, elementCount?: number, decommitments?: Array<Buffer> }, newPartialTree: PartialMerkleTree } {
    return {
      proof: this.generateMultiAppendProof(appendElements, options),
      newPartialTree: this.append(appendElements),
    }
  }

  generateCombinedProof(indices: Array<number>, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, element?: Buffer, elements?: Array<Buffer>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, index?: number } {
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

  generateUpdateAppendProof(indices: Array<number>, updateElements: Array<Buffer>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { updateElement?: Buffer, updateElements?: Array<Buffer>, appendElement?: Buffer, appendElements?: Array<Buffer>, root: Buffer, element?: Buffer, elements?: Array<Buffer>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, index?: number } {
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

    return super.generateUpdateAppendProof(indices, updateElements, appendElements, options)
  }

  generateUseAppendProof(indices: Array<number>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { appendElement?: Buffer, appendElements?: Array<Buffer>, root: Buffer, element?: Buffer, elements?: Array<Buffer>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, index?: number } {
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

    return super.generateUseAppendProof(indices, appendElements, options)
  }

  updatePartialAndAppend(indices: Array<number>, updateElements: Array<Buffer>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: { updateElement?: Buffer, updateElements?: Array<Buffer>, appendElement?: Buffer, appendElements?: Array<Buffer>, root: Buffer, element?: Buffer, elements?: Array<Buffer>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, index?: number }, newPartialTree: PartialMerkleTree } {
    return {
      proof: this.generateUpdateAppendProof(indices, updateElements, appendElements, options),
      newPartialTree: this.set(indices, updateElements).append(appendElements),
    }
  }

  usePartialAndAppend(indices: Array<number>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: { appendElement?: Buffer, appendElements?: Array<Buffer>, root: Buffer, element?: Buffer, elements?: Array<Buffer>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, index?: number }, newPartialTree: PartialMerkleTree } {
    return {
      proof: this.generateUseAppendProof(indices, appendElements, options),
      newPartialTree: this.append(appendElements),
    }
  }

  generateSizeProof(options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, elementCount: number, elementRoot?: Buffer, compactProof?: Array<Buffer>, decommitments?: Array<Buffer> } {
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

  check(indices: Array<number>, elements: Array<Buffer>): Array<boolean> {
    if (this._elements.length <= 0) throw new Error('Tree has no known elements.')

    if (!Array.isArray(indices) && !Array.isArray(elements)) return this.check([indices], [elements])

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
    const treeOpts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      hashFunction: hashFunction
    }, Common.defaultTreeOptions)
    const newTree = Common.getUpdatedTree(this._tree, leafs, treeOpts)

    const proofOpts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, Common.defaultProofOptions)
    return new PartialMerkleTree(newElements, newTree, proofOpts)
  }

  append(elements: Array<Buffer> | Buffer): PartialMerkleTree {
    if (!Array.isArray(elements)) return this.append([elements])

    const elementArray = Array.isArray(elements) ? elements : Array<Buffer>()
    const newElements = this.elements.concat(elementArray)
    const leafs = newElements.map((element) => element && hashNode(this._elementPrefix, element))
    const hashFunction = getHashFunction(this._sortedHash)

    const treeOpts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      hashFunction: hashFunction
    }, Common.defaultTreeOptions)
    const newTree = Common.getGrownTree(this._tree, leafs, treeOpts)

    const proofOpts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, Common.defaultProofOptions)
    return new PartialMerkleTree(newElements, newTree, proofOpts)
  }
}

