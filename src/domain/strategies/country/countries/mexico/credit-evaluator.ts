import type { ICreditEvaluator } from '../../credit-evaluator.interface';
import type { CreditRequest } from '../../../../entities/credit-request';
import type { BankingInfo } from '../../../../entities/banking-info';
import type { CreditEvaluationResult } from '../../types';
import { MEXICO_CONFIG } from './config';

export class MexicoCreditEvaluator implements ICreditEvaluator {
  async evaluate(
    creditRequest: CreditRequest,
    bankingInfo: BankingInfo
  ): Promise<CreditEvaluationResult> {
    const financialData = bankingInfo.financialData as any;

    const currentDebt = financialData?.debt ?? 0;
    const accountBalance = financialData?.balance ?? 0;
    const creditScore = financialData?.risk_score ?? 0;
    const monthlyIncome = creditRequest.monthlyIncome;
    const requestedAmount = creditRequest.requestedAmount;

    const debtToIncomeRatio = monthlyIncome > 0 ? currentDebt / monthlyIncome : Infinity;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (creditScore >= 750 && debtToIncomeRatio < 0.3) {
      riskLevel = 'LOW';
    } else if (creditScore >= 600 && debtToIncomeRatio < 0.4) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    const checks = {
      creditScoreOk: creditScore >= (MEXICO_CONFIG.minCreditScore ?? 600),
      debtToIncomeOk: debtToIncomeRatio <= (MEXICO_CONFIG.maxDebtToIncomeRatio ?? 0.4),
      amountWithinLimit: requestedAmount <= MEXICO_CONFIG.amountLimit,
      sufficientIncome: monthlyIncome >= requestedAmount * 0.15, // At least 15% of requested amount
      positiveBalance: accountBalance >= 0,
    };

    const allChecksPassed = Object.values(checks).every(check => check === true);
    const approved = allChecksPassed && riskLevel !== 'HIGH';

    let reason = '';
    if (approved) {
      reason = `Credit approved. Risk level: ${riskLevel}, Credit score: ${creditScore}, DTI ratio: ${(debtToIncomeRatio * 100).toFixed(1)}%`;
    } else {
      const reasons: string[] = [];
      if (!checks.creditScoreOk) {
        reasons.push(`credit score too low (${creditScore} < ${MEXICO_CONFIG.minCreditScore})`);
      }
      if (!checks.debtToIncomeOk) {
        reasons.push(`debt-to-income ratio too high (${(debtToIncomeRatio * 100).toFixed(1)}% > ${(MEXICO_CONFIG.maxDebtToIncomeRatio! * 100).toFixed(0)}%)`);
      }
      if (!checks.amountWithinLimit) {
        reasons.push(`requested amount exceeds limit (${requestedAmount} > ${MEXICO_CONFIG.amountLimit})`);
      }
      if (!checks.sufficientIncome) {
        reasons.push('insufficient monthly income for requested amount');
      }
      if (!checks.positiveBalance) {
        reasons.push('negative account balance');
      }
      if (riskLevel === 'HIGH') {
        reasons.push('high risk profile');
      }
      reason = `Credit rejected: ${reasons.join(', ')}`;
    }

    let recommendedAmount: number | undefined;
    if (!approved && monthlyIncome > 0) {
      const maxByDti = (monthlyIncome * 0.3 - currentDebt) * 12;
      const maxByIncome = monthlyIncome * 6.67;
      recommendedAmount = Math.min(maxByDti, maxByIncome, MEXICO_CONFIG.amountLimit);
      recommendedAmount = Math.max(0, Math.floor(recommendedAmount));
    }

    return {
      approved,
      reason,
      score: creditScore,
      riskLevel,
      recommendedAmount: approved ? undefined : recommendedAmount,
      metadata: {
        checks,
        debtToIncomeRatio: parseFloat((debtToIncomeRatio * 100).toFixed(2)),
        currentDebt,
        accountBalance,
        monthlyIncome,
        requestedAmount,
      },
    };
  }
}
