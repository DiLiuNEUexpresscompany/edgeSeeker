import { useState, useEffect } from 'react';

export default function MonitorPage() {
  const [time, setTime] = useState(new Date());
  const [hotspot, setHotspot] = useState(null);
  const [regions, setRegions] = useState({});

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/hotspot/all');
        const data = await res.json();
        setRegions(data.regions || {});
        setHotspot(data.current_hotspot);
      } catch (e) { /* ignore */ }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const current = regions[hotspot] || {};
  const level = current.alert_level || 'normal';
  const score = current.total_score?.toFixed(1) || '0.0';

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="sys-info">
          <span className="sys-label">SYS</span>
          <span className="sys-value">EDGE_MONITOR</span>
          <span className="sys-status">TRACKING</span>
        </div>
        <div className="metrics">
          <div className="metric">
            <span className="metric-label">REGION</span>
            <span className="metric-value">{current.name_zh || '—'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">ALERT</span>
            <span className="metric-value" style={{ color: level === 'critical' ? 'var(--red)' : level === 'high' ? 'var(--yellow)' : 'var(--green)' }}>
              {score}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">UTC</span>
            <span className="metric-value">{time.toISOString().slice(11, 19)}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Left Column - Region Status */}
        <div className="col col-left">
          <div className="panel">
            <div className="panel-header">
              <span>REGION_STATUS</span>
              <span>SCORE</span>
            </div>
            <div className="panel-body flush">
              {Object.entries(regions).map(([id, r]) => (
                <RegionRow 
                  key={id} 
                  data={r} 
                  active={id === hotspot} 
                />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span>FACTORS</span>
              <span>{current.name_zh || '—'}</span>
            </div>
            <div className="panel-body flush">
              <SliderRow label="NEWS_VEL" value={current.factors?.news_velocity || 0} />
              <SliderRow label="SOCIAL" value={current.factors?.social_volume || 0} />
              <SliderRow label="SENTIMENT" value={current.factors?.sentiment_shift || 0} />
              <SliderRow label="PREDICT" value={current.factors?.prediction_volatility || 0} />
              <SliderRow label="MARKET" value={current.factors?.market_movement || 0} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span>PREDICTIONS</span>
              <span>POLYMARKET</span>
            </div>
            <div className="panel-body flush">
              <PredRow q="US strikes Iran by Feb 28?" pct={27} change={5} />
              <PredRow q="Israel strikes Iran by Mar 31?" pct={54} change={12} />
              <PredRow q="Regime change before 2027?" pct={39} change={-3} />
            </div>
          </div>
        </div>

        {/* Center Column - News Feed */}
        <div className="col col-center">
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <span>INTEL_FEED</span>
              <span>LIVE</span>
            </div>
            <div className="panel-body flush" style={{ overflowY: 'auto' }}>
              <NewsRow time="00:02" src="REUTERS" title="Second U.S. carrier nears Iran, as Trump warns of 'bad things' without meaningful deal" />
              <NewsRow time="00:08" src="BBC" title="UK blocks US access to British RAF bases for potential Iran strikes" />
              <NewsRow time="00:15" src="AJ" title="Iran threatens to close Strait of Hormuz during expanded IRGC naval drills" />
              <NewsRow time="00:22" src="CNN" title="Oil prices surge to six-month highs with Brent topping $91 amid war fears" />
              <NewsRow time="00:31" src="NPR" title="Netanyahu warns Iran would face 'a response they can't even imagine'" />
              <NewsRow time="00:45" src="FOX" title="Defense stocks rally sharply as Iran tensions escalate; Lockheed up 3.2%" />
              <NewsRow time="00:52" src="AP" title="EU officially designates Iran's Revolutionary Guard as terrorist org" />
              <NewsRow time="01:05" src="RTRS" title="Iranians hold defiant memorial services amid ongoing government crackdown" />
              <NewsRow time="01:18" src="WSJ" title="White House considers 72-hour ultimatum to Tehran on nuclear inspections" />
              <NewsRow time="01:32" src="FT" title="European banks halt all Iran-related transactions amid new sanctions" />
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)' }}>
            <div className="chart-box" style={{ height: '120px' }}>
              <span className="chart-label">NEWS_VOLUME</span>
              <span className="chart-value">3,018</span>
              <MiniChart data={[30,35,32,45,42,55,60,58,72,85,90,95]} color="#60a5fa" />
            </div>
            <div className="chart-box" style={{ height: '120px' }}>
              <span className="chart-label">SOCIAL_VOL</span>
              <span className="chart-value">53.2K</span>
              <MiniChart data={[40,38,45,50,48,55,52,60,65,70,68,75]} color="#a78bfa" />
            </div>
          </div>
        </div>

        {/* Right Column - Timeline & Social */}
        <div className="col col-right">
          <div className="panel">
            <div className="panel-header">
              <span>TIMELINE</span>
              <span>24H</span>
            </div>
            <div className="panel-body flush">
              <TimelineRow time="14:32" type="conflict" text="Trump considers limited strike within days" />
              <TimelineRow time="13:15" type="military" text="IRGC expands naval drills in Hormuz" />
              <TimelineRow time="12:00" type="diplomacy" text="UK denies US access to RAF bases" />
              <TimelineRow time="10:45" type="economy" text="Brent crude hits $91.45/bbl" />
              <TimelineRow time="09:30" type="diplomacy" text="EU designates IRGC as terrorist org" />
              <TimelineRow time="08:15" type="military" text="US carrier Lincoln enters Gulf of Oman" />
            </div>
          </div>

          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <span>SOCIAL_INTEL</span>
              <span>X/BSKY</span>
            </div>
            <div className="panel-body flush" style={{ overflowY: 'auto' }}>
              <TweetRow handle="@IranIntl" text="BREAKING: Iranian Air Force aircraft crashes in western province during night training mission. One pilot confirmed dead." />
              <TweetRow handle="@OSINT_Upd" text="🚨 Satellite imagery shows increased activity at Bandar Abbas naval base. Multiple IRGC vessels preparing for exercises." />
              <TweetRow handle="@WarMonitor" text="US Central Command confirms USS Abraham Lincoln carrier group now positioned in Gulf of Oman." />
              <TweetRow handle="@IntelCrab" text="Reports of unusual air traffic over northern Iraq. Multiple tanker aircraft detected on ADS-B." />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>LOG_OUT: AUTO_TRACKING {current.name_zh || '...'}</span>
        <span>REFRESH: 5s</span>
        <span>v0.2.0</span>
      </footer>
    </div>
  );
}

/* ========== Components ========== */

function RegionRow({ data, active }) {
  const level = data.alert_level || 'normal';
  const score = data.total_score?.toFixed(1) || '0.0';
  
  return (
    <div className="region-status" style={{ background: active ? 'var(--bg-inset)' : 'transparent' }}>
      <div className="region-header">
        <span className="region-name">
          {active && '▶ '}{data.name_zh || '—'}
        </span>
        <span className={`region-score ${level}`}>{score}</span>
      </div>
      <div className="region-bar">
        <div 
          className={`region-bar-fill ${level}`} 
          style={{ width: `${data.total_score || 0}%` }} 
        />
      </div>
    </div>
  );
}

function SliderRow({ label, value }) {
  const v = value?.toFixed(1) || '0.0';
  return (
    <div className="slider-row">
      <span className="slider-label">{label}</span>
      <div className="slider-track">
        <div className="slider-thumb" style={{ left: `${value || 0}%` }} />
      </div>
      <span className="slider-value">{v}</span>
    </div>
  );
}

function NewsRow({ time, src, title }) {
  return (
    <div className="news-row">
      <span className="news-time">{time}</span>
      <span className="news-source">{src}</span>
      <span className="news-title">{title}</span>
    </div>
  );
}

function TimelineRow({ time, type, text }) {
  return (
    <div className="timeline-row">
      <span className="timeline-time">{time}</span>
      <span className={`timeline-type ${type}`}>[{type.toUpperCase().slice(0,4)}]</span>
      <span className="timeline-text">{text}</span>
    </div>
  );
}

function TweetRow({ handle, text }) {
  return (
    <div className="tweet-row">
      <div className="tweet-header">
        <span className="tweet-handle">{handle}</span>
      </div>
      <div className="tweet-text">{text}</div>
    </div>
  );
}

function PredRow({ q, pct, change }) {
  return (
    <div className="pred-row">
      <span className="pred-q">{q}</span>
      <span className="pred-pct">{pct}%</span>
      <span className={`pred-change ${change > 0 ? 'up' : 'down'}`}>
        {change > 0 ? '+' : ''}{change}
      </span>
    </div>
  );
}

function MiniChart({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 80;
  const w = 100;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg 
      viewBox={`0 0 ${w} ${h}`} 
      style={{ 
        position: 'absolute', 
        bottom: '12px', 
        left: '12px', 
        right: '12px',
        height: '60px'
      }}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
