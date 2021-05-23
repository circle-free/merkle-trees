import { defaultProofOptions, defaultTreeOptions, getBalancedLeafCount, getNewRootParams, getRootParams, proof, proofOptions, treeOptions } from './common'
import { to32ByteBuffer, from32ByteBuffer } from './utils'

// Generates a set of decommitments to prove the existence of a leaf at a given index.
export const generate = (tree: Array<Buffer>, elementCount: number, index: number, options: proofOptions = defaultProofOptions): proof => {
  const decommitments = []
  const leafCount = tree.length >>> 1

  for (let i = leafCount + index; i > 1; i >>>= 1) {
    decommitments.unshift(i & 1 ? tree[i - 1] : tree[i + 1])
  }

  // Filter out non-existent decommitments, which are nodes to the "right" of the last leaf
  const filteredDecommitments = decommitments.filter((d) => d).map(Buffer.from)

  return options.compact
    ? {
      index,
      elementCount: 0,
      compactProof: [to32ByteBuffer(elementCount)].concat(filteredDecommitments),
      decommitments: Array<Buffer>(),
    }
    : {
      index,
      compactProof: Array<Buffer>(),
      elementCount,
      decommitments: filteredDecommitments,
    }
}

// Compute the root given a leaf, its index, and a set of decommitments.
export const getRoot = (params: getRootParams, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number } => {
  if (params.compactProof.length > 0) {
    params.elementCount = from32ByteBuffer(params.compactProof[0])
    params.decommitments = params.compactProof.slice(1)
  }

  let decommitmentIndex = params.decommitments.length
  let hash = Buffer.from(params.leaf)
  let upperBound = params.elementCount - 1

  while (decommitmentIndex > 0) {
    // If not "right-most" node at this level, or odd, compute the parent hash
    if (params.index !== upperBound || params.index & 1) {
      // Note that hash order is irrelevant if hash function sorts nodes
      hash =
        params.index & 1
          ? options.hashFunction(params.decommitments[--decommitmentIndex], hash)
          : options.hashFunction(hash, params.decommitments[--decommitmentIndex])
    }

    params.index >>>= 1
    upperBound >>>= 1
  }

  return { root: hash, elementCount: params.elementCount }
}

// Compute the existing root given a leaf, its index, and a set of decommitments
// and computes a new root, along the way, given a new leaf to take its place.
// See getRoot for relevant inline comments.
export const getNewRoot = (params: getNewRootParams, options: treeOptions = defaultTreeOptions): { root: Buffer, newRoot: Buffer, elementCount: number } => {
  if (params.compactProof.length > 0) {
    params.elementCount = from32ByteBuffer(params.compactProof[0])
    params.decommitments = params.compactProof.slice(1)
  }

  let decommitmentIndex = params.decommitments.length
  let hash = Buffer.from(params.leaf)
  let updateHash = Buffer.from(params.updateLeaf)
  let upperBound = params.elementCount - 1

  while (decommitmentIndex > 0) {
    if (params.index !== upperBound || params.index & 1) {
      hash =
        params.index & 1
          ? options.hashFunction(params.decommitments[--decommitmentIndex], hash)
          : options.hashFunction(hash, params.decommitments[--decommitmentIndex])

      updateHash =
        params.index & 1
          ? options.hashFunction(params.decommitments[decommitmentIndex], updateHash)
          : options.hashFunction(updateHash, params.decommitments[decommitmentIndex])
    }

    params.index >>>= 1
    upperBound >>>= 1
  }

  return { root: hash, newRoot: updateHash, elementCount: params.elementCount }
}

// This is identical to the above getRoot, except it builds a tree, similar to Common.buildTree
// See above getRoot for relevant inline comments
export const getPartialTree = (index: number, leaf: Buffer, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { tree: Array<Buffer>, elementCount: number } => {
  if (compactProof.length > 0) {
    elementCount = from32ByteBuffer(compactProof[0])
    decommitments = compactProof.slice(1)
  }

  let balancedLeafCount = getBalancedLeafCount(elementCount)
  const tree = Array(balancedLeafCount << 1).fill(null)

  let decommitmentIndex = decommitments.length
  let hash = Buffer.from(leaf)
  let upperBound = elementCount - 1

  while (decommitmentIndex > 0) {
    const nodeIndex = balancedLeafCount + index
    tree[nodeIndex] = hash

    if (index !== upperBound || index & 1) {
      hash =
        index & 1
          ? options.hashFunction(decommitments[--decommitmentIndex], hash)
          : options.hashFunction(hash, decommitments[--decommitmentIndex])

      const pairIndex = index & 1 ? nodeIndex - 1 : nodeIndex + 1
      tree[pairIndex] = decommitments[decommitmentIndex]

      // maybe if (index + 1 === upperBound) we know the next decommitment is the last leaf
    }

    balancedLeafCount >>>= 1
    index >>>= 1
    upperBound >>>= 1
  }

  tree[1] = hash

  return { tree, elementCount }
}
