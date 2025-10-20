// scripts/deploy.js
const { ethers, network, run } = require("hardhat");

const toBytes32 = (s) => ethers.keccak256(ethers.toUtf8Bytes(s));

async function main() {
  const [adminSigner, storeAdminSigner] = await ethers.getSigners();
  const admin = await adminSigner.getAddress();
  const storeAdmin = await storeAdminSigner.getAddress();

  const orgString = "ORG:MAERSK";
  const orgId = toBytes32(orgString);
  const createOrgStore = true;


  // Deploy Registry
  const Registry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await Registry.deploy(admin);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("DocumentRegistry deployed at:", registryAddr);

  // Deploy Factory
  const Factory = await ethers.getContractFactory("DocumentStoreFactory");
  const factory = await Factory.deploy(admin, registryAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("DocumentStoreFactory deployed at:", factoryAddr);

  // Create first store
  if (createOrgStore) {
    const tx = await factory.createStore(orgId, storeAdmin);
    const rc = await tx.wait();
    console.log("createStore tx deployed at:", rc.hash);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
