import { Keccak } from "sha3"

export const leftPad = (num: string | number, size: number, char: string = '0'): string => {
  let s: string = num + ''
  while (s.length < size) s = char + s
  return s
}

export const to32ByteBuffer = (num: number): Buffer => Buffer.from(leftPad(num.toString(16), 64), 'hex')

export const from32ByteBuffer = (buffer: Buffer): number => buffer.readUInt32BE(28)

export const bitCount32 = (n: number): number => {
  let m = n - ((n >>> 1) & 0x55555555)
  m = (m & 0x33333333) + ((m >>> 2) & 0x33333333)

  return (((m + (m >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24
}

export const prefix = (value: string): string => (value.startsWith('0x') ? value : '0x' + value)

export const hash = (buffer: Buffer): Buffer => new Keccak(256).update(buffer).digest()

export const hashNode = (left: Buffer, right: Buffer): Buffer => hash(Buffer.concat([left, right]))

export const sortHashNode = (left: Buffer, right: Buffer): Buffer => {
  if (left && right) {
    return hash(Buffer.concat([left, right].sort(Buffer.compare)))
  }

  throw new Error('Both buffers must exist to be sorted and hashed.')
}

export const getHashFunction = (sortedHash: boolean): ((x: Buffer, y: Buffer) => Buffer) => {
  return (left, right: Buffer): Buffer => sortedHash ? sortHashNode(left, right) : hashNode(left, right)
}

export const findLastIndex = (array: Array<any>, predicate: (value: any, index: number, array: Array<any>) => boolean): number => {
  let i = array.length

  while (i--) {
    if (predicate(array[i], i, array)) return i
  }

  return -1
}

export const to32ByteBoolBuffer = (booleans: Array<1 | 0>): Buffer => {
  if (booleans.length > 256) return null
  const value = booleans.reduce((value, bool, i) => value | ((bool ? BigInt(1) : BigInt(0)) << BigInt(i)), BigInt(0))
  return Buffer.from(leftPad(value.toString(16), 64), 'hex')
}

export const toBigIntBoolSet = (booleans: Array<1 | 0>): bigint => {
  if (booleans.length > 256) return null
  return booleans.reduce((value, bool, i) => value | ((bool ? BigInt(1) : BigInt(0)) << BigInt(i)), BigInt(0))
}

export const roundUpToPowerOf2 = (num: number): number => {
  if (bitCount32(num) === 1) return num

  num |= num >>> 1
  num |= num >>> 2
  num |= num >>> 4
  num |= num >>> 8
  num |= num >>> 16

  return num + 1
}

export const bigIntTo32ByteBuffer = (value: bigint): Buffer => Buffer.from(leftPad(value.toString(16), 64), 'hex')

export const bufferToBigInt = (buffer: Buffer): bigint => BigInt('0x' + buffer.toString('hex'))
