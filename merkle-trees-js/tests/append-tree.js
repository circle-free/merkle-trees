// 'strict';

// const chai = require('chai');
// const { expect } = chai;

// const Test = require('../src/multi-proof');
// const TIMEOUT = 500;
// const CHECK_FREQUENCY = 50;

// describe('PromiseHelper', () => {
//   describe('waitUntil', () => {
//     const { waitUntil } = PromiseHelper;

//     it('should resolve false if condition is not met within timeout.', () => {
//       return expect(waitUntil(() => Promise.resolve(false), TIMEOUT, CHECK_FREQUENCY)).to.become(
//         false
//       );

//       // const items = [
//       //   '0000000000000000000000000000000000000000000000000000000000000001',
//       //   '0000000000000000000000000000000000000000000000000000000000000002',
//       //   '0000000000000000000000000000000000000000000000000000000000000003',
//       //   '0000000000000000000000000000000000000000000000000000000000000004',
//       //   '0000000000000000000000000000000000000000000000000000000000000005',
//       //   '0000000000000000000000000000000000000000000000000000000000000006',
//       //   '0000000000000000000000000000000000000000000000000000000000000007',
//       //   '0000000000000000000000000000000000000000000000000000000000000008'];

//       // const buffers = items.map(item => Buffer.from(item, 'hex'));
//       // const { realLeafCount, tree, mixedRoot, root } = makeTree(buffers.slice(0,7));
//       // console.log(`Tree has ${realLeafCount} real leafs, with root ${root.toString('hex')} and mixed root ${mixedRoot.toString('hex')}.`);

//       // const decommitments = generateAppendProof(tree, realLeafCount);
//       // const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(buffers[7], mixedRoot, root, realLeafCount, decommitments);
//       // console.log(`Tree now has ${newRealLeafCount} real leafs, with root ${newRoot.toString('hex')} and mixed root ${newMixedRoot.toString('hex')}.`);

//       // const { mixedRoot: rebuiltMixedRoot, root: rebuiltRoot } = makeTree(buffers.slice(0,8));

//       // if (rebuiltMixedRoot.equals(newMixedRoot) && rebuiltRoot.equals(newRoot)) {
//       //     console.log('Root and mixed root matches with freshly built 8-leaf tree.');
//       // } else {
//       //     console.error('Root and mixed root does not match with freshly built 8-leaf tree.');
//       // }
//     });
//   });
// });
