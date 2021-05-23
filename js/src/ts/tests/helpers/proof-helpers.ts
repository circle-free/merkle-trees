import { expect } from 'chai'
import { generateElements } from './index'
import { MerkleTree } from '../../index'
import { defaultProofOptions, proofOptions } from '../../common'

const testSingleProofGeneration = (elementCount, seed, index, expected, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)

  expect(proof.root.equals(merkleTree.root)).to.be.true
  expect(proof.index).to.equal(index)
  expect(proof.element.equals(elements[index])).to.be.true

  if (options.compact) {
    expect(proof.compactProof.length).to.equal(expected.compactProof.length)
    proof.compactProof.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.compactProof[i]))
    return
  }

  expect(proof.elementCount).to.equal(elementCount)
  expect(proof.decommitments.length).to.equal(expected.decommitments.length)
  proof.decommitments.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.decommitments[i]))
}

const compareSingleProofs = (elementCount, index, optionsA: proofOptions = defaultProofOptions, optionsB: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const treeA = new MerkleTree(elements, optionsA)
  const proofA = treeA.generateSingleProof(index)
  const treeB = new MerkleTree(elements, optionsB)
  const proofB = treeB.generateSingleProof(index)

  expect(proofA.root.equals(proofB.root)).to.be.true
  expect(proofA.elementCount).to.equal(proofB.elementCount)
  expect(proofA.index).to.equal(proofB.index)
  expect(proofA.element.equals(proofB.element)).to.be.true
  expect(proofA.decommitments.length).to.equal(proofB.decommitments.length)
  proofA.decommitments.forEach((d, i) => expect(d.equals(proofB.decommitments[i])).to.be.true)
}

const testSingleProofVerification = (elementCount, index, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)
  const proofValid = MerkleTree.verifySingleProof(proof, options)

  expect(proofValid).to.be.true
}

const testMultiProofGeneration = (elementCount, seed, indices, expected, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateMultiProof(indices, options)

  expect(proof.root.equals(merkleTree.root)).to.be.true
  expect(proof.elements.length).to.equal(indices.length)
  proof.elements.forEach((e, i) => expect(e.equals(elements[indices[i]])).to.be.true)

  if (options.compact) {
    expect(proof.compactProof.length).to.equal(expected.compactProof.length)
    proof.compactProof.forEach((p, i) => expect(p.toString('hex')).to.equal(expected.compactProof[i]))
    return
  }

  if (options.indexed) {
    expect(proof.indices).to.deep.equal(indices)
  } else {
    expect(proof.indices).to.equal(undefined)
    expect(proof.flags).to.deep.equal(expected.flags)
    expect(proof.skips).to.deep.equal(expected.skips)
  }

  if (!options.sortedHash) {
    expect(proof.orders).to.deep.equal(expected.orders)
  }

  expect(proof.elementCount).to.equal(elementCount)
  expect(proof.decommitments.length).to.equal(expected.decommitments.length)
  proof.decommitments.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.decommitments[i]))
}

const compareMultiProofs = (elementCount, indices, optionsA = {}, optionsB = {}) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const treeA = new MerkleTree(elements, optionsA)
  const proofA = treeA.generateMultiProof(indices, optionsA)
  const treeB = new MerkleTree(elements, optionsB)
  const proofB = treeB.generateMultiProof(indices, optionsB)

  expect(proofA.root.equals(proofB.root)).to.be.true
  expect(proofA.elementCount).to.equal(proofB.elementCount)
  proofA.elements.forEach((e, i) => expect(e.equals(proofB.elements[i])).to.be.true)
  expect(proofA.elements.length).to.equal(proofB.elements.length)

  if (optionsA.indexed && optionsB.indexed) {
    expect(proofA.indices).to.deep.equal(proofB.indices)
    return
  }

  if (optionsA.compact && optionsB.compact) {
    proofA.compactProof.forEach((p, i) => expect(p.equals(proofB.compactProof[i])).to.be.true)
    expect(proofA.compactProof.length).to.equal(proofB.compactProof.length)
    return
  }

  proofA.decommitments.forEach((d, i) => expect(d.equals(proofB.decommitments[i])).to.be.true)
  expect(proofA.decommitments.length).to.equal(proofB.decommitments.length)
  expect(proofA.flags).to.deep.equal(proofB.flags)
  expect(proofA.skips).to.deep.equal(proofB.skips)
}

const testMultiProofVerification = (elementCount, indices, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateMultiProof(indices, options)
  const proofValid = MerkleTree.verifyMultiProof(proof, options)

  expect(proofValid).to.be.true
}

const testMultiProofIndicesInferring = (elementCount, indices, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateMultiProof(indices, options)
  const inferredIndices = MerkleTree.getMultiProofIndices(proof, options)

  expect(inferredIndices).to.deep.equal(indices)
}
const testAppendProofGeneration = (elementCount, seed, expected, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateAppendProof(options)

  expect(proof.root.equals(merkleTree.root)).to.be.true

  if (options.compact) {
    proof.compactProof.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.compactProof[i]))
    expect(proof.compactProof.length).to.equal(expected.compactProof.length)
    return
  }

  expect(proof.elementCount).to.equal(elementCount)
  proof.decommitments.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.decommitments[i]))
  expect(proof.decommitments.length).to.equal(expected.decommitments.length)
}

const testAppendProofVerification = (elementCount, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateAppendProof(options)
  const proofValid = MerkleTree.verifyAppendProof(proof, options)

  expect(proofValid).to.be.true
}
const testCombinedProofMinimumIndex = (elementCount, expected, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount)
  const merkleTree = new MerkleTree(elements, options)
  const minimumIndex = merkleTree.minimumCombinedProofIndex

  expect(minimumIndex).to.equal(expected.minimumIndex)
}

const testSingleUpdateSingleAppendProofGeneration = (elementCount, seed, index, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const uElement = generateElements(1, { seed: '11' })[0]
  const aElement = generateElements(1, { seed: '22' })[0]
  const combinedProof = merkleTree.generateUpdateAppendProof(index, uElement, aElement, options)
  const { element, updateElement, appendElement } = combinedProof
  const singleProof = merkleTree.generateSingleProof(index, options)

  expect(element.equals(originalElements[index])).to.be.true
  expect(updateElement.equals(uElement)).to.be.true
  expect(appendElement.equals(aElement)).to.be.true

  if (options.compact) {
    combinedProof.compactProof.forEach((p, i) => expect(p.equals(singleProof.compactProof[i])).to.be.true)
    expect(combinedProof.compactProof.length).to.equal(singleProof.compactProof.length)
    return
  }

  expect(combinedProof.elementCount).to.equal(singleProof.elementCount)
  combinedProof.decommitments.forEach((d, i) => expect(d.equals(singleProof.decommitments[i])).to.be.true)
  expect(combinedProof.decommitments.length).to.equal(singleProof.decommitments.length)
}

const testMultiUpdateMultiAppendProofGeneration = (elementCount, seed, updateIndices, appendSize, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const uElements = generateElements(updateIndices.length, { seed: '11' })
  const aElements = generateElements(appendSize, { seed: '22' })
  const combinedProof = merkleTree.generateUpdateAppendProof(updateIndices, uElements, aElements, options)
  const { elements, updateElements, appendElements } = combinedProof
  const multiProof = merkleTree.generateMultiProof(updateIndices, options)

  elements.forEach((e, i) => expect(e.equals(originalElements[updateIndices[i]])).to.be.true)
  expect(elements.length).to.equal(updateIndices.length)
  updateElements.forEach((e, i) => expect(e.equals(uElements[i])).to.be.true)
  expect(updateElements.length).to.equal(uElements.length)
  appendElements.forEach((e, i) => expect(e.equals(aElements[i])).to.be.true)
  expect(appendElements.length).to.equal(aElements.length)

  if (options.compact) {
    combinedProof.compactProof.forEach((p, i) => expect(p.equals(multiProof.compactProof[i])).to.be.true)
    expect(combinedProof.compactProof.length).to.equal(multiProof.compactProof.length)
    return
  }

  if (!options.sortedHash) {
    expect(combinedProof.orders).to.deep.equal(multiProof.orders)
  }

  expect(combinedProof.elementCount).to.equal(multiProof.elementCount)
  combinedProof.decommitments.forEach((d, i) => expect(d.equals(multiProof.decommitments[i])).to.be.true)
  expect(combinedProof.decommitments.length).to.equal(multiProof.decommitments.length)
  expect(combinedProof.flags).to.deep.equal(multiProof.flags)
  expect(combinedProof.skips).to.deep.equal(multiProof.skips)
}

const testCombinedProofVerification = (elementCount, indices, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateCombinedProof(indices, options)
  const proofValid = MerkleTree.verifyCombinedProof(proof, options)

  expect(proofValid).to.be.true
}
const testSingleUseSingleAppendProofGeneration = (elementCount, seed, index, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const aElement = generateElements(1, { seed: '22' })[0]
  const combinedProof = merkleTree.generateUseAppendProof(index, aElement, options)
  const { element, appendElement } = combinedProof
  const singleProof = merkleTree.generateSingleProof(index, options)

  expect(element.equals(originalElements[index])).to.be.true
  expect(appendElement.equals(aElement)).to.be.true

  if (options.compact) {
    combinedProof.compactProof.forEach((p, i) => expect(p.equals(singleProof.compactProof[i])).to.be.true)
    expect(combinedProof.compactProof.length).to.equal(singleProof.compactProof.length)
    return
  }

  expect(combinedProof.elementCount).to.equal(singleProof.elementCount)
  combinedProof.decommitments.forEach((d, i) => expect(d.equals(singleProof.decommitments[i])).to.be.true)
  expect(combinedProof.decommitments.length).to.equal(singleProof.decommitments.length)
}
const testMultiUseMultiAppendProofGeneration = (elementCount, seed, indices, appendSize, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const aElements = generateElements(appendSize, { seed: '22' })
  const combinedProof = merkleTree.generateUseAppendProof(indices, aElements, options)
  const { elements, appendElements } = combinedProof
  const multiProof = merkleTree.generateMultiProof(indices, options)

  elements.forEach((e, i) => expect(e.equals(originalElements[indices[i]])).to.be.true)
  expect(elements.length).to.equal(indices.length)
  appendElements.forEach((e, i) => expect(e.equals(aElements[i])).to.be.true)
  expect(appendElements.length).to.equal(aElements.length)

  if (options.compact) {
    combinedProof.compactProof.forEach((p, i) => expect(p.equals(multiProof.compactProof[i])).to.be.true)
    expect(combinedProof.compactProof.length).to.equal(multiProof.compactProof.length)
    return
  }

  if (!options.sortedHash) {
    expect(combinedProof.orders).to.deep.equal(multiProof.orders)
  }

  expect(combinedProof.elementCount).to.equal(multiProof.elementCount)
  combinedProof.decommitments.forEach((d, i) => expect(d.equals(multiProof.decommitments[i])).to.be.true)
  expect(combinedProof.decommitments.length).to.equal(multiProof.decommitments.length)
  expect(combinedProof.flags).to.deep.equal(multiProof.flags)
  expect(combinedProof.skips).to.deep.equal(multiProof.skips)
}
const testSizeProofGeneration = (elementCount, seed, expected, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSizeProof(options)

  expect(proof.root.equals(merkleTree.root)).to.be.true
  expect(proof.elementCount).to.equal(elementCount)

  if (options.simple) {
    expect(proof.elementRoot.toString('hex')).to.equal(expected.elementRoot)
    return
  }

  if (options.compact) {
    proof.compactProof.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.compactProof[i]))
    expect(proof.compactProof.length).to.equal(expected.compactProof.length)
    return
  }

  proof.decommitments.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.decommitments[i]))
  expect(proof.decommitments.length).to.equal(expected.decommitments.length)
}

const testSizeProofVerification = (elementCount, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSizeProof(options)
  const proofValid = MerkleTree.verifySizeProof(proof, options)

  expect(proofValid).to.be.true
}


