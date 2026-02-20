/**
 * Tracked Accounts - Terminal Style
 * 追踪的账号列表
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TerminalBox } from '../common';

const AccountRow = ({ account }) => {
  const platformIcon = account.account.platform === 'twitter' ? '𝕏' : '🦋';
  
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[#222] last:border-0 text-xs hover:bg-[#111] -mx-3 px-3 transition-colors">
      <span className="text-sm">{platformIcon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-white">{account.account.display_name}</span>
        {account.account.verified && (
          <span className="text-[#00ffff] ml-1">✓</span>
        )}
        <span className="text-[#555] ml-2">@{account.account.username}</span>
      </div>
      <span className="text-[10px] text-[#444] uppercase">{account.category}</span>
    </div>
  );
};

const TrackedAccounts = ({ limit = 10 }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await api.getTrackedAccounts();
        setAccounts(data.slice(0, limit));
      } catch (error) {
        console.error('Failed to fetch tracked accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [limit]);

  if (loading) {
    return (
      <TerminalBox title="TRACKED ACCOUNTS">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse h-6 bg-[#222]" />
          ))}
        </div>
      </TerminalBox>
    );
  }

  return (
    <TerminalBox 
      title="TRACKED ACCOUNTS" 
      headerRight={`${accounts.length} SOURCES`}
    >
      <div>
        {accounts.map((account) => (
          <AccountRow key={account.account.id} account={account} />
        ))}
      </div>
    </TerminalBox>
  );
};

export default TrackedAccounts;
