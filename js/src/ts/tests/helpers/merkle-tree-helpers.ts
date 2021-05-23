import { expect } from 'chai'
import { defaultElementOptions, elementOptions, generateElements } from './index'
import { MerkleTree } from '../../index'
import { defaultProofOptions, defaultTreeOptions, proofOptions, treeOptions } from '../../common'

export interface expectedTree extends MerkleTree { }

const testBuildTree = (elementCount: number, seed: string, expected: expectedTree, treeOptions: proofOptions = defaultProofOptions, elementOptions: elementOptions = defaultElementOptions) => {
  const elements = generateElements(elementCount, { seed, size: elementOptions.size })
  const merkleTree = new MerkleTree(elements, treeOptions)

  expect(merkleTree.root.toString('hex')).to.equal(expected.root)
  expect(merkleTree.elementRoot.toString('hex')).to.equal(expected.elementRoot)
  expect(merkleTree.depth).to.equal(expected.depth)
  merkleTree.elements.forEach((e, i) => expect(e.equals(elements[i])).to.be.true)
  expect(merkleTree.elements.length).to.equal(elements.length)
}

const compareTrees = (elementCount: number, optionsA: proofOptions, optionsB: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const treeA = new MerkleTree(elements, optionsA)
  const treeB = new MerkleTree(elements, optionsB)

  expect(treeA.root.equals(treeB.root)).to.be.true
  expect(treeA.elementRoot.equals(treeB.elementRoot)).to.be.true
  expect(treeA.depth).to.equal(treeB.depth)
  treeA.elements.forEach((e, i) => expect(e.equals(treeB.elements[i])).to.be.true)
  expect(treeA.elements.length).to.equal(treeB.elements.length)
}

const testSingleUpdate = (elementCount: number, index: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const updateElement = generateElements(1, { seed: '11' })[0]
  const { newMerkleTree, proof } = merkleTree.updateSingle(index, updateElement, options)
  const { root } = MerkleTree.updateWithSingleProof(proof, options)
  const newElements = elements.map((e, i) => (i === index ? updateElement : e))
  const freshMerkleTree = new MerkleTree(newElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
}

const testConsecutiveSingleUpdate = (iterations: number, elementCount: number, options: proofOptions = defaultProofOptions, elementOptions: elementOptions = defaultElementOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc', size: elementOptions.size })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const index = Math.floor(Math.random() * elementCount)
    const updateElement = generateElements(1, { random: true, size: elementOptions.size })[0]
    const { newMerkleTree, proof } = merkleTree.updateSingle(index, updateElement, options)
    merkleTree = newMerkleTree
    root = MerkleTree.updateWithSingleProof(proof, options).root
    elements[index] = updateElement

    expect(root.equals(merkleTree.root)).to.be.true
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}

const testMultiUpdate = (elementCount: number, indices: Array<number>, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const updateElements = generateElements(indices.length, { seed: '11' })
  const { newMerkleTree, proof } = merkleTree.updateMulti(indices, updateElements, options)
  const { root } = MerkleTree.updateWithMultiProof(proof, options)

  const newTreeElements = elements.map((e, i) => {
    const index = indices.indexOf(i)

    return index >= 0 ? updateElements[index] : e
  })

  const freshMerkleTree = new MerkleTree(newTreeElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
}

const testConsecutiveMultiUpdate = (iterations: number, elementCount: number, updateSize: number, options: proofOptions = defaultProofOptions, elementOptions: elementOptions = defaultElementOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc', size: elementOptions.size })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const rawUpdateElements = generateElements(updateSize, { random: true, size: elementOptions.size })
    const rawIndices = rawUpdateElements.map(() => Math.floor(Math.random() * elementCount))
    const indices = rawIndices.filter((index, i) => rawIndices.indexOf(index) === i).sort((a, b) => a - b)
    const updateElements = rawUpdateElements.slice(0, indices.length)

    const { newMerkleTree, proof } = merkleTree.updateMulti(indices, updateElements, options)
    merkleTree = newMerkleTree
    root = MerkleTree.updateWithMultiProof(proof, options).root

    elements = elements.map((element, i) => {
      const index = indices.indexOf(i)

      return index >= 0 ? updateElements[index] : element
    })

    expect(root.equals(merkleTree.root)).to.be.true
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}

const testSingleAppend = (elementCount: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const appendElement = generateElements(1, { seed: '11' })[0]
  const { newMerkleTree, proof } = merkleTree.appendSingle(appendElement, options)
  const { root, elementCount: newElementCount } = MerkleTree.appendWithAppendProof(proof, options)
  const newElements = elements.concat(appendElement)
  const freshMerkleTree = new MerkleTree(newElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
  expect(newElementCount).to.equal(newMerkleTree.elements.length)
  expect(newElementCount).to.equal(freshMerkleTree.elements.length)
}

const testConsecutiveSingleAppend = (iterations: number, elementCount: number, options: proofOptions = defaultProofOptions, elementOptions: elementOptions = defaultElementOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc', size: elementOptions.size })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const appendElement = generateElements(1, { random: true, size: elementOptions.size })[0]
    const { newMerkleTree, proof } = merkleTree.appendSingle(appendElement, options)
    merkleTree = newMerkleTree
    const results = MerkleTree.appendWithAppendProof(proof, options)
    root = results.root
    elements.push(appendElement)

    expect(root.equals(merkleTree.root)).to.equal(true)
    expect(results.elementCount).to.equal(merkleTree.elements.length)
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}

const testMultiAppend = (elementCount: number, appendSize: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const appendElements = generateElements(appendSize, { seed: '11' })
  const { newMerkleTree, proof } = merkleTree.appendMulti(appendElements, options)
  const { root, elementCount: newElementCount } = MerkleTree.appendWithAppendProof(proof, options)
  const newElements = elements.concat(appendElements)
  const freshMerkleTree = new MerkleTree(newElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
  expect(newElementCount).to.equal(newMerkleTree.elements.length)
  expect(newElementCount).to.equal(freshMerkleTree.elements.length)
}

const testConsecutiveMultiAppend = (iterations: number, elementCount: number, appendSize: number, options: proofOptions = defaultProofOptions, elementOptions: elementOptions = defaultElementOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc', size: elementOptions.size })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const appendElements = generateElements(Math.ceil(Math.random() * appendSize), { random: true, size: elementOptions.size })
    const { newMerkleTree, proof } = merkleTree.appendMulti(appendElements, options)
    merkleTree = newMerkleTree
    const results = MerkleTree.appendWithAppendProof(proof, options)
    root = results.root
    elements = elements.concat(appendElements)

    expect(root.equals(merkleTree.root)).to.be.true
    expect(results.elementCount).to.equal(merkleTree.elements.length)
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}

const testSingleUpdateSingleAppend = (elementCount: number, index: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const updateElement = generateElements(1, { seed: '11' })[0]
  const appendElement = generateElements(1, { seed: '22' })[0]
  const { newMerkleTree, proof } = merkleTree.updateAndAppend({ index, updateElement, appendElement }, options)
  const { root, elementCount: newElementCount } = MerkleTree.updateAndAppendWithCombinedProof(proof, options)
  const updatedElements = elements.map((e, i) => (index == i ? updateElement : e))
  const newElements = updatedElements.concat(appendElement)
  const freshMerkleTree = new MerkleTree(newElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
  expect(newElementCount).to.equal(newMerkleTree.elements.length)
  expect(newElementCount).to.equal(freshMerkleTree.elements.length)
}

const testMultiUpdateMultiAppend = (elementCount: number, indices: Array<number>, appendSize: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const updateElements = generateElements(indices.length, { seed: '11' })
  const appendElements = generateElements(appendSize, { seed: '22' })
  const { newMerkleTree, proof } = merkleTree.updateAndAppend({ indices, updateElements, appendElements }, options)
  const { root, elementCount: newElementCount } = MerkleTree.updateAndAppendWithCombinedProof(proof, options)

  const updatedElements = elements.map((e, i) => {
    const index = indices.indexOf(i)

    return index >= 0 ? updateElements[index] : e
  })

  const newElements = updatedElements.concat(appendElements)
  const freshMerkleTree = new MerkleTree(newElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
  expect(newElementCount).to.equal(newMerkleTree.elements.length)
  expect(newElementCount).to.equal(freshMerkleTree.elements.length)
}

const testConsecutiveSingleUpdateSingleAppend = (iterations: number, elementCount: number, options: proofOptions = defaultProofOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc' })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const minimumIndex = merkleTree.minimumCombinedProofIndex
    const index = Math.floor(Math.random() * (elements.length - minimumIndex) + minimumIndex)
    const updateElement = generateElements(1, { random: true })[0]
    const appendElement = generateElements(1, { random: true })[0]

    const { newMerkleTree, proof } = merkleTree.updateAndAppend({ index, updateElement, appendElement }, options)
    merkleTree = newMerkleTree
    const results = MerkleTree.updateAndAppendWithCombinedProof(proof, options)
    root = results.root

    elements = elements.map((element, i) => (i === index ? updateElement : element)).concat(appendElement)

    expect(root.equals(merkleTree.root)).to.be.true
    expect(results.elementCount).to.equal(merkleTree.elements.length)
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}

const testConsecutiveMultiUpdateMultiAppend = (iterations: number, elementCount: number, updateSize: number, appendSize: number, options: proofOptions = defaultProofOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc' })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const rawUpdateElements = generateElements(updateSize, { random: true })
    const rawUpdateIndices = rawUpdateElements.map(() => Math.floor(Math.random() * elements.length))
    const minimumIndex = merkleTree.minimumCombinedProofIndex
    rawUpdateIndices[0] = Math.floor(Math.random() * (elements.length - minimumIndex) + minimumIndex)
    const indices = rawUpdateIndices.filter((index, i, arr) => arr.indexOf(index) === i).sort((a, b) => a - b)
    const updateElements = rawUpdateElements.slice(0, indices.length)
    const appendElements = generateElements(Math.ceil(Math.random() * appendSize), { random: true })

    const { newMerkleTree, proof } = merkleTree.updateAndAppend({ indices, updateElements, appendElements }, options)
    merkleTree = newMerkleTree
    const results = MerkleTree.updateAndAppendWithCombinedProof(proof, options)
    root = results.root

    elements = elements
      .map((element, i) => {
        const index = indices.indexOf(i)

        return index >= 0 ? updateElements[index] : element
      })
      .concat(appendElements)

    expect(root.equals(merkleTree.root)).to.be.true
    expect(results.elementCount).to.equal(merkleTree.elements.length)
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}

const testSingleUseSingleAppend = (elementCount: number, index: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const appendElement = generateElements(1, { seed: '22' })[0]
  const { newMerkleTree, proof } = merkleTree.useAndAppend(index, appendElement, options)
  const { root, elementCount: newElementCount } = MerkleTree.appendWithCombinedProof(proof, options)
  const newElements = elements.concat(appendElement)
  const freshMerkleTree = new MerkleTree(newElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
  expect(newElementCount).to.equal(newMerkleTree.elements.length)
  expect(newElementCount).to.equal(freshMerkleTree.elements.length)
}

const testConsecutiveSingleUseSingleAppend = (iterations: number, elementCount: number, options: proofOptions = defaultProofOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc' })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const minimumIndex = merkleTree.minimumCombinedProofIndex
    const index = Math.floor(Math.random() * (elements.length - minimumIndex) + minimumIndex)
    const appendElement = generateElements(1, { random: true })[0]

    const { newMerkleTree, proof } = merkleTree.useAndAppend(index, appendElement, options)
    merkleTree = newMerkleTree
    const results = MerkleTree.appendWithCombinedProof(proof, options)
    root = results.root

    elements = elements.concat(appendElement)

    expect(root.equals(merkleTree.root)).to.be.true
    expect(results.elementCount).to.equal(merkleTree.elements.length)
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}

const testMultiUseMultiAppend = (elementCount: number, indices: Array<number>, appendSize: number, options: proofOptions = defaultProofOptions) => {
  const elements = generateElements(elementCount, { seed: 'ff' })
  const merkleTree = new MerkleTree(elements, options)
  const aElements = generateElements(appendSize, { seed: '22' })
  const { newMerkleTree, proof } = merkleTree.useAndAppend(indices, aElements, options)
  const { root, elementCount: newElementCount } = MerkleTree.appendWithCombinedProof(proof, options)
  const newElements = elements.concat(aElements)
  const freshMerkleTree = new MerkleTree(newElements, options)

  expect(root.equals(newMerkleTree.root)).to.be.true
  expect(root.equals(freshMerkleTree.root)).to.be.true
  expect(newElementCount).to.equal(newMerkleTree.elements.length)
  expect(newElementCount).to.equal(freshMerkleTree.elements.length)
}

const testConsecutiveMultiUseMultiAppend = (iterations: number, elementCount: number, useSize: number, appendSize: number, options: proofOptions = defaultProofOptions) => {
  let elements = generateElements(elementCount, { seed: 'cc' })
  let merkleTree = new MerkleTree(elements, options)
  let root = null

  for (let i = 0; i < iterations; i++) {
    const rawIndices = Array(useSize)
      .fill(null)
      .map(() => Math.floor(Math.random() * elements.length))
    const minimumIndex = merkleTree.minimumCombinedProofIndex
    rawIndices[0] = Math.floor(Math.random() * (elements.length - minimumIndex) + minimumIndex)
    const indices = rawIndices.filter((index, i, arr) => arr.indexOf(index) === i).sort((a, b) => a - b)
    const appendElements = generateElements(Math.ceil(Math.random() * appendSize), { random: true })

    const { newMerkleTree, proof } = merkleTree.useAndAppend(indices, appendElements, options)
    merkleTree = newMerkleTree
    const results = MerkleTree.appendWithCombinedProof(proof, options)
    root = results.root
    elements = elements.concat(appendElements)

    expect(root.equals(merkleTree.root)).to.be.true
    expect(results.elementCount).to.equal(merkleTree.elements.length)
  }

  const finalMerkleTree = new MerkleTree(elements, options)

  expect(root.equals(finalMerkleTree.root)).to.be.true
}
