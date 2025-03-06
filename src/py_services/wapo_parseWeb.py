import asyncio
import aiohttp
import aiofiles
import os
import re
import json
import ssl
import xml.etree.ElementTree as ET
from datetime import datetime
import redis.asyncio as aioredis  # 使用异步版 Redis 客户端
import requests  # 添加同步请求库作为备用

# 配置参数
OUTPUT_DIR = "wapo_articles"  # 输出目录
LOG_FILE = os.path.join(OUTPUT_DIR, "crawler_log.txt")  # 日志文件
ERROR_LOG_FILE = os.path.join(OUTPUT_DIR, "error_log.txt")  # 错误日志
BATCH_SIZE = 5  # 并发爬取数量
REQUEST_DELAY = 0.5  # 请求延迟（秒）
CATEGORIES = ["world", "science", "business", "us", "politics", "national"]

# 确保输出目录存在
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def log_message(message, file_path=LOG_FILE):
    """记录消息到日志文件并输出到控制台"""
    async with aiofiles.open(file_path, "a", encoding="utf-8") as f:
        await f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")
    print(message)

async def fetch_sitemap(url, session):
    """获取站点地图内容"""
    # 添加浏览器样式的User-Agent
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
    }

    try:
        # 禁用SSL验证，增加超时时间
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # 日志记录请求尝试
        await log_message(f"尝试获取站点地图: {url}")
        
        async with session.get(url, headers=headers, ssl=ssl_context, timeout=30) as response:
            await log_message(f"获取站点地图状态码: {response.status}")
            if response.status == 200:
                content = await response.text()
                # 检查内容长度
                content_length = len(content)
                await log_message(f"成功获取站点地图，内容长度: {content_length} 字节")
                return content
            else:
                await log_message(f"获取站点地图失败: {url} (状态码: {response.status})", ERROR_LOG_FILE)
                return None
    except asyncio.TimeoutError:
        await log_message(f"获取站点地图超时: {url}", ERROR_LOG_FILE)
        return None
    except Exception as e:
        await log_message(f"获取站点地图错误: {url} ({str(e)})", ERROR_LOG_FILE)
        import traceback
        await log_message(traceback.format_exc(), ERROR_LOG_FILE)
        return None

def get_wapo_sitemap_url():
    """根据当前年月获取华盛顿邮报站点地图URL"""
    current_date = datetime.today()
    year = current_date.strftime("%Y")
    month = current_date.strftime("%m")
    
    # 构建华盛顿邮报的站点地图URL
    sitemap_url = f"https://www.washingtonpost.com/sitemaps/sitemap-{year}-{month}.xml"
    
    return sitemap_url

def fetch_sitemap_sync(url):
    """同步方式获取站点地图（作为备用方法）"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
    
    try:
        # 禁用SSL验证
        response = requests.get(url, headers=headers, verify=False, timeout=30)
        if response.status_code == 200:
            return response.text
        return None
    except Exception:
        return None

async def get_wapo_article_urls():
    """获取华盛顿邮报今日文章的URL列表"""
    today = datetime.today()
    today_str = today.strftime("%Y-%m-%d")
    
    await log_message(f"🔍 开始爬取华盛顿邮报今日 ({today_str}) 文章...")
    
    # 根据当前年月获取站点地图URL
    sitemap_url = get_wapo_sitemap_url()
    await log_message(f"📄 使用站点地图: {sitemap_url}")
    
    # 也可以直接使用硬编码的URL (用于测试)
    # sitemap_url = "https://www.washingtonpost.com/sitemaps/sitemap-2024-03.xml"
    # await log_message(f"📄 使用测试站点地图: {sitemap_url}")
    
    # 配置 ClientSession，禁用SSL验证
    conn = aiohttp.TCPConnector(ssl=False, force_close=True)
    async with aiohttp.ClientSession(connector=conn, timeout=aiohttp.ClientTimeout(total=60)) as session:
        try:
            # 尝试异步获取
            sitemap_content = await fetch_sitemap(sitemap_url, session)
            
            # 如果异步获取失败，尝试同步获取
            if not sitemap_content:
                await log_message("尝试使用同步方式获取站点地图...")
                sitemap_content = fetch_sitemap_sync(sitemap_url)
                
                if sitemap_content:
                    await log_message("✅ 同步方式获取站点地图成功")
                
            # 如果仍然失败，尝试获取上个月的站点地图
            if not sitemap_content:
                await log_message(f"❌ 无法获取站点地图: {sitemap_url}，尝试获取上个月的站点地图")
                
                # 如果当前月份的站点地图不存在，尝试获取上个月的
                last_month = datetime.today().replace(day=1)
                if last_month.month == 1:
                    last_month = last_month.replace(year=last_month.year-1, month=12)
                else:
                    last_month = last_month.replace(month=last_month.month-1)
                    
                year = last_month.strftime("%Y")
                month = last_month.strftime("%m")
                sitemap_url = f"https://www.washingtonpost.com/sitemaps/sitemap-{year}-{month}.xml"
                
                await log_message(f"📄 尝试使用上个月站点地图: {sitemap_url}")
                sitemap_content = await fetch_sitemap(sitemap_url, session)
                
                # 如果异步获取失败，也尝试同步获取
                if not sitemap_content:
                    await log_message("尝试使用同步方式获取上个月站点地图...")
                    sitemap_content = fetch_sitemap_sync(sitemap_url)
                    
                    if sitemap_content:
                        await log_message("✅ 同步方式获取上个月站点地图成功")
                
                # 如果仍然失败，尝试使用2024年的站点地图
                if not sitemap_content:
                    # 尝试2024年的当前月份
                    test_sitemap_url = f"https://www.washingtonpost.com/sitemaps/sitemap-2024-{month}.xml"
                    await log_message(f"📄 尝试使用2024年站点地图: {test_sitemap_url}")
                    sitemap_content = await fetch_sitemap(test_sitemap_url, session)
                    
                    if not sitemap_content:
                        sitemap_content = fetch_sitemap_sync(test_sitemap_url)
                
                # 如果所有尝试都失败
                if not sitemap_content:
                    await log_message(f"❌ 无法获取任何站点地图，程序结束")
                    return []
            
            await log_message(f"✅ 成功获取站点地图: {sitemap_url}")
            
            # 尝试解析XML
            try:
                # 对于简单的XML处理，直接使用namespace
                namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                root = ET.fromstring(sitemap_content)
                
                all_articles = []
                url_count = 0
                
                # 遍历所有URL元素并计数
                for url_elem in root.findall(".//url", None) or root.findall(".//ns:url", namespace):
                    url_count += 1
                
                await log_message(f"站点地图中共有 {url_count} 个URL")
                
                # 由于WP的sitemap结构简单，直接按照示例进行解析
                for url_elem in root.findall(".//url", None) or root.findall(".//ns:url", namespace):
                    try:
                        # 尝试两种方式获取loc元素
                        loc_elem = url_elem.find("loc") or url_elem.find("ns:loc", namespace)
                        if loc_elem is None:
                            continue
                        
                        article_url = loc_elem.text
                        if not article_url:
                            continue
                            
                        # 提取类别和标题（基于URL）
                        url_parts = article_url.split('/')
                        
                        # 跳过非文章URL
                        skip_patterns = ["/index.html", "/newsletters/", "/video/", "/live-updates/"]
                        if any(pattern in article_url for pattern in skip_patterns):
                            continue
                        
                        # 提取类别
                        category = None
                        if len(url_parts) >= 4:
                            possible_category = url_parts[3].lower()
                            # 检查URL第一段是否为类别
                            if possible_category in CATEGORIES:
                                category = possible_category
                            # 特殊处理一些URL
                            elif "politics" in article_url:
                                category = "politics"
                            elif "national" in article_url:
                                category = "national"
                            # 如果没有找到类别，使用"other"
                            else:
                                category = "other"
                        
                        # 尝试获取lastmod元素
                        lastmod_elem = url_elem.find("lastmod") or url_elem.find("ns:lastmod", namespace)
                        pub_date = lastmod_elem.text if lastmod_elem is not None else None
                        
                        # 构建文章对象
                        article = {
                            "website": "Washington Post",
                            "url": article_url,
                            "title": os.path.basename(article_url.rstrip('/')).replace('-', ' ').title(),  # 从URL生成临时标题
                            "date": pub_date or "未知日期",
                            "image": None,
                            "category": category
                        }
                        
                        all_articles.append(article)
                        
                    except Exception as e:
                        await log_message(f"处理文章错误: {str(e)}", ERROR_LOG_FILE)
                
                await log_message(f"✅ 从站点地图中提取了 {len(all_articles)} 篇文章")
                
                # 限制文章数量
                if len(all_articles) > 20:
                    all_articles = all_articles[:20]
                    await log_message(f"⚠️ 限制文章数量为前20篇")
                
                return all_articles
                
            except ET.ParseError as e:
                await log_message(f"解析站点地图错误: {str(e)}", ERROR_LOG_FILE)
                
                # 尝试手动解析简单的XML
                await log_message("尝试手动解析XML...")
                
                all_articles = []
                # 简单的正则表达式解析
                url_matches = re.findall(r'<loc>(.*?)</loc>', sitemap_content)
                date_matches = re.findall(r'<lastmod>(.*?)</lastmod>', sitemap_content)
                
                # 记录找到的URL数量
                await log_message(f"通过正则表达式找到 {len(url_matches)} 个URL和 {len(date_matches)} 个日期")
                
                # 如果找不到任何URL，尝试记录原始内容
                if not url_matches and len(sitemap_content) < 1000:
                    await log_message(f"站点地图内容过短或格式不符，原始内容: {sitemap_content}", ERROR_LOG_FILE)
                
                for i, url in enumerate(url_matches):
                    try:
                        date = date_matches[i] if i < len(date_matches) else "未知日期"
                        
                        # 跳过非文章URL
                        skip_patterns = ["/index.html", "/homepage/", "/newsletters/", "/arcpublishing/"]
                        if any(pattern in url for pattern in skip_patterns):
                            continue
                        
                        # 提取类别（基于URL）
                        category = None
                        for cat in CATEGORIES:
                            if f"/{cat}/" in url.lower():
                                category = cat
                                break
                        
                        # 如果没找到类别，检查更多可能的类别
                        if not category:
                            if "/sports/" in url.lower():
                                category = "sports"
                            elif "/technology/" in url.lower():
                                category = "technology"
                            elif "/health/" in url.lower():
                                category = "health"
                            elif "/education/" in url.lower():
                                category = "education"
                            elif "/weather/" in url.lower():
                                category = "weather"
                            else:
                                category = "other"
                        
                        # 从URL提取标题
                        slug = os.path.basename(url.rstrip('/'))
                        title = slug.replace('-', ' ').title()
                        
                        article = {
                            "website": "Washington Post",
                            "url": url,
                            "title": title,
                            "date": date,
                            "image": None,
                            "category": category
                        }
                        
                        all_articles.append(article)
                    except Exception as e:
                        await log_message(f"处理文章错误: {str(e)}", ERROR_LOG_FILE)
                
                await log_message(f"✅ 通过手动解析提取了 {len(all_articles)} 篇文章")
                
                # 限制文章数量
                if len(all_articles) > 20:
                    all_articles = all_articles[:20]
                    await log_message(f"⚠️ 限制文章数量为前20篇")
                
                return all_articles
                
        except Exception as e:
            await log_message(f"处理站点地图错误: {str(e)}", ERROR_LOG_FILE)
            import traceback
            await log_message(traceback.format_exc(), ERROR_LOG_FILE)
            return []

async def fetch_article_details(article, session):
    """从文章网页获取更多详情"""
    url = article["url"]
    
    # 如果已经有标题就不再获取详情
    # 由于WP网站加载速度较慢，这里只获取基本信息，不再获取详情
    return article
    
    # 以下代码暂时注释掉，避免请求网页详情导致程序超时
    # 如果需要获取详情，可以取消注释
    """
    try:
        # 设置较短的超时时间
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
            if response.status != 200:
                return article
            
            html_content = await response.text()
            
            # 获取标题
            title_match = re.search(r'<meta property="og:title" content="([^"]+)"', html_content)
            if title_match:
                article["title"] = title_match.group(1).strip()
            else:
                title_match = re.search(r'<title>(.*?)</title>', html_content)
                if title_match:
                    title = title_match.group(1).replace(" - The Washington Post", "").strip()
                    article["title"] = title
            
            # 获取图片
            img_match = re.search(r'<meta property="og:image" content="([^"]+)"', html_content)
            if img_match:
                article["image"] = img_match.group(1)
            
        return article
    except asyncio.TimeoutError:
        await log_message(f"获取文章详情超时: {url}", ERROR_LOG_FILE)
        return article
    except Exception as e:
        await log_message(f"获取文章详情错误: {url} ({str(e)})", ERROR_LOG_FILE)
        return article
    """

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
    
    await log_message("🚀 开始爬取华盛顿邮报文章...")
    
    try:
        # 设置总体超时时间 - 30秒
        articles_task = asyncio.create_task(get_wapo_article_urls())
        articles = await asyncio.wait_for(articles_task, timeout=30)
        
        if not articles:
            await log_message("❌ 未找到任何文章，程序结束")
            return
        
        # 由于已经从URL生成了基本标题，这里不再获取详情
        await log_message(f"✅ 跳过获取文章详情步骤，直接保存 {len(articles)} 篇文章")
        
        await save_articles(articles)
        
        # 将爬取到的文章数据存入 Redis，键名：wapo_articles，缓存时间为1小时（3600秒）
        try:
            redis_client = await aioredis.from_url("redis://localhost:6379", encoding="utf-8", decode_responses=True)
            await redis_client.set("wapo_articles", json.dumps(articles), ex=3600)
            await log_message("✅ 文章数据已保存到 Redis 键 'wapo_articles'")
        except Exception as e:
            await log_message(f"❌ 保存文章到 Redis 失败: {str(e)}", ERROR_LOG_FILE)
        
        await log_message(f"✅ 爬取完成! 共获取 {len(articles)} 篇文章")
        
    except asyncio.TimeoutError:
        await log_message("❌ 爬取过程超时，程序结束")
    except Exception as e:
        await log_message(f"❌ 爬取过程中发生错误: {str(e)}", ERROR_LOG_FILE)
        import traceback
        await log_message(traceback.format_exc(), ERROR_LOG_FILE)

if __name__ == "__main__":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except AttributeError:
        pass
    asyncio.run(main())