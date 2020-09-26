# merkle-trees-eth (A set of smart contracts and libraries compatible with `merkle-trees/js`)

## The Goal ##

A Merkle Tree library that enabled compact multi-proofs to update and append elements to roots of unbalanced trees. Can greatly reduce gas costs of storing lists, when compared to simple storage, especially when appending.
Effectively, this reduces SLOADs and SSTOREs to once per contract call, regardless of the operation (read, update, insert), and the cost of more calldata (elements and proof) and significantly more on-chain logic.
Ideally, this structure and library can be used to roll up and entire object, into one root, using recursive compact proofs to use its children, and add to it.


## Status ##

Merkle-storage library works and is tested, with an example, but could be optimized further.


## Notes ##

- Merkle trees with pairs that are sorted at hash-time result in cheaper and smaller proofs, at the cost of not being able to prove an element's index.
- More work can still be done to make these contracts more readable


## Various TODOs (mostly dependent on `merkle-trees/js`) ##

- [ ] Anything done in the JS lib
- [ ] some optimizations and more assembly wouldn't hurt
- [ ] security review
- [ ] non-assembly logic optimizations (i.e. argument and variable order, reusing variables)
- [ ] test gas cost of view functions (i.e. index inferring, size proofs)
- [ ] try to squeeze in index inferring during normal multi-proof algorithm (to return old and new root, and indices)
- [X] ~~implement index inferring for multi-proofs without sorted hashing~~
- [X] ~~an example using the library contract~~
- [X] ~~testing of the library contract~~


## Tests ##

```console
foo@bar:~$ nvm use 14.8.0
Now using node v14.8.0 (npm v6.14.7)
foo@bar:~$ yarn install
...
Done in 0.16s.
foo@bar:~$ ganache-cli
...
foo@bar:~$ yarn test
...
142 passing (1m)
```
