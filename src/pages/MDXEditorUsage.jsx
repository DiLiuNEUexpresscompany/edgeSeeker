// MDXEditorUsage.jsx
import React, { useState, useEffect } from 'react';
import EnhancedMDXEditor from './SimplifiedMDXEditor';

function MDXEditorUsage() {
  const [savedContent, setSavedContent] = useState('');
  
  // Load any previously saved content on component mount
  useEffect(() => {
    const content = localStorage.getItem('mdx-editor-content');
    if (content) {
      setSavedContent(content);
    }
  }, []);
  
  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="app-header" style={{ marginBottom: '20px' }}>
        <h1>Enhanced MDX Editor Example</h1>
        <p>
          这个示例展示了 MDXEditor 的增强版本，包含各种基础和高级功能。
          您可以尝试使用 Markdown 快捷方式（如 # 创建标题，* 创建列表）或使用工具栏进行格式化。
        </p>
      </div>
      
      <div className="editor-wrapper" style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <EnhancedMDXEditor initialContent={savedContent || undefined} />
      </div>
      
      <div className="app-footer" style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>键盘快捷键:</h3>
        <ul>
          <li><strong># 到 ######</strong>: 创建标题 (H1 到 H6)</li>
          <li><strong>* 或 -</strong>: 创建无序列表</li>
          <li><strong>1.</strong>: 创建有序列表</li>
          <li><strong>: 创建引用块</strong></li>
          <li><strong>```js</strong>: 创建代码块 (将 js 替换为目标语言)</li>
          <li><strong>Ctrl/Cmd+B</strong>: 加粗文本</li>
          <li><strong>Ctrl/Cmd+I</strong>: 斜体文本</li>
          <li><strong>Ctrl/Cmd+K</strong>: 插入或编辑链接</li>
        </ul>
        <h3>特殊功能:</h3>
        <ul>
          <li>可以通过"📌 Insert Callout"按钮插入信息提示框</li>
          <li>支持源码视图切换</li>
          <li>实时保存内容到本地存储</li>
        </ul>
      </div>
    </div>
  );
}

export default MDXEditorUsage;