// src/app/pages/wizards/create-account.helper.ts

export interface ICreateAccount {
  accountType: 'personal' | 'corporate';
  phoneNumber?: number | null;
  consultingFields: number[]; // Array of IDs
  isicCodes:any; // Array of IDs
  phoneCountryCode?:any;
  companyAddress?:string;
  // Personal account fields
  bio?: string;

  phoneCompanyNumber?:string;

  // Corporate account fields
  legalName?: string;
  logo:File | null;
  website?: string;
  registerDocument?: File | null;
  aboutCompany?: string;  
  verificationMethod: 'websiteEmail' | 'uploadDocument';
  companyEmail?: string;
  code?: string;
  // Step 3: Documents
  certifications?: { type: string; file: File }[];
}

export const inits: ICreateAccount = {
  accountType: 'personal',
  phoneCountryCode:  { text: '🇺🇸 +1   United States', code: '+1', country: 'US' },
  phoneNumber: null,
  consultingFields: [],
  isicCodes: [],
  bio: '',
  phoneCompanyNumber:'',
  legalName: '',
  companyAddress:'',
  website: '',
  registerDocument: null,
  logo: null,
  aboutCompany: '',
  certifications: [],
  verificationMethod: 'websiteEmail',
  companyEmail: '',
  code: ''
};
