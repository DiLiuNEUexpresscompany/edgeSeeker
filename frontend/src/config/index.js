/**
 * EdgeSeeker 前端配置
 */

// 后端 API 地址
// 生产环境使用 Zeabur 部署的后端
const isDev = import.meta.env.DEV;
export const API_BASE_URL = isDev 
  ? 'http://localhost:8080/api/v1'  // 本地开发环境
  : 'https://edgeseeker.zeabur.app/api/v1';  // 生产环境

// 热点地区配置
export const REGIONS = {
  'israel-palestine': {
    id: 'israel-palestine',
    name: 'Israel-Palestine',
    nameCn: '巴以',
    color: '#3B82F6',
    icon: '🇮🇱'
  },
  'russia-ukraine': {
    id: 'russia-ukraine', 
    name: 'Russia-Ukraine',
    nameCn: '俄乌',
    color: '#EF4444',
    icon: '🇺🇦'
  },
  'taiwan-strait': {
    id: 'taiwan-strait',
    name: 'Taiwan Strait',
    nameCn: '台海',
    color: '#10B981',
    icon: '🇹🇼'
  },
  'iran': {
    id: 'iran',
    name: 'Iran',
    nameCn: '伊朗',
    color: '#F59E0B',
    icon: '🇮🇷'
  },
  'korea': {
    id: 'korea',
    name: 'Korean Peninsula',
    nameCn: '朝鲜半岛',
    color: '#8B5CF6',
    icon: '🇰🇵'
  }
};

// 事件类型配置
export const EVENT_TYPES = {
  conflict: { name: 'Conflict', nameCn: '冲突', color: '#EF4444' },
  diplomacy: { name: 'Diplomacy', nameCn: '外交', color: '#3B82F6' },
  sanctions: { name: 'Sanctions', nameCn: '制裁', color: '#F59E0B' },
  military: { name: 'Military', nameCn: '军事', color: '#6B7280' },
  economy: { name: 'Economy', nameCn: '经济', color: '#10B981' },
  protest: { name: 'Protest', nameCn: '抗议', color: '#8B5CF6' },
  other: { name: 'Other', nameCn: '其他', color: '#9CA3AF' }
};

// 刷新间隔（毫秒）
export const REFRESH_INTERVALS = {
  breakingNews: 30000,      // 30秒
  headlines: 60000,         // 1分钟
  socialFeed: 30000,        // 30秒
  markets: 60000,           // 1分钟
  hotspot: 300000           // 5分钟
};

export default {
  API_BASE_URL,
  REGIONS,
  EVENT_TYPES,
  REFRESH_INTERVALS
};
