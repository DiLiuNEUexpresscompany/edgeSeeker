/**
 * Social Feed - Terminal Style
 * 社交媒体信息流
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { REFRESH_INTERVALS } from '../../config';
import { TerminalBox } from '../common';

const PostItem = ({ post }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const platformIcon = post.platform === 'twitter' ? '𝕏' : '🦋';
  
  return (
    <div className="border-b border-[#222] last:border-0 py-3 hover:bg-[#111] -mx-3 px-3 transition-colors">
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-2 text-xs">
        <span className="text-lg">{platformIcon}</span>
        <span className="text-white font-medium">
          {post.account.display_name}
        </span>
        {post.account.verified && (
          <span className="text-[#00ffff]">✓</span>
        )}
        <span className="text-[#555]">@{post.account.username}</span>
        <span className="text-[#333]">•</span>
        <span className="text-[#555]">{formatTime(post.published_at)}</span>
      </div>
      
      {/* 内容 */}
      <p className="text-xs text-[#aaa] leading-relaxed mb-2 whitespace-pre-wrap">
        {post.content}
      </p>
      
      {/* 互动数据 */}
      <div className="flex items-center gap-4 text-[10px] text-[#555] font-mono">
        <span>↩ {post.replies}</span>
        <span>⟲ {post.reposts}</span>
        <span>♥ {post.likes}</span>
        <a 
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[#00ffff] hover:underline"
        >
          VIEW →
        </a>
      </div>
    </div>
  );
};

const SocialFeed = ({ region = null, limit = 15 }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await api.getSocialFeed(platform, region, limit);
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch social feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, REFRESH_INTERVALS.socialFeed);
    return () => clearInterval(interval);
  }, [platform, region, limit]);

  return (
    <TerminalBox 
      title="LIVE SOCIAL" 
      subtitle="OSINT FEEDS"
      status="live"
    >
      {/* 平台过滤 */}
      <div className="flex gap-1 mb-3 text-[10px]">
        <button
          onClick={() => setPlatform(null)}
          className={`px-2 py-1 border ${
            platform === null 
              ? 'bg-white text-black border-white' 
              : 'border-[#333] text-[#666] hover:text-white'
          }`}
        >
          ALL
        </button>
        <button
          onClick={() => setPlatform('twitter')}
          className={`px-2 py-1 border ${
            platform === 'twitter' 
              ? 'bg-white text-black border-white' 
              : 'border-[#333] text-[#666] hover:text-white'
          }`}
        >
          𝕏
        </button>
        <button
          onClick={() => setPlatform('bluesky')}
          className={`px-2 py-1 border ${
            platform === 'bluesky' 
              ? 'bg-white text-black border-white' 
              : 'border-[#333] text-[#666] hover:text-white'
          }`}
        >
          🦋
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse py-3">
              <div className="h-3 bg-[#222] w-1/3 mb-2" />
              <div className="h-4 bg-[#222] w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </TerminalBox>
  );
};

export default SocialFeed;
