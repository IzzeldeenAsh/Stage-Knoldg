interface ICreateKnowldege {
  knowledgeType: 'Data' | 'Insights' | 'Reports' | 'Manual';
  title: string;
  accountPlan: '1' | '2' | '3';
  topicId:number|null;
  industry_id:number|null;
  isic_code_id:number|null;
  hs_code_id:number|null;
  language:string;
  region:any[];
  country:any[];
  economic_block:any[];
  description:string;

}

const inits: ICreateKnowldege = {
  knowledgeType: 'Data',
  title: '',
  accountPlan: '1',
  topicId:null,
  industry_id:null,
  isic_code_id:null,
  hs_code_id:null,
  language:'en',
  region:[],
  country:[],
  economic_block:[],
  description: '',
};

export { ICreateKnowldege, inits };
