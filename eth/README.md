# merkle-trees-eth (A set of smart contracts libraries compatible with `merkle-trees/js`)

## The Goal ##

A Merkle Tree library that enabled compact multi-proofs to update and append elements to roots of unbalanced trees. Can greatly reduce gas costs of storing lists, when compared to simple storage, especially when appending.
Effectively, this reduces SLOADs and SSTOREs to once per contract call, regardless of the operation (read, update, insert), and the cost of more calldata (elements and proof) and significantly more on-chain logic.
Ideally, this structure and library can be used to roll up and entire object, into one root, using recursive compact proofs to use its children, and add to it.
<br>
<br>

## Installing and Using ##

`npm install merkle-trees` or `yarn add merkle-trees`

```solidity
pragma solidity >=0.6.0 <0.8.0;

import "../node_modules/merkle-trees/eth/contracts/internal-merkle-library.sol";

// or

import "merkle-trees/eth/contracts/internal-merkle-library.sol";

// depending on your setup

...

Internal_Merkle_Library.elements_exist(root, elements, proof);
```

See `./contracts/test-harnesses` for contracts that give a better idea of how to use one of these libraries in your contracts. Also, see `./tests/merkle-storage.js` for examples on how to pair this with the javascript library.
<br>
<br>

## Notes ##

- Merkle trees with pairs that are sorted at hash-time result in cheaper and smaller proofs, at the cost of not being able to prove an element's index.
- More work can still be done to make these contracts more readable (at the cost of gas?)
- Contrary top the line above, more work can be done to write this all in assembly and save a lot of gas
<br>
<br>

## Various TODOs (In Order of Priority) ##

- [ ] unbalanced proofs for indexed multi-proofs in library (with tests)
- [ ] anything done in the JS lib
- [ ] some optimizations and more (or entirely) assembly wouldn't hurt
- [ ] security review
- [ ] test gas cost of view functions (i.e. index inferring, size proofs)
- [ ] try to squeeze in index inferring during normal multi-proof algorithm (to return old and new root, and indices)
- [X] ~~non-assembly logic optimizations (i.e. argument and variable order, reusing variables)~~
- [X] ~~implement index inferring for multi-proofs without sorted hashing~~
- [X] ~~an example using the library contract~~
- [X] ~~testing of the library contract~~
- [X] ~~Consolidate contracts and logic~~
<br>
<br>

## Tests ##

```console
foo@bar:~$ nvm use 14
Now using node v14.12.0 (npm v6.14.8)
foo@bar:~$ yarn install
...
Done in 0.16s.
foo@bar:~$ ganache-cli
...
foo@bar:~$ yarn compile-eth
foo@bar:~$ yarn migrate
foo@bar:~$ yarn test-eth
...
784 passing (11m)
```
