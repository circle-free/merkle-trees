import { roundUpToPowerOf2, hashNode } from "./utils"

export const getDepth = (elementCount: number): number => {
  return Math.ceil(Math.log2(elementCount))
}

export const getBalancedLeafCount = (elementCount: number): number => {
  return roundUpToPowerOf2(elementCount)
}

export interface proofOptions {
  compact: boolean,
  simple: boolean,
  indexed: boolean,
  unbalanced: boolean,
  sortedHash: Buffer,
  elementPrefix: string
}

export const defaultProofOptions: proofOptions = {
  compact: false,
  simple: false,
  indexed: false,
  unbalanced: true,
  sortedHash: Buffer.from('0x00'),
  elementPrefix: '00'
}

export interface treeOptions {
  unbalanced: boolean,
  sortedHash: Buffer,
  hashFunction: (left: Buffer, right: Buffer) => Buffer
}

export const defaultTreeOptions: treeOptions = {
  unbalanced: true,
  sortedHash: Buffer.from('0x00'),
  hashFunction: hashNode
}

export interface getRootParams {
  elementCount?: number,
  index?: number,
  leaf?: Buffer,
  flags?: Array<1 | 0>,
  orders?: Array<1 | 0>,
  skips?: Array<1 | 0>,
  indices?: Array<number>,
  leafs?: Array<Buffer>,
  compactProof?: Array<Buffer>,
  decommitments?: Array<Buffer>,
}

export interface getNewRootParams extends getRootParams {
  appendLeaf?: Buffer,
  appendLeafs?: Array<Buffer>,
  updateLeaf?: Buffer
  updateLeafs?: Array<Buffer>,
}

export interface proof {
  root?: Buffer,

  element?: Buffer,
  elements?: Array<Buffer>,
  elementCount?: number,

  index?: number,
  indices?: Array<number>,

  compactProof?: Array<Buffer>,
  decommitments?: Array<Buffer>,

  flags?: Array<1 | 0>,
  orders?: Array<1 | 0>,
  skips?: Array<1 | 0>,
}

export interface updateProof extends proof {
  updateElement?: Buffer,
  updateElements?: Array<Buffer>,
}

export interface appendProof extends proof {
  appendElement?: Buffer,
  appendElements?: Array<Buffer>,
}

export interface updateAndAppendProof extends proof {
  updateElement?: Buffer,
  updateElements?: Array<Buffer>,
  appendElement?: Buffer,
  appendElements?: Array<Buffer>,
}


export const buildTree = (leafs: Array<Buffer>, options: treeOptions = defaultTreeOptions): { tree: Array<Buffer>, depth: number } => {
  const depth = getDepth(leafs.length)
  const balancedLeafCount = getBalancedLeafCount(leafs.length)
  const tree = Array<Buffer>(balancedLeafCount << 1).fill(null)

  for (let i = 0; i < leafs.length; i++) {
    tree[balancedLeafCount + i] = leafs[i]
  }

  let lowerBound = balancedLeafCount
  let upperBound = balancedLeafCount + leafs.length - 1

  for (let i = balancedLeafCount - 1; i > 0; i--) {
    const index = i << 1

    if (index > upperBound) continue

    if (index <= lowerBound) {
      lowerBound >>>= 1
      upperBound >>>= 1
    }

    if (index === upperBound) {
      tree[i] = tree[index]
      continue
    }

    tree[i] = options.hashFunction(tree[index], tree[index + 1])
  }

  return { tree, depth }
}

export const checkElement = (tree: Array<Buffer>, index: number, leaf: Buffer): boolean => {
  const localLeaf = tree[(tree.length >> 1) + index]

  return localLeaf ? localLeaf.equals(leaf) : false
}

export const checkElements = (tree: Array<Buffer>, indices: Array<number>, leafs: Array<Buffer>): Array<boolean> => {
  return indices.reduce((exists, index, i) => exists.concat(checkElement(tree, index, leafs[i])), [])
}

export const getUpdatedTree = (tree: Array<Buffer>, leafs: Array<Buffer>, options = defaultTreeOptions): Array<Buffer> => {
  const balancedLeafCount = tree.length >> 1
  const newTree = tree.map((n) => n && Buffer.from(n))

  for (let i = 0; i < leafs.length; i++) {
    if (leafs[i]) {
      newTree[balancedLeafCount + i] = leafs[i]
    }
  }

  let lowerBound = balancedLeafCount
  let upperBound = balancedLeafCount + leafs.length - 1

  for (let i = balancedLeafCount - 1; i > 0; i--) {
    const index = i << 1

    if (index > upperBound) continue

    if (index <= lowerBound) {
      lowerBound >>>= 1
      upperBound >>>= 1
    }

    if (index === upperBound) {
      if (newTree[index]) {
        newTree[i] = newTree[index]
      }

      continue
    }

    if (!newTree[index] && !newTree[index + 1]) continue

    try {
      newTree[i] = options.hashFunction(newTree[index], newTree[index + 1])
    } catch {
      throw Error('Insufficient information to build tree.')
    }
  }

  return newTree
}

export const getGrownTree = (tree: Array<Buffer>, leafs: Array<Buffer>, options = defaultTreeOptions): Array<Buffer> => {
  const oldDepth = getDepth(tree.length >> 1)
  const oldBalancedLeafCount = tree.length >> 1
  const depth = getDepth(leafs.length)
  const balancedLeafCount = getBalancedLeafCount(leafs.length)
  if (balancedLeafCount < oldBalancedLeafCount) {
    throw new Error('Tree is already larger')
  }

  const newTree = Array<Buffer>(balancedLeafCount << 1).fill(null)

  for (let i = 0; i < leafs.length; i++) {
    newTree[balancedLeafCount + i] = tree[oldBalancedLeafCount + i] ?? null
  }

  for (let i = 1; i <= oldDepth; i++) {
    for (let j = 0; j < leafs.length >> i; j++) {
      newTree[(balancedLeafCount >> i) + j] = tree[(oldBalancedLeafCount >> i) + j]
    }
  }

  return getUpdatedTree(newTree, leafs, options)
}
