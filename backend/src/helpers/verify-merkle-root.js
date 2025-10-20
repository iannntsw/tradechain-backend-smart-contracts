const { ethers } = require("ethers");

/**
 * Collect all wrapped leaf strings (the "uuid:type:value" values) in DFS order.
 * We ignore the keys; only the values are used in merkle calculation.
 */
function collectWrappedLeaves(obj, out = []) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectWrappedLeaves(v, out));
  } else if (typeof obj === "object") {
    Object.values(obj).forEach((v) => collectWrappedLeaves(v, out));
  } else if (typeof obj === "string") {
    // Expect format "uuid:type:value"
    out.push(obj);
  }
  return out;
}

/** Hash one leaf string -> hex string (ethers style) */
function leafHash(leafStr) {
  // keccak256 of UTF-8 bytes of the "uuid:type:value" string
  return ethers.keccak256(ethers.toUtf8Bytes(leafStr)); // 0x...
}

/** Build a keccak256 Merkle root from leaf hashes, matching the generation logic exactly */
function merkleRootFromLeafHashes(leafHashes) {
  if (leafHashes.length === 0) {
    const empty = ethers.keccak256(ethers.toUtf8Bytes(""));
    return ethers.hexlify(empty).slice(2); // strip 0x
  }

  // Sort leaves lexicographically (same as generation)
  const sortedLeaves = [...leafHashes].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  
  let level = sortedLeaves.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i]; // duplicate last if odd
      const combined = ethers.concat([left, right]); // 32B + 32B
      const parent = ethers.keccak256(combined);
      next.push(parent);
    }
    level = next;
  }
  
  return ethers.hexlify(level[0]).slice(2); // strip 0x
}

/** Verify the wrapped doc's own signature.merkleRoot */
function verifyWrappedMerkle(wrapped) {
  if (!wrapped?.data || !wrapped?.signature?.merkleRoot) {
    return { ok: false, reason: "Missing data or signature.merkleRoot" };
  }
  const leaves = collectWrappedLeaves(wrapped.data);
  if (leaves.length === 0) {
    return { ok: false, reason: "No wrapped leaves found" };
  }

  const leafHashes = leaves.map(leafHash);           // hex with 0x
  const root = merkleRootFromLeafHashes(leafHashes); // hex without 0x
  console.log("Computed root:", root);
  console.log("Target root:", wrapped.signature.merkleRoot.toLowerCase());

  const matches = root === wrapped.signature.merkleRoot.toLowerCase();
  return {
    ok: matches,
    computedRoot: root,
    targetRoot: wrapped.signature.merkleRoot.toLowerCase(),
    reason: matches ? undefined : "Computed root does not match signature.merkleRoot",
  };
}



module.exports = {
  verifyWrappedMerkle,
};