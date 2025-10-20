require("@nomicfoundation/hardhat-toolbox");
require("hardhat-ethernal");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  localhost: {
    url: "http://127.0.0.1:8545"
  },
  ethernal: {
    disableSync: false,
    uploadAst: true,
  }
};
