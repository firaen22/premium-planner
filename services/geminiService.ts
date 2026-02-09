import { GoogleGenAI } from "@google/genai";
import { CalculationResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSalesPitch = async (
  data: CalculationResult, 
  hasBundle: boolean
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "請配置 API Key 以獲取 AI 建議。";

  const { 
    annualPremium, 
    rebateRate, 
    rebateAmount, 
    nextTier, 
    gapToNextTier, 
    potentialExtraRebate, 
    prepaymentYears, 
    prepaymentInterest,
    voucherValue,
    voucherDescription
  } = data;

  if (!nextTier) {
    return "恭喜！您已達到最高回贈級別。這是目前市場上最優厚的條件，建議立即鎖定優惠。";
  }

  const currentRatePercent = (rebateRate * 100).toFixed(0);
  const nextRatePercent = (hasBundle ? nextTier.rateBundle * 100 : nextTier.rateBasic * 100).toFixed(0);
  const nextTierMin = nextTier.min.toLocaleString();
  const gap = gapToNextTier.toLocaleString();
  const extraRebate = potentialExtraRebate.toLocaleString();
  const prepayInfo = prepaymentYears === 4 
    ? `客戶選擇了預繳 4 年，鎖定了 $${prepaymentInterest.toLocaleString()} 的高息回報。` 
    : `客戶目前選擇預繳 1 年 (收益 $${prepaymentInterest.toLocaleString()})。`;
  
  const voucherInfo = voucherValue > 0 
    ? `此外，客戶已獲得額外 HK$${(voucherValue * (data.currency === 'HKD' ? 1 : 8)).toLocaleString()} 的保費折扣券 (${voucherDescription})。`
    : `目前尚未達到領取保費折扣券的門檻 (需滿 HK$5,000)。`;

  const prompt = `
    你是一位頂尖的 AIA 財務策劃專家 (MDRT/TOT 級別)，專精於「環宇盈活儲蓄保險計劃 (Global Power Multi-Currency Plan)」的銷售。
    
    **產品亮點：**
    長線回報極具競爭力、可靈活轉換貨幣、適合傳承財富。

    **情境：**
    客戶目前的預算為每年 $${annualPremium.toLocaleString()}。
    目前保費回贈率為 ${currentRatePercent}%，現金回贈金額 $${rebateAmount.toLocaleString()}。
    ${voucherInfo}
    ${prepayInfo}
    
    **缺口分析 (The Gap)：**
    客戶只需增加 $${gap} 的保費，即可進入下一級別 ($${nextTierMin})。
    升級後回贈率將跳升至 ${nextRatePercent}%。
    這將帶來額外 $${extraRebate} 的回贈收益。

    **任務：**
    請用簡短、有力、具備「損失厭惡 (Loss Aversion)」心理學技巧的口吻撰寫一段銷售話術。
    你要讓客戶覺得「現在不升級保費，就是白白浪費了 ${extraRebate} 的現金回贈」。
    
    語氣：專業、自信、具備親和力。
    語言：繁體中文 (香港口語風格)。
    限制在 100 字以內。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "無法生成建議。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 服務暫時無法使用。";
  }
};