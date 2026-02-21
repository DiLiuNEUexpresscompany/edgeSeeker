/**
 * Mobile Intelligence Page - Full Featured
 * Matches desktop functionality with new Portent design
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

export default function MobileIntelligencePage({ lang = 'en' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [activeNav, setActiveNav] = useState('stream');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // API Data - same as desktop
  const [hotspot, setHotspot] = useState(null);
  const [regions, setRegions] = useState({});
  const [newsItems, setNewsItems] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [markets, setMarkets] = useState({ defense_stocks: [], commodities: [], crypto: [] });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Sync language
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  // Fetch all data - same as desktop
  const fetchAllData = async (isInitial = false, forceRefresh = false) => {
    try {
      if (isInitial) setLoading(true);
      if (forceRefresh) setRefreshing(true);
      
      const refreshParam = forceRefresh ? 'force_refresh=true' : '';
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
        setNewsItems(data.items || []);
      }
      
      if (socialRes.ok) {
        const data = await socialRes.json();
        setSocialPosts(data.items || []);
      }
      
      if (predRes.ok) {
        const data = await predRes.json();
        setPredictions(data.items || []);
      }
      
      if (marketRes.ok) {
        const data = await marketRes.json();
        setMarkets(data);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData(true);
    const interval = setInterval(() => fetchAllData(false), 30000);
    return () => clearInterval(interval);
  }, [lang]);

  // Fetch prediction detail
  const selectPrediction = async (item) => {
    setSelectedItem({ type: 'prediction', data: item });
    setShowDetail(true);
    
    if (!item.history || item.history.length === 0) {
      setLoadingDetail(true);
      try {
        const langParam = lang === 'zh' ? '?lang=zh' : '';
        const res = await fetch(`${API_BASE}/markets/predictions/${item.id}${langParam}`);
        if (res.ok) {
          const detail = await res.json();
          if (!detail.error) {
            setSelectedItem({ type: 'prediction', data: detail });
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

  // Get items for current view
  const getCurrentItems = () => {
    if (activeNav === 'social') {
      if (activeTab === 'all') return socialPosts;
      if (activeTab === 'twitter') return socialPosts.filter(p => p.platform === 'twitter');
      if (activeTab === 'bluesky') return socialPosts.filter(p => p.platform === 'bluesky');
      return socialPosts;
    }
    if (activeNav === 'predictions') {
      if (activeTab === 'all') return predictions;
      return predictions.filter(p => p.region?.toLowerCase().includes(activeTab.toLowerCase()));
    }
    if (activeNav === 'stocks') return markets.defense_stocks || [];
    if (activeNav === 'crypto') return markets.crypto || [];
    if (activeNav === 'commodities') return markets.commodities || [];
    
    // News
    if (activeTab === 'all') return newsItems;
    return newsItems.filter(n => n.source_id?.includes(activeTab.toUpperCase()));
  };

  const items = getCurrentItems();
  const current = regions[hotspot] || {};
  const alertCount = Object.values(regions).filter(r => r.alert_level === 'critical' || r.alert_level === 'high').length;

  // Handlers
  const handleItemClick = (item, type) => {
    if (type === 'prediction') {
      selectPrediction(item);
    } else {
      setSelectedItem({ type, data: item });
      setShowDetail(true);
    }
  };

  const handleBack = () => {
    setShowDetail(false);
  };

  const handleRefresh = () => {
    if (!refreshing) fetchAllData(false, true);
  };

  // Get tabs for current nav
  const getTabs = () => {
    if (activeNav === 'social') return [
      { key: 'all', label: t('feed.all') },
      { key: 'twitter', label: '𝕏' },
      { key: 'bluesky', label: 'Bluesky' },
    ];
    if (activeNav === 'predictions') return [
      { key: 'all', label: t('feed.all') },
      { key: 'iran', label: t('feed.iran') },
      { key: 'russia', label: t('feed.russia') },
    ];
    if (activeNav === 'stocks' || activeNav === 'crypto' || activeNav === 'commodities') return [];
    return [
      { key: 'all', label: t('feed.all') },
      { key: 'osint', label: t('feed.osint') },
      { key: 'wire', label: t('feed.wire') },
    ];
  };

  // Render detail view
  if (showDetail && selectedItem) {
    return (
      <div className="mobile-app">
        <DetailView 
          item={selectedItem}
          regions={regions}
          hotspot={current}
          socialPosts={socialPosts}
          predictions={predictions}
          markets={markets}
          loadingDetail={loadingDetail}
          onBack={handleBack}
          onSelectPrediction={selectPrediction}
          lang={lang}
          t={t}
        />
      </div>
    );
  }

  return (
    <div className="mobile-app">
      {/* Header */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <div className="mobile-header-dot"></div>
          <span className="mobile-header-title">EdgeSeeker</span>
        </div>
        <div className="mobile-header-status">
          {current?.name && (
            <span className={`mobile-status-tag ${current.alert_level}`}>
              {current.name}: {current.total_score?.toFixed(0) || 0}
            </span>
          )}
        </div>
        <button 
          className="mobile-header-btn"
          onClick={() => navigate(lang === 'en' ? '/zh' : '/en')}
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </header>

      {/* Tabs */}
      {getTabs().length > 0 && (
        <div className="mobile-tabs">
          <div className="mobile-tabs-inner">
            {getTabs().map(tab => (
              <button
                key={tab.key}
                className={`mobile-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <main className="mobile-feed">
        {loading ? (
          <div className="mobile-loading">{t('feed.loading') || 'Loading...'}</div>
        ) : items.length === 0 ? (
          <div className="mobile-empty">{t('feed.noItems') || 'No items'}</div>
        ) : (
          <>
            {/* Market Summary Bar (for stream view) */}
            {activeNav === 'stream' && markets.defense_stocks?.length > 0 && (
              <div className="mobile-market-bar">
                {markets.defense_stocks.slice(0, 3).map(s => (
                  <div 
                    key={s.symbol} 
                    className="mobile-ticker-item"
                    onClick={() => handleItemClick(s, 'stock')}
                  >
                    <span className="ticker-symbol">{s.symbol}</span>
                    <span className={`ticker-change ${s.change_percent >= 0 ? 'up' : 'down'}`}>
                      {s.change_percent >= 0 ? '+' : ''}{s.change_percent?.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {markets.commodities?.slice(0, 2).map(c => (
                  <div 
                    key={c.symbol} 
                    className="mobile-ticker-item"
                    onClick={() => handleItemClick(c, 'commodity')}
                  >
                    <span className="ticker-symbol">{c.name?.split(' ')[0]}</span>
                    <span className={`ticker-change ${c.change_percent >= 0 ? 'up' : 'down'}`}>
                      {c.change_percent >= 0 ? '+' : ''}{c.change_percent?.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Items */}
            {items.map((item, idx) => (
              <FeedCard 
                key={item.id || item.symbol || idx}
                item={item}
                type={activeNav}
                isActive={selectedItem?.data?.id === item.id || selectedItem?.data?.symbol === item.symbol}
                onClick={() => {
                  const type = activeNav === 'social' ? 'social' 
                    : activeNav === 'predictions' ? 'prediction'
                    : activeNav === 'stocks' ? 'stock'
                    : activeNav === 'crypto' ? 'crypto'
                    : activeNav === 'commodities' ? 'commodity'
                    : 'news';
                  handleItemClick(item, type);
                }}
                t={t}
              />
            ))}
          </>
        )}
        <div style={{ height: '80px' }}></div>
      </main>

      {/* FAB */}
      <button className="mobile-fab" onClick={handleRefresh}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={refreshing ? 'spinning' : ''}>
          <path d="M23 4v6h-6M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>

      {/* Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <NavButton active={activeNav === 'stream'} onClick={() => { setActiveNav('stream'); setActiveTab('all'); }} icon="stream" label={t('sidebar.intelStream') || 'Stream'} />
        <NavButton active={activeNav === 'social'} onClick={() => { setActiveNav('social'); setActiveTab('all'); }} icon="social" label={t('sidebar.socialIntel') || 'Social'} />
        <NavButton active={activeNav === 'predictions'} onClick={() => { setActiveNav('predictions'); setActiveTab('all'); }} icon="predictions" label={t('sidebar.predictionMarkets') || 'Markets'} />
        <NavButton active={activeNav === 'stocks'} onClick={() => setActiveNav('stocks')} icon="stocks" label={t('sidebar.defenseStocks') || 'Stocks'} badge={alertCount > 0 ? alertCount : null} />
      </nav>
    </div>
  );
}

// ========== Feed Card ==========
function FeedCard({ item, type, isActive, onClick, t }) {
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toTimeString().slice(0, 5);
    } catch { return '--:--'; }
  };

  // News
  if (type === 'stream') {
    const rel = item.relevance_score > 0.7 ? 'red' : item.relevance_score > 0.4 ? 'blue' : '';
    const relLabel = item.relevance_score > 0.7 ? 'HIGH REL' : item.relevance_score > 0.4 ? 'MED REL' : 'LOW REL';
    return (
      <div className={`mobile-card ${isActive ? 'active' : ''}`} onClick={onClick}>
        <div className="mobile-card-header">
          <span className="mobile-card-source">{item.source_id || item.source || 'OSINT'}</span>
          <span className={`mobile-card-tag ${rel}`}>{relLabel}</span>
        </div>
        <h3 className="mobile-card-title">{item.title}</h3>
        <p className="mobile-card-summary">{formatTime(item.published)} — {item.summary?.slice(0, 100)}...</p>
      </div>
    );
  }

  // Social
  if (type === 'social') {
    const icon = item.platform === 'twitter' ? '𝕏' : item.platform === 'bluesky' ? '🦋' : '🔴';
    return (
      <div className={`mobile-card ${isActive ? 'active' : ''}`} onClick={onClick}>
        <div className="mobile-card-header">
          <span className="mobile-card-source">{icon} {item.handle}</span>
          <span className="mobile-card-tag">{item.platform?.toUpperCase()}</span>
        </div>
        <h3 className="mobile-card-title">{item.text?.slice(0, 80)}</h3>
        <p className="mobile-card-summary">
          {formatTime(item.created_at)} — ❤️ {item.likes >= 1000 ? (item.likes/1000).toFixed(0)+'K' : item.likes} 🔁 {item.reposts}
        </p>
      </div>
    );
  }

  // Predictions
  if (type === 'predictions') {
    return (
      <div className={`mobile-card ${isActive ? 'active' : ''}`} onClick={onClick}>
        <div className="mobile-card-header">
          <span className="mobile-card-source">POLYMARKET</span>
          <span className={`mobile-card-tag ${item.outcome_yes > 60 ? 'red' : 'blue'}`}>
            {item.outcome_yes?.toFixed(0)}% YES
          </span>
        </div>
        <h3 className="mobile-card-title">{item.question}</h3>
        <p className="mobile-card-summary">
          {item.region} — Vol: ${(item.volume / 1000).toFixed(0)}K — 24h: {item.change_24h >= 0 ? '+' : ''}{item.change_24h?.toFixed(1)}%
        </p>
      </div>
    );
  }

  // Stocks / Crypto / Commodities
  if (type === 'stocks' || type === 'crypto' || type === 'commodities') {
    const isUp = item.change_percent >= 0;
    return (
      <div className={`mobile-card ${isActive ? 'active' : ''}`} onClick={onClick}>
        <div className="mobile-card-header">
          <span className="mobile-card-source" style={{ fontWeight: 600 }}>{item.symbol}</span>
          <span className={`mobile-card-tag ${isUp ? 'blue' : 'red'}`}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{item.change_percent?.toFixed(2)}%
          </span>
        </div>
        <h3 className="mobile-card-title">{item.name}</h3>
        <div className="mobile-card-price">
          <span className="price-value">${item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <MiniSparkline isUp={isUp} symbol={item.symbol} />
        </div>
      </div>
    );
  }

  return null;
}

// ========== Detail View ==========
function DetailView({ item, regions, hotspot, socialPosts, predictions, markets, loadingDetail, onBack, onSelectPrediction, lang, t }) {
  const { type, data } = item;
  const regionData = data?.region && regions[data.region] ? regions[data.region] : hotspot;
  const factors = regionData?.factors || {};

  return (
    <>
      {/* Detail Header */}
      <header className="mobile-detail-header">
        <button className="mobile-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <span className="mobile-detail-label">
          {type === 'news' ? (data.source_id || 'OSINT') 
            : type === 'social' ? data.platform?.toUpperCase()
            : type === 'prediction' ? 'POLYMARKET'
            : data.symbol}
        </span>
        <div style={{ flex: 1 }} />
      </header>

      {/* Detail Content */}
      <div className="mobile-detail-content">
        {/* Title */}
        <h1 className="mobile-detail-title">
          {type === 'news' ? data.title 
            : type === 'social' ? data.text
            : type === 'prediction' ? data.question
            : data.name}
        </h1>

        {/* Meta */}
        <div className="mobile-detail-meta">
          {type === 'news' && <span>{data.source} • {data.region || 'Global'}</span>}
          {type === 'social' && <span>{data.handle} • {data.author}</span>}
          {type === 'prediction' && <span>{data.region} • Vol: ${(data.volume/1000).toFixed(0)}K</span>}
          {(type === 'stock' || type === 'crypto' || type === 'commodity') && (
            <span>${data.price?.toFixed(2)} • {data.change_percent >= 0 ? '+' : ''}{data.change_percent?.toFixed(2)}%</span>
          )}
        </div>

        {/* Type-specific content */}
        {type === 'news' && (
          <>
            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.intelSummary') || 'Intelligence Summary'}
                <span>{data.source_id || 'OSINT'}</span>
              </div>
              <p className="mobile-section-text">{data.summary || data.title}</p>
            </div>

            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.threatAssessment') || 'Threat Assessment'}
                <span>{t('workspace.realTime') || 'REAL-TIME'}</span>
              </div>
              <div className="mobile-stat-grid cols-4">
                <div className="mobile-stat">
                  <span className="mobile-stat-value">{regionData?.total_score?.toFixed(0) || 0}%</span>
                  <span className="mobile-stat-label">{t('workspace.threatScore') || 'Threat Score'}</span>
                </div>
                <div className="mobile-stat">
                  <span className={`mobile-stat-value ${regionData?.alert_level === 'critical' ? 'alert' : ''}`}>
                    {regionData?.alert_level?.toUpperCase() || 'N/A'}
                  </span>
                  <span className="mobile-stat-label">{t('workspace.alertLevel') || 'Alert Level'}</span>
                </div>
                <div className="mobile-stat">
                  <span className="mobile-stat-value">{Math.round(factors.google_trends || 0)}</span>
                  <span className="mobile-stat-label">{t('workspace.googleTrends') || 'Google Trends'}</span>
                </div>
                <div className="mobile-stat">
                  <span className="mobile-stat-value">{Math.round(factors.news_velocity || 0)}</span>
                  <span className="mobile-stat-label">{t('workspace.newsVelocity') || 'News Velocity'}</span>
                </div>
              </div>
            </div>

            {/* Related Social */}
            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.socialIntelligence') || 'Social Intelligence'}
                <span>{t('workspace.related') || 'RELATED'}</span>
              </div>
              {socialPosts.filter(p => p.region === data.region).slice(0, 3).map((post, i) => (
                <div key={i} className="mobile-related-item">
                  <span className="related-platform">{post.platform === 'twitter' ? '𝕏' : '🦋'}</span>
                  <span className="related-text">{post.text?.slice(0, 60)}...</span>
                </div>
              ))}
            </div>

            {data.url && (
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="mobile-detail-link">
                {t('workspace.sourceLink') || 'View Source'} ↗
              </a>
            )}
          </>
        )}

        {type === 'social' && (
          <>
            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.postContent') || 'Post Content'}
              </div>
              <p className="mobile-section-text">{data.text}</p>
            </div>

            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.engagement') || 'Engagement'}
                <span>{t('workspace.realTime') || 'REAL-TIME'}</span>
              </div>
              <div className="mobile-stat-grid cols-3">
                <div className="mobile-stat">
                  <span className="mobile-stat-value">{data.likes >= 1000 ? (data.likes/1000).toFixed(1)+'K' : data.likes}</span>
                  <span className="mobile-stat-label">{t('workspace.likes') || 'Likes'}</span>
                </div>
                <div className="mobile-stat">
                  <span className="mobile-stat-value">{data.reposts >= 1000 ? (data.reposts/1000).toFixed(1)+'K' : data.reposts}</span>
                  <span className="mobile-stat-label">{t('workspace.reposts') || 'Reposts'}</span>
                </div>
              </div>
            </div>

            {data.url && (
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="mobile-detail-link">
                {t('workspace.viewOn', { platform: data.platform }) || 'View Post'} ↗
              </a>
            )}
          </>
        )}

        {type === 'prediction' && (
          <>
            {/* Odds Chart */}
            {data.history && data.history.length > 2 && (
              <div className="mobile-section">
                <div className="mobile-section-title">
                  {t('workspace.oddsChart') || 'Odds Chart'}
                  <span>{t('workspace.yesProbability') || 'YES PROBABILITY'}</span>
                </div>
                <OddsChart data={data.history} />
              </div>
            )}

            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.marketData') || 'Market Data'}
                <span>{t('workspace.live') || 'LIVE'}</span>
              </div>
              <div className="mobile-stat-grid cols-4">
                <div className="mobile-stat">
                  <span className="mobile-stat-value">{data.outcome_yes?.toFixed(0)}%</span>
                  <span className="mobile-stat-label">{t('workspace.yes') || 'Yes'}</span>
                </div>
                <div className="mobile-stat">
                  <span className="mobile-stat-value">{data.outcome_no?.toFixed(0)}%</span>
                  <span className="mobile-stat-label">{t('workspace.no') || 'No'}</span>
                </div>
                <div className="mobile-stat">
                  <span className="mobile-stat-value">${(data.volume/1000).toFixed(0)}K</span>
                  <span className="mobile-stat-label">{t('workspace.totalVol') || 'Total Vol'}</span>
                </div>
                <div className="mobile-stat">
                  <span className="mobile-stat-value">${((data.volume_24h || 0)/1000).toFixed(0)}K</span>
                  <span className="mobile-stat-label">{t('workspace.vol24h') || '24H Vol'}</span>
                </div>
              </div>
            </div>

            {/* Related Predictions */}
            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.relatedPredictions') || 'Related Predictions'}
              </div>
              {predictions.filter(p => p.region === data.region && p.id !== data.id).slice(0, 3).map((p, i) => (
                <div key={i} className="mobile-related-item" onClick={() => onSelectPrediction(p)}>
                  <span className="related-text">{p.question?.slice(0, 50)}...</span>
                  <span className="related-odds">{p.outcome_yes?.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </>
        )}

        {(type === 'stock' || type === 'crypto' || type === 'commodity') && (
          <>
            {/* Price Chart */}
            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.priceChart') || 'Price Chart'}
                <span>24H</span>
              </div>
              <PriceChart data={data.history} isUp={data.change_percent >= 0} />
            </div>

            <div className="mobile-section">
              <div className="mobile-section-title">
                {t('workspace.marketData') || 'Market Data'}
              </div>
              <div className="mobile-stat-grid cols-3">
                <div className="mobile-stat">
                  <span className="mobile-stat-value">${data.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="mobile-stat-label">{t('workspace.currentPrice') || 'Current Price'}</span>
                </div>
                <div className="mobile-stat">
                  <span className={`mobile-stat-value ${data.change_percent >= 0 ? 'up' : 'down'}`}>
                    {data.change_percent >= 0 ? '+' : ''}{data.change_percent?.toFixed(2)}%
                  </span>
                  <span className="mobile-stat-label">{t('workspace.change24h') || '24H Change'}</span>
                </div>
                <div className="mobile-stat">
                  <span className="mobile-stat-value">
                    {data.change >= 0 ? '+' : '-'}${Math.abs(data.change || 0).toFixed(2)}
                  </span>
                  <span className="mobile-stat-label">{t('workspace.changeDollar') || '$ Change'}</span>
                </div>
              </div>
            </div>

            {/* Related items */}
            <div className="mobile-section">
              <div className="mobile-section-title">
                {type === 'stock' ? (t('workspace.relatedStocks') || 'Related Defense Stocks') 
                  : type === 'crypto' ? (t('workspace.relatedCrypto') || 'Related Crypto') 
                  : (t('workspace.relatedCommodities') || 'Related Commodities')}
              </div>
              {(type === 'stock' ? markets.defense_stocks : type === 'crypto' ? markets.crypto : markets.commodities)
                ?.filter(m => m.symbol !== data.symbol).slice(0, 4).map((m, i) => (
                <div key={i} className="mobile-related-item">
                  <span className="related-symbol">{m.symbol}</span>
                  <span className="related-price">${m.price?.toFixed(2)}</span>
                  <span className={`related-change ${m.change_percent >= 0 ? 'up' : 'down'}`}>
                    {m.change_percent >= 0 ? '+' : ''}{m.change_percent?.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Bottom spacer */}
        <div style={{ height: '40px' }}></div>
      </div>
    </>
  );
}

// ========== Components ==========
function NavButton({ active, onClick, icon, label, badge }) {
  const icons = {
    stream: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    social: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    predictions: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    stocks: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  };

  return (
    <button className={`mobile-nav-btn ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="mobile-nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {icons[icon]}
        </svg>
        {badge && <span className="mobile-nav-badge">{badge}</span>}
      </div>
      <span>{label}</span>
    </button>
  );
}

function MiniSparkline({ isUp, symbol }) {
  const pathData = useMemo(() => {
    const seed = (symbol || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const points = Array.from({ length: 12 }, (_, i) => {
      const base = isUp ? 30 + i * 2 : 70 - i * 2;
      const noise = Math.sin(seed * (i + 1) * 0.5) * 10;
      return base + noise;
    });
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    return points.map((p, i) => {
      const x = (i / (points.length - 1)) * 50;
      const y = 14 - ((p - min) / range) * 14;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [isUp, symbol]);

  return (
    <svg width="50" height="16" className="mini-sparkline">
      <path d={pathData} fill="none" stroke={isUp ? '#22C55E' : '#EF4444'} strokeWidth="1.5"/>
    </svg>
  );
}

function PriceChart({ data, isUp }) {
  const points = useMemo(() => {
    if (data && data.length >= 2) return data.slice(-24);
    return Array.from({ length: 24 }, (_, i) => {
      const base = isUp ? 100 + i * 0.5 : 120 - i * 0.5;
      return base + (Math.random() - 0.5) * 5;
    });
  }, [data, isUp]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 300;
  const height = 100;
  const padding = 10;

  const pathData = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = padding + (height - padding * 2) - ((p - min) / range) * (height - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const color = isUp ? '#22C55E' : '#EF4444';

  return (
    <div className="mobile-chart">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={pathData} fill="none" stroke={color} strokeWidth="2"/>
      </svg>
    </div>
  );
}

function OddsChart({ data }) {
  const points = data.slice(-30);
  if (points.length < 2) return null;

  const width = 300;
  const height = 80;
  const padding = 10;

  const pathData = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = padding + (height - padding * 2) - (p / 100) * (height - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="mobile-chart">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* 50% line */}
        <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#A3A19C" strokeDasharray="4,2"/>
        <path d={pathData} fill="none" stroke="#2C4F7C" strokeWidth="2"/>
      </svg>
    </div>
  );
}
