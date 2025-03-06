import asyncio
import aiohttp
import aiofiles
import os
import re
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import redis.asyncio as aioredis  # 使用异步版 Redis 客户端

# 配置参数
OUTPUT_DIR = "cnn_articles"  # 输出目录
LOG_FILE = os.path.join(OUTPUT_DIR, "crawler_log.txt")  # 日志文件
ERROR_LOG_FILE = os.path.join(OUTPUT_DIR, "error_log.txt")  # 错误日志
BATCH_SIZE = 5  # 并发爬取数量
REQUEST_DELAY = 0.5  # 请求延迟（秒）
CATEGORIES = ["world", "science", "business", "us", "politics"]

# 确保输出目录存在
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def log_message(message, file_path=LOG_FILE):
    """记录消息到日志文件并输出到控制台"""
    async with aiofiles.open(file_path, "a", encoding="utf-8") as f:
        await f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")
    print(message)

async def fetch_sitemap(url, session):
    """获取站点地图内容"""
    try:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.text()
            else:
                await log_message(f"获取站点地图失败: {url} (状态码: {response.status})", ERROR_LOG_FILE)
                return None
    except Exception as e:
        await log_message(f"获取站点地图错误: {url} ({str(e)})", ERROR_LOG_FILE)
        return None

async def get_cnn_article_urls():
    """获取CNN今日文章的URL列表"""
    today = datetime.today()
    today_str = today.strftime("%Y-%m-%d")
    year_str = today.strftime("%Y")
    month_str = today.strftime("%m")
    
    await log_message(f"🔍 开始爬取CNN今日 ({today_str}) 文章...")
    
    base_url = "https://www.cnn.com/sitemap/article.xml"
    
    async with aiohttp.ClientSession() as session:
        sitemap_content = await fetch_sitemap(base_url, session)
        if not sitemap_content:
            return []
        
        await log_message(f"✅ 成功获取主站点地图")
        
        try:
            namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            root = ET.fromstring(sitemap_content)
            
            article_sitemaps = []
            current_month_pattern = f"/{year_str}/{month_str}"
            
            for sitemap in root.findall(".//ns:sitemap", namespace):
                loc_elem = sitemap.find("ns:loc", namespace)
                if loc_elem is not None:
                    sitemap_url = loc_elem.text
                    for category in CATEGORIES:
                        if category in sitemap_url and current_month_pattern in sitemap_url:
                            article_sitemaps.append((sitemap_url, category))
                            break
            
            await log_message(f"✅ 找到 {len(article_sitemaps)} 个当月文章站点地图")
            
            if not article_sitemaps:
                for sitemap in root.findall(".//ns:sitemap", namespace):
                    loc_elem = sitemap.find("ns:loc", namespace)
                    if loc_elem is not None:
                        sitemap_url = loc_elem.text
                        for category in CATEGORIES:
                            if category in sitemap_url and f"/{year_str}/" in sitemap_url:
                                article_sitemaps.append((sitemap_url, category))
                                break
                await log_message(f"✅ 找到 {len(article_sitemaps)} 个当年文章站点地图")
            
            article_sitemaps = article_sitemaps[:5]  # 最多处理5个站点地图
            all_articles = []
            
            for sitemap_url, category in article_sitemaps:
                await log_message(f"🔍 处理站点地图: {sitemap_url} (类别: {category})")
                sub_sitemap_content = await fetch_sitemap(sitemap_url, session)
                if not sub_sitemap_content:
                    continue
                
                try:
                    sub_root = ET.fromstring(sub_sitemap_content)
                    sub_namespace = {
                        'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
                        'image': 'http://www.google.com/schemas/sitemap-image/1.1',
                        'news': 'http://www.google.com/schemas/sitemap-news/0.9'
                    }
                    
                    today_articles = []
                    for url_elem in sub_root.findall(".//ns:url", sub_namespace):
                        try:
                            loc_elem = url_elem.find("ns:loc", sub_namespace)
                            if loc_elem is None:
                                continue
                            article_url = loc_elem.text
                            
                            lastmod_elem = url_elem.find("ns:lastmod", sub_namespace)
                            pub_date = lastmod_elem.text if lastmod_elem is not None else None
                            
                            if pub_date is None:
                                news_elem = url_elem.find(".//news:news", sub_namespace)
                                if news_elem is not None:
                                    pub_date_elem = news_elem.find(".//news:publication_date", sub_namespace)
                                    if pub_date_elem is not None:
                                        pub_date = pub_date_elem.text
                            
                            if not pub_date or today_str not in pub_date:
                                continue
                            
                            title = None
                            news_elem = url_elem.find(".//news:news", sub_namespace)
                            if news_elem is not None:
                                title_elem = news_elem.find(".//news:title", sub_namespace)
                                if title_elem is not None:
                                    title = title_elem.text
                            
                            image_url = None
                            image_elem = url_elem.find(".//image:image", sub_namespace)
                            if image_elem is not None:
                                image_loc = image_elem.find(".//image:loc", sub_namespace)
                                if image_loc is not None:
                                    image_url = image_loc.text
                                if title is None:
                                    image_title = image_elem.find(".//image:title", sub_namespace)
                                    if image_title is not None:
                                        title = image_title.text
                            
                            today_articles.append({
                                "website": "CNN",
                                "url": article_url,
                                "title": title or "未找到标题",
                                "date": pub_date,
                                "image": image_url,
                                "category": category  # 添加类别标签
                            })
                        except Exception as e:
                            await log_message(f"处理文章错误: {str(e)}", ERROR_LOG_FILE)
                    
                    await log_message(f"✅ 在站点地图 {sitemap_url} 中找到 {len(today_articles)} 篇今日文章")
                    all_articles.extend(today_articles)
                    
                except ET.ParseError as e:
                    await log_message(f"解析站点地图错误: {sitemap_url} ({str(e)})", ERROR_LOG_FILE)
            
            if len(all_articles) < 5:
                await log_message(f"⚠️ 只找到 {len(all_articles)} 篇今日文章，尝试获取更多文章...")
                
                for sitemap_url, category in article_sitemaps:
                    sub_sitemap_content = await fetch_sitemap(sitemap_url, session)
                    if not sub_sitemap_content:
                        continue
                    
                    try:
                        sub_root = ET.fromstring(sub_sitemap_content)
                        sub_namespace = {
                            'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
                            'image': 'http://www.google.com/schemas/sitemap-image/1.1',
                            'news': 'http://www.google.com/schemas/sitemap-news/0.9'
                        }
                        
                        for url_elem in sub_root.findall(".//ns:url", sub_namespace)[:10]:
                            try:
                                loc_elem = url_elem.find("ns:loc", sub_namespace)
                                if loc_elem is None:
                                    continue
                                article_url = loc_elem.text
                                
                                if any(a["url"] == article_url for a in all_articles):
                                    continue
                                
                                lastmod_elem = url_elem.find("ns:lastmod", sub_namespace)
                                pub_date = lastmod_elem.text if lastmod_elem is not None else None
                                
                                if pub_date is None:
                                    news_elem = url_elem.find(".//news:news", sub_namespace)
                                    if news_elem is not None:
                                        pub_date_elem = news_elem.find(".//news:publication_date", sub_namespace)
                                        if pub_date_elem is not None:
                                            pub_date = pub_date_elem.text
                                
                                title = None
                                news_elem = url_elem.find(".//news:news", sub_namespace)
                                if news_elem is not None:
                                    title_elem = news_elem.find(".//news:title", sub_namespace)
                                    if title_elem is not None:
                                        title = title_elem.text
                                
                                image_url = None
                                image_elem = url_elem.find(".//image:image", sub_namespace)
                                if image_elem is not None:
                                    image_loc = image_elem.find(".//image:loc", sub_namespace)
                                    if image_loc is not None:
                                        image_url = image_loc.text
                                    if title is None:
                                        image_title = image_elem.find(".//image:title", sub_namespace)
                                        if image_title is not None:
                                            title = image_title.text
                                
                                all_articles.append({
                                    "website": "CNN",
                                    "url": article_url,
                                    "title": title or "未找到标题",
                                    "date": pub_date or "未知日期",
                                    "image": image_url,
                                    "category": category  # 添加类别标签
                                })
                                
                                if len(all_articles) >= 20:
                                    break
                                    
                            except Exception as e:
                                await log_message(f"处理文章错误: {str(e)}", ERROR_LOG_FILE)
                            
                    except ET.ParseError as e:
                        await log_message(f"解析站点地图错误: {sitemap_url} ({str(e)})", ERROR_LOG_FILE)
            
            await log_message(f"✅ 最终获取到 {len(all_articles)} 篇文章")
            return all_articles
            
        except ET.ParseError as e:
            await log_message(f"解析主站点地图错误: {str(e)}", ERROR_LOG_FILE)
            return []
        except Exception as e:
            await log_message(f"处理站点地图错误: {str(e)}", ERROR_LOG_FILE)
            import traceback
            await log_message(traceback.format_exc(), ERROR_LOG_FILE)
            return []

async def fetch_article_details(article, session):
    """从文章网页获取更多详情"""
    url = article["url"]
    
    try:
        async with session.get(url) as response:
            if response.status != 200:
                return article
            
            html_content = await response.text()
            
            if article["title"] == "未找到标题":
                title_match = re.search(r'<title>(.*?)</title>', html_content)
                if title_match:
                    article["title"] = title_match.group(1).replace(" - CNN", "").strip()
            
            if not article.get("image"):
                img_match = re.search(r'<meta property="og:image" content="([^"]+)"', html_content)
                if img_match:
                    article["image"] = img_match.group(1)
                else:
                    img_match = re.search(r'<img[^>]+src="([^"]+)"', html_content)
                    if img_match:
                        image_url = img_match.group(1)
                        if image_url.startswith('/'):
                            image_url = 'https://www.cnn.com' + image_url
                        article["image"] = image_url
            
        return article
    except Exception as e:
        await log_message(f"获取文章详情错误: {url} ({str(e)})", ERROR_LOG_FILE)
        return article

async def save_articles(articles):
    """保存文章信息到文件"""
    json_file = os.path.join(OUTPUT_DIR, "articles.json")
    
    try:
        async with aiofiles.open(json_file, "w", encoding="utf-8") as f:
            await f.write(json.dumps(articles, ensure_ascii=False, indent=4))
        await log_message(f"✅ 文章数据已保存到 {json_file}")
    except Exception as e:
        await log_message(f"❌ 保存文章到 JSON 文件失败: {str(e)}", ERROR_LOG_FILE)

async def main():
    # 清空日志
    async with aiofiles.open(LOG_FILE, "w") as f:
        await f.write("")
    async with aiofiles.open(ERROR_LOG_FILE, "w") as f:
        await f.write("")
    
    await log_message("🚀 开始爬取CNN文章...")
    articles = await get_cnn_article_urls()
    
    if not articles:
        await log_message("❌ 未找到任何文章，程序结束")
        return
    
    await log_message(f"🔍 正在获取 {len(articles)} 篇文章的详细信息...")
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_article_details(article, session) for article in articles]
        articles = await asyncio.gather(*tasks)
    
    await save_articles(articles)
    
    # 将爬取到的文章数据存入 Redis，键名：cnn_articles，缓存时间为1小时（3600秒）
    try:
        redis_client = await aioredis.from_url("redis://localhost:6379", encoding="utf-8", decode_responses=True)
        await redis_client.set("cnn_articles", json.dumps(articles), ex=3600)
        await log_message("✅ 文章数据已保存到 Redis 键 'cnn_articles'")
    except Exception as e:
        await log_message(f"❌ 保存文章到 Redis 失败: {str(e)}", ERROR_LOG_FILE)
    
    await log_message(f"✅ 爬取完成! 共获取 {len(articles)} 篇文章")

if __name__ == "__main__":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except AttributeError:
        pass
    asyncio.run(main())
