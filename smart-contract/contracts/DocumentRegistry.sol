// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract DocumentRegistry is AccessControl {
    bytes32 public constant REGISTRY_ADMIN_ROLE =
        keccak256("REGISTRY_ADMIN_ROLE");

    // Mapping of Document Type to Account to Allowed
    mapping(bytes32 => mapping(address => bool)) public allowedIssuer;
    mapping(bytes32 => mapping(address => bool)) public allowedSigner;

    // Mapping of Document ID to signer address to allowed
    mapping(bytes32 => mapping(address => bool))
        public allowedSignerForDocument;

    // Inter-contract permission table
    // An on-chain "allow-list" that controls which smart contracts are allowed
    // to call or verify data from another smart contract
    mapping(address => mapping(address => bool)) public allowCall;

    // Optional mapping for the number of signers per document type
    mapping(bytes32 => uint8) public requiredSignerCount;

    event IssuerWhiteListed(
        bytes32 indexed documentType,
        address indexed issuer,
        bool active
    );
    event SignerWhiteListed(
        bytes32 indexed documentType,
        address indexed signer,
        bool active
    );
    event DocumentSignerWhiteListed(
        bytes32 indexed documentId,
        address indexed signer,
        bool active
    );

    event InteropAllowed(
        address indexed fromContract,
        address indexed toContract,
        bool allowed
    );
    event RequiredSignerCountSet(bytes32 indexed documentType, uint8 count);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
    }

    /**
     * @notice Adds or removes an address from the issuer whitelist for a given document type.
     * @dev Only callable by accounts with the REGISTRY_ADMIN_ROLE.
     * @param documentType The unique identifier (bytes32) representing a document category (e.g. "INVOICE", "BL").
     * @param issuer The address of the entity (organization or contract) to whitelist or remove.
     * @param active True to enable (whitelist), false to disable (remove).
     *
     * Emits an {IssuerWhitelisted} event.
     */
    function setIssuer(
        bytes32 documentType,
        address issuer,
        bool active
    ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        allowedIssuer[documentType][issuer] = active;
        emit IssuerWhiteListed(documentType, issuer, active);
    }

    /**
     * @notice Adds or removes an address from the signer whitelist for a given document type.
     * @dev Only callable by accounts with the REGISTRY_ADMIN_ROLE.
     * @param documentType The unique identifier (bytes32) representing a document category.
     * @param signer The address of the authorized signer (e.g. customs, bank, inspector).
     * @param active True to enable, false to disable.
     *
     * Emits a {SignerWhitelisted} event.
     */
    function setSigner(
        bytes32 documentType,
        address signer,
        bool active
    ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        allowedSigner[documentType][signer] = active;
        emit SignerWhiteListed(documentType, signer, active);
    }

    /**
     * @notice Adds or removes an address from the signer whitelist for a given document.
     * @dev Only callable by accounts with the REGISTRY_ADMIN_ROLE.
     * @param documentId The unique identifier (bytes32) representing a document.
     * @param signer The address of the authorized signer (e.g. customs, bank, inspector).
     * @param active True to enable, false to disable.
     *
     * Emits a {DocumentSignerWhiteListed} event.
     */
    function setSignerForDocument(bytes32 documentId, address signer, bool active)
        external onlyRole(REGISTRY_ADMIN_ROLE)
    {
        allowedSignerForDocument[documentId][signer] = active;
        emit DocumentSignerWhiteListed(documentId, signer, active);
    }

    /**
     * @notice Grants or revokes permission for one contract to interact with another.
     * @dev Used for inter-contract access control (e.g., Customs contract reading Shipping contract data).
     *      Only callable by accounts with the REGISTRY_ADMIN_ROLE.
     * @param fromContract The calling contract address.
     * @param toContract The target contract address whose data/functions may be accessed.
     * @param allowed True to permit calls, false to revoke.
     *
     * Emits an {InteropAllowed} event.
     */
    function setInterop(
        address fromContract,
        address toContract,
        bool allowed
    ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        allowCall[fromContract][toContract] = allowed;
        emit InteropAllowed(fromContract, toContract, allowed);
    }

    /**
     * @notice Defines how many signatures are required to consider a document fully valid.
     * @dev The rule applies per document type (e.g., "COO" may require 2 signers, "INVOICE" only 1).
     *      Only callable by accounts with the REGISTRY_ADMIN_ROLE.
     * @param documentType The document category identifier.
     * @param count The required number of signer attestations.
     *
     * Emits a {RequiredSignerCountSet} event.
     */
    function setRequiredSignerCount(
        bytes32 documentType,
        uint8 count
    ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        requiredSignerCount[documentType] = count;
        emit RequiredSignerCountSet(documentType, count);
    }
}
