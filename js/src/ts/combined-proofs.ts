import { bitCount32, from32ByteBuffer, bufferToBigInt } from './utils'
import { generate as generateMulti } from './flag-multi-proofs'
import { generate as generateSingle } from './single-proofs'
import { defaultTreeOptions, treeOptions } from './common'

export const generate = (tree: Array<Buffer>, elementCount: number, indices?: Array<number>, index?: number, options: treeOptions = defaultTreeOptions): { compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, index?: number } => {
  return index == null
    ? generateMulti(tree, elementCount, indices, options)
    : generateSingle(tree, elementCount, index, options)
}

// This is the MultiFlagProof.getRootBooleans algorithm, however, it additionally infers and
// verifies the decommitments needed for the append-proof, as the provided decommitments for the
// multi-proof are verified. In order for the correct append-proof decommitments to be inferred,
// the multi-proof must be proving the existence of one of last elements. Two roots will be
// computed: one from the multi-proof and one from the inferred append-proof decommitments. They
// should match, so long as the multi-proof is valid, and on of the last element is being proved.
// The algorithm to infer the append-proof decommitments is to take the left node of each
// hashing pair, if the right node of the hashing pair is to be the appending node.
// See MultiFlagProof.getRootBooleans for relevant inline comments.
const getRootBooleansFromMulti = (leafs: Array<Buffer>, elementCount: number, flags: Array<1 | 0>, orders: Array<1 | 0>, skips: Array<1 | 0>, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number, appendDecommitments: Array<Buffer> } => {
  const hashCount = flags.length
  const leafCount = leafs.length
  const hashes = leafs.map((leaf) => leaf).reverse()

  let readIndex = 0
  let writeIndex = 0
  let decommitmentIndex = 0

  // The index, localized to the level/depth, of where the first appended element will go
  let appendNodeIndex = elementCount

  // Since hashes is a circular queue, we need to remember where the "right-most" hash is
  let readIndexOfAppendNode = 0

  // We need as many append-proof decommitments as bits set in elementCount
  // and we will build this array in reverse order
  let appendDecommitmentIndex = bitCount32(elementCount)
  const appendDecommitments = Array<Buffer>(appendDecommitmentIndex).fill(null)

  // We will be accumulating the computed append-proof inferred root here
  let appendHash

  for (let i = 0; i < hashCount; i++) {
    if (skips[i]) {
      // If we're skipping, we're definitely dealing with the last node on this level, and it is
      // an append-proof decommitment if this index is odd. Note two important things. First, for
      // all unbalanced trees, the first append-proof decommitment is from here, and it will be
      // the only append-proof decommitment taken from a "skipped" hash. Second, again for unbalanced
      // trees, appendNodeIndex is referencing the non-existent leaf to be added, when elementCount
      // is odd. When elementCount is even, it will be referencing an existing "right-most" node.
      const skippedHash = hashes[readIndex++]

      if (appendNodeIndex & 1) {
        appendDecommitments[--appendDecommitmentIndex] = skippedHash

        // Since we know this will always be the first append decommitment, appendHash starts as it
        appendHash = skippedHash
      }

      // Remember this circular queue index so we can tell when we've at the end of a new level
      readIndexOfAppendNode = writeIndex

      // The index is localized to the level/depth, so the next one is it divided by 2
      appendNodeIndex >>>= 1

      hashes[writeIndex++] = skippedHash

      readIndex %= leafCount
      writeIndex %= leafCount
      continue
    }

    // Check if we're at the last ("right-most") node at a level (within the circular queue)
    if (readIndexOfAppendNode === readIndex) {
      // Only the hash sibling of odd "right-most" nodes are valid append-proof decommitments
      if (appendNodeIndex & 1) {
        const nextReadIndex = (readIndex + 1) % leafCount

        // Note: we can save variables here by swapping flag/decommitment inclusion from "right"
        // to "left" below, and using left as the appendDecommitment, if hash order is not relevant.
        const appendDecommitment = flags[i] ? hashes[nextReadIndex] : decommitments[decommitmentIndex]

        // flag informs if the "left" node is a previously computed hash, or a decommitment
        appendDecommitments[--appendDecommitmentIndex] = appendDecommitment

        // Accumulate the into the append hash
        appendHash = options.hashFunction(appendDecommitment, appendHash)
      }

      // Remember this circular queue index so we can tell when we've at the end of a new level
      readIndexOfAppendNode = writeIndex

      // The index is localized to the level/depth, so the next one is it divided by 2
      appendNodeIndex >>>= 1
    }

    const right = flags[i] ? hashes[readIndex++] : decommitments[decommitmentIndex++]
    readIndex %= leafCount
    const left = hashes[readIndex++]
    hashes[writeIndex++] = orders?.[i] ? options.hashFunction(left, right) : options.hashFunction(right, left)

    readIndex %= leafCount
    writeIndex %= leafCount
  }

  const root = hashes[(writeIndex === 0 ? leafCount : writeIndex) - 1]

  // For a balanced tree, there is only 1 append-proof decommitment: the root itself
  if (appendDecommitmentIndex !== 1 && appendHash.equals(root)) {
    throw new Error('Invalid Proof.')
  }

  // The new append decommitments is simply the new root, for a balanced tree.
  if (appendDecommitmentIndex === 1) appendDecommitments[0] = root

  return { root: Buffer.from(root), elementCount, appendDecommitments }
}

// This is identical to the above getRootBooleans algorithm, differing only in that the
// the flag and skip bit-set is shifted and checked, rather than boolean arrays.
// See getRootBooleans for relevant inline comments.
const getRootBitsFromMulti = (leafs: Array<Buffer>, compactProof: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number, appendDecommitments: Array<Buffer> } => {
  const elementCount = from32ByteBuffer(compactProof[0])
  const flags = bufferToBigInt(compactProof[1])
  const skips = bufferToBigInt(compactProof[2])
  const orders = options.sortedHash ? undefined : bufferToBigInt(compactProof[3])
  const decommitments = compactProof.slice(options.sortedHash ? 3 : 4)
  const leafCount = leafs.length
  const hashes = leafs.map((leaf) => leaf).reverse()

  let readIndex = 0
  let writeIndex = 0
  let decommitmentIndex = 0
  let bitCheck = BigInt(1)

  let appendNodeIndex = elementCount
  let readIndexOfAppendNode = 0
  let appendDecommitmentIndex = bitCount32(elementCount)
  const appendDecommitments = Array(appendDecommitmentIndex).fill(null)
  let appendHash

  while (true) {
    const flag = flags & bitCheck

    if (skips & bitCheck) {
      if (flag) {
        const root = hashes[(writeIndex === 0 ? leafCount : writeIndex) - 1]

        if (appendDecommitmentIndex !== 1 && appendHash.equals(root)) throw new Error('Invalid Proof.')

        if (appendDecommitmentIndex === 1) appendDecommitments[0] = root

        return { root: Buffer.from(root), elementCount, appendDecommitments }
      }

      const skippedHash = hashes[readIndex++]

      if (appendNodeIndex & 1) {
        appendDecommitments[--appendDecommitmentIndex] = skippedHash
        appendHash = skippedHash
      }

      readIndexOfAppendNode = writeIndex
      appendNodeIndex >>>= 1

      hashes[writeIndex++] = skippedHash

      readIndex %= leafCount
      writeIndex %= leafCount
      bitCheck <<= BigInt(1)
      continue
    }

    if (readIndexOfAppendNode === readIndex) {
      const nextReadIndex = (readIndex + 1) % leafCount
      const appendDecommitment = flag ? hashes[nextReadIndex] : decommitments[decommitmentIndex]

      if (appendNodeIndex & 1) {
        appendDecommitments[--appendDecommitmentIndex] = appendDecommitment
        appendHash = options.hashFunction(appendDecommitment, appendHash)
      }

      readIndexOfAppendNode = writeIndex
      appendNodeIndex >>>= 1
    }

    const right = flag ? hashes[readIndex++] : decommitments[decommitmentIndex++]
    readIndex %= leafCount
    const left = hashes[readIndex++]

    const order = orders && orders & bitCheck
    hashes[writeIndex++] = order ? options.hashFunction(left, right) : options.hashFunction(right, left)

    readIndex %= leafCount
    writeIndex %= leafCount
    bitCheck <<= BigInt(1)
  }
}

// This is the SingleProof.getRoot algorithm, however, it additionally infers and verifies the
// decommitments needed for the append-proof, as the provided decommitments for the single proof
// are verified. It is effectively a combination of the SingleProof.getRoot and the above
// getRootBooleansFromMulti.
// See MultiFlagProof.getRootBooleans and getRootBooleansFromMulti for relevant inline comments.
const getRootFromSingle = (index: number, leaf: Buffer, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number, appendDecommitments: Array<Buffer> } => {
  if (compactProof.length > 0) {
    elementCount = from32ByteBuffer(compactProof[0])
    decommitments = compactProof.slice(1)
  }

  let decommitmentIndex = decommitments.length
  let hash = Buffer.from(leaf)
  let upperBound = elementCount - 1
  let appendNodeIndex = elementCount
  let appendDecommitmentIndex = bitCount32(elementCount)
  const appendDecommitments = Array(appendDecommitmentIndex).fill(null)
  let appendHash

  while (decommitmentIndex > 0) {
    if (index === upperBound && !(index & 1)) {
      if (appendNodeIndex & 1) {
        appendDecommitments[--appendDecommitmentIndex] = hash
        appendHash = hash
      }

      index >>>= 1
      upperBound >>>= 1
      appendNodeIndex >>>= 1
      continue
    }

    --decommitmentIndex

    if (appendNodeIndex & 1) {
      appendDecommitments[--appendDecommitmentIndex] = decommitments[decommitmentIndex]
      appendHash = options.hashFunction(decommitments[decommitmentIndex], appendHash)
    }

    hash =
      index & 1
        ? options.hashFunction(decommitments[decommitmentIndex], hash)
        : options.hashFunction(hash, decommitments[decommitmentIndex])

    index >>>= 1
    upperBound >>>= 1
    appendNodeIndex >>>= 1
  }

  if (appendDecommitmentIndex !== 1 && appendHash.equals(hash)) throw new Error('Invalid Proof.')

  if (appendDecommitmentIndex === 1) appendDecommitments[0] = hash

  return { root: hash, elementCount, appendDecommitments }
}

export const getRoot = (leafs?: Array<Buffer>, leaf?: Buffer, index?: number, compactProof?: Array<Buffer>, elementCount?: number, flags?: Array<1 | 0>, orders?: Array<1 | 0>, skips?: Array<1 | 0>, decommitments?: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number, appendDecommitments: Array<Buffer> } => {
  return leaf
    ? getRootFromSingle(index, leaf, compactProof, elementCount, decommitments, options)
    : compactProof.length > 0
      ? getRootBitsFromMulti(leafs, compactProof, options)
      : getRootBooleansFromMulti(leafs, elementCount, flags, orders, skips, decommitments, options)
}

// This is identical to the above getRootBooleans followed by the AppendProof.getNewRootMulti.
// First, a loop computes the new root, given the decommitments and update elements. At the same
// time, the old root is computed, from the decommitments and original elements. Also, at the
// same time, the old root is computed, from the inferred append-proof decommitments. And also,
// at the same time, the new append-proof decommitments are computed from the updated elements.
// Finally either appendMulti or appendSingle above is called to get the new root.
// See getRootBooleans for relevant inline comments.
const getNewRootBooleansFromMulti = (leafs: Array<Buffer>, updateLeafs: Array<Buffer>, elementCount: number, flags: Array<1 | 0>, skips: Array<1 | 0>, orders: Array<1 | 0>, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, newRoot: Buffer, elementCount: number, appendDecommitments: Array<Buffer> } => {
  const hashCount = flags.length
  const leafCount = leafs.length
  const hashes = leafs.map((leaf) => leaf).reverse()
  const newHashes = updateLeafs.map((leaf) => leaf).reverse()

  let readIndex = 0
  let writeIndex = 0
  let decommitmentIndex = 0
  let appendNodeIndex = elementCount
  let readIndexOfAppendNode = 0
  let appendDecommitmentIndex = bitCount32(elementCount)
  const appendDecommitments = Array(appendDecommitmentIndex).fill(null)
  let hash

  for (let i = 0; i < hashCount; i++) {
    if (skips[i]) {
      const skippedHash = hashes[readIndex]
      const newSkippedHash = newHashes[readIndex++]

      if (appendNodeIndex & 1) {
        // decommitments for the append step are actually the new hashes, given the updated leafs.
        appendDecommitments[--appendDecommitmentIndex] = newSkippedHash

        // hash still needs to accumulate old values, to result in old root.
        hash = skippedHash
      }

      readIndexOfAppendNode = writeIndex
      appendNodeIndex >>>= 1

      hashes[writeIndex] = skippedHash
      newHashes[writeIndex++] = newSkippedHash

      readIndex %= leafCount
      writeIndex %= leafCount
      continue
    }

    if (readIndexOfAppendNode === readIndex) {
      if (appendNodeIndex & 1) {
        const nextReadIndex = (readIndex + 1) % leafCount
        const appendHash = flags[i] ? hashes[nextReadIndex] : decommitments[decommitmentIndex]
        const newAppendHash = flags[i] ? newHashes[nextReadIndex] : decommitments[decommitmentIndex]

        // decommitments for the append step are actually the new hashes, given the updated leafs.
        appendDecommitments[--appendDecommitmentIndex] = newAppendHash

        // hash still needs to accumulate old values, to result in old root.
        hash = options.hashFunction(appendHash, hash)
      }

      readIndexOfAppendNode = writeIndex
      appendNodeIndex >>>= 1
    }

    const right = flags[i] ? hashes[readIndex] : decommitments[decommitmentIndex]
    const newRight = flags[i] ? newHashes[readIndex++] : decommitments[decommitmentIndex++]

    readIndex %= leafCount

    const left = hashes[readIndex]
    const newLeft = newHashes[readIndex++]

    hashes[writeIndex] = orders?.[i] ? options.hashFunction(left, right) : options.hashFunction(right, left)
    newHashes[writeIndex++] = orders?.[i] ? options.hashFunction(newLeft, newRight) : options.hashFunction(newRight, newLeft)

    readIndex %= leafCount
    writeIndex %= leafCount
  }

  const rootIndex = (writeIndex === 0 ? leafCount : writeIndex) - 1
  const oldRoot = hashes[rootIndex]
  const newRoot = newHashes[rootIndex]

  if (appendDecommitmentIndex !== 1 && hash.equals(oldRoot)) throw new Error('Invalid Proof.')

  if (appendDecommitmentIndex === 1) appendDecommitments[0] = newRoot

  return { root: Buffer.from(oldRoot), newRoot, elementCount, appendDecommitments }
}

// This is identical to the above getNewRootBooleans algorithm, differing only in that the
// the flag and skip bit-set is shifted and checked, rather than boolean arrays.
// See getNewRootBooleans for relevant inline comments.
const getNewRootBitsFromMulti = (leafs: Array<Buffer>, updateLeafs: Array<Buffer>, compactProof: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, newRoot: Buffer, elementCount: number, appendDecommitments: Array<Buffer> } => {
  const elementCount = from32ByteBuffer(compactProof[0])
  const flags = bufferToBigInt(compactProof[1])
  const skips = bufferToBigInt(compactProof[2])
  const orders = options.sortedHash ? undefined : bufferToBigInt(compactProof[3])
  const decommitments = compactProof.slice(options.sortedHash ? 3 : 4)
  const leafCount = leafs.length
  const hashes = leafs.map((leaf) => leaf).reverse()
  const newHashes = updateLeafs.map((leaf) => leaf).reverse()

  let readIndex = 0
  let writeIndex = 0
  let decommitmentIndex = 0
  let bitCheck = BigInt(1)
  let appendNodeIndex = elementCount
  let readIndexOfAppendNode = 0
  let appendDecommitmentIndex = bitCount32(elementCount)
  const appendDecommitments = Array(appendDecommitmentIndex).fill(null)
  let hash

  while (true) {
    const flag = flags & bitCheck

    if (skips & bitCheck) {
      if (flag) {
        const rootIndex = (writeIndex === 0 ? leafCount : writeIndex) - 1
        const oldRoot = hashes[rootIndex]
        const newRoot = newHashes[rootIndex]

        if (appendDecommitmentIndex !== 1 && hash.equals(oldRoot)) throw new Error('Invalid Proof.')

        if (appendDecommitmentIndex === 1) appendDecommitments[0] = newRoot

        return { root: oldRoot, newRoot, elementCount, appendDecommitments }
      }

      const skippedHash = hashes[readIndex]
      const newSkippedHash = newHashes[readIndex++]

      if (appendNodeIndex & 1) {
        appendDecommitments[--appendDecommitmentIndex] = newSkippedHash
        hash = skippedHash
      }

      readIndexOfAppendNode = writeIndex
      appendNodeIndex >>>= 1

      hashes[writeIndex] = skippedHash
      newHashes[writeIndex++] = newSkippedHash

      readIndex %= leafCount
      writeIndex %= leafCount
      bitCheck <<= BigInt(1)
      continue
    }

    if (readIndexOfAppendNode === readIndex) {
      if (appendNodeIndex & 1) {
        const nextReadIndex = (readIndex + 1) % leafCount
        const appendHash = flag ? hashes[nextReadIndex] : decommitments[decommitmentIndex]
        const newAppendHash = flag ? newHashes[nextReadIndex] : decommitments[decommitmentIndex]

        appendDecommitments[--appendDecommitmentIndex] = newAppendHash
        hash = options.hashFunction(appendHash, hash)
      }

      readIndexOfAppendNode = writeIndex
      appendNodeIndex >>>= 1
    }

    const right = flag ? hashes[readIndex] : decommitments[decommitmentIndex]
    const newRight = flag ? newHashes[readIndex++] : decommitments[decommitmentIndex++]

    readIndex %= leafCount

    const left = hashes[readIndex]
    const newLeft = newHashes[readIndex++]

    const order = orders && orders & bitCheck
    hashes[writeIndex] = order ? options.hashFunction(left, right) : options.hashFunction(right, left)
    newHashes[writeIndex++] = order ? options.hashFunction(newLeft, newRight) : options.hashFunction(newRight, newLeft)

    readIndex %= leafCount
    writeIndex %= leafCount
    bitCheck <<= BigInt(1)
  }
}

// This is identical to the above getRootFromSingle algorithm, except the append decommitments are
// built taking the update leaf into account, followed by just calling the appendMulti or
// appendSingle above to get the new root.
// See getRootFromSingle for relevant inline comments.
const getNewRootFromSingle = (index: number, leaf: Buffer, updateLeaf: Buffer, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, newRoot: Buffer, elementCount: number, appendDecommitments: Array<Buffer> } => {
  if (compactProof.length > 0) {
    elementCount = from32ByteBuffer(compactProof[0])
    decommitments = compactProof.slice(1)
  }

  let decommitmentIndex = decommitments.length
  let hash = Buffer.from(leaf)
  let updateHash = Buffer.from(updateLeaf)
  let upperBound = elementCount - 1
  let appendNodeIndex = elementCount
  let appendDecommitmentIndex = bitCount32(elementCount)
  const appendDecommitments = Array(appendDecommitmentIndex).fill(null)
  let appendHash

  while (decommitmentIndex > 0) {
    if (index === upperBound && !(index & 1)) {
      if (appendNodeIndex & 1) {
        appendDecommitments[--appendDecommitmentIndex] = updateHash
        appendHash = hash
      }

      index >>>= 1
      upperBound >>>= 1
      appendNodeIndex >>>= 1
      continue
    }

    --decommitmentIndex

    if (appendNodeIndex & 1) {
      appendDecommitments[--appendDecommitmentIndex] = decommitments[decommitmentIndex]
      appendHash = options.hashFunction(decommitments[decommitmentIndex], appendHash)
    }

    hash =
      index & 1
        ? options.hashFunction(decommitments[decommitmentIndex], hash)
        : options.hashFunction(hash, decommitments[decommitmentIndex])

    updateHash =
      index & 1
        ? options.hashFunction(decommitments[decommitmentIndex], updateHash)
        : options.hashFunction(updateHash, decommitments[decommitmentIndex])

    index >>>= 1
    upperBound >>>= 1
    appendNodeIndex >>>= 1
  }

  if (appendDecommitmentIndex !== 1 && hash.equals(hash)) throw new Error('Invalid Proof.')

  if (appendDecommitmentIndex === 1) appendDecommitments[0] = updateHash

  return { root: hash, newRoot: updateHash, elementCount, appendDecommitments }
}

export const getNewRoot = (
  leafs?: Array<Buffer>, updateLeafs?: Array<Buffer>, elementCount?: number, flags?: Array<1 | 0>, skips?: Array<1 | 0>, orders?: Array<1 | 0>, decommitments?: Array<Buffer>, compactProof?: Array<Buffer>, index?: number, leaf?: Buffer, updateLeaf?: Buffer, options: treeOptions = defaultTreeOptions) => {
  return leaf
    ? getNewRootFromSingle(index, leaf, updateLeaf, compactProof, elementCount, decommitments, options)
    : compactProof.length > 0
      ? getNewRootBitsFromMulti(leafs, updateLeafs, compactProof, options)
      : getNewRootBooleansFromMulti(leafs, updateLeafs, elementCount, flags, skips, orders, decommitments, options)
}

// This returns the minimum index that must be in the proof, to result in a proof that will be
// a valid combined proof (i.e. a valid multi-proof and append-proof). Simply, set the first
// set bit in the element count to zero, and return that value.
export const getMinimumIndex = (elementCount: number): number => {
  for (let shifts = 0; shifts < 32; shifts++) {
    if (elementCount & 1) return (elementCount & 0xfffffffe) << shifts

    elementCount >>>= 1
  }
}
