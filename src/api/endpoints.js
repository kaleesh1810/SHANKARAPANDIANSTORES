// src/api/endpoints.js
export const API_ENDPOINTS = {
  LEDGER_CREATION_ENDPOINTS: {
    getTree: "LedgerGroupCreation/LedgerGroupCreationGet",
    getDropdown: "LedgerCreation/GetledgerCreationdropdowslist",
    getDropdownPaged: (page = 1, pageSize = 20, searchText = '') =>
      `LedgerCreation/GetledgerCreationdropdowslist/${page}/${pageSize}?searchText=${encodeURIComponent(searchText)}`,
    postCreate: "LedgerCreation/LedgerCreationPost",
    putEdit: "LedgerCreation/ledgerCreationPut",
    delete: (fCode) => `LedgerCreation/LedgerCreationDelete/${fCode}`,
  },

  ITEM_CREATION_ENDPOINTS: {
    getTree: "ItemGroupCreation/ItemGroupCreationGet",
    getDropdown: "ItemCreation/GetItemCreationdropdowslist",
    getMaxPrefix: "ItemCreation/GetMaxPrefix",
    postCreate: "ItemCreation/ItemCreationPost",
    putEdit: "ItemCreation/ItemCreationUpdate",
    delete: (fCode) => `ItemCreation/ItemCreationDelete/${fCode}`,
  },

  LEDGER_GROUP_CREATION_ENDPOINTS: {
    getTree: "LedgerGroupCreation/LedgerGroupCreationGet",
    getDropdown: "LedgerGroupCreation/ledgergroupCreationDropdownlist",
    postCreate: "LedgerGroupCreation/LedgerGroupCreationPost",
    putEdit: "LedgerGroupCreation/ledgerGroupCreationPut",
    delete: (fCode) => `LedgerGroupCreation/ledgerGroupCreationDelete/${fCode}`,
  },

  ITEM_GROUP: {
    getTree: "ItemGroupCreation/ItemGroupCreationGet",
    getDropdown: "ItemGroupCreation/ItemgroupCreationDropdownlist",
    postCreate: "ItemGroupCreation/ItemGroupCreationPost",
    putEdit: "ItemGroupCreation/ItemGroupCreationPut",
    delete: (fCode) => `ItemGroupCreation/ItemGroupCreationDelete/${fCode}`,
  },

    ADMINISTRATION: {
    USER_LIST: "Administartor/UserNameList",
    ADMIN_BATCH_INSERT: "Administartor/adminstration/InsertBatch",
    GET_PERMISSIONS_BY_USER: "Administartor/GetPermissionsByUserCode",
    DELETE_PERMISSIONS: "Administartor/administration/delete"
  }
    

};

// Named convenience export for older imports that expect ADMINISTRATION directly
export const ADMINISTRATION = API_ENDPOINTS.ADMINISTRATION;