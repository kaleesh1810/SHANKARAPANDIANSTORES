import { useAuth } from '../context/AuthContext';

/**
 * Hook to check permissions for a specific form code
 * @param {string} formCode - The form code to check permissions for (e.g., "FRMLGRP")
 * @returns {object} Permission object with shape: { canCreate: boolean, canEdit: boolean, canDelete: boolean, print: boolean }
 */
export const useFormPermissions = (formCode) => {
  const { userData, permissions } = useAuth();

  // Admin users have all permissions by default
  if (userData?.role === 'Admin') {
    return {
      permission: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      print: true,
      hasAnyPermission: () => true,
    };
  }

  // Find permission for this form code in the permissions array
  const formPermission = permissions && Array.isArray(permissions) 
    ? permissions.find(perm => perm.formPermission === formCode || perm.fForm === formCode)
    : null;

  // Return permission object with all action permissions
  // Note: permissions are stored with boolean values (add, edit, delete, print) or string values (fAdd, fMod, fDel, fPrint)
  const hasAdd = formPermission?.add === true || formPermission?.fAdd === 'Y' || formPermission?.addPermission === 'Y' || false;
  const hasEdit = formPermission?.edit === true || formPermission?.fMod === 'Y' || formPermission?.editPermission === 'Y' || false;
  const hasDelete = formPermission?.delete === true || formPermission?.fDel === 'Y' || formPermission?.deletePermission === 'Y' || false;
  const hasPrint = formPermission?.print === true || formPermission?.fPrint === 'Y' || formPermission?.printPermission === 'Y' || false;
  
  return {
    permission: formPermission?.fPermission === 'Y' || false,
    canCreate: hasAdd,
    canEdit: hasEdit,
    canDelete: hasDelete,
    print: hasPrint,
    // Legacy property names for backward compatibility
    add: hasAdd,
    edit: hasEdit,
    delete: hasDelete,
    // Helper function to check if any action is allowed
    hasAnyPermission: () => {
      if (!formPermission) return false;
      return formPermission.fPermission === 'Y' || hasAdd || hasEdit || hasDelete || hasPrint;
    }
  };
};
