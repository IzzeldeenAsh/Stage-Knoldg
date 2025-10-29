export interface IsicCode {
    id: number;
    code: string;
    description: {
      en: string;
    };
    is_active: number;
    parent_id: number;
    child_isic_code?: IsicCode[];
  }
  
  export interface TreeNode {
    key: string;
    label: string;
    data?: any;
    children?: TreeNode[];
    icon?: string;
    expandedIcon?: string;
    collapsedIcon?: string;
    leaf?: boolean;
  }
  