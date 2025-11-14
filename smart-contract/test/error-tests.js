const { expect } = require("chai");
const { ethers } = require("hardhat");

const keccak = (s) => ethers.keccak256(ethers.toUtf8Bytes(s));

describe("DocumentStore — negative and edge cases", function () {
  async function deployAll() {
    const [admin, storeAdmin, issuer, signer, revoker, rando, cA, cB] =
      await ethers.getSigners();

    const adminAddr = await admin.getAddress();
    const storeAdminAddr = await storeAdmin.getAddress();
    const issuerAddr = await issuer.getAddress();
    const signerAddr = await signer.getAddress();
    const revokerAddr = await revoker.getAddress();
    const cAAddr = await cA.getAddress();
    const cBAddr = await cB.getAddress();

    // Registry
    const Registry = await ethers.getContractFactory("DocumentRegistry");
    const registry = await Registry.deploy(adminAddr);
    await registry.waitForDeployment();
    const registryAddr = await registry.getAddress();

    // Factory
    const Factory = await ethers.getContractFactory("DocumentStoreFactory");
    const factory = await Factory.deploy(adminAddr, registryAddr);
    await factory.waitForDeployment();

    // Create one org store
    const ORG_ID = keccak("ORG:NEGATIVE");
    await (
      await factory.connect(admin).createStore(ORG_ID, storeAdminAddr)
    ).wait();
    const storeAddr = await factory.organisationAddress(ORG_ID);
    const store = await ethers.getContractAt("DocumentStore", storeAddr);

    // Roles
    const ISSUER_ROLE = await store.ISSUER_ROLE();
    const SIGNER_ROLE = await store.SIGNER_ROLE();
    const REVOKER_ROLE = await store.REVOKER_ROLE();

    await (
      await store.connect(storeAdmin).grantRole(ISSUER_ROLE, issuerAddr)
    ).wait();
    await (
      await store.connect(storeAdmin).grantRole(SIGNER_ROLE, signerAddr)
    ).wait();
    await (
      await store.connect(storeAdmin).grantRole(REVOKER_ROLE, revokerAddr)
    ).wait();

    // Optional plumbing (adjust if required by your logic)
    await (
      await registry.connect(admin).setInterop(cAAddr, cBAddr, true)
    ).wait();

    return {
      accounts: { admin, storeAdmin, issuer, signer, revoker, rando },
      addresses: {
        adminAddr,
        storeAdminAddr,
        issuerAddr,
        signerAddr,
        revokerAddr,
      },
      registry,
      factory,
      store,
    };
  }

  it("ISSUE: non-issuer cannot issue", async function () {
    const { store, accounts } = await deployAll();
    const docId = keccak("INV-NEG-1");
    const docHash = keccak("HASH-1");
    const docType = ethers.encodeBytes32String("INVOICE");

    await expect(store.connect(accounts.rando).issue(docId, docHash, docType))
      .to.be.reverted;
  });

  it("ISSUE: cannot issue the same document twice", async function () {
    const { store, accounts } = await deployAll();
    const docId = keccak("INV-NEG-2");
    const docHash = keccak("HASH-2");
    const docType = ethers.encodeBytes32String("INVOICE");

    await (
      await store.connect(accounts.issuer).issue(docId, docHash, docType)
    ).wait();

    await expect(store.connect(accounts.issuer).issue(docId, docHash, docType))
      .to.be.reverted; // duplicate
  });

  it("SIGN: signer must have SIGNER_ROLE on the store", async function () {
    const { store, registry, accounts, addresses } = await deployAll();
    const { issuer, rando } = accounts;

    const docId = keccak("INV-NEG-3");
    const docHash = keccak("HASH-3");
    const docType = ethers.encodeBytes32String("INVOICE");

    await (await store.connect(issuer).issue(docId, docHash, docType)).wait();
    await (
      await registry
        .connect(accounts.admin)
        .setSignerForDocument(docId, addresses.signerAddr, true)
    ).wait();

    // rando does not have SIGNER_ROLE
    await expect(store.connect(rando).sign(docId)).to.be.reverted;
  });

  it("SIGN: signer must be whitelisted FOR THIS DOCUMENT in registry", async function () {
    const { store, accounts } = await deployAll();
    const { issuer, signer } = accounts;

    const docId = keccak("INV-NEG-4");
    const docHash = keccak("HASH-4");
    const docType = ethers.encodeBytes32String("INVOICE");

    await (await store.connect(issuer).issue(docId, docHash, docType)).wait();

    // signer has SIGNER_ROLE (from setup) but NOT setSignerForDocument in registry → should revert
    await expect(store.connect(signer).sign(docId)).to.be.reverted;
  });

  it("SIGN: cannot sign a non-issued document", async function () {
    const { store, registry, accounts, addresses } = await deployAll();
    await (
      await registry
        .connect(accounts.admin)
        .setSignerForDocument(keccak("INV-NEG-5"), addresses.signerAddr, true)
    ).wait();

    await expect(store.connect(accounts.signer).sign(keccak("INV-NEG-5"))).to.be
      .reverted;
  });

  it("SIGN: cannot sign twice by the same signer (if contract forbids)", async function () {
    const { store, registry, accounts, addresses } = await deployAll();
    const { issuer, signer } = accounts;

    const docId = keccak("INV-NEG-6");
    const docHash = keccak("HASH-6");
    const docType = ethers.encodeBytes32String("INVOICE");

    await (await store.connect(issuer).issue(docId, docHash, docType)).wait();
    await (
      await registry
        .connect(accounts.admin)
        .setSignerForDocument(docId, addresses.signerAddr, true)
    ).wait();

    await (await store.connect(signer).sign(docId)).wait();
    await expect(store.connect(signer).sign(docId)).to.be.reverted; // or assert idempotency behavior if allowed
  });

  it("REVOKE: only allowed revoker/issuer can revoke", async function () {
    const { store, accounts } = await deployAll();
    const { issuer, rando } = accounts;

    const docId = keccak("INV-NEG-7");
    const docHash = keccak("HASH-7");
    const docType = ethers.encodeBytes32String("INVOICE");

    await (await store.connect(issuer).issue(docId, docHash, docType)).wait();

    await expect(store.connect(rando).revoke(docId, 0)).to.be.reverted;
  });

  it("REVOKE: cannot revoke non-issued doc", async function () {
    const { store, accounts } = await deployAll();
    await expect(store.connect(accounts.revoker).revoke(keccak("INV-NEG-9"), 0))
      .to.be.reverted;
  });

  it("FACTORY: non-admin cannot create store", async function () {
    const { factory, accounts } = await deployAll();
    const ORG_ID = keccak("ORG:SHOULD-FAIL");

    await expect(
      factory
        .connect(accounts.rando)
        .createStore(
          ORG_ID,
          (await accounts.storeAdmin.getAddress?.()) ??
            accounts.storeAdmin.address
        )
    ).to.be.reverted;
  });

  it("REGISTRY: removing signer-for-document prevents signing", async function () {
    const { store, registry, accounts, addresses } = await deployAll();
    const { issuer, signer } = accounts;

    const docId = keccak("INV-NEG-10");
    const docHash = keccak("HASH-10");
    const docType = ethers.encodeBytes32String("INVOICE");

    await (await store.connect(issuer).issue(docId, docHash, docType)).wait();

    await (
      await registry
        .connect(accounts.admin)
        .setSignerForDocument(docId, addresses.signerAddr, true)
    ).wait();
    await (
      await registry
        .connect(accounts.admin)
        .setSignerForDocument(docId, addresses.signerAddr, false)
    ).wait();

    await expect(store.connect(signer).sign(docId)).to.be.reverted;
  });
});
