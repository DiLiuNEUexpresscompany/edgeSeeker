/**
 * Commodities - Terminal Style
 * 大宗商品行情
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { REFRESH_INTERVALS } from '../../config';
import { TerminalBox } from '../common';

const CommodityItem = ({ commodity, icon }) => {
  const isPositive = commodity.change_percent >= 0;
  const color = isPositive ? '#00ff00' : '#ff0000';
  
  return (
    <div className="border border-[#333] p-3 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
        {commodity.name}
      </div>
      <div className="text-lg font-mono text-white mb-1">
        ${commodity.price.toFixed(2)}
      </div>
      <div 
        className="text-xs font-mono"
        style={{ color }}
      >
        {isPositive ? '▲' : '▼'} {Math.abs(commodity.change_percent).toFixed(2)}%
      </div>
      <div className="text-[10px] text-[#444] mt-1">
        /{commodity.unit}
      </div>
    </div>
  );
};

const Commodities = () => {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);

  const icons = {
    'Crude Oil': '🛢️',
    'Gold': '🥇',
    'Natural Gas': '⛽'
  };

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const data = await api.getCommodities();
        setCommodities(data);
      } catch (error) {
        console.error('Failed to fetch commodities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommodities();
    const interval = setInterval(fetchCommodities, REFRESH_INTERVALS.markets);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <TerminalBox title="COMMODITIES">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse border border-[#222] p-3 h-24" />
          ))}
        </div>
      </TerminalBox>
    );
  }

  return (
    <TerminalBox title="COMMODITIES" status="live">
      <div className="grid grid-cols-3 gap-2">
        {commodities.map((c) => (
          <CommodityItem 
            key={c.symbol} 
            commodity={c}
            icon={icons[c.name] || '📊'}
          />
        ))}
      </div>
    </TerminalBox>
  );
};

export default Commodities;
