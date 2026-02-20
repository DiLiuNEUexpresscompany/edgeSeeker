/**
 * Prediction Markets - Terminal Style
 * 预测市场 (Polymarket)
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { REFRESH_INTERVALS } from '../../config';
import { TerminalBox } from '../common';

const PredictionCard = ({ market }) => {
  const prob = market.probability;
  const barWidth = Math.min(100, Math.max(0, prob));
  
  // 生成 ASCII 进度条
  const generateBar = (value, width = 20) => {
    const filled = Math.round((value / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div className="border border-[#333] p-3 hover:border-[#555] transition-colors">
      {/* 标题 */}
      <h4 className="text-xs text-[#aaa] mb-3 line-clamp-2 leading-relaxed">
        {market.title}
      </h4>
      
      {/* 概率显示 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#555] uppercase tracking-wider">PROBABILITY</span>
        <span 
          className="text-2xl font-bold font-mono"
          style={{ 
            color: prob >= 50 ? '#00ff00' : prob >= 30 ? '#ffff00' : '#ff0000' 
          }}
        >
          {prob.toFixed(0)}%
        </span>
      </div>
      
      {/* ASCII 进度条 */}
      <div 
        className="font-mono text-xs mb-3 tracking-tighter"
        style={{ 
          color: prob >= 50 ? '#00ff00' : prob >= 30 ? '#ffff00' : '#ff0000' 
        }}
      >
        {generateBar(prob, 24)}
      </div>
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between text-[10px] text-[#555]">
        <span>VOL: ${(market.volume / 1000000).toFixed(1)}M</span>
        <a 
          href={market.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00ffff] hover:underline"
        >
          VIEW →
        </a>
      </div>
    </div>
  );
};

const PredictionMarkets = ({ region = null, limit = 4 }) => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const data = await api.getPredictionMarkets(region, limit);
        setMarkets(data);
      } catch (error) {
        console.error('Failed to fetch prediction markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, REFRESH_INTERVALS.markets);
    return () => clearInterval(interval);
  }, [region, limit]);

  if (loading) {
    return (
      <TerminalBox title="PREDICTION MARKETS" subtitle="POLYMARKET">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse border border-[#222] p-3">
              <div className="h-8 bg-[#222] mb-2" />
              <div className="h-6 bg-[#222] w-1/2" />
            </div>
          ))}
        </div>
      </TerminalBox>
    );
  }

  return (
    <TerminalBox 
      title="PREDICTION MARKETS" 
      subtitle="POLYMARKET"
      status="live"
    >
      <div className="grid grid-cols-2 gap-3">
        {markets.map((market) => (
          <PredictionCard key={market.id} market={market} />
        ))}
      </div>
    </TerminalBox>
  );
};

export default PredictionMarkets;
