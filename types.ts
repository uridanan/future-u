export type Currency = 'USD' | 'ILS';

export interface Contribution {
  id: string;
  fromAge: number;
  toAge: number;
  amount: number; // Stored in USD
}

export interface Scenario {
  id: string;
  name: string;
  initialAmount: number; // Stored in USD
  startAge: number;
  interestRate: number;
  contributions: Contribution[];
}

export interface ChartDataPoint {
  age: number;
  [scenarioId: string]: number | null; // e.g., { age: 30, 'scenario-1': 50000, 'scenario-2': null }
}

export interface MilestoneValue {
  total: number | null;
  allowance: number | null;
}

export interface MilestoneRow {
  age: number;
  values: {
    [scenarioId: string]: MilestoneValue;
  };
}
