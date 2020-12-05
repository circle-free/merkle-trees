'use strict';
const { Keccak } = require('sha3');
const assert = require('assert');

const leftPad = (num, size, char = '0') => {
  let s = num + '';

  while (s.length < size) s = char + s;

  return s;
};

const to32ByteBuffer = (number) => Buffer.from(leftPad(number.toString(16), 64), 'hex');

const from32ByteBuffer = (buffer) => buffer.readUInt32BE(28);

const bitCount32 = (n) => {
  let m = n - ((n >>> 1) & 0x55555555);
  m = (m & 0x33333333) + ((m >>> 2) & 0x33333333);

  return (((m + (m >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
};

const prefix = (value) => (value.startsWith('0x') ? value : '0x' + value);

// NOTE: arguments must already be buffer, preferably 32 bytes
const hash = (buffer) => new Keccak(256).update(buffer).digest();

// NOTE: arguments must already be buffers, preferably 32 bytes
const hashNode = (left, right) => hash(Buffer.concat([left, right]));

// NOTE: arguments must already be buffers, preferably 32 bytes
const sortHashNode = (left, right) => {
  assert(left && right, 'Both buffers must exist to be sorted and hashed.');

  return hash(Buffer.concat([left, right].sort(Buffer.compare)));
};

const getHashFunction = (sortedHash) => (left, right) =>
  sortedHash ? sortHashNode(left, right) : hashNode(left, right);

const findLastIndex = (array, predicate) => {
  let i = array.length;

  while (i--) {
    if (predicate(array[i], i, array)) return i;
  }

  return -1;
};

const to32ByteBoolBuffer = (booleans) => {
  if (booleans.length > 256) return null;

  const value = booleans.reduce((value, bool, i) => value | ((bool ? 1n : 0n) << BigInt(i)), 0n);

  return Buffer.from(leftPad(value.toString(16), 64), 'hex');
};

const toBigIntBoolSet = (booleans) => {
  if (booleans.length > 256) return null;

  return booleans.reduce((value, bool, i) => value | ((bool ? 1n : 0n) << BigInt(i)), 0n);
};

const roundUpToPowerOf2 = (number) => {
  if (bitCount32(number) === 1) return number;

  number |= number >>> 1;
  number |= number >>> 2;
  number |= number >>> 4;
  number |= number >>> 8;
  number |= number >>> 16;

  return number + 1;
};

const bigIntTo32ByteBuffer = (value) => Buffer.from(leftPad(value.toString(16), 64), 'hex');

const bufferToBigInt = (buffer) => BigInt('0x' + buffer.toString('hex'));

module.exports = {
  leftPad,
  to32ByteBuffer,
  from32ByteBuffer,
  to32ByteBoolBuffer,
  toBigIntBoolSet,
  bitCount32,
  prefix,
  hash,
  hashNode,
  sortHashNode,
  getHashFunction,
  findLastIndex,
  roundUpToPowerOf2,
  bigIntTo32ByteBuffer,
  bufferToBigInt,
};
