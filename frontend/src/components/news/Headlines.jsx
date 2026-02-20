/**
 * Headlines - Terminal Style
 * 头条新闻列表
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EVENT_TYPES, REFRESH_INTERVALS } from '../../config';
import { TerminalBox } from '../common';

const HeadlineItem = ({ article, index }) => {
  const eventType = EVENT_TYPES[article.event_type] || EVENT_TYPES.other;
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block py-2 border-b border-[#222] last:border-0 hover:bg-[#111] px-2 -mx-2 transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* 序号 */}
        <span className="text-[#333] text-xs font-mono w-4 flex-shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        
        <div className="flex-1 min-w-0">
          {/* 元信息行 */}
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span 
              className="data-tag"
              style={{ color: eventType.color, borderColor: eventType.color }}
            >
              {eventType.nameCn}
            </span>
            <span className="text-[#555]">{article.source?.name}</span>
            <span className="text-[#333]">•</span>
            <span className="text-[#555]">{formatTime(article.published_at)}</span>
            {index === 0 && (
              <span className="text-[#ff0000] animate-pulse">● NEW</span>
            )}
          </div>
          
          {/* 标题 */}
          <h4 className="text-sm text-[#ccc] group-hover:text-white transition-colors line-clamp-2">
            {article.title}
          </h4>
        </div>
        
        {/* 重要性分数 */}
        <div className="flex-shrink-0 text-right">
          <div 
            className="text-xs font-mono"
            style={{ 
              color: article.importance_score >= 7 ? '#ff0000' : 
                     article.importance_score >= 5 ? '#ffff00' : '#00ff00' 
            }}
          >
            {article.importance_score.toFixed(1)}
          </div>
        </div>
      </div>
    </a>
  );
};

const Headlines = ({ region = null, limit = 10 }) => {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeadlines = async () => {
      try {
        const data = await api.getHeadlines(region, limit);
        setHeadlines(data);
      } catch (error) {
        console.error('Failed to fetch headlines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeadlines();
    const interval = setInterval(fetchHeadlines, REFRESH_INTERVALS.headlines);
    return () => clearInterval(interval);
  }, [region, limit]);

  if (loading) {
    return (
      <TerminalBox title="LATEST HEADLINES" status="normal">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-[#222] w-1/4 mb-1" />
              <div className="h-4 bg-[#222] w-full" />
            </div>
          ))}
        </div>
      </TerminalBox>
    );
  }

  return (
    <TerminalBox 
      title="LATEST HEADLINES" 
      status="live"
      headerRight={`${headlines.length} ITEMS`}
    >
      <div className="space-y-0">
        {headlines.map((article, index) => (
          <HeadlineItem key={article.id} article={article} index={index} />
        ))}
      </div>
    </TerminalBox>
  );
};

export default Headlines;
