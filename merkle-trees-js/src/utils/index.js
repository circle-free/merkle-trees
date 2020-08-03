'use strict';
const { Keccak } = require('sha3');
const { leftShift, or } = require('bitwise-buffer');

const leftPad = (num, size, char = '0') => {
  let s = num + '';

  while (s.length < size) s = char + s;

  return s;
};

const to32ByteBuffer = (number) => {
  return Buffer.from(leftPad(number.toString(16), 64), 'hex');
};

const bitCount32 = (n) => {
  let m = n - ((n >> 1) & 0x55555555);
  m = (m & 0x33333333) + ((m >> 2) & 0x33333333);

  return (((m + (m >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
};

// NOTE: arguments must already be buffer, preferably 32 bytes
const hash = (buffer) => {
  const hash = new Keccak(256);
  return hash.update(buffer).digest();
};

// NOTE: arguments must already be buffers, preferably 32 bytes
const hashNode = (leftHash, rightHash) => {
  return hash(Buffer.concat([leftHash, rightHash]));
};

// NOTE: arguments must already be buffers, preferably 32 bytes
const sortHashNode = (leftHash, rightHash) => {
  if (!leftHash) return rightHash;

  if (!rightHash) return leftHash;

  return hash(Buffer.concat([leftHash, rightHash].sort(Buffer.compare)));
};

const findLastIndex = (array, predicate) => {
  let i = array.length;

  while (i--) {
    if (predicate(array[i], i, array)) return i;
  }

  return -1;
};

const to32ByteBoolBuffer = (booleans) => {
  return booleans.length < 257
    ? booleans.reduce(
        (booleanBuffer, bool, i) => or(booleanBuffer, leftShift(to32ByteBuffer(bool ? '1' : '0'), i)),
        Buffer.alloc(32)
      )
    : null;
};

module.exports = {
  leftPad,
  to32ByteBuffer,
  to32ByteBoolBuffer,
  bitCount32,
  hash,
  hashNode,
  sortHashNode,
  findLastIndex,
};
