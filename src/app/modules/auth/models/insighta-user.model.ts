export class InsightaUserModel {
    id!: number; // User ID
    name!: string; // User's name
    email!: string; // User's email
    countryId?: number | null = null; // Country ID (nullable)
    country: string | null = null; // Country name (nullable)
    roles: string[] = []; // Array of roles (e.g., 'admin', 'staff')
    profile_photo_url?:string;
    status?:string;
    constructor(init?: Partial<InsightaUserModel>) {
      Object.assign(this, init);
    }
  }