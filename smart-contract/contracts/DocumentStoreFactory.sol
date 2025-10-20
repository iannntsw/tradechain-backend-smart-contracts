// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {DocumentStore} from "./DocumentStore.sol";

interface IDocumentRegistry {
    function setInterop(
        address fromContract,
        address toContract,
        bool allowed
    ) external;
}

interface IDocumentStore {
    function ISSUER_ROLE() external view returns (bytes32);
    function REVOKER_ROLE() external view returns (bytes32);
    function SIGNER_ROLE() external view returns (bytes32);

    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
}

/**
 * @title DocumentStoreFactory
 * @notice Factory and governance helper for deploying and configuring DocumentStore instances.
 * @dev Each deployed store typically represents an organization/tenant. This factory:
 *      - Deploys new stores bound to a shared DocumentRegistry
 *      - Maps org identifiers to their store address
 *      - Provides role management helpers (issuer/revoker/signer)
 *      - Allows governed setup of inter-contract permissions via the Registry (allowCall matrix)
 *
 * Access control:
 * - DEFAULT_ADMIN_ROLE: full control over the factory (can set admins, pause factory features if you add Pausable, etc.)
 * - FACTORY_ADMIN_ROLE: allowed to create stores, assign roles, and configure registry interop
 */
contract DocumentStoreFactory is AccessControl {
    bytes32 public constant FACTORY_ADMIN_ROLE =
        keccak256("FACTORY_ADMIN_ROLE");

    /// @notice Shared registry used by all deployed stores (manages whitelists & interop rules)
    IDocumentRegistry public immutable registry;

    /// @notice Organization (bytes32) => deployed store address
    mapping(bytes32 => address) public organisationAddress;

    /// @notice Deployed store list (for discovery/analytics)
    address[] public allStores;

    /// @notice Reverse index (store => org)
    mapping(address => bytes32) public organisationStore;

    event StoreCreated(bytes32 indexed orgId, address indexed store, address indexed admin);
    event StoreRoleUpdated(address indexed store, bytes32 indexed role, address indexed account, bool granted);
    event InteropConfigured(address indexed fromContract, address indexed toContract, bool allowed);

    /**
     * @notice Initializes the factory with an admin and the shared DocumentRegistry.
     * @dev Grants DEFAULT_ADMIN_ROLE and FACTORY_ADMIN_ROLE to the provided admin.
     * @param admin The address that will manage the factory.
     * @param registry_ The DocumentRegistry address used by all new stores.
     */
    constructor(address admin, address registry_) {
        require(admin != address(0), "Admin cannot create their own document store factory");
        require(registry_ != address(0), "Registry cannot create their own document store factory");
        registry = IDocumentRegistry(registry_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FACTORY_ADMIN_ROLE, admin);
    }

    /**
     * @notice Deploys a new DocumentStore for a given organization identifier.
     * @dev Reverts if an org already has a store. The deployed store admin will receive
     *      DEFAULT_ADMIN_ROLE within that store (as set by the store's constructor).
     * @param organisationId A stable, unique identifier for the organization (e.g., keccak256(DID) or business ID).
     * @param storeAdmin The admin address for the new DocumentStore (will hold all roles initially).
     * @return store The address of the newly deployed DocumentStore.
     *
     * Emits a {StoreCreated} event.
     */
    function createStore(bytes32 organisationId, address storeAdmin)
        external
        onlyRole(FACTORY_ADMIN_ROLE)
        returns (address store)
    {
        require(organisationId != bytes32(0), "Invalid Organisation ID");
        require(storeAdmin != address(0), "Invalid Admin Address");
        // require(organisationAddress[organisationId] == address(0), "Document Store already exists");

        DocumentStore newStore = new DocumentStore(storeAdmin, address(registry));
        store = address(newStore);

        organisationAddress[organisationId] = store;
        organisationStore[store] = organisationId;
        allStores.push(store);

        emit StoreCreated(organisationId, store, storeAdmin);
    }

    /**
     * @notice Returns the number of stores deployed by this factory.
     * @return count The total number of stores.
     */
    function storesLength() external view returns (uint256 count) {
        return allStores.length;
    }

    /**
     * @notice Returns the store address at a given index.
     * @param index The index within the `allStores` array.
     * @return store The store address.
     */
    function storeAt(uint256 index) external view returns (address store) {
        require(index < allStores.length, "Store does not exist");
        return allStores[index];
    }

    /**
     * @notice Grants or revokes a role in a specific DocumentStore.
     * @dev Use this to delegate ISSUER/REVOKER/SIGNER roles to operational accounts.
     * @param store The DocumentStore instance.
     * @param role The role identifier (e.g., store.ISSUER_ROLE()).
     * @param account The account to grant/revoke the role.
     * @param grant True to grant, false to revoke.
     *
     * Emits a {StoreRoleUpdated} event.
     */
    function setStoreRole(address store, bytes32 role, address account, bool grant)
        external
        onlyRole(FACTORY_ADMIN_ROLE)
    {
        require(store != address(0), "store=0");
        require(account != address(0), "account=0");

        if (grant) {
            DocumentStore(store).grantRole(role, account);
        } else {
            DocumentStore(store).revokeRole(role, account);
        }
        emit StoreRoleUpdated(store, role, account, grant);
    }

    /**
     * @notice Convenience function to grant standard roles (ISSUER/REVOKER/SIGNER) in one call.
     * @dev Any address param can be zero to skip that particular grant.
     * @param store The target DocumentStore.
     * @param issuer Account to grant ISSUER_ROLE (or zero to skip).
     * @param revoker Account to grant REVOKER_ROLE (or zero to skip).
     * @param signer Account to grant SIGNER_ROLE (or zero to skip).
     *
     * Emits multiple {StoreRoleUpdated} events as applicable.
     */
    function grantStandardRoles(address store, address issuer, address revoker, address signer)
        external
        onlyRole(FACTORY_ADMIN_ROLE)
    {
        require(store != address(0), "store=0");

        bytes32 ISSUER = DocumentStore(store).ISSUER_ROLE();
        bytes32 REVOKER = DocumentStore(store).REVOKER_ROLE();
        bytes32 SIGNER = DocumentStore(store).SIGNER_ROLE();

        if (issuer != address(0)) {
            DocumentStore(store).grantRole(ISSUER, issuer);
            emit StoreRoleUpdated(store, ISSUER, issuer, true);
        }
        if (revoker != address(0)) {
            DocumentStore(store).grantRole(REVOKER, revoker);
            emit StoreRoleUpdated(store, REVOKER, revoker, true);
        }
        if (signer != address(0)) {
            DocumentStore(store).grantRole(SIGNER, signer);
            emit StoreRoleUpdated(store, SIGNER, signer, true);
        }
    }

    /**
     * @notice Configures inter-contract permissions in the Registry (allowCall matrix).
     * @dev Grants or revokes permission for `fromContract` to interact with `toContract`.
     *      This is the governance hook answering your access-control requirement across orgs.
     * @param fromContract The calling/consuming contract address.
     * @param toContract The providing/target contract address.
     * @param allowed True to allow calls, false to revoke permission.
     *
     * Emits an {InteropConfigured} event.
     */
    function setInterop(address fromContract, address toContract, bool allowed)
        external
        onlyRole(FACTORY_ADMIN_ROLE)
    {
        registry.setInterop(fromContract, toContract, allowed);
        emit InteropConfigured(fromContract, toContract, allowed);
    }

    /**
     * @notice Looks up the organization identifier for a given store.
     * @param store The store address to query.
     * @return orgId The organization identifier bound to this store.
     */
    function orgIdOf(address store) external view returns (bytes32 orgId) {
        return organisationStore[store];
    }
}
