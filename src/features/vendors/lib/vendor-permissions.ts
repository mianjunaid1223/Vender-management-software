interface VendorFeatures {
  profileManagement?: {
    read?: boolean;
    edit?: boolean;
    create?: boolean;
  };
  companyInformation?: {
    read?: boolean;
    edit?: boolean;
    create?: boolean;
  };
  vendorManagement?: {
    read?: boolean;
    edit?: boolean;
    create?: boolean;
  };
  invoiceManagement?: {
    read?: boolean;
    edit?: boolean;
    create?: boolean;
  };
  contractManagement?: {
    read?: boolean;
    edit?: boolean;
    create?: boolean;
  };
  communicationTools?: {
    read?: boolean;
    edit?: boolean;
    create?: boolean;
  };
  reportingAnalytics?: {
    read?: boolean;
    edit?: boolean;
    create?: boolean;
  };
  // Add other optional features as needed
  [key: string]: any;
}

/**
 * Maps vendor access features to a standardized permissions object
 * @param features - The features object from vendor portal access configuration
 * @returns Normalized permissions object with read/edit/create access levels for each feature
 */
export function mapVendorPermissions(features: VendorFeatures) {
  return {
    profile_management: {
      read: features?.profileManagement?.read || false,
      edit: features?.profileManagement?.edit || false,
      create: features?.profileManagement?.create || false
    },
    company_information: {
      read: features?.companyInformation?.read || false,
      edit: features?.companyInformation?.edit || false,
      create: features?.companyInformation?.create || false
    },
    vendor_management: {
      read: features?.vendorManagement?.read || false,
      edit: features?.vendorManagement?.edit || false,
      create: features?.vendorManagement?.create || false
    },
    contract_management: {
      read: features?.contractManagement?.read || false,
      edit: features?.contractManagement?.edit || false,
      create: features?.contractManagement?.create || false
    },
    invoice_management: {
      read: features?.invoiceManagement?.read || false,
      edit: features?.invoiceManagement?.edit || false,
      create: features?.invoiceManagement?.create || false
    },
    contact_management: {
      read: features?.contactManagement?.read || false,
      edit: features?.contactManagement?.edit || false,
      create: features?.contactManagement?.create || false
    },
    document_management: {
      read: features?.documentManagement?.read || false,
      edit: features?.documentManagement?.edit || false,
      create: features?.documentManagement?.create || false
    },
    reports: {
      read: features?.reports?.read || false,
      edit: features?.reports?.edit || false,
      create: features?.reports?.create || false
    }
  };
}