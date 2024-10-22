export interface User {
    id: number;
    name: string;
    email: string;
    countryId: number | null;
    country: string | null;
    roles: string[];
    token: string;
  }