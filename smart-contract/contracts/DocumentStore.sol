// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IDocumentRegistry {
    function allowedIssuer(bytes32, address) external view returns (bool);
    function allowedSigner(bytes32, address) external view returns (bool);
    function allowedSignerForDocument(
        bytes32,
        address
    ) external view returns (bool);
    function requiredSignerCount(bytes32) external view returns (uint8);
}

/**
 * @notice Smart contract for issuing, signing, and revoking trade documents.
 * @dev Each instance may represent a company or organization.
 *      The contract integrates with a central DocumentRegistry for access control,
 *      whitelisting, and signer threshold configuration.
 */
contract DocumentStore is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    enum State {
        None,
        Issued,
        Signed,
        Revoked
    }
    enum RevokeReason {
        USER_REQUEST,
        FRAUD,
        REISSUED,
        OTHER
    }

    struct DocumentMeta {
        bytes32 documentHash; // Hash of the JSON/PDF document;
        bytes32 documentType; // Type of Document (Sales Quotation, Purchase Order, Invoice);
        address issuer; // Address that issued the document
        uint64 issuedAt; // Timestamp of issuance
        uint64 revokedAt; // Timestamp of revocation, 0 if not revoked
        State state; // Lifecycle state
    }

    IDocumentRegistry public registry;

    mapping(bytes32 => DocumentMeta) public meta;
    mapping(bytes32 => mapping(address => uint64)) public signedAt;

    event DocumentIssued(
        bytes32 indexed documentId,
        bytes32 indexed documentType,
        address issuer,
        bytes32 documentHash
    );

    event DocumentSigned(bytes32 indexed documentId, address indexed signer);
    event DocumentRevoked(
        bytes32 indexed documentId,
        address indexed revoker,
        RevokeReason reason
    );

    constructor(address admin, address registry_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(REVOKER_ROLE, admin);
        _grantRole(SIGNER_ROLE, admin);
        registry = IDocumentRegistry(registry_);
    }

    /**
     * @notice Issues a new document on-chain by recording its metadata and hash.
     * @dev Requires the caller to hold the ISSUER_ROLE and be whitelisted in the registry.
     * @param documentId The unique identifier (hash) representing the issued document.
     * @param documentHash The keccak256 hash of the off-chain document (e.g., JSON/PDF).
     * @param documentType The category of the document (e.g., "INVOICE", "PO").
     *
     * Emits a {DocumentIssued} event.
     */
    function issue(
        bytes32 documentId,
        bytes32 documentHash,
        bytes32 documentType
    ) external onlyRole(ISSUER_ROLE) {
        require(
            meta[documentId].state == State.None,
            "Document Already Exists"
        );

        meta[documentId] = DocumentMeta({
            documentHash: documentHash,
            documentType: documentType,
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0,
            state: State.Issued
        });

        emit DocumentIssued(
            documentId,
            documentType,
            msg.sender,
            documentHash
        );
    }

    /**
     * @notice Signs a previously issued document to attest its validity or approval.
     * @dev Requires SIGNER_ROLE and that the signer is whitelisted for the given document type.
     *      Can only be executed once per signer for each document.
     * @param documentId The document ID to be signed.
     *
     * Emits a {DocumentSigned} event.
     */
    function sign(bytes32 documentId) external onlyRole(SIGNER_ROLE) {
        DocumentMeta storage docMeta = meta[documentId];
        require(
            docMeta.state == State.Issued || docMeta.state == State.Signed,
            "Document not signable"
        );

        bool allowed = registry.allowedSignerForDocument(
            documentId,
            msg.sender
        );

        require(allowed, "Signer not allowed");
        require(
            signedAt[documentId][msg.sender] == 0,
            "Document already signed"
        );

        signedAt[documentId][msg.sender] = uint64(block.timestamp);
        if (docMeta.state == State.None || docMeta.state == State.Revoked) {
            revert("Document not signable");
        }

        emit DocumentSigned(documentId, msg.sender);
    }

    /**
     * @notice Revokes a document, marking it as invalid.
     * @dev Requires REVOKER_ROLE and the document must currently be Issued or Signed.
     * @param documentId The unique identifier of the document to revoke.
     * @param reason The reason for revocation (USER_REQUEST, FRAUD, etc.).
     *
     * Emits a {DocumentRevoked} event.
     */
    function revoke(
        bytes32 documentId,
        RevokeReason reason
    ) external onlyRole(REVOKER_ROLE) {
        DocumentMeta storage docMeta = meta[documentId];
        require(
            docMeta.state == State.Issued || docMeta.state == State.Signed,
            "Document not revocable"
        );
        docMeta.state = State.Revoked;
        docMeta.revokedAt = uint64(block.timestamp);
        emit DocumentRevoked(documentId, msg.sender, reason);
    }

    /**
     * @notice Checks if a document is currently Issued
     * @param documentId The document identifier to verify.
     * @return bool True if the document is valid, false if Revoked or nonexistent.
     */
    function isIssued(bytes32 documentId) external view returns (bool) {
        return meta[documentId].state == State.Issued;
    }

    /**
     * @notice Checks if a document is currently Signed.
     * @param documentId The document identifier to verify.
     * @return bool True if the document is Signed, false if not signed or nonexistent.
     */
    function isSigned(bytes32 documentId) external view returns (bool) {
        return signedAt[documentId][msg.sender] > 0;
    }
}   
