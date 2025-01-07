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
}

const inits: ICreateKnowldege = {
  knowledgeType: 'data',
  title: '',
  topicId:null,
  industry:null,
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
  customTopic:''
};

export { ICreateKnowldege, inits };
