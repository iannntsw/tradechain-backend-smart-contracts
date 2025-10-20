const { ethers } = require("ethers");
const { randomUUID } = require("crypto");

const isPlainObject = (v) =>
  v && typeof v === "object" && !Array.isArray(v);

const asTypeTag = (v) => {
  const t = typeof v;
  if (t === "string") return "string";
  if (t === "number") return Number.isInteger(v) ? "integer" : "number";
  if (t === "boolean") return "boolean";
  if (v === null) return "null";
  // Fallback: stringify the unknown primitive
  return "string";
};

const strip0x = (hex) => (hex.startsWith("0x") ? hex.slice(2) : hex);

// --- 1) Salt the document (uuid:type:value) for every primitive ---
function saltDocument(input) {
  // Deep clone & transform primitives
  const transform = (node) => {
    if (Array.isArray(node)) return node.map(transform);

    if (isPlainObject(node)) {
      const out = {};
      for (const k of Object.keys(node).sort()) {
        out[k] = transform(node[k]);
      }
      return out;
    }

    // Primitive: convert to "uuid:type:value"
    const tag = asTypeTag(node);
    const val = node === null ? "null" : String(node);
    const salt = randomUUID(); // 
    return `${salt}:${tag}:${val}`;
  };

  return transform(input);
}

// --- 2) Build Merkle leaves from ALL salted primitive strings (no paths) ---
function buildLeaves(saltedDoc) {
  const leaves = [];

  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (isPlainObject(node)) {
      for (const k of Object.keys(node)) visit(node[k]);
      return;
    }
    // Primitive (already salted as "uuid:type:value")
    const salted = String(node);
    const leafHash = ethers.keccak256(ethers.toUtf8Bytes(salted));
    leaves.push(leafHash);
  };

  visit(saltedDoc);
  leaves.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return leaves;
}

// --- 3) Compute Merkle root (keccak256 concat of sibling nodes) ---
function merkleRoot(input) {
  // If caller passed a doc, first salt & leaf it; if caller passed leaves, use directly
  const leaves = Array.isArray(input) ? input.slice() : buildLeaves(input);

  if (leaves.length === 0) {
    const empty = ethers.keccak256(ethers.toUtf8Bytes(""));
    return { root: strip0x(empty), leaves, layers: [[strip0x(empty)]] };
  }

  // Copy and compute layers
  const hex = (h) => strip0x(h);
  const layers = [leaves.map(hex)];

  let level = leaves.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i]; // duplicate last if odd
      const combined = ethers.concat([left, right]); // 32B + 32B
      const parent = ethers.keccak256(combined);
      next.push(parent);
    }
    layers.push(next.map(hex));
    level = next;
  }

  const root = hex(level[0]);
  return { root, leaves: layers[0], layers };
}

function wrapDocument(rawDoc) {
  const salted = saltDocument(rawDoc);
  const { root } = merkleRoot(salted);

  return {
    data: salted,
    signature: {
      type: "SHA3MerkleProof",
      targetHash: root,
      proof: [],           // can be populated if you generate selective proofs
      merkleRoot: root
    }
  };
}

module.exports = {
  saltDocument,
  buildLeaves,
  merkleRoot,
  wrapDocument,
};
