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
}

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
  targetMarket: string;
  customTopic: string;
  documents: IDocument[];
  knowledgeId: number;
  tag_ids: any[];
  keywords: any[];
  publish_status: 'draft'|'now'|'scheduled';
  publish_date_time: string;
  status?: string;
  economic_bloc?: number[];
  documentDescriptions?: { 
    id: number;
    description: string; 
  }[];
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
  targetMarket: '1',
  customTopic: '',
  documents: [],
  knowledgeId: 0,
  keywords: [],
  tag_ids: [],
  publish_status: 'draft',
  publish_date_time: '',
  economic_bloc: [],
  documentDescriptions: []
};

export { ICreateKnowldege, inits };
