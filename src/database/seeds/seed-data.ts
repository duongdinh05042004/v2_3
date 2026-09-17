import { CONFIG_KEYS } from '../../common/constants';

export const defaultFieldMapping = {
  'lead_data.full_name': 'NAME',
  'lead_data.email': 'EMAIL[0][VALUE]',
  'lead_data.phone': 'PHONE[0][VALUE]',
  'lead_data.city': 'UF_CRM_CITY',
  'campaign.campaign_name': 'UF_CRM_UTM_CAMPAIGN',
  'campaign.ad_name': 'UF_CRM_AD_NAME',
  'lead_data.ttclid': 'UF_CRM_TTCLID',
};

export const defaultDealRules = [
  {
    condition: "campaign.campaign_name CONTAINS 'sale'",
    action: 'create_deal',
    pipeline_id: '1',
    stage_id: 'NEW',
    probability: 30,
  },
];

export const defaultAssignmentRules = {
  strategy: 'weighted',
  rules: [
    {
      id: 'assign-hanoi',
      condition: "lead_data.city EQUALS 'Hà Nội'",
      assign_to: 'sp_hanoi',
    },
    {
      id: 'assign-tech',
      condition: "lead_data.interests CONTAINS 'technology'",
      assign_to: 'sp_tech',
    },
  ],
  fallback: 'sp_round_robin',
};

export const defaultPipeline = {
  stages: [
    { id: 'NEW', name: 'New', probability: 10 },
    { id: 'QUALIFIED', name: 'Qualified', probability: 40 },
    { id: 'PROPOSAL', name: 'Proposal', probability: 65 },
    { id: 'WON', name: 'Won', probability: 100 },
    { id: 'LOST', name: 'Lost', probability: 0 },
  ],
};

export const defaultQualityWeights = {
  hasEmail: 15,
  hasPhone: 15,
  hasCity: 10,
  hasTtclid: 10,
  customQuestion: 10,
  maxCustomQuestions: 20,
  interest: 5,
  maxInterests: 15,
  formComplete: 15,
  validPhone: 10,
};

export const defaultCampaignCosts = {
  '1234567890123456789': { spend: 15000000, currency: 'VND' },
};

export const defaultConfigurations = [
  {
    key: CONFIG_KEYS.FIELD_MAPPING,
    value: defaultFieldMapping,
    description: 'TikTok lead field -> Bitrix24 CRM field mapping',
  },
  {
    key: CONFIG_KEYS.DEAL_RULES,
    value: defaultDealRules,
    description: 'Rule engine for automatic Lead to Deal conversion',
  },
  {
    key: CONFIG_KEYS.ASSIGNMENT_RULES,
    value: defaultAssignmentRules,
    description: 'Sales assignment criteria',
  },
  {
    key: CONFIG_KEYS.PIPELINE,
    value: defaultPipeline,
    description: 'Deal pipeline stages and default probabilities',
  },
  {
    key: CONFIG_KEYS.QUALITY_WEIGHTS,
    value: defaultQualityWeights,
    description: 'Lead quality scoring weights',
  },
  {
    key: CONFIG_KEYS.CAMPAIGN_COSTS,
    value: defaultCampaignCosts,
    description: 'Campaign spend used for CPL and ROI',
  },
];

export const defaultSalesPersons = [
  {
    externalId: 'sp_manager',
    name: 'Huong Le',
    email: 'huong.le@example.com',
    bitrix24UserId: 100,
    territories: [],
    specialties: ['management'],
    maxOpenDeals: 100,
    managerExternalId: null,
  },
  {
    externalId: 'sp_hanoi',
    name: 'Lan Nguyen',
    email: 'lan.nguyen@example.com',
    bitrix24UserId: 101,
    territories: ['Hà Nội', 'Ha Noi', 'Hanoi'],
    specialties: ['enterprise'],
    maxOpenDeals: 40,
    managerExternalId: 'sp_manager',
  },
  {
    externalId: 'sp_tech',
    name: 'Minh Tran',
    email: 'minh.tran@example.com',
    bitrix24UserId: 102,
    territories: [],
    specialties: ['technology', 'mobile apps'],
    maxOpenDeals: 35,
    managerExternalId: 'sp_manager',
  },
  {
    externalId: 'sp_round_robin',
    name: 'Round Robin Desk',
    email: 'sales.desk@example.com',
    bitrix24UserId: 103,
    territories: [],
    specialties: [],
    maxOpenDeals: 80,
    managerExternalId: 'sp_manager',
  },
];
