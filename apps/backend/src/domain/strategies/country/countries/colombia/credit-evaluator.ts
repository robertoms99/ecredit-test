import type { ICreditEvaluator } from '../../credit-evaluator.interface';
import type { CreditRequest } from '../../../../entities/credit-request';
import type { BankingInfo } from '../../../../entities/banking-info';
import type { CreditEvaluationResult } from '../../types';
import { COLOMBIA_CONFIG } from './config';

export class ColombiaCreditEvaluator implements ICreditEvaluator {
  async evaluate(
    creditRequest: CreditRequest,
    bankingInfo: BankingInfo
  ): Promise<CreditEvaluationResult> {
    const financialData = bankingInfo.financialData as any;

    const creditScore = financialData?.datacredito?.score ?? 0;
    const currentDebt = financialData?.datos_financieros?.obligaciones_mensuales ?? 0;
    const accountBalance = financialData?.datos_financieros?.balance_cuentas ?? 0;
    const monthlyIncome = financialData?.datos_financieros?.ingresos_mensuales ?? creditRequest.monthlyIncome;
    const requestedAmount = creditRequest.requestedAmount;

    const debtToIncomeRatio = monthlyIncome > 0 ? currentDebt / monthlyIncome : Infinity;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (creditScore >= 700 && debtToIncomeRatio < 0.35) {
      riskLevel = 'LOW';
    } else if (creditScore >= 550 && debtToIncomeRatio < 0.45) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    const checks = {
      creditScoreOk: creditScore >= (COLOMBIA_CONFIG.minCreditScore ?? 550),
      debtToIncomeOk: debtToIncomeRatio <= (COLOMBIA_CONFIG.maxDebtToIncomeRatio ?? 0.45),
      amountWithinLimit: requestedAmount <= COLOMBIA_CONFIG.amountLimit,
      sufficientIncome: monthlyIncome >= requestedAmount * 0.12,
      balanceNotCritical: accountBalance >= -50000,
    };

    const canApprove =
      Object.values(checks).every(check => check === true) &&
      (riskLevel === 'LOW' || riskLevel === 'MEDIUM');

    const approved = canApprove;

    let reason = '';
    if (approved) {
      reason = `Crédito aprobado. Nivel de riesgo: ${riskLevel}, Puntaje crediticio: ${creditScore}, Ratio deuda/ingreso: ${(debtToIncomeRatio * 100).toFixed(1)}%`;
    } else {
      const reasons: string[] = [];
      if (!checks.creditScoreOk) {
        reasons.push(`puntaje crediticio muy bajo (${creditScore} < ${COLOMBIA_CONFIG.minCreditScore})`);
      }
      if (!checks.debtToIncomeOk) {
        reasons.push(`ratio deuda/ingreso muy alto (${(debtToIncomeRatio * 100).toFixed(1)}% > ${(COLOMBIA_CONFIG.maxDebtToIncomeRatio! * 100).toFixed(0)}%)`);
      }
      if (!checks.amountWithinLimit) {
        reasons.push(`monto solicitado excede el límite (${requestedAmount} > ${COLOMBIA_CONFIG.amountLimit})`);
      }
      if (!checks.sufficientIncome) {
        reasons.push('ingreso mensual insuficiente para el monto solicitado');
      }
      if (!checks.balanceNotCritical) {
        reasons.push('balance de cuenta críticamente bajo');
      }
      if (riskLevel === 'HIGH') {
        reasons.push('perfil de alto riesgo');
      }
      reason = `Crédito rechazado: ${reasons.join(', ')}`;
    }

    let recommendedAmount: number | undefined;
    if (!approved && monthlyIncome > 0) {
      const maxByDti = (monthlyIncome * 0.35 - currentDebt) * 12;
      const maxByIncome = monthlyIncome * 8.33;
      recommendedAmount = Math.min(maxByDti, maxByIncome, COLOMBIA_CONFIG.amountLimit);
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
