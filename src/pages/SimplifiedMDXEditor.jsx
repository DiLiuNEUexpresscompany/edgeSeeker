// EnhancedMDXEditor.jsx
import React, { useState, useCallback } from 'react';
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  // 基础插件
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  // 文本格式化
  BoldItalicUnderlineToggles,
  UndoRedo,
  BlockTypeSelect,
  CreateLink,
  // 特殊块
  InsertThematicBreak,
  diffSourcePlugin,
  frontmatterPlugin,
  // 链接和媒体
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  InsertImage,
  // 表格
  tablePlugin,
  InsertTable,
  // 代码和Markdown
  codeBlockPlugin,
  codeMirrorPlugin,
  InsertCodeBlock,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  // 高级功能
  markdownShortcutPlugin,
  // 其他工具栏组件
  ListsToggle,
  Separator,
  // 实时预览和编辑
  ButtonWithTooltip,
  DiffSourceToggleWrapper,
  // JSX支持
  jsxPlugin,
} from '@mdxeditor/editor';

// List of supported code languages
const CODE_LANGUAGES = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TypeScript JSX',
  python: 'Python',
  java: 'Java',
  css: 'CSS',
  html: 'HTML',
  json: 'JSON',
  markdown: 'Markdown',
  sql: 'SQL',
  bash: 'Bash',
  php: 'PHP',
};

// Image upload handler
async function imageUploadHandler(image) {
  try {
    // In a real app, you would upload the image to your server
    // This is a placeholder implementation
    console.log('Image upload requested:', image);
    
    // Simulating a successful upload with a placeholder image
    return 'https://picsum.photos/800/400';
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

// Custom toolbar button component
function CustomToolbarButton({ title, onClick, icon }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className="toolbar-btn"
      style={{ 
        padding: '4px 8px', 
        background: 'none', 
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{title}</span>
    </button>
  );
}

function EnhancedMDXEditor({ initialContent = "# Welcome to the Enhanced MDX Editor\n\nStart typing to create your content..." }) {
  // 编辑器实例引用
  const [editorRef, setEditorRef] = useState(null);
  
  // 显示差异视图状态
  const [showDiff, setShowDiff] = useState(false);
  
  // 存储编辑器内容
  const [content, setContent] = useState(initialContent);
  
  // 编辑器变更处理
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
  }, []);
  
  // 保存内容
  const saveContent = useCallback(() => {
    // 实际应用中可以将内容保存到服务器或本地存储
    console.log('Saving content:', content);
    localStorage.setItem('mdx-editor-content', content);
    alert('Content saved successfully!');
  }, [content]);
  
  // 插入自定义组件
  const insertCallout = useCallback(() => {
    if (editorRef) {
      editorRef.insertJsx('Callout', { type: 'info', title: 'Info Callout' }, 'Callout content here');
    }
  }, [editorRef]);
  
  // 自定义工具栏组件
  const CustomToolbarButton = useCallback(({ title, onClick, icon }) => (
    <button 
      onClick={onClick}
      title={title}
      className="toolbar-btn"
      style={{ 
        padding: '4px 8px', 
        background: 'none', 
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{title}</span>
    </button>
  ), []);

  return (
    <div className="mdx-editor-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 编辑器顶部控制栏 */}
      <div className="editor-controls" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
        <div>
          <CustomToolbarButton 
            title="Save" 
            onClick={saveContent}
            icon="💾"
          />
          <CustomToolbarButton 
            title={showDiff ? "Hide Source" : "Show Source"} 
            onClick={() => setShowDiff(!showDiff)}
            icon="📄"
          />
        </div>
        <div>
          <CustomToolbarButton 
            title="Insert Callout" 
            onClick={insertCallout}
            icon="📌"
          />
        </div>
      </div>
      
      {/* MDX Editor instance */}
      <MDXEditor
        ref={setEditorRef}
        markdown={content}
        onChange={handleContentChange}
        placeholder="开始编写您的MDX内容..."
        contentEditableClassName="prose max-w-full"
        className="mdx-editor"
        plugins={[
          // 基础文本编辑插件
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          
          // 链接和媒体插件
          linkPlugin(),
          linkDialogPlugin({
            linkAutocompleteSuggestions: [
              'https://example.com', 
              'https://github.com', 
              'https://mdxjs.com',
              'https://docs.mdxeditor.dev'
            ]
          }),
          imagePlugin({
            imageUploadHandler,
            imageAutocompleteSuggestions: [
              'https://picsum.photos/200',
              'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6',
              'https://plus.unsplash.com/premium_photo-1684520359349-8a1fc2fcd54c'
            ]
          }),
          
          // 表格支持
          tablePlugin(),
          
          // 代码块支持
          codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
          codeMirrorPlugin({ 
            codeBlockLanguages: CODE_LANGUAGES,
            codeMirrorOptions: {
              theme: 'light',
              lineNumbers: true,
              lineWrapping: true
            }
          }),
          
          // Markdown增强功能
          markdownShortcutPlugin(),
          frontmatterPlugin(),
          
          // JSX组件支持
          jsxPlugin(),
          
          // 差异视图
          diffSourcePlugin({ viewMode: showDiff ? 'rich-text-with-diff' : 'rich-text' }),
          
          // 工具栏配置
          toolbarPlugin({
            toolbarContents: () => (
              <div className="toolbar-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <Separator />
                <InsertCodeBlock />
                <Separator />
                <InsertThematicBreak />
                <Separator />
                <ConditionalContents
                  options={[
                    {
                      when: (editor) => editor?.activePlugin === 'diff-source',
                      contents: () => <DiffSourceToggleWrapper />
                    },
                    {
                      when: (editor) => editor?.editorType === 'codeblock',
                      contents: () => <ChangeCodeMirrorLanguage />
                    }
                  ]}
                />
              </div>
            )
          }),
        ]}
      />
      
      {/* Status bar */}
      <div className="editor-status-bar" style={{ padding: '4px 8px', fontSize: '12px', color: '#666', borderTop: '1px solid #eee' }}>
        {content.length} characters
      </div>
    </div>
  );
}

export default EnhancedMDXEditor;