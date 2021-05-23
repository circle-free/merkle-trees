import { hashNode, getHashFunction, to32ByteBuffer } from './utils'
import * as Common from './common'
import * as SingleProofs from './single-proofs'
import * as MultiIndexedProofs from './index-multi-proofs'
import * as MultiFlagProofs from './flag-multi-proofs'
import * as AppendProofs from './append-proofs'
import * as CombinedProofs from './combined-proofs'

export class MerkleTree {
  _unbalanced: boolean
  _depth: number
  _sortedHash: Buffer
  _elementPrefix: Buffer
  _elements: Array<Buffer>
  _tree: Array<Buffer>

  constructor(elements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions) {
    this._elementPrefix = Buffer.from(options.elementPrefix, 'hex')
    this._sortedHash = options.sortedHash
    this._unbalanced = options.unbalanced
    this._elements = elements.map(Buffer.from)

    if (elements.length === 0) {
      this._depth = 0
      this._tree = []

      return
    }

    const balancedLeafCount = Common.getBalancedLeafCount(this._elements.length)
    if (!options.unbalanced && elements.length !== balancedLeafCount) throw new Error('Incorrect element count for balanced tree.')

    const leafs = this._elements.map((element) => hashNode(this._elementPrefix, element))

    const hashFunction = getHashFunction(this._sortedHash)
    const { tree, depth } = Common.buildTree(leafs, Object.assign({
      hashFunction: hashFunction,
      sortedHash: options.sortedHash,
      unbalanced: options.unbalanced,
    }, Common.defaultTreeOptions))

    this._tree = tree
    this._depth = depth
    this._tree[0] = MerkleTree.computeMixedRoot(this._elements.length, this._tree[1])
  }

  static verifySingleProof(root: Buffer, element: Buffer, index: number, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): boolean {
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, element)
    const opts = Object.assign({ hashFunction }, Common.defaultTreeOptions)
    const { root: recoveredRoot, elementCount: recoveredElementCount } = SingleProofs.getRoot({ index, leaf, compactProof, elementCount, decommitments }, opts)

    return MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)
  }

  static updateWithSingleProof(root: Buffer, element: Buffer, updateElement: Buffer, index: number, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer } {
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, element)
    const updateLeaf = hashNode(prefixBuffer, updateElement)
    const opts = Object.assign({ hashFunction }, Common.defaultTreeOptions)
    const { root: recoveredRoot, newRoot, elementCount: recoveredElementCount } = SingleProofs.getNewRoot({ index, leaf, updateLeaf, compactProof, elementCount, decommitments }, opts)

    if (!MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')
    return { root: MerkleTree.computeMixedRoot(recoveredElementCount, newRoot) }
  }

  static verifyMultiProof(root: Buffer, elements: Array<Buffer>, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer>, indices?: Array<number>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, options: Common.proofOptions = Common.defaultProofOptions): boolean {
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leafs = elements.map((element) => hashNode(prefixBuffer, element))
    const opts = Object.assign({ hashFunction }, Common.defaultTreeOptions)
    const { root: recoveredRoot, elementCount: recoveredElementCount } = indices.length > 0
      ? MultiIndexedProofs.getRoot({ indices, leafs, compactProof, elementCount, decommitments }, opts)
      : MultiFlagProofs.getRoot({ leafs, compactProof, elementCount, flags, skips, orders, decommitments }, opts)
    return MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)
  }

  static getMultiProofIndices(leafCount: number, compactProof?: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>): Array<number> {
    return MultiFlagProofs.getIndices(leafCount, compactProof, flags, skips, orders).indices
  }

  static updateWithMultiProof(root: Buffer, elements: Array<Buffer>, updateElements: Array<Buffer>, elementCount: number, compactProof: Array<Buffer>, decommitments: Array<Buffer>, indices?: Array<number>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer } {
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leafs = elements.map((element) => hashNode(prefixBuffer, element))
    const updateLeafs = updateElements.map((element) => hashNode(prefixBuffer, element))
    const opts = Object.assign({ hashFunction }, Common.defaultTreeOptions)
    const { root: recoveredRoot, newRoot, elementCount: recoveredElementCount } = indices
      ? MultiIndexedProofs.getNewRoot({ indices, leafs, updateLeafs, compactProof, elementCount, decommitments }, opts)
      : MultiFlagProofs.getNewRoot({ leafs, updateLeafs, compactProof, elementCount, flags, skips, orders, decommitments }, opts)

    if (!MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

    return { root: MerkleTree.computeMixedRoot(recoveredElementCount, newRoot) }
  }

  static verifyAppendProof(root: Buffer, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): boolean {
    // if (!options.unbalanced) throw new Error('Append-Proofs not supported for balanced trees.')
    if (root.equals(to32ByteBuffer(0))) return true

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({ hashFunction }, Common.defaultTreeOptions)
    const { root: recoveredRoot, elementCount: recoveredElementCount } = AppendProofs.getRoot({ compactProof, elementCount, decommitments }, opts)

    return MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)
  }

  static appendWithAppendProof(root: Buffer, appendElement: Buffer, appendElements: Array<Buffer>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, elementCount: number } {
    // if (!options.unbalanced) throw new Error('Append-Proofs not supported for balanced trees.')

    if (root.equals(to32ByteBuffer(0))) {
      const merkleTree = new MerkleTree(appendElements || [appendElement], options)
      return { root: merkleTree.root, elementCount: appendElements?.length ?? 1 }
    }

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({ hashFunction }, Common.defaultTreeOptions)
    const { root: recoveredRoot, newRoot, elementCount: recoveredElementCount } = appendElement?.length > 0
      ? AppendProofs.getNewRoot({ appendLeaf: hashNode(prefixBuffer, appendElement), compactProof, elementCount, decommitments }, opts)
      : AppendProofs.getNewRoot({ appendLeafs: appendElements.map((element) => hashNode(prefixBuffer, element)), compactProof, elementCount, decommitments }, opts)
    const newElementCount = recoveredElementCount + (appendElements?.length ?? 1)

    if (!MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount }
  }

  static appendWithCombinedProof(root: Buffer, element: Buffer, elements: Array<Buffer>, appendElement: Buffer, appendElements: Array<Buffer>, index: number, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, orders?: Array<1 | 0>, skips?: Array<1 | 0>, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, elementCount: number } {
    // if (!options.unbalanced) throw new Error('Combined-Proofs not supported for balanced trees.')

    if (root.equals(to32ByteBuffer(0))) {
      const merkleTree = new MerkleTree(appendElements || [appendElement], options)
      return { root: merkleTree.root, elementCount: appendElements?.length ?? 1 }
    }

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const leaf = hashNode(prefixBuffer, element)
    const leafs = elements.map((element) => hashNode(prefixBuffer, element))

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({ hashFunction }, Common.defaultTreeOptions)
    const { root: recoveredRoot, elementCount: recoveredElementCount, appendDecommitments } = CombinedProofs.getRoot({ leafs, leaf, index, compactProof, elementCount, flags, orders, skips, decommitments }, opts)

    const newRoot = appendElement instanceof Buffer
      ? AppendProofs.appendSingle(hashNode(prefixBuffer, appendElement), recoveredElementCount, decommitments, opts)
      : AppendProofs.appendMulti(appendElements.map((element) => hashNode(prefixBuffer, element)), recoveredElementCount, decommitments, opts)
    const newElementCount = recoveredElementCount + (appendElements?.length ?? 1)

    if (!MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount }
  }

  static verifyCombinedProof(root: Buffer, elements?: Array<Buffer>, element?: Buffer, index?: number, compactProof?: Array<Buffer>, elementCount?: number, flags?: Array<1 | 0>, orders?: Array<1 | 0>, skips?: Array<1 | 0>, decommitments?: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): boolean {
    if (!options.unbalanced) throw new Error('Combined-Proofs not supported for balanced trees.')

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)

    const leaf = hashNode(prefixBuffer, element)
    const leafs = elements.map((e) => hashNode(prefixBuffer, e))
    const opts = Object.assign({ hashFunction }, options)

    const { root: recoveredRoot, elementCount: recoveredElementCount } = CombinedProofs.getRoot({ leafs, leaf, index, compactProof, elementCount, flags, orders, skips, decommitments }, opts)

    return MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)
  }

  static getCombinedProofIndices(leafCount: number, compactProof?: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>): Array<number> {
    return MerkleTree.getMultiProofIndices(leafCount, compactProof, flags, skips, orders)
  }

  static updateAndAppendWithCombinedProof(root: Buffer, element: Buffer, elements: Array<Buffer>, updateElement: Buffer, updateElements: Array<Buffer>, appendElement: Buffer, appendElements: Array<Buffer>, elementCount: number, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, decommitments?: Array<Buffer>, compactProof?: Array<Buffer>, index?: number, options: Common.proofOptions = Common.defaultProofOptions): { root: Buffer, elementCount: number } {
    if (!options.unbalanced) throw new Error('Combined-Proofs not supported for balanced trees.')

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)

    const leaf = hashNode(prefixBuffer, element)
    const updateLeaf = hashNode(prefixBuffer, updateElement)
    const leafs = elements.map((e) => hashNode(prefixBuffer, e))
    const updateLeafs = updateElements.map((element) => hashNode(prefixBuffer, element))

    const opts = Object.assign({ hashFunction }, options)
    const { root: recoveredRoot, elementCount: recoveredElementCount, appendDecommitments } = CombinedProofs.getNewRoot({ leafs, updateLeafs, elementCount, flags, skips, orders, decommitments, compactProof, index, leaf, updateLeaf }, opts)

    const newRoot = appendElement?.length > 0
      ? AppendProofs.appendSingle(hashNode(prefixBuffer, appendElement), recoveredElementCount, decommitments, opts)
      : AppendProofs.appendMulti(appendElements.map((element) => hashNode(prefixBuffer, element)), recoveredElementCount, decommitments, opts)

    const appendCount = appendElements?.length || 1
    const newElementCount = recoveredElementCount + appendCount

    if (!MerkleTree.verifyMixedRoot(root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

    return {
      root: MerkleTree.computeMixedRoot(newElementCount, newRoot),
      elementCount: newElementCount,
    }
  }

  static computeMixedRoot(elementCount: number, root: Buffer): Buffer {
    return hashNode(to32ByteBuffer(elementCount), root)
  }

  static verifyMixedRoot(mixedRoot: Buffer, elementCount: number, root: Buffer): boolean {
    return MerkleTree.computeMixedRoot(elementCount, root).equals(mixedRoot)
  }

  static verifySizeProof(root: Buffer, elementCount: number, elementRoot: Buffer, compactProof: Array<Buffer>, options: Common.treeOptions = Common.defaultTreeOptions): boolean {
    const decommitments = compactProof

    if (root.equals(to32ByteBuffer(0)) && elementCount === 0) return true

    if (elementRoot) return MerkleTree.verifyMixedRoot(root, elementCount, elementRoot)

    if (options.sortedHash) throw new Error('Can only verify simple Size Proofs for sorted hashed trees.')

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({ hashFunction }, options)
    const params = { elementCount, decommitments }
    const { root: recoveredRoot } = AppendProofs.getRoot({ compactProof, elementCount, decommitments }, opts)

    return MerkleTree.verifyMixedRoot(root, elementCount, recoveredRoot)
  }

  get root(): Buffer {
    return this._elements.length ? Buffer.from(this._tree[0]) : to32ByteBuffer(0)
  }

  get elementRoot(): Buffer {
    return this._elements.length ? Buffer.from(this._tree[1]) : to32ByteBuffer(0)
  }

  get depth(): number {
    return this._depth
  }

  get elements(): Array<Buffer> {
    return this._elements.map(Buffer.from)
  }

  get minimumCombinedProofIndex(): number {
    return CombinedProofs.getMinimumIndex(this._elements.length)
  }

  generateSingleProof(index: number, options: Common.proofOptions = Common.defaultProofOptions): Common.proof {
    if (this._elements.length <= 0) throw new Error('Tree is empty.')
    if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')

    const proof = SingleProofs.generate(this._tree, this._elements.length, index, options)
    const base = { root: this.root, element: Buffer.from(this._elements[index]) }

    return Object.assign(base, proof)
  }

  generateSingleUpdateProof(index: number, updateElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): Common.updateProof {
    const base = { updateElement: Buffer.from(updateElement) }

    return Object.assign(base, this.generateSingleProof(index, options))
  }

  updateSingle(index: number, updateElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): { proof: Common.updateProof, newMerkleTree: MerkleTree } {
    const newElements = this._elements.map((e, i) => (i === index ? updateElement : e))

    const opts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, options)

    return {
      proof: this.generateSingleUpdateProof(index, updateElement, options),
      newMerkleTree: new MerkleTree(newElements, opts),
    }
  }

  generateMultiProof(indices: Array<number>, options: Common.proofOptions = Common.defaultProofOptions): Common.proof {
    if (this._elements.length <= 0) throw new Error('Tree is empty.')
    indices.forEach((index, i) => {
      if (index < 0 || index > this._elements.length) throw new Error('Index out of range.')
      if (indices.indexOf(index) !== i) throw new Error('Duplicate in indices.')
    })

    const opts = Object.assign({ unbalanced: this._unbalanced, sortedHash: this._sortedHash }, options)

    const proof = options.indexed
      ? MultiIndexedProofs.generate(this._tree, this.elements.length, indices, opts)
      : MultiFlagProofs.generate(this._tree, this.elements.length, indices, opts)

    const elements = indices.map((index) => Buffer.from(this._elements[index]))
    const base = { root: this.root, elements }

    return Object.assign(base, proof)
  }

  generateMultiUpdateProof(indices: Array<number>, updateElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): Common.updateProof {
    if (indices.length !== updateElements.length) throw new Error('Indices and element count mismatch.')
    const base = { updateElements: updateElements.map(Buffer.from) }

    return Object.assign(base, this.generateMultiProof(indices, options))
  }

  updateMulti(indices: Array<number>, updateElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: Common.updateProof, newMerkleTree: MerkleTree } {
    const newElements = this.elements.map((e, i) => {
      const index = indices.indexOf(i)

      return index >= 0 ? updateElements[index] : e
    })

    const opts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, options)

    return {
      proof: this.generateMultiUpdateProof(indices, updateElements, options),
      newMerkleTree: new MerkleTree(newElements, opts),
    }
  }

  generateAppendProof(options: Common.proofOptions = Common.defaultProofOptions): Common.proof {
    if (!this._unbalanced) throw new Error('Can only generate Append-Proofs for unbalanced trees.')
    if (this._elements.length === 0) {
      return options.compact
        ? { root: this.root, compactProof: [to32ByteBuffer(0)] }
        : { root: this.root, elementCount: 0, decommitments: [] }
    }

    const proof = AppendProofs.generate(this._tree, this._elements.length, options)
    return Object.assign({ root: this.root }, proof)
  }

  generateSingleAppendProof(appendElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): Common.appendProof {
    const base = { appendElement: Buffer.from(appendElement) }

    return Object.assign(base, this.generateAppendProof(options))
  }

  generateMultiAppendProof(appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): Common.appendProof {
    if (appendElements.length <= 0) throw new Error('No elements provided.')
    const base = { appendElements: appendElements.map(Buffer.from) }

    return Object.assign(base, this.generateAppendProof(options))
  }

  appendSingle(appendElement: Buffer, options: Common.proofOptions = Common.defaultProofOptions): { proof: Common.appendProof, newMerkleTree: MerkleTree } {
    const newElements = this.elements.map((e) => e)
    newElements.push(appendElement)

    const opts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, options)
    return {
      proof: this.generateSingleAppendProof(appendElement, options),
      newMerkleTree: new MerkleTree(newElements, opts),
    }
  }

  appendMulti(appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: Common.appendProof, newMerkleTree: MerkleTree } {
    const newElements = this.elements.concat(appendElements)

    const opts = Object.assign({
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, options)

    return {
      proof: this.generateMultiAppendProof(appendElements, options),
      newMerkleTree: new MerkleTree(newElements, opts),
    }
  }

  // Todo: update the default options
  // Todo: Generalize error constants
  generateCombinedProof(indices: Array<number> | number, options: Common.proofOptions = Common.defaultProofOptions): Common.proof {
    if (this._elements.length <= 0) throw new Error('Tree is empty.')

    if (options.indexed) throw new Error('Indexed Combined-Proofs are not yet supported.')
    if (!this._unbalanced) throw new Error('Can only generate Combined-Proofs for unbalanced trees.')

    const elementCount = this._elements.length
    const minimumIndex = CombinedProofs.getMinimumIndex(elementCount)
    const params = { tree: this._tree, elementCount }

    let proof: Common.proof
    if (Array.isArray(indices)) {
      indices.forEach((index, i) => {
        if (index >= this._elements.length) throw new Error('Index out of range.')
        if (indices.indexOf(index) !== i) throw new Error('Duplicate in indices.')
      })

      if (indices[indices.length - 1] >= minimumIndex, `Last index must be larger than ${minimumIndex}.`)
        Object.assign(params, { indices })
      proof = CombinedProofs.generate(this._tree, this._elements.length, indices, null, options)
    } else {
      if (indices >= this._elements.length) throw new Error('Index out of range.')
      if (indices < minimumIndex) throw new Error(`Index must be larger than ${minimumIndex}.`)
      Object.assign(params, { index: indices })
      proof = CombinedProofs.generate(this._tree, this._elements.length, null, indices, options)
    }

    const opts = Object.assign({ sortedHash: this._sortedHash }, options)
    const base = { root: this.root }

    if (Array.isArray(indices)) {
      const elements = indices.map((index) => Buffer.from(this._elements[index]))
      Object.assign(base, { elements })
    } else {
      const element = Buffer.from(this._elements[indices])
      Object.assign(base, { element })
    }

    return Object.assign(base, proof)
  }

  generateUpdateAppendProof(indices: Array<number>, updateElements: Array<Buffer>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): Common.updateAndAppendProof {
    if (Array.isArray(indices) !== Array.isArray(updateElements)) throw new Error('Indices and update mismatch.')
    if (!Number.isInteger(indices) && indices.length <= 0) throw new Error('No elements provided to be proven')
    if (!Number.isInteger(indices) && indices.length !== updateElements.length) throw new Error('Indices and update element count mismatch.')
    if (Array.isArray(appendElements) && appendElements.length <= 0) throw new Error('No elements provided to be appended.')

    const base = {}
    Array.isArray(updateElements)
      ? Object.assign(base, { updateElements: updateElements.map(Buffer.from) })
      : Object.assign(base, { updateElement: Buffer.from(updateElements) })

    Array.isArray(appendElements)
      ? Object.assign(base, { appendElements: appendElements.map(Buffer.from) })
      : Object.assign(base, { appendElement: Buffer.from(appendElements) })

    return Object.assign(base, this.generateCombinedProof(indices, options))
  }

  generateUseAppendProof(indices: Array<number>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): Common.appendProof {
    if (!Number.isInteger(indices) && indices.length <= 0) throw new Error('No elements provided to be proven')
    if (Array.isArray(appendElements) && appendElements.length <= 0) throw new Error('No elements provided to be appended.')

    const base = {}
    Array.isArray(appendElements)
      ? Object.assign(base, { appendElements: appendElements.map(Buffer.from) })
      : Object.assign(base, { appendElement: Buffer.from(appendElements) })

    return Object.assign(base, this.generateCombinedProof(indices, options))
  }

  updateAndAppend(indices: Array<number>, updateElements: Array<Buffer>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: Common.updateAndAppendProof, newMerkleTree: MerkleTree } {
    const index: number = Array.isArray(indices) ? null : indices
    const { newMerkleTree: updatedTree } = Array.isArray(updateElements)
      ? this.updateMulti(indices, updateElements, options)
      : this.updateSingle(index, updateElements, options)

    const { newMerkleTree } = Array.isArray(appendElements)
      ? updatedTree.appendMulti(appendElements, options)
      : updatedTree.appendSingle(appendElements, options)

    return {
      proof: this.generateUpdateAppendProof(indices, updateElements, appendElements, options),
      newMerkleTree,
    }
  }

  useAndAppend(indices: Array<number>, appendElements: Array<Buffer>, options: Common.proofOptions = Common.defaultProofOptions): { proof: Common.appendProof, newMerkleTree: MerkleTree } {
    const { newMerkleTree } = Array.isArray(appendElements)
      ? this.appendMulti(appendElements, options)
      : this.appendSingle(appendElements, options)

    return {
      proof: this.generateUseAppendProof(indices, appendElements, options),
      newMerkleTree,
    }
  }

  generateSizeProof(options: Common.proofOptions = Common.defaultProofOptions): Common.proof {
    const elementCount = this._elements.length

    if (elementCount === 0) {
      const root = to32ByteBuffer(0)
      const element = to32ByteBuffer(0)

      if (options.simple) return { root, elementCount, element }

      if (this._sortedHash) throw new Error('Can only generate simple Size Proofs for sorted hashed trees.')

      return options.compact ? { root, elementCount, compactProof: [] } : { root, elementCount, decommitments: [] }
    }

    if (options.simple) return { root: this.root, elementCount, element: this.elementRoot }

    if (this._sortedHash) throw new Error('Can only generate simple Size Proofs for sorted hashed trees.')

    const opts = Object.assign({}, options, { compact: false })
    const proof = AppendProofs.generate(this._tree, elementCount, opts)
    const decommitments = proof.decommitments

    if (options.compact) return { root: this.root, elementCount, compactProof: decommitments }

    return { root: this.root, elementCount, decommitments }
  }
}
