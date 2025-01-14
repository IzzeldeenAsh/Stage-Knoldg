export interface IForsightaProfile {
    id: number;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
    
    department?: Department;
    position?: Position;
    profile_photo_url: string | null;
    status: string;
    verified?:boolean
    countryId?:number;
    country?:any;
    country_id?:number;
    bio?:string;
    isic_code?:any;
    certifications?:any;
    industries?:any;
    consulting_field?:any;
    company?:Company;
    insighter_status?:string;
    client_status?:string;
    phone?:string;
    social?: SocialNetwork[];
  }
  
  export interface Department {
    id: number;
    code: string;
    isic_code_id: string;
    status: string;
    name: string;
    names: TranslatedNames;

  }
  
  export interface Position {
    id: number;
    name: string;
    names: TranslatedNames;
  }
  
  export interface TranslatedNames {
    en: string;
    ar: string;
  }
  
  export interface SocialNetwork {
    id: number;
    link: string;
    type: string;
  }

  export interface IClient {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
    profile_photo_url: string | null;
    country_id: number;
    country: string;
    status: string;
    verified: boolean;

  }
  
  export interface DataUserResponse {
    data: IClient;
  }
  // src/app/models/company.model.ts

export interface Company {
  id: number;
  legal_name?: string;
  website?: string | null;
  verified_email?: string | null;
  about_us: string;
  register_document: string; // URL as a string
  logo: string; // URL as a string
  status: string;
  address:string;
  primary_activate_at?:string;
  company_phone:string;
  verified:boolean;
  social?: SocialNetwork[];
}
