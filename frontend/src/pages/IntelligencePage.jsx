import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import i18n from '../i18n';
import '../styles/portent.css';

const API_BASE = 'http://localhost:8001/api/v1';

// ========== Main Component ==========
export default function IntelligencePage({ lang = 'en' }) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('stream');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // API Data
  const [hotspot, setHotspot] = useState(null);
  const [regions, setRegions] = useState({});
  const [newsItems, setNewsItems] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [markets, setMarkets] = useState({ defense_stocks: [], commodities: [], crypto: [] });
  
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch all data
  const fetchAllData = async (isInitial = false, forceRefresh = false) => {
    try {
      if (isInitial) setLoading(true);
      if (forceRefresh) setRefreshing(true);
      
      const refreshParam = forceRefresh ? 'force_refresh=true' : '';
      // Add lang parameter when in Chinese mode (based on route)
      const langParam = lang === 'zh' ? 'lang=zh' : '';
      const buildParams = (...params) => {
        const valid = params.filter(p => p);
        return valid.length ? '?' + valid.join('&') : '';
      };
      
      const [hotspotRes, newsRes, socialRes, predRes, marketRes] = await Promise.all([
        fetch(`${API_BASE}/hotspot/all${buildParams(refreshParam)}`),
        fetch(`${API_BASE}/news/${buildParams('limit=50', refreshParam, langParam)}`),
        fetch(`${API_BASE}/social/${buildParams('limit=50', refreshParam, langParam)}`),
        fetch(`${API_BASE}/markets/predictions${buildParams('limit=20', refreshParam, langParam)}`),
        fetch(`${API_BASE}/markets/all${buildParams(refreshParam)}`)
      ]);
      
      if (hotspotRes.ok) {
        const data = await hotspotRes.json();
        setRegions(data.regions || {});
        setHotspot(data.current_hotspot);
      }
      
      if (newsRes.ok) {
        const data = await newsRes.json();
        const items = data.items || [];
        setNewsItems(items);
        if (isInitial && items.length > 0) {
          setSelectedItem({ type: 'news', data: items[0] });
        }
      }
      
      if (socialRes.ok) {
        const data = await socialRes.json();
        const items = data.items || [];
        setSocialPosts(items);
      }
      
      if (predRes.ok) {
        const data = await predRes.json();
        const items = data.items || [];
        setPredictions(items);
      }
      
      if (marketRes.ok) {
        const data = await marketRes.json();
        setMarkets(data);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Manual refresh handler
  const handleRefresh = () => {
    if (!refreshing) {
      fetchAllData(false, true);
    }
  };
  
  // Language change - navigate to different route
  const handleLanguageChange = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    navigate(`/${newLang}`);
  };
  
  // Fetch prediction market detail with history
  const selectPrediction = async (item) => {
    // Set immediately with current data
    setSelectedItem({ type: 'prediction', data: item });
    
    // If no history, fetch detail
    if (!item.history || item.history.length === 0) {
      setLoadingDetail(true);
      try {
        const langParam = lang === 'zh' ? '?lang=zh' : '';
        const res = await fetch(`${API_BASE}/markets/predictions/${item.id}${langParam}`);
        if (res.ok) {
          const detail = await res.json();
          if (!detail.error) {
            // Update with full detail data
            setSelectedItem({ type: 'prediction', data: detail });
            // Also update in predictions array for caching
            setPredictions(prev => prev.map(p => p.id === item.id ? { ...p, ...detail } : p));
          }
        }
      } catch (e) {
        console.error('Failed to fetch prediction detail:', e);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  // Sync i18n and fetch data when lang changes
  useEffect(() => {
    i18n.changeLanguage(lang);
    fetchAllData(true);
  }, [lang]);

  useEffect(() => {
    const interval = setInterval(() => fetchAllData(false), 30000);
    return () => clearInterval(interval);
  }, [lang]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // When nav changes, auto-select first item (only for non-market categories)
  // Market categories (stocks, crypto, commodities) are handled by explicit onClick
  const prevActiveNav = useRef(activeNav);
  
  useEffect(() => {
    if (prevActiveNav.current === activeNav) {
      return;
    }
    prevActiveNav.current = activeNav;
    
    // Only auto-select for non-market categories
    if (activeNav === 'stream' && newsItems.length > 0) {
      setSelectedItem({ type: 'news', data: newsItems[0] });
    } else if (activeNav === 'social' && socialPosts.length > 0) {
      setSelectedItem({ type: 'social', data: socialPosts[0] });
    } else if (activeNav === 'predictions' && predictions.length > 0) {
      selectPrediction(predictions[0]);
    }
    // stocks, crypto, commodities - handled by onClick, not here
  }, [activeNav, newsItems, socialPosts, predictions]);

  const current = regions[hotspot] || {};
  const alertCount = Object.values(regions).filter(r => r.alert_level === 'critical').length;

  // Get items for current view
  const getCurrentItems = () => {
    if (activeNav === 'social') {
      if (activeTab === 'all') return socialPosts;
      if (activeTab === 'twitter') return socialPosts.filter(p => p.platform === 'twitter');
      if (activeTab === 'bluesky') return socialPosts.filter(p => p.platform === 'bluesky');
      if (activeTab === 'truth social') return socialPosts.filter(p => p.platform === 'truthsocial');
      return socialPosts;
    }
    if (activeNav === 'predictions') {
      if (activeTab === 'all') return predictions;
      return predictions.filter(p => p.region?.includes(activeTab.toLowerCase()));
    }
    if (activeNav === 'stocks') {
      return markets.defense_stocks || [];
    }
    if (activeNav === 'crypto') {
      return markets.crypto || [];
    }
    if (activeNav === 'commodities') {
      return markets.commodities || [];
    }
    // Default: news (filtered by tab)
    if (activeTab === 'all') return newsItems;
    return newsItems.filter(n => n.source_id?.includes(activeTab.toUpperCase()));
  };

  return (
    <div className="app-container">
      {/* Breaking News Ticker */}
      <BreakingTicker items={newsItems} />
      
      <Header 
        time={time} 
        hotspot={current} 
        loading={loading} 
        lastRefresh={lastRefresh}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onLanguageChange={handleLanguageChange}
        lang={lang}
      />

      <Sidebar 
        activeNav={activeNav} 
        setActiveNav={setActiveNav}
        alertCount={alertCount}

        markets={markets}
        socialCount={socialPosts.length}
        predictionCount={predictions.length}
      />

      <FeedPanel 
        activeNav={activeNav}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        items={getCurrentItems()}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        selectPrediction={selectPrediction}
        loading={loading}
      />

      <Workspace 
        selectedItem={selectedItem}
        hotspot={current}
        regions={regions}
        socialPosts={socialPosts}
        predictions={predictions}
        markets={markets}
        loadingDetail={loadingDetail}
        selectPrediction={selectPrediction}
      />
    </div>
  );
}

// ========== Breaking News Ticker ==========
function BreakingTicker({ items }) {
  const { t } = useTranslation();
  const tickerItems = items.filter(item => item.relevance_score > 0.3).slice(0, 10);
  
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diff = Math.floor((now - date) / 60000); // minutes
      if (diff < 60) return t('time.mAgo', { count: diff });
      if (diff < 1440) return t('time.hAgo', { count: Math.floor(diff/60) });
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (tickerItems.length === 0) {
    return (
      <div className="ticker-bar">
        <div className="ticker-label">{t('ticker.live')}</div>
        <div className="ticker-content">
          <span style={{ padding: '0 24px', color: 'var(--ink-tertiary)' }}>{t('ticker.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ticker-bar">
      <div className="ticker-label">{t('ticker.breaking')}</div>
      <div className="ticker-content">
        <div className="ticker-scroll">
          {/* Duplicate for seamless loop */}
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <span key={idx} className="ticker-item">
              <strong>{item.title}</strong>
              <span className="ticker-source">{item.source}</span>
              <span className="ticker-time">{formatTime(item.published)}</span>
              <span className="ticker-separator">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== Header ==========
function Header({ time, hotspot, loading, lastRefresh, refreshing, onRefresh, onLanguageChange, lang }) {
  const { t } = useTranslation();
  const level = hotspot?.alert_level || 'normal';
  const statusColor = level === 'critical' ? 'var(--accent-alert)' : 
                      level === 'high' ? '#B45309' : 'var(--accent-data)';
  
  // Format last refresh time
  const formatLastRefresh = () => {
    if (!lastRefresh) return '--';
    const now = new Date();
    const diff = Math.floor((now - lastRefresh) / 1000);
    if (diff < 5) return t('header.now');
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return lastRefresh.toLocaleTimeString();
  };
  
  return (
    <header className="header">
      <div className="brand">{t('brand')}</div>
      <div className="header-meta">
        <span>
          {t('header.tracking')}: <strong style={{ color: statusColor }}>
            {loading ? '...' : (hotspot?.name || 'N/A')}
          </strong>
        </span>
        <span className="header-divider" />
        <span>
          {t('header.score')}: <strong style={{ color: statusColor }}>
            {hotspot?.total_score?.toFixed(1) || '0.0'}
          </strong>
        </span>
        <span className="header-divider" />
        <span>
          {t('header.alert')}: <strong style={{ color: statusColor }}>
            {level?.toUpperCase()}
          </strong>
        </span>
        <span className="header-divider" />
        <span>
          {t('header.updated')}: <strong>{formatLastRefresh()}</strong>
        </span>
        <button 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Force refresh all data"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {refreshing ? t('header.syncing') : t('header.refresh')}
        </button>
        <span className="header-divider" />
        <span>
          {t('header.utc')}: <strong>{time.toISOString().slice(11, 19)}</strong>
        </span>
        <button 
          className="lang-btn"
          onClick={onLanguageChange}
          title={lang === 'en' ? '切换到中文' : 'Switch to English'}
        >
          {lang === 'en' ? '🌐 中文' : '🌐 EN'}
        </button>
      </div>
    </header>
  );
}

// ========== Sidebar ==========
function Sidebar({ activeNav, setActiveNav, setSelectedItem, alertCount, markets, socialCount, predictionCount }) {
  const { t } = useTranslation();
  return (
    <nav className="sidebar">
      <div className="nav-section">
        <div className="nav-title">{t('sidebar.collection')}</div>
        <NavItem 
          active={activeNav === 'stream'} 
          onClick={() => setActiveNav('stream')}
          label={t('sidebar.intelStream')}
        />
        <NavItem 
          active={activeNav === 'social'} 
          onClick={() => setActiveNav('social')}
          label={t('sidebar.socialIntel')}
          count={socialCount}
        />
        <NavItem 
          active={activeNav === 'predictions'} 
          onClick={() => setActiveNav('predictions')}
          label={t('sidebar.predictionMarkets')}
          count={predictionCount}
        />
      </div>

      <div className="nav-section">
        <div className="nav-title">{t('sidebar.markets')}</div>
        <NavItem 
          active={activeNav === 'stocks'} 
          onClick={() => {
            setActiveNav('stocks');
            if (markets.defense_stocks?.length > 0) {
              setSelectedItem({ type: 'stock', data: markets.defense_stocks[0] });
            }
          }}
          label={t('sidebar.defenseStocks')}
        />
        <NavItem 
          active={activeNav === 'crypto'} 
          onClick={() => {
            setActiveNav('crypto');
            if (markets.crypto?.length > 0) {
              setSelectedItem({ type: 'crypto', data: markets.crypto[0] });
            }
          }}
          label={t('sidebar.crypto')}
        />
        <NavItem 
          active={activeNav === 'commodities'} 
          onClick={() => {
            setActiveNav('commodities');
            if (markets.commodities?.length > 0) {
              setSelectedItem({ type: 'commodity', data: markets.commodities[0] });
            }
          }}
          label={t('sidebar.commodities')}
        />
      </div>

      {/* Quick Tickers */}
      <div className="nav-section">
        <div className="nav-title">{t('sidebar.livePrices')}</div>
        {markets.defense_stocks?.slice(0, 3).map((s) => (
          <MarketTicker 
            key={s.symbol} 
            symbol={s.symbol} 
            change={s.change_percent}
            onClick={() => {
              setActiveNav('stocks');
              setSelectedItem({ type: 'stock', data: s });
            }}
          />
        ))}
        {markets.commodities?.slice(0, 2).map((c) => (
          <MarketTicker 
            key={c.symbol} 
            symbol={c.name?.split(' ')[0]} 
            change={c.change_percent}
            onClick={() => {
              setActiveNav('commodities');
              setSelectedItem({ type: 'commodity', data: c });
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-strong)', paddingTop: 'var(--space-md)' }}>
        <NavItem 
          alert
          active={activeNav === 'alerts'}
          onClick={() => setActiveNav('alerts')}
          label={t('sidebar.criticalAlerts')}
          count={alertCount}
        />
      </div>
    </nav>
  );
}

function MarketTicker({ symbol, change, onClick }) {
  const isUp = change >= 0;
  return (
    <div 
      className="nav-item" 
      style={{ fontSize: '11px', padding: '6px 8px', cursor: 'pointer' }}
      onClick={onClick}
    >
      <span style={{ fontWeight: 500 }}>{symbol}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MiniSparkline up={isUp} symbol={symbol} />
        <span style={{ color: isUp ? 'var(--accent-success)' : 'var(--accent-alert)' }}>
          {isUp ? '+' : ''}{change?.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ========== Related Social Posts ==========
function RelatedSocialPosts({ newsItem, socialPosts }) {
  const { t } = useTranslation();
  const [semanticPosts, setSemanticPosts] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch semantically matched posts from API
  useEffect(() => {
    if (!newsItem?.title) return;
    
    const fetchSemanticMatch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/semantic/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            news_title: newsItem.title || '',
            news_summary: newsItem.summary || '',
            news_region: newsItem.region || 'global',
            top_k: 4
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSemanticPosts(data.matched_posts || []);
        }
      } catch (e) {
        console.error('Semantic match error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSemanticMatch();
  }, [newsItem?.id]);
  
  // Fallback: simple region-based matching
  const fallbackMatch = useMemo(() => {
    if (!socialPosts || !Array.isArray(socialPosts)) return [];
    return socialPosts
      .filter(p => p.region === newsItem?.region || !newsItem?.region)
      .slice(0, 4);
  }, [newsItem?.region, socialPosts]);

  // Find related posts
  // Use semantic matches if available, otherwise fallback
  const displayPosts = semanticPosts && semanticPosts.length > 0 
    ? semanticPosts 
    : fallbackMatch;

  if (loading) {
    return (
      <div className="timeline-list">
        <div className="timeline-item" style={{ opacity: 0.5 }}>
          <span className="timeline-text">🔍 {t('workspace.matchingPosts') || 'Finding related posts...'}</span>
        </div>
      </div>
    );
  }

  if (displayPosts.length === 0) {
    return (
      <div className="timeline-list">
        <div className="timeline-item" style={{ opacity: 0.5 }}>
          <span className="timeline-text">{t('social.noRelatedPosts')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-list">
      {displayPosts.map((post, i) => {
        const icon = post.platform === 'twitter' ? '𝕏' : post.platform === 'bluesky' ? '🦋' : '🔴';
        const platformColor = post.platform === 'truthsocial' ? 'var(--accent-alert)' : post.platform === 'twitter' ? '#1DA1F2' : 'var(--accent-data)';
        const platformName = post.platform === 'twitter' ? 'Twitter' : post.platform === 'bluesky' ? 'Bluesky' : 'Truth Social';
        
        return (
          <a 
            key={post.id || i} 
            className="timeline-item social-link"
            href={post.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title={t('workspace.viewOn', { platform: platformName })}
          >
            <span className="timeline-time" style={{ color: platformColor, minWidth: '100px' }}>
              {icon} {post.handle?.slice(0, 12) || 'Unknown'}
            </span>
            <span className="timeline-text">
              {post.text?.slice(0, 65)}...
            </span>
            <span className="timeline-arrow">↗</span>
          </a>
        );
      })}
      {(!semanticPosts || semanticPosts.length === 0) && (
        <div className="timeline-note">{t('social.showingRegional')}</div>
      )}
    </div>
  );
}

function MiniSparkline({ up, symbol }) {
  // Use useMemo to cache sparkline data - only regenerate when symbol or direction changes
  const pathData = useMemo(() => {
    // Use symbol as seed for consistent random data
    const seed = (symbol || 'default').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const points = Array.from({ length: 12 }, (_, i) => {
      const base = up ? 30 + i * 2 : 70 - i * 2;
      // Use deterministic "random" based on seed and index
      const noise = Math.sin(seed * (i + 1) * 0.5) * 10;
      return base + noise;
    });
    
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    
    return points.map((p, i) => {
      const x = (i / (points.length - 1)) * 40;
      const y = 12 - ((p - min) / range) * 12;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [up, symbol]);
  
  return (
    <svg width="40" height="12" style={{ display: 'block' }}>
      <path
        d={pathData}
        fill="none"
        stroke={up ? 'var(--accent-success)' : 'var(--accent-alert)'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Sparkline for market items in feed
function MarketSparkline({ data, isUp, symbol }) {
  const points = useMemo(() => {
    if (data && data.length >= 2) {
      return data.slice(-12);
    }
    // Generate deterministic sample data if no history
    const seed = (symbol || 'default').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 12 }, (_, i) => {
      const base = isUp ? 30 + i * 2 : 70 - i * 2;
      const noise = Math.sin(seed * (i + 1) * 0.5) * 8;
      return base + noise;
    });
  }, [data, isUp, symbol]);
  
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  
  const pathData = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 60;
    const y = 16 - ((p - min) / range) * 16;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return (
    <svg width="60" height="16" style={{ display: 'block' }}>
      <path
        d={pathData}
        fill="none"
        stroke={isUp ? 'var(--accent-success)' : 'var(--accent-alert)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Large chart for workspace
function PriceChart({ data, isUp }) {
  if (!data || data.length < 2) {
    // Generate sample data if no history
    data = Array.from({ length: 24 }, (_, i) => {
      const base = isUp ? 100 + i * 0.5 : 120 - i * 0.5;
      return base + (Math.random() - 0.5) * 5;
    });
  }
  
  const points = data.slice(-24);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 400;
  const height = 160;
  const padding = 20;
  
  const pathData = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = padding + (height - padding * 2) - ((p - min) / range) * (height - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  
  // Create fill area
  const firstX = padding;
  const lastX = padding + (width - padding * 2);
  const fillPath = pathData + ` L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`;
  
  const color = isUp ? 'var(--accent-success)' : 'var(--accent-alert)';
  
  return (
    <div className="price-chart">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line 
            key={i}
            x1={padding} 
            y1={padding + i * (height - padding * 2) / 4} 
            x2={width - padding} 
            y2={padding + i * (height - padding * 2) / 4}
            stroke="var(--border-light)"
            strokeDasharray="2,2"
          />
        ))}
        {/* Fill area */}
        <path
          d={fillPath}
          fill={color}
          fillOpacity="0.1"
        />
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={lastX}
          cy={padding + (height - padding * 2) - ((points[points.length - 1] - min) / range) * (height - padding * 2)}
          r="4"
          fill={color}
        />
      </svg>
      <div className="chart-labels">
        <span>${max.toFixed(2)}</span>
        <span style={{ flex: 1 }} />
        <span>${min.toFixed(2)}</span>
      </div>
    </div>
  );
}

// Odds chart for prediction markets
function OddsChart({ data, currentOdds }) {
  const points = data.slice(-30);
  if (points.length < 2) return null;
  
  // For odds, we use fixed 0-100 range
  const min = 0;
  const max = 100;
  const width = 400;
  const height = 140;
  const padding = 25;
  
  const pathData = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = padding + (height - padding * 2) - ((p - min) / (max - min)) * (height - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  
  const firstX = padding;
  const lastX = padding + (width - padding * 2);
  const fillPath = pathData + ` L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`;
  
  // Color based on odds direction
  const firstVal = points[0];
  const lastVal = points[points.length - 1];
  const isUp = lastVal >= firstVal;
  const color = 'var(--accent-data)';
  
  // 50% line position
  const fiftyY = padding + (height - padding * 2) / 2;
  
  return (
    <div className="price-chart">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines at 25%, 50%, 75% */}
        {[0, 25, 50, 75, 100].map((val, i) => {
          const y = padding + (height - padding * 2) - (val / 100) * (height - padding * 2);
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke={val === 50 ? 'var(--border-strong)' : 'var(--border-light)'}
                strokeDasharray={val === 50 ? '4,2' : '2,2'}
              />
              <text
                x={padding - 4}
                y={y + 3}
                fontSize="9"
                fill="var(--ink-tertiary)"
                textAnchor="end"
              >
                {val}%
              </text>
            </g>
          );
        })}
        {/* Fill area */}
        <path
          d={fillPath}
          fill={color}
          fillOpacity="0.1"
        />
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current value dot */}
        <circle
          cx={lastX}
          cy={padding + (height - padding * 2) - ((lastVal - min) / (max - min)) * (height - padding * 2)}
          r="5"
          fill={color}
        />
        {/* Current value label */}
        <text
          x={lastX + 8}
          y={padding + (height - padding * 2) - ((lastVal - min) / (max - min)) * (height - padding * 2) + 4}
          fontSize="11"
          fontWeight="600"
          fill={color}
        >
          {lastVal.toFixed(0)}%
        </text>
      </svg>
    </div>
  );
}

function NavItem({ active, onClick, label, count, alert }) {
  return (
    <div 
      className={`nav-item ${active ? 'active' : ''} ${alert ? 'alert' : ''}`}
      onClick={onClick}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`count-badge ${alert ? 'alert' : ''}`}>{count}</span>
      )}
    </div>
  );
}

// ========== Feed Panel ==========
function FeedPanel({ activeNav, activeTab, setActiveTab, items, selectedItem, setSelectedItem, selectPrediction, loading }) {
  const { t } = useTranslation();
  
  const getTitle = () => {
    if (activeNav === 'social') return t('feed.socialIntelligence');
    if (activeNav === 'predictions') return t('feed.predictionMarkets');
    if (activeNav === 'stocks') return t('feed.defenseStocks');
    if (activeNav === 'crypto') return t('feed.cryptocurrency');
    if (activeNav === 'commodities') return t('feed.commodities');
    return t('feed.intelStream');
  };

  const getTabs = () => {
    if (activeNav === 'social') return [
      { key: 'all', label: t('feed.all') },
      { key: 'twitter', label: '𝕏' },
      { key: 'bluesky', label: t('feed.bluesky') },
      { key: 'truth social', label: t('feed.truthSocial') }
    ];
    if (activeNav === 'predictions') return [
      { key: 'all', label: t('feed.all') },
      { key: 'iran', label: t('feed.iran') },
      { key: 'russia', label: t('feed.russia') },
      { key: 'taiwan', label: t('feed.taiwan') }
    ];
    if (activeNav === 'stocks' || activeNav === 'crypto' || activeNav === 'commodities') return [];
    return [
      { key: 'all', label: t('feed.all') },
      { key: 'osint', label: t('feed.osint') },
      { key: 'wire', label: t('feed.wire') },
      { key: 'milint', label: t('feed.milint') }
    ];
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toTimeString().slice(0, 5);
    } catch {
      return '--:--';
    }
  };

  const renderItem = (item, idx) => {
    // Social post
    if (activeNav === 'social') {
      const isActive = selectedItem?.type === 'social' && selectedItem?.data?.id === item.id;
      const platformIcon = item.platform === 'twitter' ? '𝕏' : item.platform === 'bluesky' ? '🦋' : '🔴';
      const platformLabel = item.platform === 'twitter' ? 'TWITTER' : item.platform === 'bluesky' ? 'BLUESKY' : 'TRUTH';
      return (
        <div 
          key={item.id || idx}
          className={`feed-item ${isActive ? 'active' : ''}`}
          onClick={() => setSelectedItem({ type: 'social', data: item })}
        >
          <div className="item-meta">
            <span className="item-source">{platformIcon} {item.handle}</span>
            <span className={`classification-tag ${item.platform === 'truthsocial' ? 'critical' : item.platform === 'twitter' ? 'high' : 'elevated'}`}>
              {platformLabel}
            </span>
          </div>
          <div className="item-summary">{item.text?.slice(0, 100)}</div>
          <div className="item-snippet">
            {formatTime(item.created_at)} — ❤️ {item.likes >= 1000 ? (item.likes/1000).toFixed(0)+'K' : item.likes} 🔁 {item.reposts >= 1000 ? (item.reposts/1000).toFixed(0)+'K' : item.reposts} — {item.region || 'global'}
          </div>
        </div>
      );
    }
    
    // Prediction market
    if (activeNav === 'predictions') {
      const isActive = selectedItem?.type === 'prediction' && selectedItem?.data?.id === item.id;
      return (
        <div 
          key={item.id || idx}
          className={`feed-item ${isActive ? 'active' : ''}`}
          onClick={() => selectPrediction(item)}
        >
          <div className="item-meta">
            <span className="item-source">POLYMARKET</span>
            <span className={`classification-tag ${item.outcome_yes > 60 ? 'critical' : item.outcome_yes > 40 ? 'high' : 'elevated'}`}>
              {item.outcome_yes?.toFixed(0)}% YES
            </span>
          </div>
          <div className="item-summary">{item.question}</div>
          <div className="item-snippet">
            {t('feed.region')}: {item.region} — {t('feed.volume')}: ${(item.volume / 1000).toFixed(0)}K — {t('feed.change')}: {item.change_24h >= 0 ? '+' : ''}{item.change_24h?.toFixed(1)}%
          </div>
        </div>
      );
    }
    
    // Stocks, Crypto, Commodities
    if (activeNav === 'stocks' || activeNav === 'crypto' || activeNav === 'commodities') {
      const itemType = activeNav === 'stocks' ? 'stock' : activeNav === 'crypto' ? 'crypto' : 'commodity';
      const isActive = selectedItem?.type === itemType && selectedItem?.data?.symbol === item.symbol;
      const isUp = item.change_percent >= 0;
      const changeClass = isUp ? 'elevated' : 'critical';
      
      return (
        <div 
          key={item.symbol || idx}
          className={`feed-item ${isActive ? 'active' : ''}`}
          onClick={() => setSelectedItem({ type: itemType, data: item })}
        >
          <div className="item-meta">
            <span className="item-source" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.symbol}</span>
            <span className={`classification-tag ${changeClass}`}>
              {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{item.change_percent?.toFixed(2)}%
            </span>
          </div>
          <div className="item-summary">{item.name}</div>
          <div className="item-snippet" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600 }}>
              ${item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <MarketSparkline data={item.history} isUp={isUp} symbol={item.symbol} />
          </div>
        </div>
      );
    }
    
    // News item (default)
    const isActive = selectedItem?.type === 'news' && selectedItem?.data?.id === item.id;
    const rel = item.relevance_score > 0.7 ? 'critical' : item.relevance_score > 0.4 ? 'high' : 'elevated';
    const relLabel = item.relevance_score > 0.7 ? t('feed.highRel') : item.relevance_score > 0.4 ? t('feed.medRel') : t('feed.lowRel');
    
    return (
      <div 
        key={item.id || idx}
        className={`feed-item ${isActive ? 'active' : ''}`}
        onClick={() => setSelectedItem({ type: 'news', data: item })}
      >
        <div className="item-meta">
          <span className="item-source">{item.source_id || item.source}</span>
          <span className={`classification-tag ${rel}`}>{relLabel}</span>
        </div>
        <div className="item-summary">{item.title}</div>
        <div className="item-snippet">
          {formatTime(item.published)} — {item.summary?.slice(0, 100)}...
        </div>
      </div>
    );
  };

  return (
    <div className="feed-panel">
      <div className="panel-header">
        <h2 className="panel-title">{getTitle()}</h2>
        <div className="panel-action" style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
          {loading ? '↻' : `${items.length} ${t('feed.items')}`}
        </div>
      </div>
      
      <div className="filter-tabs">
        {getTabs().map((tab) => (
          <div 
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="feed-list">
        {items.length === 0 && !loading && (
          <div style={{ padding: '20px', color: 'var(--ink-tertiary)', textAlign: 'center' }}>
            {t('feed.noItems')}
          </div>
        )}
        {items.map((item, idx) => renderItem(item, idx))}
      </div>
    </div>
  );
}

// ========== Workspace ==========
function Workspace({ selectedItem, hotspot, regions, socialPosts, predictions, markets, loadingDetail, selectPrediction }) {
  const { t } = useTranslation();
  
  // Get threat data based on selected item's region
  const getItemRegionData = () => {
    const itemRegion = selectedItem?.data?.region;
    if (itemRegion && regions && regions[itemRegion]) {
      return regions[itemRegion];
    }
    return hotspot; // Fallback to current hotspot
  };
  
  const regionData = getItemRegionData();
  const score = regionData?.total_score?.toFixed(0) || 0;
  const factors = regionData?.factors || {};
  
  const formatDate = () => {
    return new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }).toUpperCase();
  };
  
  // Helper to get display text (content is now translated at API level)
  const getDisplayText = (field) => {
    return selectedItem?.data?.[field] || '';
  };

  if (!selectedItem) {
    return (
      <main className="workspace">
        <div style={{ padding: '40px', color: 'var(--ink-tertiary)', textAlign: 'center' }}>
          {t('workspace.selectItem')}
        </div>
      </main>
    );
  }

  const { type, data: item } = selectedItem;
  
  // Render based on type
  const renderHeader = () => {
    if (type === 'social') {
      const platformDisplay = item.platform === 'twitter' ? 'Twitter/X' : item.platform === 'bluesky' ? 'Bluesky' : 'Truth Social';
      return (
        <>
          <div className="report-classification">{t('workspace.socialIntel')} // {platformDisplay.toUpperCase()}</div>
          <h1>{item.handle}</h1>
          <div className="report-meta-grid">
            <div className="meta-group">
              <label>{t('workspace.author')}</label>
              <span>{item.author}</span>
            </div>
            <div className="meta-group">
              <label>{t('workspace.platform')}</label>
              <span>{platformDisplay}</span>
            </div>
            <div className="meta-group">
              <label>{t('workspace.region')}</label>
              <span>{item.region || 'Global'}</span>
            </div>
          </div>
        </>
      );
    }
    
    if (type === 'prediction') {
      return (
        <>
          <div className="report-classification">{t('workspace.predictionMarket')} // POLYMARKET</div>
          <h1 style={{ fontSize: '24px' }}>{getDisplayText('question')}</h1>
          <div className="report-meta-grid">
            <div className="meta-group">
              <label>{t('workspace.region')}</label>
              <span>{item.region}</span>
            </div>
            <div className="meta-group">
              <label>{t('workspace.volume')}</label>
              <span>${(item.volume / 1000).toFixed(0)}K</span>
            </div>
            <div className="meta-group">
              <label>{t('workspace.endDate')}</label>
              <span>{item.end_date?.slice(0, 10) || 'N/A'}</span>
            </div>
          </div>
        </>
      );
    }
    
    // Stock, Crypto, Commodity
    if (type === 'stock' || type === 'crypto' || type === 'commodity') {
      const categoryLabel = type === 'stock' ? t('workspace.defenseStock') : type === 'crypto' ? t('workspace.cryptocurrency') : t('workspace.commodity');
      const isUp = item.change_percent >= 0;
      return (
        <>
          <div className="report-classification">{categoryLabel} // {item.symbol}</div>
          <h1 style={{ fontFamily: 'var(--font-mono)' }}>{item.name}</h1>
          <div className="report-meta-grid">
            <div className="meta-group">
              <label>{t('workspace.symbol')}</label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.symbol}</span>
            </div>
            <div className="meta-group">
              <label>{t('workspace.price')}</label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                ${item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="meta-group">
              <label>{t('workspace.change24h')}</label>
              <span style={{ color: isUp ? 'var(--accent-success)' : 'var(--accent-alert)', fontWeight: 600 }}>
                {isUp ? '+' : ''}{item.change_percent?.toFixed(2)}%
              </span>
            </div>
          </div>
        </>
      );
    }
    
    // News
    return (
      <>
        <div className="report-classification">
          {item.classification || t('workspace.osint')} // {item.region?.toUpperCase() || t('workspace.global')}
        </div>
        <h1>{getDisplayText('title')}</h1>
        <div className="report-meta-grid">
          <div className="meta-group">
            <label>{t('workspace.source')}</label>
            <span>{item.source}</span>
          </div>
          <div className="meta-group">
            <label>{t('workspace.date')}</label>
            <span>{formatDate()}</span>
          </div>
          <div className="meta-group">
            <label>{t('workspace.region')}</label>
            <span>{regionData?.name || item.region || 'Global'}</span>
          </div>
        </div>
      </>
    );
  };

  const renderContent = () => {
    if (type === 'social') {
      const formatNumber = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
        return n || 0;
      };
      
      const platformName = item.platform === 'twitter' ? 'Twitter/X' : item.platform === 'bluesky' ? 'Bluesky' : 'Truth Social';
      const repostLabel = item.platform === 'twitter' ? t('workspace.reposts') : item.platform === 'bluesky' ? t('workspace.reposts') : t('workspace.retruths');
      const platformColor = item.platform === 'twitter' ? '#1DA1F2' : item.platform === 'bluesky' ? 'var(--accent-data)' : 'var(--accent-alert)';
      
      return (
        <>
          <div className="data-block">
            <div className="section-heading">{t('workspace.postContent')}</div>
            <div className="text-body">
              <p>{getDisplayText('text')}</p>
            </div>
            {item.url && (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: platformColor, marginTop: '12px', display: 'inline-block' }}
              >
                {t('workspace.viewOn', { platform: platformName })} ↗
              </a>
            )}
          </div>
          <div className="data-block">
            <div className="section-heading">{t('workspace.engagement')}<span>{t('workspace.realTime')}</span></div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-val">{formatNumber(item.likes)}</div>
                <div className="stat-label">{t('workspace.likes')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{formatNumber(item.reposts)}</div>
                <div className="stat-label">{repostLabel}</div>
              </div>
              {item.replies !== undefined && (
                <div className="stat-card">
                  <div className="stat-val">{formatNumber(item.replies)}</div>
                  <div className="stat-label">{t('workspace.replies')}</div>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }
    
    // Stock, Crypto, Commodity
    if (type === 'stock' || type === 'crypto' || type === 'commodity') {
      const isUp = item.change_percent >= 0;
      const relatedItems = type === 'stock' ? markets.defense_stocks : 
                           type === 'crypto' ? markets.crypto : markets.commodities;
      const otherItems = relatedItems?.filter(i => i.symbol !== item.symbol).slice(0, 5) || [];
      const relatedLabel = type === 'stock' ? t('workspace.relatedStocks') : type === 'crypto' ? t('workspace.relatedCrypto') : t('workspace.relatedCommodities');
      
      return (
        <>
          <div className="data-block">
            <div className="section-heading">{t('workspace.priceChart')}<span>24H</span></div>
            <PriceChart data={item.history} isUp={isUp} symbol={item.symbol} />
          </div>
          <div className="data-block">
            <div className="section-heading">{t('workspace.marketData')}</div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  ${item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="stat-label">{t('workspace.currentPrice')}</div>
              </div>
              <div className="stat-card">
                <div className={`stat-val ${isUp ? 'success' : 'alert'}`}>
                  {isUp ? '+' : ''}{item.change_percent?.toFixed(2)}%
                </div>
                <div className="stat-label">{t('workspace.change24h')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {isUp ? '+' : '-'}${Math.abs(item.change || 0).toFixed(2)}
                </div>
                <div className="stat-label">{t('workspace.changeDollar')}</div>
              </div>
              {item.volume && (
                <div className="stat-card">
                  <div className="stat-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '16px' }}>
                    {(item.volume / 1000000).toFixed(1)}M
                  </div>
                  <div className="stat-label">{t('workspace.volume')}</div>
                </div>
              )}
            </div>
          </div>
          <div className="data-block">
            <div className="section-heading">{relatedLabel}</div>
            <ul className="entity-list">
              {otherItems.map((m, i) => {
                const mUp = m.change_percent >= 0;
                return (
                  <li key={i} className="entity-item">
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{m.symbol}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>${m.price?.toFixed(2)}</span>
                      <span style={{ color: mUp ? 'var(--accent-success)' : 'var(--accent-alert)', fontSize: '11px' }}>
                        {mUp ? '▲' : '▼'}{mUp ? '+' : ''}{m.change_percent?.toFixed(1)}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      );
    }
    
    if (type === 'prediction') {
      const hasHistory = item.history && item.history.length > 2;
      
      return (
        <>
          {hasHistory ? (
            <div className="data-block">
              <div className="section-heading">{t('workspace.oddsChart')}<span>{t('workspace.yesProbability')}</span></div>
              <OddsChart data={item.history} currentOdds={item.outcome_yes} />
            </div>
          ) : (
            <div className="data-block">
              <div className="section-heading">{t('workspace.oddsChart')}</div>
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-tertiary)', fontSize: '12px' }}>
                {loadingDetail ? t('workspace.loadingHistory') : t('workspace.noHistoryData')}
              </div>
            </div>
          )}
          <div className="data-block">
            <div className="section-heading">{t('workspace.marketData')}<span>{t('workspace.live')}</span></div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-val" style={{ color: 'var(--accent-data)' }}>{item.outcome_yes?.toFixed(0)}%</div>
                <div className="stat-label">{t('workspace.yes')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{item.outcome_no?.toFixed(0)}%</div>
                <div className="stat-label">{t('workspace.no')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">${(item.volume / 1000).toFixed(0)}K</div>
                <div className="stat-label">{t('workspace.totalVol')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">${((item.volume_24h || 0) / 1000).toFixed(0)}K</div>
                <div className="stat-label">{t('workspace.vol24h')}</div>
              </div>
            </div>
          </div>
          <div className="data-block">
            <div className="section-heading">{t('workspace.relatedPredictions')}</div>
            <ul className="entity-list">
              {predictions.filter(p => p.region === item.region && p.id !== item.id).slice(0, 4).map((p, i) => (
                <li 
                  key={i} 
                  className="entity-item clickable" 
                  style={{ flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
                  onClick={() => selectPrediction(p)}
                >
                  <span style={{ fontSize: '11px' }}>{p.question?.slice(0, 50)}...</span>
                  <span style={{ color: 'var(--accent-data)' }}>{p.outcome_yes?.toFixed(0)}% YES</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      );
    }
    
    // News
    return (
      <>
        <div className="data-block">
          <div className="section-heading">
            {t('workspace.intelSummary')}
            <span>{item.source_id}</span>
          </div>
          <div className="text-body">
            <p>{getDisplayText('summary') || getDisplayText('title')}</p>
          </div>
        </div>
        <div className="data-block">
          <div className="section-heading">{t('workspace.threatAssessment')}<span>{t('workspace.realTime')}</span></div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-val">{score}%</div>
              <div className="stat-label">{t('workspace.threatScore')}</div>
            </div>
            <div className="stat-card">
              <div className={`stat-val ${regionData?.alert_level === 'critical' ? 'alert' : ''}`}>
                {regionData?.alert_level?.toUpperCase() || 'N/A'}
              </div>
              <div className="stat-label">{t('workspace.alertLevel')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{Math.round(factors.google_trends || 0)}</div>
              <div className="stat-label">{t('workspace.googleTrends')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{Math.round(factors.news_velocity || 0)}</div>
              <div className="stat-label">{t('workspace.newsVelocity')}</div>
            </div>
          </div>
        </div>
        <div className="data-block">
          <div className="section-heading">{t('workspace.socialIntelligence')}<span>{t('workspace.related')}</span></div>
          <RelatedSocialPosts newsItem={item} socialPosts={socialPosts} />
        </div>
      </>
    );
  };

  return (
    <main className="workspace">
      <div className="report-header">
        <div className="report-title-block">
          {renderHeader()}
        </div>
        <div className="report-actions">
          {type === 'news' && item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn">
              {t('workspace.sourceLink')} ↗
            </a>
          )}
          <button className="btn btn-primary">{t('workspace.archive')}</button>
        </div>
      </div>

      <div className="report-content">
        <div className="content-left">
          {renderContent()}
        </div>

        <div className="content-right">
          {/* Prediction Markets */}
          <div className="data-block">
            <div className="section-heading">{t('workspace.predictionMarkets')}</div>
            <ul className="entity-list">
              {predictions.slice(0, 5).map((p, i) => (
                <li key={i} className="entity-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--ink-secondary)' }}>{p.question?.slice(0, 50)}...</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ color: 'var(--accent-data)', fontWeight: 500 }}>{p.outcome_yes?.toFixed(0)}% YES</span>
                    <span style={{ fontSize: '10px', color: p.change_24h >= 0 ? 'var(--accent-success)' : 'var(--accent-alert)' }}>
                      {p.change_24h >= 0 ? '+' : ''}{p.change_24h?.toFixed(1)}%
                    </span>
                  </div>
                </li>
              ))}
              {predictions.length === 0 && <li className="entity-item">{t('workspace.noPredictionData')}</li>}
            </ul>
          </div>

          {/* Factor Analysis - 7 factors matching backend weights */}
          <div className="data-block">
            <div className="section-heading">{t('workspace.factorAnalysis')}</div>
            <div className="spectrum-chart">
              <div className="spectrum-bar" style={{ height: `${factors.news_velocity || 0}%` }} title={`${Math.round(factors.news_velocity || 0)}%`} />
              <div className="spectrum-bar" style={{ height: `${factors.social_volume || 0}%` }} title={`${Math.round(factors.social_volume || 0)}%`} />
              <div className="spectrum-bar" style={{ height: `${factors.google_trends || 0}%` }} title={`${Math.round(factors.google_trends || 0)}%`} />
              <div className="spectrum-bar highlight" style={{ height: `${factors.sentiment_shift || 0}%` }} title={`${Math.round(factors.sentiment_shift || 0)}%`} />
              <div className="spectrum-bar" style={{ height: `${factors.prediction_volatility || 0}%` }} title={`${Math.round(factors.prediction_volatility || 0)}%`} />
              <div className="spectrum-bar" style={{ height: `${factors.market_movement || 0}%` }} title={`${Math.round(factors.market_movement || 0)}%`} />
              <div className="spectrum-bar" style={{ height: `${factors.event_triggers || 0}%` }} title={`${Math.round(factors.event_triggers || 0)}%`} />
            </div>
            <div className="spectrum-labels">
              <span>{t('workspace.factorNewsVel')}</span>
              <span>{t('workspace.factorSocialVol')}</span>
              <span>{t('workspace.factorTrends')}</span>
              <span>{t('workspace.factorSentiment')}</span>
              <span>{t('workspace.factorPrediction')}</span>
              <span>{t('workspace.factorMarket')}</span>
              <span>{t('workspace.factorEvent')}</span>
            </div>
          </div>

          {/* Commodities */}
          <div className="data-block">
            <div className="section-heading">{t('feed.commodities')}</div>
            <ul className="entity-list">
              {markets.commodities?.map((c, i) => (
                <li key={i} className="entity-item">
                  <span>{c.name}</span>
                  <span style={{ color: c.change_percent >= 0 ? 'var(--accent-success)' : 'var(--accent-alert)' }}>
                    ${c.price?.toFixed(2)} ({c.change_percent >= 0 ? '+' : ''}{c.change_percent?.toFixed(1)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
