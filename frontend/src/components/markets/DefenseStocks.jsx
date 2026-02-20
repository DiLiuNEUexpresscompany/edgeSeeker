/**
 * Defense Stocks - Terminal Style
 * 军工股行情
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { REFRESH_INTERVALS } from '../../config';
import { TerminalBox } from '../common';

const StockRow = ({ stock }) => {
  const isPositive = stock.change_percent >= 0;
  const color = isPositive ? '#00ff00' : '#ff0000';
  const arrow = isPositive ? '▲' : '▼';
  
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#222] last:border-0 font-mono text-xs">
      <div className="flex items-center gap-3">
        <span className="text-white w-12">{stock.symbol}</span>
        <span className="text-[#555] truncate max-w-[100px]">{stock.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[#888] w-16 text-right">${stock.price.toFixed(2)}</span>
        <span 
          className="w-16 text-right"
          style={{ color }}
        >
          {arrow} {Math.abs(stock.change_percent).toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

const DefenseStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const data = await api.getDefenseStocks();
        setStocks(data);
      } catch (error) {
        console.error('Failed to fetch defense stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, REFRESH_INTERVALS.markets);
    return () => clearInterval(interval);
  }, []);

  // 计算平均涨跌
  const avgChange = stocks.length > 0 
    ? stocks.reduce((sum, s) => sum + s.change_percent, 0) / stocks.length 
    : 0;

  if (loading) {
    return (
      <TerminalBox title="DEFENSE SECTOR">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-6 bg-[#222]" />
          ))}
        </div>
      </TerminalBox>
    );
  }

  return (
    <TerminalBox 
      title="DEFENSE SECTOR" 
      status={avgChange >= 0 ? 'live' : 'warning'}
      headerRight={
        <span style={{ color: avgChange >= 0 ? '#00ff00' : '#ff0000' }}>
          AVG: {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
        </span>
      }
    >
      <div>
        {stocks.map((stock) => (
          <StockRow key={stock.symbol} stock={stock} />
        ))}
      </div>
    </TerminalBox>
  );
};

export default DefenseStocks;
