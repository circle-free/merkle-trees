
import { expect } from 'chai'
import { generateElements } from './index'
import { MerkleTree, PartialMerkleTree } from '../../index'
import { proof } from '../../common'

export interface expectedPartialTree extends proof {
  tree?: Array<Buffer>
}

export const testTreeFromSingleProof = (elementCount: number, seed: string, index: number, expected: expectedPartialTree, options) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options)

  expect(partialTree._sortedHash).to.equal(merkleTree._sortedHash)
  expect(partialTree._unbalanced).to.equal(merkleTree._unbalanced)
  expect(partialTree._elementPrefix.equals(merkleTree._elementPrefix)).to.be.true
  expect(partialTree._depth).to.equal(merkleTree._depth)
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements)
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree)
}

export const testTreeFromSingleUpdateProof = (elementCount: number, seed: string, index: number, expected: expectedPartialTree, options) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const updateElement = generateElements(1, { seed: '11' })[0]
  const { proof, newMerkleTree } = merkleTree.updateSingle(index, updateElement, options)
  const partialTree = PartialMerkleTree.fromSingleUpdateProof(proof, options)

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash)
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced)
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true
  expect(partialTree._depth).to.equal(newMerkleTree._depth)
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements)
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree)
}

export const testTreeFromMultiProof = (elementCount: number, seed: string, indices, expected: expectedPartialTree, options) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateMultiProof(indices, options)
  const partialTree = PartialMerkleTree.fromMultiProof(proof, options)

  expect(partialTree._sortedHash).to.equal(merkleTree._sortedHash)
  expect(partialTree._unbalanced).to.equal(merkleTree._unbalanced)
  expect(partialTree._elementPrefix.equals(merkleTree._elementPrefix)).to.be.true
  expect(partialTree._depth).to.equal(merkleTree._depth)
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements)
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree)
}

export const testTreeFromMultiUpdateProof = (elementCount: number, seed: string, indices, expected: expectedPartialTree, options) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const updateElements = generateElements(indices.length, { seed: '11' })
  const { proof, newMerkleTree } = merkleTree.updateMulti(indices, updateElements, options)
  const partialTree = PartialMerkleTree.fromMultiUpdateProof(proof, options)

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash)
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced)
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true
  expect(partialTree._depth).to.equal(newMerkleTree._depth)
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements)
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree)
}

export const testTreeFromSingleAppendProof = (elementCount: number, seed: string, expected: expectedPartialTree, options) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const appendElement = generateElements(1, { seed: '22' })[0]
  const { proof, newMerkleTree } = merkleTree.appendSingle(appendElement, options)
  const partialTree = PartialMerkleTree.fromAppendProof(proof, options)

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash)
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced)
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true
  expect(partialTree._depth).to.equal(newMerkleTree._depth)
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements)
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree)
}

export const testTreeFromMultiAppendProof = (elementCount: number, seed: string, appendCount, expected: expectedPartialTree, options) => {
  const elements = generateElements(elementCount, { seed })
  const merkleTree = new MerkleTree(elements, options)
  const appendElements = generateElements(appendCount, { seed: '22' })
  const { proof, newMerkleTree } = merkleTree.appendMulti(appendElements, options)
  const partialTree = PartialMerkleTree.fromAppendProof(proof, options)

  expect(partialTree._sortedHash).to.equal(newMerkleTree._sortedHash)
  expect(partialTree._unbalanced).to.equal(newMerkleTree._unbalanced)
  expect(partialTree._elementPrefix.equals(newMerkleTree._elementPrefix)).to.be.true
  expect(partialTree._depth).to.equal(newMerkleTree._depth)
  expect(partialTree._elements.map((e) => e && e.toString('hex'))).to.deep.equal(expected.elements)
  expect(partialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expected.tree)
}

export const testGenerateSingleProofFromPartial = (elementCount: number, index: number, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options)

  const proofFromPartial = partialTree.generateSingleProof(index, options)
  const proofIsValid = MerkleTree.verifySingleProof(proofFromPartial, options)

  expect(proofIsValid).to.be.true
  expect(proofFromPartial.root.equals(proof.root)).to.be.true
}

export const testGenerateSingleUpdateProofFromSinglePartial = (elementCount: number, index: number, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const updateElement = generateElements(1, { seed: '11' })[0]

  const merkleTree = new MerkleTree(elements, options)
  const { proof: proofFromTree, newMerkleTree } = merkleTree.updateSingle(index, updateElement, options)

  const partialTree = PartialMerkleTree.fromSingleProof(proofFromTree, options)
  const { proof: proofFromPartialTree, newPartialTree } = partialTree.updatePartialSingle(index, updateElement, options)

  const proofFromPartialTreeIsValid = MerkleTree.verifySingleProof(proofFromPartialTree, options)

  expect(proofFromPartialTreeIsValid).to.be.true
  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true
}

export const testGenerateMultiUpdateProofFromMultiPartial = (elementCount: number, indices, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const updateElements = generateElements(indices.length, { seed: '11' })

  const merkleTree = new MerkleTree(elements, options)
  const { proof: proofFromTree, newMerkleTree } = merkleTree.updateMulti(indices, updateElements, options)

  const partialTree = PartialMerkleTree.fromMultiProof(proofFromTree, options)
  const { proof: proofFromPartialTree, newPartialTree } = partialTree.updatePartialMulti(indices, updateElements, options)

  const proofFromPartialTreeIsValid = MerkleTree.verifyMultiProof(proofFromPartialTree, options)

  expect(proofFromPartialTreeIsValid).to.be.true
  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true
}

export const testCheckElements = (elementCount: number, index: number, checkIndices, expectations, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options)
  const elementChecks = partialTree.check(
    checkIndices,
    checkIndices.map((i) => elements[i])
  )

  expect(elementChecks).to.deep.equal(expectations)
  checkIndices.forEach((index, i) => expect(partialTree.check(index, elements[index])).to.equal(expectations[i]))
}

export const testSetElement = (elementCount: number, index: number, setIndex, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options)
  const newPartialTree = partialTree.set(setIndex, elements[setIndex])

  expect(newPartialTree._elements[index].equals(elements[index])).to.be.true
  expect(newPartialTree._elements[setIndex].equals(elements[setIndex])).to.be.true
  const expectedTreeNodes = partialTree._tree.map((n) => n && n.toString('hex'))
  const newLeafIndex = (newPartialTree._tree.length >> 1) + setIndex
  expectedTreeNodes[newLeafIndex] = merkleTree._tree[newLeafIndex].toString('hex')
  expect(newPartialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expectedTreeNodes)
}

export const testSetElements = (elementCount: number, index: number, setIndices, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const proof = merkleTree.generateSingleProof(index, options)
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options)
  const newPartialTree = partialTree.set(
    setIndices,
    setIndices.map((i) => elements[i])
  )

  setIndices.concat(index).forEach((i) => expect(newPartialTree._elements[i].equals(elements[i])).to.be.true)
  const expectedTreeNodes = partialTree._tree.map((n) => n && n.toString('hex'))

  setIndices.forEach((setIndex) => {
    const newLeafIndex = (newPartialTree._tree.length >> 1) + setIndex
    expectedTreeNodes[newLeafIndex] = merkleTree._tree[newLeafIndex].toString('hex')
  })

  expect(newPartialTree._tree.map((n) => n && n.toString('hex'))).to.deep.equal(expectedTreeNodes)
}

export const testAppendElement = (elementCount: number, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const index = elementCount - 1
  const proof = merkleTree.generateSingleProof(index, options)
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options)
  const appendElement = generateElements(1, { seed: '22' })[0]
  const newPartialTree = partialTree.append(appendElement)
  const newMerkleTree = new MerkleTree(elements.concat(appendElement), options)

  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true
}

export const testAppendElements = (elementCount: number, appendElementCount, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const index = elementCount - 1
  const proof = merkleTree.generateSingleProof(index, options)
  const partialTree = PartialMerkleTree.fromSingleProof(proof, options)
  const appendElements = generateElements(appendElementCount, { seed: '22' })
  const newPartialTree = partialTree.append(appendElements)
  const newMerkleTree = new MerkleTree(elements.concat(appendElements), options)

  expect(newPartialTree.root.equals(newMerkleTree.root)).to.be.true
};