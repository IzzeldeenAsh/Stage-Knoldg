// src/app/pages/wizards/create-account.helper.ts

export interface ICreateAccount {
  accountType: 'personal' | 'corporate';
  phone: string;
  consultingFields: number[]; // Array of IDs
  isicCodes: number[]; // Array of IDs

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
  phone: '',
  consultingFields: [],
  isicCodes: [],
  bio: '',
  legalName: '',
  website: '',
  registerDocument: null,
  aboutCompany: '',
  certifications: [],
};
