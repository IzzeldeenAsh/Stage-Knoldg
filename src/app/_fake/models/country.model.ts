export interface Country {
    id: number;
    country_code: number;
    name: {
      en: string;
      fr: string;
      ar: string;
    };
  }

  export interface ICountry {
    id: number;
    region_id: number;
    deleted_at: string | null;
    name: {
      ar: string;
      en: string;
    };
    iso3: string;
    iso2: string;
    nationality: {
      en: string;
      ar: string;
    };
    flag: string;
    status: string | null;
    international_code: string;
  }