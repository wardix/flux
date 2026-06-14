export const WORKLOAD_THRESHOLDS = {
  UNDERLOAD: 5,
  OPTIMAL: 10,
} as const;

export type CapacityLevel = 'underload' | 'optimal' | 'overload';
