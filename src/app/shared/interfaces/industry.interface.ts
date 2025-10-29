export interface Industry {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  subIndustries: SubIndustry[];
}

export interface SubIndustry {
  id: string;
  name: string;
  description: string;
}
