// src/app/pages/wizards/create-account.helper.ts

export interface ICreateAccount {
  accountType: 'personal' | 'corporate';
  phoneNumber: number | null;
  consultingFields: number[]; // Array of IDs
  isicCodes:any; // Array of IDs
  phoneCountryCode:any;

  // Personal account fields
  bio?: string;

  // Corporate account fields
  legalName?: string;
  website?: string;
  registerDocument?: File | null;
  aboutCompany?: string;

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
  legalName: '',
  website: '',
  registerDocument: null,
  aboutCompany: '',
  certifications: [],
};
