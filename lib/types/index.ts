export interface Job {
  id: string;
  ref_number: string;
  client_id: string;
  status: 'draft' | 'ai_processing' | 'review' | 'estimated' | 'quoted' | 'closed';
  source: 'pdf_upload' | 'manual' | 'cloned';
  cloned_from?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface JobRequirements {
  id: string;
  job_id: string;
  crane_type: string | null;
  quantity: number | null;
  location_type: 'Indoor' | 'Outdoor' | 'Semi-Outdoor' | null;
  control_type: string | null;
  mh_capacity: number | null;
  ah_capacity: number | null;
  span: number | null;
  mh_lift: number | null;
  ah_lift: number | null;
  bay_length: number | null;
  mh_speed: number | null;
  ah_speed: number | null;
  ct_speed: number | null;
  lt_speed: number | null;
  micro_speed: boolean | null;
  ambient_temp: number | null;
  duty_class: string | null;
  vvvf_required: boolean | null;
  power_supply: string | null;
  rail_size: string | null;
  dsl_type: string | null;
  special_features: string[] | null;
  updated_at: string;
}

export interface AiExtraction {
  id: string;
  job_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_extraction: any;
  field_confidence: Record<string, number>;
  missing_fields: { field: string; reason: string }[];
  created_at: string;
}

export interface Component {
  id: string;
  category: string;
  model: string;
  unit_price: number;
  unit: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specs: any;
  is_active: boolean;
  updated_by: string;
  updated_at: string;
}

export interface Formula {
  id: string;
  name: string;
  expression: string;
  variables: string[];
  description: string | null;
  updated_by: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any;
  priority: number;
  is_active: boolean;
}

export interface Estimation {
  id: string;
  job_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mh_breakdown: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ah_breakdown: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ct_breakdown: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lt_breakdown: any;
  structural_cost: number;
  base_total: number;
  margin_multiplier: number;
  painting_cost: number;
  misc_cost: number;
  crd_cost: number;
  grand_total: number;
  gst_amount: number;
  grand_total_with_gst: number;
  version: number;
  created_at: string;
}

export interface Document {
  id: string;
  job_id: string;
  type: 'quotation' | 'job_card' | 'missing_fields' | 'ga_drawing';
  storage_path: string | null;
  version: number;
  created_by: string;
  created_at: string;
}
