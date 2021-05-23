import { hashNode, getHashFunction, to32ByteBuffer } from './utils'
import * as Common from './common'
import * as SingleProofs from './single-proofs'
import * as MultiIndexedProofs from './index-multi-proofs'
import * as MultiFlagProofs from './flag-multi-proofs'
import * as AppendProofs from './append-proofs'
import * as CombinedProofs from './combined-proofs'
import { CommonOptions } from 'child_process'

export class MerkleTree {
  _unbalanced: boolean
  _depth: number
  _sortedHash: boolean
  _elementPrefix: Buffer
  _elements: Array<Buffer>
  _tree: Array<Buffer>

  constructor(elements: Array<Buffer>, options?: Common.proofOptions) {
    options = Object.assign({}, Common.defaultProofOptions, options)
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
    const { tree, depth } = Common.buildTree(leafs, Object.assign({}, Common.defaultTreeOptions, {
      hashFunction: hashFunction,
      sortedHash: options.sortedHash,
      unbalanced: options.unbalanced,
    }))

    this._tree = tree
    this._depth = depth
    this._tree[0] = MerkleTree.computeMixedRoot(this._elements.length, this._tree[1])
  }

  static verifySingleProof(proof: Common.proof, options?: Common.proofOptions): boolean {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, proof.element)
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction })
    const { root: recoveredRoot, elementCount: recoveredElementCount } = SingleProofs.getRoot({ index: proof.index, leaf, compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments: proof.decommitments }, opts)

    return MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)
  }

  static updateWithSingleProof(proof: Common.updateProof, options?: Common.proofOptions): { root: Buffer } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leaf = hashNode(prefixBuffer, proof.element)
    const updateLeaf = hashNode(prefixBuffer, proof.updateElement)
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction })
    const { root: recoveredRoot, newRoot, elementCount: recoveredElementCount } = SingleProofs.getNewRoot({ index: proof.index, leaf, updateLeaf, compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments: proof.decommitments }, opts)

    if (!MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')
    return { root: MerkleTree.computeMixedRoot(recoveredElementCount, newRoot) }
  }

  static verifyMultiProof(proof: Common.proof, options?: Common.proofOptions): boolean {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leafs = proof.elements.map((element) => hashNode(prefixBuffer, element))
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction })
    const { root: recoveredRoot, elementCount: recoveredElementCount } = proof.indices.length > 0
      ? MultiIndexedProofs.getRoot({ indices: proof.indices, leafs, compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments: proof.decommitments }, opts)
      : MultiFlagProofs.getRoot({ leafs, compactProof: proof.compactProof, elementCount: proof.elementCount, flags: proof.flags, skips: proof.skips, orders: proof.orders, decommitments: proof.decommitments }, opts)
    return MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)
  }

  static getMultiProofIndices(proof: Common.proof): Array<number> {
    return MultiFlagProofs.getIndices(proof).indices
  }

  static updateWithMultiProof(proof: Common.updateProof, options?: Common.proofOptions): { root: Buffer } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)
    const leafs = proof.elements.map((element) => hashNode(prefixBuffer, element))
    const updateLeafs = proof.updateElements.map((element) => hashNode(prefixBuffer, element))
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction })
    const { root: recoveredRoot, newRoot, elementCount: recoveredElementCount } = proof.indices
      ? MultiIndexedProofs.getNewRoot({ indices: proof.indices, leafs, updateLeafs, compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments: proof.decommitments }, opts)
      : MultiFlagProofs.getNewRoot({ leafs, updateLeafs, compactProof: proof.compactProof, elementCount: proof.elementCount, flags: proof.flags, skips: proof.skips, orders: proof.orders, decommitments: proof.decommitments }, opts)

    if (!MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

    return { root: MerkleTree.computeMixedRoot(recoveredElementCount, newRoot) }
  }

  static verifyAppendProof(proof: Common.proof, options?: Common.proofOptions): boolean {
    options = Object.assign({}, Common.defaultProofOptions, options)
    // if (!options.unbalanced) throw new Error('Append-Proofs not supported for balanced trees.')
    if (proof.root.equals(to32ByteBuffer(0))) return true

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction })
    const { root: recoveredRoot, elementCount: recoveredElementCount } = AppendProofs.getRoot({ compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments: proof.decommitments }, opts)

    return MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)
  }

  static appendWithAppendProof(proof: Common.appendProof, options?: Common.proofOptions): { root: Buffer, elementCount: number } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    // if (!options.unbalanced) throw new Error('Append-Proofs not supported for balanced trees.')

    if (proof.root.equals(to32ByteBuffer(0))) {
      const merkleTree = new MerkleTree(proof.appendElements || [proof.appendElement], options)
      return { root: merkleTree.root, elementCount: proof.appendElements?.length ?? 1 }
    }

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction })
    const { root: recoveredRoot, newRoot, elementCount: recoveredElementCount } = proof.appendElement?.length > 0
      ? AppendProofs.getNewRoot({ appendLeaf: hashNode(prefixBuffer, proof.appendElement), compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments: proof.decommitments }, opts)
      : AppendProofs.getNewRoot({ appendLeafs: proof.appendElements.map((element) => hashNode(prefixBuffer, element)), compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments: proof.decommitments }, opts)
    const newElementCount = recoveredElementCount + (proof.appendElements?.length ?? 1)

    if (!MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount }
  }

  static appendWithCombinedProof(proof: Common.appendProof, options?: Common.proofOptions): { root: Buffer, elementCount: number } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    // if (!options.unbalanced) throw new Error('Combined-Proofs not supported for balanced trees.')

    if (proof.root.equals(to32ByteBuffer(0))) {
      const merkleTree = new MerkleTree(proof.appendElements || [proof.appendElement], options)
      return { root: merkleTree.root, elementCount: proof.appendElements?.length ?? 1 }
    }

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const leaf = hashNode(prefixBuffer, proof.element)
    const leafs = proof.elements.map((element) => hashNode(prefixBuffer, element))

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction })
    const { root: recoveredRoot, elementCount: recoveredElementCount, appendDecommitments } = CombinedProofs.getRoot({ leafs, leaf, index: proof.index, compactProof: proof.compactProof, elementCount: proof.elementCount, flags: proof.flags, orders: proof.orders, skips: proof.skips, decommitments: proof.decommitments }, opts)

    const newRoot = proof.appendElement instanceof Buffer
      ? AppendProofs.appendSingle(hashNode(prefixBuffer, proof.appendElement), recoveredElementCount, proof.decommitments, opts)
      : AppendProofs.appendMulti(proof.appendElements.map((element) => hashNode(prefixBuffer, element)), recoveredElementCount, proof.decommitments, opts)
    const newElementCount = recoveredElementCount + (proof.appendElements?.length ?? 1)

    if (!MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

    return { root: MerkleTree.computeMixedRoot(newElementCount, newRoot), elementCount: newElementCount }
  }

  static verifyCombinedProof(proof: Common.proof, options?: Common.proofOptions): boolean {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (!options.unbalanced) throw new Error('Combined-Proofs not supported for balanced trees.')

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)

    const leaf = hashNode(prefixBuffer, proof.element)
    const leafs = proof.elements.map((e) => hashNode(prefixBuffer, e))
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction }, options)

    const { root: recoveredRoot, elementCount: recoveredElementCount } = CombinedProofs.getRoot({ leafs, leaf, index: proof.index, compactProof: proof.compactProof, elementCount: proof.elementCount, flags: proof.flags, orders: proof.orders, skips: proof.skips, decommitments: proof.decommitments }, opts)

    return MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)
  }

  static getCombinedProofIndices(leafCount: number, compactProof?: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>): Array<number> {
    return MerkleTree.getMultiProofIndices({ elementCount: leafCount, compactProof, flags, skips, orders })
  }

  static updateAndAppendWithCombinedProof(proof: Common.updateAndAppendProof, options?: Common.proofOptions): { root: Buffer, elementCount: number } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (!options.unbalanced) throw new Error('Combined-Proofs not supported for balanced trees.')

    const prefixBuffer = Buffer.from(options.elementPrefix, 'hex')
    const hashFunction = getHashFunction(options.sortedHash)

    const leaf = hashNode(prefixBuffer, proof.element)
    const updateLeaf = hashNode(prefixBuffer, proof.updateElement)
    const leafs = proof.elements.map((e) => hashNode(prefixBuffer, e))
    const updateLeafs = proof.updateElements.map((element) => hashNode(prefixBuffer, element))

    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction }, options)
    const { root: recoveredRoot, elementCount: recoveredElementCount, appendDecommitments } = CombinedProofs.getNewRoot({ leafs, updateLeafs, elementCount: proof.elementCount, flags: proof.flags, skips: proof.skips, orders: proof.orders, decommitments: proof.decommitments, compactProof: proof.compactProof, index: proof.index, leaf, updateLeaf }, opts)

    const newRoot = proof.appendElements?.length > 0
      ? AppendProofs.appendMulti(proof.appendElements.map((element) => hashNode(prefixBuffer, element)), recoveredElementCount, proof.decommitments, opts)
      : AppendProofs.appendSingle(hashNode(prefixBuffer, proof.appendElement), recoveredElementCount, proof.decommitments, opts)

    const appendCount = proof.appendElements?.length || 1
    const newElementCount = recoveredElementCount + appendCount

    if (!MerkleTree.verifyMixedRoot(proof.root, recoveredElementCount, recoveredRoot)) throw new Error('Invalid Proof.')

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

  static verifySizeProof(proof: Common.proof, options?: Common.proofOptions): boolean {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const decommitments = proof.compactProof

    if (proof.root.equals(to32ByteBuffer(0)) && proof.elementCount === 0) return true

    if (proof.element) return MerkleTree.verifyMixedRoot(proof.root, proof.elementCount, proof.element)

    if (options.sortedHash) throw new Error('Can only verify simple Size Proofs for sorted hashed trees.')

    const hashFunction = getHashFunction(options.sortedHash)
    const opts = Object.assign({}, Common.defaultTreeOptions, { hashFunction }, options)
    const { root: recoveredRoot } = AppendProofs.getRoot({ compactProof: proof.compactProof, elementCount: proof.elementCount, decommitments }, opts)

    return MerkleTree.verifyMixedRoot(proof.root, proof.elementCount, recoveredRoot)
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

  generateSingleProof(index: number, options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (this._elements.length <= 0) throw new Error('Tree is empty.')
    if (index < 0 || index >= this._elements.length) throw new Error('Index out of range.')

    const proof = SingleProofs.generate(this._tree, this._elements.length, index, options)
    const base = { root: this.root, element: Buffer.from(this._elements[index]) }

    return Object.assign(base, proof)
  }

  generateSingleUpdateProof(index: number, updateElement: Buffer, options?: Common.proofOptions): Common.updateProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const base = { updateElement: Buffer.from(updateElement) }

    return Object.assign(base, this.generateSingleProof(index, options))
  }

  updateSingle(index: number, updateElement: Buffer, options?: Common.proofOptions): { proof: Common.updateProof, newMerkleTree: MerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const newElements = this._elements.map((e, i) => (i === index ? updateElement : e))

    const opts = Object.assign({}, Common.defaultTreeOptions, {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, options)

    return {
      proof: this.generateSingleUpdateProof(index, updateElement, options),
      newMerkleTree: new MerkleTree(newElements, opts),
    }
  }

  generateMultiProof(indices: Array<number>, options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
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

  generateMultiUpdateProof(indices: Array<number>, updateElements: Array<Buffer>, options?: Common.proofOptions): Common.updateProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (indices.length !== updateElements.length) throw new Error('Indices and element count mismatch.')
    const base = { updateElements: updateElements.map(Buffer.from) }

    return Object.assign(base, this.generateMultiProof(indices, options))
  }

  updateMulti(indices: Array<number>, updateElements: Array<Buffer>, options?: Common.proofOptions): { proof: Common.updateProof, newMerkleTree: MerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const newElements = this.elements.map((e, i) => {
      const index = indices.indexOf(i)

      return index >= 0 ? updateElements[index] : e
    })

    const opts = Object.assign({}, Common.defaultTreeOptions, {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, options)

    return {
      proof: this.generateMultiUpdateProof(indices, updateElements, options),
      newMerkleTree: new MerkleTree(newElements, opts),
    }
  }

  generateAppendProof(options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (!this._unbalanced) throw new Error('Can only generate Append-Proofs for unbalanced trees.')
    if (this._elements.length === 0) {
      return options.compact
        ? { root: this.root, compactProof: [to32ByteBuffer(0)] }
        : { root: this.root, elementCount: 0, decommitments: [] }
    }

    const proof = AppendProofs.generate(this._tree, this._elements.length, options)
    return Object.assign({ root: this.root }, proof)
  }

  generateSingleAppendProof(appendElement: Buffer, options?: Common.proofOptions): Common.appendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const base = { appendElement: Buffer.from(appendElement) }

    return Object.assign(base, this.generateAppendProof(options))
  }

  generateMultiAppendProof(appendElements: Array<Buffer>, options?: Common.proofOptions): Common.appendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (appendElements.length <= 0) throw new Error('No elements provided.')
    const base = { appendElements: appendElements.map(Buffer.from) }

    return Object.assign(base, this.generateAppendProof(options))
  }

  appendSingle(appendElement: Buffer, options?: Common.proofOptions): { proof: Common.appendProof, newMerkleTree: MerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const newElements = this.elements.map((e) => e)
    newElements.push(appendElement)

    const opts = Object.assign({}, Common.defaultTreeOptions, {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    }, options)
    return {
      proof: this.generateSingleAppendProof(appendElement, options),
      newMerkleTree: new MerkleTree(newElements, opts),
    }
  }

  appendMulti(appendElements: Array<Buffer>, options?: Common.proofOptions): { proof: Common.appendProof, newMerkleTree: MerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const newElements = this.elements.concat(appendElements)

    const opts = Object.assign({}, Common.defaultTreeOptions, {
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
  generateCombinedProof(indices: Array<number> | number, options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
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

  generateUpdateAppendProof(proof: Common.updateAndAppendProof, options?: Common.proofOptions): Common.updateAndAppendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (proof.indices.length > 0 && proof.updateElements.length <= 0) throw new Error('Indices and update mismatch.')
    if (proof.index == null && proof.indices.length <= 0) throw new Error('No elements provided to be proven')
    if (proof.index == null && proof.indices.length !== proof.updateElements.length) throw new Error('Indices and update element count mismatch.')
    if (proof.appendElements.length <= 0) throw new Error('No elements provided to be appended.')

    const base = {}
    proof.updateElements.length > 0
      ? Object.assign(base, { updateElements: proof.updateElements.map(Buffer.from) })
      : Object.assign(base, { updateElement: Buffer.from(proof.updateElement) })

    proof.appendElements.length > 0
      ? Object.assign(base, { appendElements: proof.appendElements.map(Buffer.from) })
      : Object.assign(base, { appendElement: Buffer.from(proof.appendElement) })

    return Object.assign(base, this.generateCombinedProof(proof.indices, options))
  }

  generateUseAppendProof(proof: Common.appendProof, options?: Common.proofOptions): Common.appendProof {
    options = Object.assign({}, Common.defaultProofOptions, options)
    if (!Number.isInteger(proof.indices) && proof.indices.length <= 0) throw new Error('No elements provided to be proven')
    if (Array.isArray(proof.appendElements) && proof.appendElements.length <= 0) throw new Error('No elements provided to be appended.')

    const base = {}
    proof.appendElements.length > 0
      ? Object.assign(base, { appendElements: proof.appendElements.map(Buffer.from) })
      : Object.assign(base, { appendElement: Buffer.from(proof.appendElement) })

    return Object.assign(base, this.generateCombinedProof(proof.indices, options))
  }

  updateAndAppend(proof: Common.updateAndAppendProof, options?: Common.proofOptions): { proof: Common.updateAndAppendProof, newMerkleTree: MerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    const { newMerkleTree: updatedTree } = proof.updateElements?.length > 0
      ? this.updateMulti(proof.indices, proof.updateElements, options)
      : this.updateSingle(proof.index, proof.updateElement, options)

    const { newMerkleTree } = proof.appendElements?.length > 0
      ? updatedTree.appendMulti(proof.appendElements, options)
      : updatedTree.appendSingle(proof.appendElement, options)

    return {
      proof: this.generateUpdateAppendProof({ indices: proof.indices, updateElements: proof.updateElements, appendElements: proof.appendElements }, options),
      newMerkleTree,
    }
  }

  useAndAppend(indices: Array<number> | number, appendElements: Array<Buffer> | Buffer, options?: Common.proofOptions): { proof: Common.appendProof, newMerkleTree: MerkleTree } {
    options = Object.assign({}, Common.defaultProofOptions, options)
    let proof: Common.appendProof
    if (!Array.isArray(indices)) {
      proof.index = indices
    } else {
      proof.indices = indices
    }

    if (!Array.isArray(appendElements)) {
      proof.appendElement = appendElements
    } else {
      proof.appendElements = appendElements
    }

    const { newMerkleTree } = Array.isArray(appendElements)
      ? this.appendMulti(appendElements, options)
      : this.appendSingle(proof.appendElement, options)

    return {
      proof: this.generateUseAppendProof(proof, options),
      newMerkleTree,
    }
  }

  generateSizeProof(options?: Common.proofOptions): Common.proof {
    options = Object.assign({}, Common.defaultProofOptions, options)
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
