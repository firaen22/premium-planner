import React, { useState } from 'react';
import { CalculationResult } from '../types';
import { generateSalesPitch } from '../services/geminiService';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface AdviceSectionProps {
  data: CalculationResult;
  hasBundle: boolean;
}

export const AdviceSection: React.FC<AdviceSectionProps> = ({ data, hasBundle }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastAnalyzedPremium, setLastAnalyzedPremium] = useState<number>(0);

  const handleGenerateAdvice = async () => {
    setLoading(true);
    const pitch = await generateSalesPitch(data, hasBundle);
    setAdvice(pitch);
    setLoading(false);
    setLastAnalyzedPremium(data.annualPremium);
  };

  // Auto-generate if premium changes significantly (> 10%) or logic implies a new tier crossed?
  // To save tokens, we'll keep it manual or trigger on significant tier changes only if we wanted to.
  // For now, manual trigger is safer for API limits, or auto trigger on mount/major updates.
  // Let's make it a prominent button that pulses if the gap is small.

  const isCloseGap = data.nextTier && data.gapToNextTier < 5000;

  return (
    <div className={`mt-6 p-6 rounded-xl border-2 transition-all duration-300 ${isCloseGap ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <SparklesIcon className="h-5 w-5 text-yellow-500 mr-2" />
          AI 智能缺口分析
        </h3>
        {(!advice || lastAnalyzedPremium !== data.annualPremium) && (
          <button
            onClick={handleGenerateAdvice}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg shadow hover:from-red-700 hover:to-red-800 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? '分析中...' : '生成銷售話術'}
          </button>
        )}
      </div>

      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}

      {!loading && advice && lastAnalyzedPremium === data.annualPremium && (
        <div className="prose prose-sm text-gray-700 leading-relaxed font-medium">
          <p className="whitespace-pre-wrap">{advice}</p>
        </div>
      )}

      {!loading && (!advice || lastAnalyzedPremium !== data.annualPremium) && (
        <p className="text-gray-500 text-sm">
          點擊上方按鈕，讓 AI 為您分析目前的保費配置是否達到最佳效益。
        </p>
      )}
    </div>
  );
};
