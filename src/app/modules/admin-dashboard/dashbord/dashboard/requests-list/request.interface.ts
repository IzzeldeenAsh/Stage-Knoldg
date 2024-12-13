export interface RequestResponse {
    data: RequestItem[];
    links: Links;
    meta: Meta;
  }
  
  export interface RequestItem {
    id: number;
    type: {
      key: string;
      label: string;
    };
    requestable_type: string;
    comments: string;
    staff_notes: string | null;
    handel_by: string | null;
    handel_at: string | null;
    requestable: Requestable;
  }
  
  export interface Requestable {
    id: number;
    legal_name: string;
    website: string | null;
    verified_email: string | null;
    about_us: string;
    register_document: string;
    logo: string;
    status: string;
    address: string;
    company_phone: string;
  }
  
  export interface Links {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  }
  
  export interface Meta {
    current_page: number;
    from: number;
    last_page: number;
    links: MetaLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  }
  
  export interface MetaLink {
    url: string | null;
    label: string;
    active: boolean;
  }
  