import * as crypto from 'crypto'
import { hashNode, to32ByteBuffer } from '../../utils'

export const generateRandomElement = (): Buffer => {
  return crypto.randomBytes(32)
}

export interface elementOptions {
  seed?: string,
  random?: boolean,
  size?: number
}

export const defaultElementOptions = {
  seed: "random",
  random: false,
  size: 32,
}

export const generateElements = (elementCount: number, options?: elementOptions): Array<Buffer> => {
  const { seed, random = false, size = 32 } = Object.assign(defaultElementOptions, options)
  const elements = []
  let seedBuffer = seed ? Buffer.from(seed, 'hex') : null
  let element = seedBuffer

  for (let i = 0; i < elementCount; i++) {
    element = random ? generateRandomElement() : seed ? hashNode(seedBuffer, element) : to32ByteBuffer(i)

    const elementSize = size === 0 ? element.readUInt8(31) : size

    if (element.length < elementSize) {
      element = Buffer.concat([element, Buffer.alloc(elementSize - element.length)])
    } else if (element.length > elementSize) {
      element = element.slice(0, elementSize)
    }

    seedBuffer = seed ? element : seedBuffer
    elements.push(element)
  }

  return elements
}

export const shuffle = (array: Array<any>) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j: number = Math.floor(Math.random() * (i + 1))
    let t: any = array[i]
    array[i] = array[j]
    array[j] = t
  }

  return array
}
