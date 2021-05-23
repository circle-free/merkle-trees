import { expect } from 'chai'
import { generateElements } from './index'
import { MerkleTree } from '../../index'
import { defaultProofOptions, proof, proofOptions, updateAndAppendProof } from '../../common'


export interface expectedProof extends updateAndAppendProof {
  minimumIndex: number
}

export const testSingleProofGeneration = (elementCount: number, seed: string, index: number, expected: expectedProof, options: proofOptions = defaultProofOptions) => {
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

export const compareSingleProofs = (elementCount: number, index: number, optionsA: proofOptions = defaultProofOptions, optionsB: proofOptions = defaultProofOptions) => {
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

export const testSingleProofVerification = (elementCount: number, index: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)
  const proofValid = MerkleTree.verifySingleProof(proof, options)

  expect(proofValid).to.be.true
}

export const testMultiProofGeneration = (elementCount: number, seed: string, indices: Array<number>, expected: expectedProof, options: proofOptions = defaultProofOptions) => {
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

export const compareMultiProofs = (elementCount: number, indices: Array<number>, optionsA: proofOptions = defaultProofOptions, optionsB: proofOptions = defaultProofOptions) => {
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

export const testMultiProofVerification = (elementCount: number, indices: Array<number>, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateMultiProof(indices, options)
  const proofValid = MerkleTree.verifyMultiProof(proof, options)

  expect(proofValid).to.be.true
}

export const testMultiProofIndicesInferring = (elementCount: number, indices: Array<number>, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateMultiProof(indices, options)
  const inferredIndices = MerkleTree.getMultiProofIndices(proof)

  expect(inferredIndices).to.deep.equal(indices)
}
export const testAppendProofGeneration = (elementCount: number, seed: string, expected: expectedProof, options: proofOptions = defaultProofOptions) => {
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

export const testAppendProofVerification = (elementCount: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateAppendProof(options)
  const proofValid = MerkleTree.verifyAppendProof(proof, options)

  expect(proofValid).to.be.true
}

export const testCombinedProofMinimumIndex = (elementCount: number, expected: expectedProof, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount)
  const merkleTree = new MerkleTree(elements, options)
  const minimumIndex = merkleTree.minimumCombinedProofIndex

  expect(minimumIndex).to.equal(expected.minimumIndex)
}

export const testSingleUpdateSingleAppendProofGeneration = (elementCount: number, seed: string, index: number, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const updateElement = generateElements(1, { seed: '11' })[0]
  const appendElement = generateElements(1, { seed: '22' })[0]
  const combinedProof = merkleTree.generateUpdateAppendProof({ index, updateElement, appendElement }, options)
  const { element, updateElement: rUpdateElement, appendElement: rAppendElement } = combinedProof
  const singleProof = merkleTree.generateSingleProof(index, options)

  expect(element.equals(originalElements[index])).to.be.true
  expect(updateElement.equals(rUpdateElement)).to.be.true
  expect(appendElement.equals(rAppendElement)).to.be.true

  if (options.compact) {
    combinedProof.compactProof.forEach((p, i) => expect(p.equals(singleProof.compactProof[i])).to.be.true)
    expect(combinedProof.compactProof.length).to.equal(singleProof.compactProof.length)
    return
  }

  expect(combinedProof.elementCount).to.equal(singleProof.elementCount)
  combinedProof.decommitments.forEach((d, i) => expect(d.equals(singleProof.decommitments[i])).to.be.true)
  expect(combinedProof.decommitments.length).to.equal(singleProof.decommitments.length)
}

export const testMultiUpdateMultiAppendProofGeneration = (elementCount: number, seed: string, indices: Array<number>, appendSize: number, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const updateElements = generateElements(indices.length, { seed: '11' })
  const appendElements = generateElements(appendSize, { seed: '22' })
  const combinedProof = merkleTree.generateUpdateAppendProof({ indices, updateElements, appendElements }, options)
  const { elements, updateElements: rUpdateElements, appendElements: rAppendElements } = combinedProof
  const multiProof = merkleTree.generateMultiProof(indices, options)

  elements.forEach((e, i) => expect(e.equals(originalElements[indices[i]])).to.be.true)
  expect(elements.length).to.equal(indices.length)
  rUpdateElements.forEach((e, i) => expect(e.equals(updateElements[i])).to.be.true)
  expect(rUpdateElements.length).to.equal(updateElements.length)
  rAppendElements.forEach((e, i) => expect(e.equals(appendElements[i])).to.be.true)
  expect(rAppendElements.length).to.equal(appendElements.length)

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

export const testCombinedProofVerification = (elementCount: number, indices: Array<number>, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateCombinedProof(indices, options)
  const proofValid = MerkleTree.verifyCombinedProof(proof, options)

  expect(proofValid).to.be.true
}

export const testSingleUseSingleAppendProofGeneration = (elementCount: number, seed: string, index: number, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const appendElement = generateElements(1, { seed: '22' })[0]
  const combinedProof = merkleTree.generateUseAppendProof({ index, appendElement }, options)
  const { element, appendElement: rAppendElement } = combinedProof
  const singleProof = merkleTree.generateSingleProof(index, options)

  expect(element.equals(originalElements[index])).to.be.true
  expect(appendElement.equals(rAppendElement)).to.be.true

  if (options.compact) {
    combinedProof.compactProof.forEach((p, i) => expect(p.equals(singleProof.compactProof[i])).to.be.true)
    expect(combinedProof.compactProof.length).to.equal(singleProof.compactProof.length)
    return
  }

  expect(combinedProof.elementCount).to.equal(singleProof.elementCount)
  combinedProof.decommitments.forEach((d, i) => expect(d.equals(singleProof.decommitments[i])).to.be.true)
  expect(combinedProof.decommitments.length).to.equal(singleProof.decommitments.length)
}

export const testMultiUseMultiAppendProofGeneration = (elementCount: number, seed: string, indices: Array<number>, appendSize: number, options: proofOptions = defaultProofOptions) => {
  const originalElements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(originalElements, options)
  const appendElements = generateElements(appendSize, { seed: '22' })
  const combinedProof = merkleTree.generateUseAppendProof({ indices, appendElements }, options)
  const { elements, appendElements: rAppendElements } = combinedProof
  const multiProof = merkleTree.generateMultiProof(indices, options)

  elements.forEach((e, i) => expect(e.equals(originalElements[indices[i]])).to.be.true)
  expect(elements.length).to.equal(indices.length)
  rAppendElements.forEach((e, i) => expect(e.equals(appendElements[i])).to.be.true)
  expect(rAppendElements.length).to.equal(appendElements.length)

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

export const testSizeProofGeneration = (elementCount: number, seed: string, expected: expectedProof, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSizeProof(options)

  expect(proof.root.equals(merkleTree.root)).to.be.true
  expect(proof.elementCount).to.equal(elementCount)

  if (options.simple) {
    expect(proof.element.toString('hex')).to.equal(expected.element)
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

export const testSizeProofVerification = (elementCount: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSizeProof(options)
  const proofValid = MerkleTree.verifySizeProof(proof, options)

  expect(proofValid).to.be.true
}


