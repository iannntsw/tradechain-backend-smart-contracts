const { expect } = require("chai");
const { ethers } = require("hardhat");

const keccak = (s) => ethers.keccak256(ethers.toUtf8Bytes(s));

describe("DocumentStore (new ABI) — issue → whitelist → sign → revoke", function () {
  it("deploys, creates a store, issues, whitelists signer for the doc, signs, and revokes", async function () {
    // ---------- Signers ----------
    const [admin, storeAdmin, issuer, signer, revoker, cA, cB] =
      await ethers.getSigners();
    const adminAddr = await admin.getAddress();
    const storeAdminAddr = await storeAdmin.getAddress();
    const issuerAddr = await issuer.getAddress();
    const signerAddr = await signer.getAddress();
    const revokerAddr = await revoker.getAddress();
    const cAAddr = await cA.getAddress();
    const cBAddr = await cB.getAddress();

    // ---------- Deploy Registry ----------
    const Registry = await ethers.getContractFactory("DocumentRegistry");
    const registry = await Registry.deploy(adminAddr);
    await registry.waitForDeployment();
    const registryAddr = await registry.getAddress();

    // Optional setup (kept for parity; not enforced by current store.issue):
    const documentType = ethers.encodeBytes32String("INVOICE");
    await expect(registry.connect(admin).setRequiredSignerCount(documentType, 1))
      .to.emit(registry, "RequiredSignerCountSet")
      .withArgs(documentType, 1);

    // Interop is optional;
    await expect(registry.connect(admin).setInterop(cAAddr, cBAddr, true))
      .to.emit(registry, "InteropAllowed")
      .withArgs(cAAddr, cBAddr, true);

    // Deploy Factory
    const Factory = await ethers.getContractFactory("DocumentStoreFactory");
    const factory = await Factory.deploy(adminAddr, registryAddr);
    await factory.waitForDeployment();

    // Create a Document Store
    const ORG_ID = keccak("ORG:MAERSK");
    await (await factory.connect(admin).createStore(ORG_ID, storeAdminAddr)).wait();
    const storeAddr = await factory.organisationAddress(ORG_ID);
    expect(ethers.isAddress(storeAddr)).to.equal(true);

    const store = await ethers.getContractAt("DocumentStore", storeAddr);

    // Grant Roles for the Document Store
    const ISSUER_ROLE  = await store.ISSUER_ROLE();
    const SIGNER_ROLE  = await store.SIGNER_ROLE();
    const REVOKER_ROLE = await store.REVOKER_ROLE();

    await (await store.connect(storeAdmin).grantRole(ISSUER_ROLE, issuerAddr)).wait();
    await (await store.connect(storeAdmin).grantRole(SIGNER_ROLE, signerAddr)).wait();
    await (await store.connect(storeAdmin).grantRole(REVOKER_ROLE, revokerAddr)).wait();

    // ---------- Issue → whitelist signer-for-document → sign → revoke ----------
    const docId        = keccak("INV-123#1"); // your document identifier (bytes32)
    const docHash      = keccak('MERKLE-ROOT:0xabc... or any stable hash of canonical JSON');

    // Issue a Document: issue(bytes32 documentId, bytes32 documentHash, bytes32 documentType)
    await expect(
      store.connect(issuer).issue(docId, docHash, documentType)
    ).to.emit(store, "DocumentIssued")
     .withArgs(docId, documentType, issuerAddr, docHash);

    // Confirm issued
    expect(await store.isIssued(docId)).to.equal(true);

    // Whitelist signer FOR THIS DOCUMENT (required by sign)
    await expect(
      registry.connect(admin).setSignerForDocument(docId, signerAddr, true)
    ).to.emit(registry, "DocumentSignerWhiteListed")
     .withArgs(docId, signerAddr, true);

    // Check if the registry allows the signer for the document
    expect(await registry.allowedSignerForDocument(docId, signerAddr)).to.equal(true);

    // Sign (must be called by the signer and signer must have SIGNER_ROLE on store)
    await expect(store.connect(signer).sign(docId))
      .to.emit(store, "DocumentSigned")
      .withArgs(docId, signerAddr);

    // isIssued should still be true (signing does not clear 'Issued' state)
    expect(await store.isIssued(docId)).to.equal(true);

    // signedAt(docId, signer) > 0
    const signedAt = await store.signedAt(docId, signerAddr);
    expect(signedAt).to.be.gt(0);

    // isSigned depends on msg.sender in the current contract:
    // call from signer => true
    expect(await store.connect(signer).isSigned(docId)).to.equal(true);
    // call from someone else => probably false (since their signedAt is 0)
    expect(await store.connect(issuer).isSigned(docId)).to.equal(false);

    // Revoke
    await expect(store.connect(revoker).revoke(docId, 0))
      .to.emit(store, "DocumentRevoked")
      .withArgs(docId, revokerAddr, 0);

    // After revoke, isIssued should be false
    expect(await store.isIssued(docId)).to.equal(false);
  });
});
