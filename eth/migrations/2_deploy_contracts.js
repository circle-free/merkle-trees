const MS_ICBSH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Sorted_Hash');
const MS_ICBS = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Standard');
const MS_ICB32SH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Sorted_Hash');
const MS_ICB32S = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Standard');
const MS_IMBSH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Sorted_Hash');
const MS_IMBS = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Standard');
const MS_IMB32SH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Sorted_Hash');
const MS_IMB32S = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Standard');

module.exports = function(deployer) {
  deployer.deploy(MS_ICBSH)
    .then(() => MS_ICBSH.deployed())
    .then(() => deployer.deploy(MS_ICBS))
    .then(() => MS_ICBS.deployed())
    .then(() => deployer.deploy(MS_ICB32SH))
    .then(() => MS_ICB32SH.deployed())
    .then(() => deployer.deploy(MS_ICB32S))
    .then(() => MS_ICB32S.deployed())
    .then(() => deployer.deploy(MS_IMBSH))
    .then(() => MS_IMBSH.deployed())
    .then(() => deployer.deploy(MS_IMBS))
    .then(() => MS_IMBS.deployed())
    .then(() => deployer.deploy(MS_IMB32SH))
    .then(() => MS_IMB32SH.deployed())
    .then(() => deployer.deploy(MS_IMB32S))
    .then(() => MS_IMB32S.deployed());
};
