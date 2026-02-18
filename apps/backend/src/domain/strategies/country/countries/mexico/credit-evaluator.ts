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

    const creditScore = financialData?.informacion_crediticia?.calificacion_buro ?? 0;
    const currentDebt = financialData?.informacion_financiera?.deuda_mensual_mxn ?? 0;
    const accountBalance = financialData?.informacion_financiera?.saldo_cuenta_mxn ?? 0;
    const monthlyIncome = financialData?.informacion_financiera?.ingreso_mensual_mxn ?? creditRequest.monthlyIncome;
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
      reason = `Crédito aprobado. Nivel de riesgo: ${riskLevel}, Puntaje crediticio: ${creditScore}, Relación deuda/ingreso: ${(debtToIncomeRatio * 100).toFixed(1)}%`;
    } else {
      const reasons: string[] = [];
      if (!checks.creditScoreOk) {
        reasons.push(`puntaje crediticio muy bajo (${creditScore} < ${MEXICO_CONFIG.minCreditScore})`);
      }
      if (!checks.debtToIncomeOk) {
        reasons.push(`relación deuda/ingreso muy alta (${(debtToIncomeRatio * 100).toFixed(1)}% > ${(MEXICO_CONFIG.maxDebtToIncomeRatio! * 100).toFixed(0)}%)`);
      }
      if (!checks.amountWithinLimit) {
        reasons.push(`monto solicitado excede el límite (${requestedAmount} > ${MEXICO_CONFIG.amountLimit})`);
      }
      if (!checks.sufficientIncome) {
        reasons.push('ingreso mensual insuficiente para el monto solicitado');
      }
      if (!checks.positiveBalance) {
        reasons.push('saldo de cuenta negativo');
      }
      if (riskLevel === 'HIGH') {
        reasons.push('perfil de alto riesgo');
      }
      reason = `Crédito rechazado: ${reasons.join(', ')}`;
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
