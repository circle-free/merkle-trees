'use strict';

const crypto = require('crypto');
const { hashNode, to32ByteBuffer } = require('../../src/utils');

const generateRandomElement = () => {
  return crypto.randomBytes(32);
};

const generateElements = (elementCount, options = {}) => {
  const { seed, random = false, size = 32 } = options;
  const elements = [];
  let seedBuffer = seed ? Buffer.from(seed, 'hex') : null;
  let element = seedBuffer;

  for (let i = 0; i < elementCount; i++) {
    element = random ? generateRandomElement() : seed ? hashNode(seedBuffer, element) : to32ByteBuffer(i);

    const elementSize = size === 'random' ? element.readUInt8(31) : size;

    if (element.length < elementSize) {
      element = Buffer.concat([element, Buffer.alloc(elementSize - element.length)]);
    } else if (element.length > elementSize) {
      element = element.slice(0, elementSize);
    }

    seedBuffer = seed ? element : seedBuffer;
    elements.push(element);
  }

  return elements;
};

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

module.exports = {
  generateRandomElement,
  generateElements,
  shuffle,
};
