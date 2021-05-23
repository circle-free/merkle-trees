// import { defaultTreeOptions, treeOptions } from "./common"
// import { bufferToBigInt, from32ByteBuffer, roundUpToPowerOf2 } from "./utils"

// // Compute the root given a leaf, its index, and a set of decommitments.
// export const getRootWithLeafAndDecommitments = (index: number, leaf: Buffer, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number } => {
//   if (compactProof.length > 0) {
//     elementCount = from32ByteBuffer(compactProof[0])
//     decommitments = compactProof.slice(1)
//   }

//   let decommitmentIndex = decommitments.length
//   let hash = Buffer.from(leaf)
//   let upperBound = elementCount - 1

//   while (decommitmentIndex > 0) {
//     // If not "right-most" node at this level, or odd, compute the parent hash
//     if (index !== upperBound || index & 1) {
//       // Note that hash order is irrelevant if hash function sorts nodes
//       hash =
//         index & 1
//           ? options.hashFunction(decommitments[--decommitmentIndex], hash)
//           : options.hashFunction(hash, decommitments[--decommitmentIndex])
//     }

//     index >>>= 1
//     upperBound >>>= 1
//   }

//   return { root: hash, elementCount }
// }

// const getRootWithLeafsAndBits = (leafs: Array<Buffer>, elementCount: number, flags: Array<1 | 0>, skips: Array<1 | 0>, orders: Array<1 | 0>, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number } => {
//   const hashCount = flags.length
//   const leafCount = leafs.length
//   const hashes = leafs.map((leaf) => leaf).reverse()

//   let readIndex = 0
//   let writeIndex = 0
//   let decommitmentIndex = 0

//   for (let i = 0; i < hashCount; i++) {
//     if (skips[i]) {
//       hashes[writeIndex++] = hashes[readIndex++]

//       readIndex %= leafCount
//       writeIndex %= leafCount
//       continue
//     }

//     const right = flags[i] ? hashes[readIndex++] : decommitments[decommitmentIndex++]
//     readIndex %= leafCount
//     const left = hashes[readIndex++]
//     hashes[writeIndex++] = orders?.[i] ? options.hashFunction(left, right) : options.hashFunction(right, left)

//     readIndex %= leafCount
//     writeIndex %= leafCount
//   }

//   const rootIndex = (writeIndex === 0 ? leafCount : writeIndex) - 1

//   return { root: Buffer.from(hashes[rootIndex]), elementCount }
// }

// // This is identical to the above getRootBooleans algorithm, differing only in that the
// // the flag and skip bit-set is shifted and checked, rather than boolean arrays.
// // See getRootBooleans for relevant inline comments.
// const getRootWithLeafsAndProof = (leafs: Array<Buffer>, compactProof: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number } => {
//   const elementCount = from32ByteBuffer(compactProof[0])
//   const flags = bufferToBigInt(compactProof[1])
//   const skips = bufferToBigInt(compactProof[2])
//   const orders = options.sortedHash ? undefined : bufferToBigInt(compactProof[3])
//   const decommitments = compactProof.slice(options.sortedHash ? 3 : 4)
//   const leafCount = leafs.length
//   const hashes = leafs.map((leaf) => leaf).reverse()

//   let readIndex = 0
//   let writeIndex = 0
//   let decommitmentIndex = 0
//   let bitCheck = BigInt(1)

//   while (true) {
//     const flag = flags & bitCheck

//     if (skips & bitCheck) {
//       if (flag) {
//         const rootIndex = (writeIndex === 0 ? leafCount : writeIndex) - 1

//         return { root: hashes[rootIndex], elementCount }
//       }

//       hashes[writeIndex++] = hashes[readIndex++]

//       readIndex %= leafCount
//       writeIndex %= leafCount
//       bitCheck <<= BigInt(1)
//       continue
//     }

//     const right = flag ? hashes[readIndex++] : decommitments[decommitmentIndex++]
//     readIndex %= leafCount
//     const left = hashes[readIndex++]

//     const order = orders && orders & bitCheck
//     hashes[writeIndex++] = order ? options.hashFunction(left, right) : options.hashFunction(right, left)

//     readIndex %= leafCount
//     writeIndex %= leafCount
//     bitCheck <<= BigInt(1)
//   }
// }

// // Compute the root given a set of leafs, their indices, and a set of decommitments
// // Uses a circular queue to accumulate the parent nodes and another circular to track
// // the serialized tree indices of those nodes.
// export const getRootWithLeafsIndicesAndProof = (indices: Array<number>, leafs: Array<Buffer>, compactProof: Array<Buffer>, elementCount: number, decommitments: Array<Buffer>, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number } => {
//   if (compactProof.length > 0) {
//     elementCount = from32ByteBuffer(compactProof[0])
//     decommitments = compactProof.slice(1)
//   }

//   const balancedLeafCount = roundUpToPowerOf2(elementCount)

//   // Keep verification minimal by using circular hashes queue with separate read and write heads
//   const hashes = leafs.map((leaf) => leaf).reverse()
//   const treeIndices = indices.map((index) => balancedLeafCount + index).reverse()
//   const indexCount = indices.length

//   let readIndex = 0
//   let writeIndex = 0
//   let decommitmentIndex = 0
//   let upperBound = balancedLeafCount + elementCount - 1
//   let lowestTreeIndex = treeIndices[indices.length - 1]
//   let nodeIndex
//   let nextNodeIndex

//   while (true) {
//     nodeIndex = treeIndices[readIndex]

//     if (nodeIndex === 1) {
//       // Given the circular nature of writeIndex, get the last writeIndex.
//       const rootIndex = (writeIndex === 0 ? indexCount : writeIndex) - 1

//       return { root: hashes[rootIndex], elementCount }
//     }

//     const indexIsOdd = nodeIndex & 1

//     if (nodeIndex === upperBound && !indexIsOdd) {
//       treeIndices[writeIndex] = nodeIndex >>> 1
//       hashes[writeIndex++] = hashes[readIndex++]
//     } else {
//       const nextReadIndex = (readIndex + 1) % indexCount
//       nextNodeIndex = treeIndices[nextReadIndex]

//       // The next node is a sibling of the current one
//       const nextIsPair = nextNodeIndex === nodeIndex - 1

//       const right = indexIsOdd ? hashes[readIndex++] : decommitments[decommitmentIndex++]
//       readIndex %= indexCount
//       const left = indexIsOdd && !nextIsPair ? decommitments[decommitmentIndex++] : hashes[readIndex++]

//       treeIndices[writeIndex] = nodeIndex >>> 1
//       hashes[writeIndex++] = options.hashFunction(left, right)
//     }

//     readIndex %= indexCount
//     writeIndex %= indexCount

//     if (nodeIndex === lowestTreeIndex || nextNodeIndex === lowestTreeIndex) {
//       lowestTreeIndex >>>= 1
//       upperBound >>>= 1
//     }
//   }
// }

// export interface getRootOptions {
//   index: number,
//   elementCount: number,
//   leaf: Buffer,
//   flags: Array<1 | 0>,
//   skips: Array<1 | 0>,
//   orders: Array<1 | 0>
//   indices: Array<number>,
//   leafs: Array<Buffer>,
//   compactProof: Array<Buffer>,
//   decommitments: Array<Buffer>,
// }


// export const getRoot = (opts: getRootOptions, options: treeOptions = defaultTreeOptions): { root: Buffer, elementCount: number } => {
//   return opts.leafs.length > 0
//     ?
//     : getRootWithLeafAndDecommitments(opts.leaf, opts.compactProof)


//   opts.compactProof.length > 0
//     ? getRootWithLeafsAndProof(leafs, compactProof, options)
//     : getRootWithLeafsAndBits(leafs, elementCount, flags, skips, orders, decommitments, options)
// }
