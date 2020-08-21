# merkle-trees-eth (A set of smart contracts and libraries compatible with `merkle-trees-js`)

## The Goal ##

A Merkle Tree library that enabled compact multi-proofs to update and append elements to roots of unbalanced trees. Can greatly reduce gas costs of storing lists, when compared to simple storage, especially when appending.
Ideally, this structure and library can be used to roll up and entire object, into one root, using recursive compact proofs to use its children, and add to it.


## Status ##

While the merkle-storage contract is a working and tested example, the merkle-storage library needs to be tested, and could be optimized further.


## Various TODOs (mostly dependent on `merkle-trees-js`) ##

* Support indexed multi-proofs
* Support index-less single-proofs
* Support deleting elements
* recursive proofs (arrays of arrays)
* recursive proofs (objects of objects)
* some optimizations and more assembly wouldn't hurt
* benchmark break-evens


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
29 passing (42s)
```
