/**
 * Events Timeline - Terminal Style
 * 事件时间线
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EVENT_TYPES, REFRESH_INTERVALS } from '../../config';
import { TerminalBox } from '../common';

const TimelineItem = ({ article, index }) => {
  const eventType = EVENT_TYPES[article.event_type] || EVENT_TYPES.other;
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="relative pl-6 pb-4 last:pb-0">
      {/* 时间线 */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-[#333]" />
      
      {/* 时间点 */}
      <div 
        className="absolute left-0 top-1.5 w-2 h-2 -translate-x-1/2"
        style={{ backgroundColor: eventType.color }}
      />
      
      {/* 内容 */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-[#111] -mr-3 pr-3 -ml-3 pl-3 py-1 transition-colors"
      >
        {/* 时间和标签 */}
        <div className="flex items-center gap-2 text-xs mb-1">
          <span className="text-[#555] font-mono">{formatTime(article.published_at)}</span>
          <span 
            className="uppercase text-[10px] tracking-wider"
            style={{ color: eventType.color }}
          >
            {eventType.nameCn}
          </span>
          {index === 0 && <span className="status-dot live" />}
        </div>
        
        {/* 标题 */}
        <p className="text-xs text-[#aaa] line-clamp-2 leading-relaxed">
          {article.title}
        </p>
        
        {/* 来源 */}
        <div className="text-[10px] text-[#444] mt-1">
          {article.source?.name}
        </div>
      </a>
    </div>
  );
};

const EventsTimeline = ({ region = null, limit = 10 }) => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventType = filter === 'all' ? null : filter;
        const data = await api.getLatestNews(region, eventType, limit);
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, REFRESH_INTERVALS.headlines);
    return () => clearInterval(interval);
  }, [region, filter, limit]);

  const filters = [
    { id: 'all', label: 'ALL' },
    { id: 'conflict', label: 'CONFLICT', color: EVENT_TYPES.conflict.color },
    { id: 'diplomacy', label: 'DIPLO', color: EVENT_TYPES.diplomacy.color },
    { id: 'military', label: 'MIL', color: EVENT_TYPES.military.color },
  ];

  return (
    <TerminalBox 
      title="EVENTS TIMELINE" 
      status="live"
      headerRight={`${events.length} EVENTS`}
    >
      {/* 过滤器 */}
      <div className="flex gap-1 mb-4 text-[10px]">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              px-2 py-1 border transition-all
              ${filter === f.id 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent border-[#333] text-[#666] hover:text-white hover:border-[#555]'
              }
            `}
            style={{
              borderColor: filter === f.id && f.color ? f.color : undefined,
              backgroundColor: filter === f.id && f.color ? f.color : undefined
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse pl-6">
              <div className="h-3 bg-[#222] w-1/3 mb-1" />
              <div className="h-4 bg-[#222] w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto pr-2">
          {events.map((event, index) => (
            <TimelineItem key={event.id} article={event} index={index} />
          ))}
        </div>
      )}
    </TerminalBox>
  );
};

export default EventsTimeline;
