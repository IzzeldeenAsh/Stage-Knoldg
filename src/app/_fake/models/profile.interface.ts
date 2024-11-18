export interface IForsightaProfile {
    id: number;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
    department: Department;
    position: Position;
    profile_photo_url: string | null;
    status: string;
    verified?:boolean
    countryId?:number;
    country?:any;
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
  