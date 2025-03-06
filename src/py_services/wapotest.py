import requests
import os
from datetime import datetime
import xml.etree.ElementTree as ET

OUTPUT_DIR = "wapo_articles"
os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {
    'authority': 'www.washingtonpost.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    #'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'cookie': 'wp_devicetype=0; wp_ak_v_v=0|20210407; wp_ak_kywrd_ab=1; wp_ak_ob=1|20240131; wp_ak_signinv2=1|20230125; wp_ak_wab=1|2|0|0|0|1|1|1|1|20230418; wp_ak_v_mab=0|1|0|0|20250226; wp_ttrid="11340fdf-cd21-46fb-bc85-d6247e343685"; wp_ak_pw=0|20250129; wp_usp=1YNY; wp_ak_bt=1|20200518; wp_ak_bfd=1|20201222; wp_ak_tos=1|20211110; wp_ak_sff=1|20220425; wp_ak_lr=0|20221020; wp_ak_btvm=1|20220615; wp_ak_co=2|20220505; wp_ak_btap=1|20211118; wp_ak_pp=1|20210310; _cb=BBT3dDCo5tAjB4YlCz; _ga=GA1.1.322632190.1741212842; wp_pwapi_ar="H4sIAAAAAAAA/13NwRHDIAwEwF5453GHBELuRmBUQx=="; jts-rw={"u":"91791174121284141852021"};',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
}

def log_message(message):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def fetch_sitemap(url):
    try:
        response = requests.get(url, headers=headers, timeout=60)
        response.raise_for_status()
        return response.text  # 直接返回文本，不再解压
    except Exception as e:
        log_message(f"请求异常: {e}")
        return None

def get_month_sitemap_url():
    main_sitemap_url = "https://www.washingtonpost.com/sitemaps/sitemap.xml.gz"
    content = fetch_sitemap(main_sitemap_url)

    if not content:
        log_message("主站点地图无法访问")
        return None

    try:
        root = ET.fromstring(content)
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        current_month = datetime.today().strftime('%Y-%m')

        for sitemap in root.findall("ns:sitemap", namespaces=namespace):
            loc = sitemap.find("ns:loc", namespaces=namespace).text
            if f"sitemap-{current_month}" in loc:
                return loc

    except Exception as e:
        log_message(f"解析主站点地图异常: {e}")

    return None

def get_today_article_urls(month_sitemap_url):
    content = fetch_sitemap(month_sitemap_url)
    if not content:
        log_message("月份站点地图无法访问")
        return []

    try:
        root = ET.fromstring(content)
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        today_str = datetime.today().strftime('%Y-%m-%d')

        article_urls = []
        for url_elem in root.findall("ns:url", namespaces=namespace):
            loc_elem = url_elem.find("ns:loc", namespaces=namespace)
            lastmod_elem = url_elem.find("ns:lastmod", namespaces=namespace)

            if loc_elem is None or lastmod_elem is None:
                continue

            url = loc_elem.text
            lastmod = lastmod_elem.text[:10]

            if lastmod == today_str:
                article_urls.append(url)

        return article_urls

    except Exception as e:
        log_message(f"解析月份站点地图异常: {e}")

    return []

def save_article_urls(urls):
    file_path = os.path.join(OUTPUT_DIR, "articles.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        for url in urls:
            f.write(url + "\n")
    log_message(f"✅ 已保存 {len(urls)} 个文章URL到 {file_path}")

if __name__ == "__main__":
    log_message("开始爬取华盛顿邮报今日文章...")

    month_sitemap_url = get_month_sitemap_url()
    if not month_sitemap_url:
        log_message("❌ 未找到当前月份的站点地图，程序结束。")
        exit()

    urls = get_today_article_urls(month_sitemap_url)
    if urls:
        save_article_urls(urls)
    else:
        log_message("❌ 今日未发现任何文章URL。")
