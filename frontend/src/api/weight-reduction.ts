import client from './client';
import type { WeightReductionResult } from '@/types';

export async function computeWeightReduction(baseConfigId: string, compareConfigId: string): Promise<WeightReductionResult> {
  const { data } = await client.get('/weight-reduction', {
    params: { base_config_id: baseConfigId, compare_config_id: compareConfigId },
  });
  return data;
}
