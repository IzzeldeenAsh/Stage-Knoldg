interface IDocument {
  file_name: string;
  table_of_content: Array<{
    chapter: {
      title: string;
    }
  }>;
  file: any;
  status: 'active' | 'inactive';
  price: number;
  file_extension?: string;  
  description?: string;
  id?: number; 
}

export { IDocument };

interface ICreateKnowldege {
  knowledgeType: string;
  title: string;
  topicId: any;
  industry: number|null;
  isic_code: number|null;
  hs_code: number|null;
  language: any;
  regions: any[];
  countries: any[];
  economic_blocs: number[];
  description: string;
  cover_start?: number|null;
  cover_end?: number|null;
  targetMarket: string;
  customTopic: string;
  documents: IDocument[];
  knowledgeId: number;
  tag_ids: any[];
  keywords: any[];
  publish_status: 'unpublished'|'published'|'scheduled'|'in_review';
  publish_date_time: string;
  status?: string;
  economic_bloc?: number[];
  documentDescriptions?: {
    id: number;
    description: string;
  }[];
  isWorldwide?: boolean;
  filesWithErrors?: any[];
}

const inits: ICreateKnowldege = {
  knowledgeType: '',
  title: '',
  topicId: null,
  industry: null,
  isic_code: null,
  hs_code: null,
  language: {
    "id": "en",
    "name": "English"
  },
  regions: [],
  countries: [],
  economic_blocs: [],
  description: '',
  targetMarket: '3',
  customTopic: '',
  documents: [],
  knowledgeId: 0,
  keywords: [],
  tag_ids: [],
  publish_status: 'unpublished',
  publish_date_time: '',
  economic_bloc: [],
  documentDescriptions: [],
  isWorldwide: false
};

export { ICreateKnowldege, inits };
