import { DEFAULT_REWARD_RULES } from '../config/appConfig';
import { isSupabaseEnabled, supabaseRequest } from './supabaseClient';

const mapRulesFromRow = (row) => ({
  id: row.id,
  purchasePoints: row.purchase_points ?? DEFAULT_REWARD_RULES.purchasePoints,
  purchaseAmount: row.purchase_amount ?? DEFAULT_REWARD_RULES.purchaseAmount,
  referralBonus: row.referral_bonus ?? DEFAULT_REWARD_RULES.referralBonus,
  redemptionValue: row.redemption_value ?? DEFAULT_REWARD_RULES.redemptionValue,
});

const rulesToRow = (rules) => ({
  shop_id: rules.shop_id,
  purchase_points: rules.purchasePoints,
  purchase_amount: rules.purchaseAmount,
  referral_bonus: rules.referralBonus,
  redemption_value: rules.redemptionValue,
  active: true,
});

export const loyaltyRepository = {
  enabled: isSupabaseEnabled,

  async getRules() {
    const rows = await supabaseRequest('loyalty_rules', {
      query: '?select=*&active=eq.true&limit=1',
    });
    return rows[0] ? mapRulesFromRow(rows[0]) : DEFAULT_REWARD_RULES;
  },

  async saveRules(rules) {
    if (rules.id) {
      const rows = await supabaseRequest('loyalty_rules', {
        method: 'PATCH',
        query: `?id=eq.${rules.id}`,
        body: rulesToRow(rules),
      });
      return mapRulesFromRow(rows[0]);
    }

    const rows = await supabaseRequest('loyalty_rules', {
      method: 'POST',
      body: rulesToRow(rules),
    });
    return mapRulesFromRow(rows[0]);
  },
};
