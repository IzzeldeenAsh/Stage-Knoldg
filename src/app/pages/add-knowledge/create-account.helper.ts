interface ICreateKnowldege {
  knowledgeType: 'data' | 'insight' | 'report' | 'manual';
  title: string;
  topicId:any;
  industry:number|null;
  isic_code:number|null;
  hs_code:number|null;
  language:any;
  regions:any[];
  countries:any[];
  economic_block:number[];
  description:string;
  targetMarket:string;
  customTopic:string;
  file_name:string;
  table_of_content:string;
  price:number;
  file:any;
  status:'active'|'inactive';
  knowledgeId:number;
  tag_ids:any[];
  keywords:any[];
}

const inits: ICreateKnowldege = {
  knowledgeType: 'data',
  title: '',
  topicId:null,
  industry:1,
  isic_code:null,
  hs_code:null,
  language: {
    "id": "en",
    "name": "English"
},
  regions:[],
  countries:[],
  economic_block:[],
  description: '',
  targetMarket:'1',
  customTopic:'',
  file_name:'',
  table_of_content:'',
  price:0,
  file:null,
  status:'active',
  knowledgeId:0,
  keywords:[],
  tag_ids:[]
};

export { ICreateKnowldege, inits };
