import express from 'express';
import cors from 'cors';

import { setupMockServer } from './mockApi.js';
// 确保文件名后缀是 `.js`

const app = express();
app.use(cors());
app.use(express.json());

// 运行 mock 服务器
setupMockServer(app);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ API 服务器运行在 http://localhost:${PORT}`);
});
