/**
 * Risk assessment utilities for transfer routes
 */

import { Route, TransferSpeed, RiskAssessment } from '../types';

/**
 * Calculate timing risk based on time buffer before deadline
 * 
 * @param estimatedArrival - When the transfer will complete
 * @param deadline - When the transfer must complete by
 * @returns Timing risk score (0-100)
 * 
 * Risk levels:
 * - Buffer > 48 hours: 0
 * - Buffer 24-48 hours: 20
 * - Buffer 6-24 hours: 50
 * - Buffer < 6 hours: 80
 * - After deadline: 100
 */
export function calculateTimingRisk(estimatedArrival: Date, deadline: Date): number {
  const bufferMs = deadline.getTime() - estimatedArrival.getTime();
  
  // After deadline
  if (bufferMs < 0) {
    return 100;
  }
  
  const bufferHours = bufferMs / (1000 * 60 * 60);
  
  if (bufferHours > 48) {
    return 0;
  } else if (bufferHours >= 24) {
    return 20;
  } else if (bufferHours >= 6) {
    return 50;
  } else {
    return 80;
  }
}

/**
 * Calculate reliability risk based on transfer methods used
 * 
 * @param route - The route to assess
 * @returns Reliability risk score (0-50)
 * 
 * Risk levels:
 * - All instant: 0
 * - Mix of instant and ACH: 30
 * - All ACH: 50
 */
export function calculateReliabilityRisk(route: Route): number {
  const methods = route.steps.map(step => step.method);
  
  const hasInstant = methods.some(m => m === TransferSpeed.INSTANT);
  const hasACH = methods.some(m => 
    m === TransferSpeed.SAME_DAY || 
    m === TransferSpeed.ONE_DAY || 
    m === TransferSpeed.THREE_DAY
  );
  
  if (hasInstant && !hasACH) {
    return 0;
  } else if (hasInstant && hasACH) {
    return 30;
  } else {
    return 50;
  }
}

/**
 * Calculate complexity risk based on number of transfer steps
 * 
 * @param route - The route to assess
 * @returns Complexity risk score (0-40)
 * 
 * Risk levels:
 * - 1 step: 0
 * - 2-3 steps: 20
 * - 4+ steps: 40
 */
export function calculateComplexityRisk(route: Route): number {
  const stepCount = route.steps.length;
  
  if (stepCount === 1) {
    return 0;
  } else if (stepCount <= 3) {
    return 20;
  } else {
    return 40;
  }
}

/**
 * Calculate overall risk score using weighted components
 * 
 * @param route - The route to assess
 * @param deadline - When the transfer must complete by
 * @returns Complete risk assessment with breakdown
 * 
 * Weights:
 * - Timing: 50%
 * - Reliability: 30%
 * - Complexity: 20%
 */
export function calculateRiskScore(route: Route, deadline: Date): RiskAssessment {
  const timing = calculateTimingRisk(route.estimatedArrival, deadline);
  const reliability = calculateReliabilityRisk(route);
  const complexity = calculateComplexityRisk(route);
  
  const score = (timing * 0.5) + (reliability * 0.3) + (complexity * 0.2);
  
  return {
    score,
    timing,
    reliability,
    complexity
  };
}

/**
 * Classify risk level based on risk score
 * 
 * @param riskScore - Numerical risk score (0-100)
 * @returns Risk level classification
 * 
 * Thresholds:
 * - 0-30: low
 * - 31-60: medium
 * - 61-100: high
 */
export function classifyRiskLevel(riskScore: number): "low" | "medium" | "high" {
  if (riskScore <= 30) {
    return "low";
  } else if (riskScore <= 60) {
    return "medium";
  } else {
    return "high";
  }
}
