#!/usr/bin/env python3
"""
Bridge: fetches Avito listings and prints JSON to stdout.
Called by Node.js AvitoParser via child_process.
"""
import sys
import json
import html as html_lib
import random
import argparse
from bs4 import BeautifulSoup
from curl_cffi import requests as cffi_requests


def make_headers():
    v = str(random.randint(140, 147))
    return {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'ru-RU,ru;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': f'"Google Chrome";v="{v}", "Not.A/Brand";v="8", "Chromium";v="{v}"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': (
            f'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            f'AppleWebKit/537.36 (KHTML, like Gecko) '
            f'Chrome/{v}.0.0.0 Safari/537.36'
        ),
    }


def fetch_page(url: str) -> tuple[str, int]:
    session = cffi_requests.Session(impersonate="chrome")
    session.headers.update(make_headers())
    resp = session.get(url, timeout=30, allow_redirects=True)
    return resp.text, resp.status_code


def extract_json(html_code: str) -> dict:
    soup = BeautifulSoup(html_code, 'html.parser')
    for script in soup.select('script'):
        if (
            script.get('type') != 'mime/invalid'
            or script.get('data-mfe-state') != 'true'
            or 'sandbox' in (script.text or '')
        ):
            continue
        try:
            data = json.loads(html_lib.unescape(script.text))
            # Путь из оригинального парсера: state.data
            state_data = (data.get('state') or {}).get('data') or {}
            if state_data.get('catalog'):
                return state_data
            # Иногда catalog лежит прямо в data
            if data.get('catalog'):
                return data
        except Exception:
            continue
    return {}


def extract_image(gallery: dict) -> list:
    images = []
    for key in ('imageLargeUrl', 'imageUrl', 'imageLargeVipUrl'):
        val = gallery.get(key)
        if val and isinstance(val, str) and val.startswith('http'):
            if val not in images:
                images.append(val)
    return images


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--limit', type=int, default=20)
    args = parser.parse_args()

    try:
        html, status = fetch_page(args.url)
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        print('[]')
        sys.exit(0)

    if status == 429:
        print(json.dumps({'error': 'rate limited (429)'}), file=sys.stderr)
        print('[]')
        sys.exit(0)

    if status != 200:
        print(json.dumps({'error': f'HTTP {status}'}), file=sys.stderr)
        print('[]')
        sys.exit(0)

    data = extract_json(html)
    if not data:
        print(json.dumps({'error': 'JSON not found on page (captcha or blocked)'}), file=sys.stderr)
        print('[]')
        sys.exit(0)

    catalog = data.get('catalog') or {}
    items = catalog.get('items') or []

    result = []
    for item in items[:args.limit]:
        if not item.get('id'):
            continue

        price_d = item.get('priceDetailed') or {}
        address_d = item.get('addressDetailed') or {}
        geo = item.get('geo') or {}
        gallery = item.get('gallery') or {}
        url_path = item.get('urlPath') or ''

        result.append({
            'id': item.get('id'),
            'title': item.get('title') or '',
            'description': item.get('description') or '',
            'price': price_d.get('value') or 0,
            'priceString': price_d.get('fullString') or '',
            'url': f"https://www.avito.ru{url_path}",
            'address': address_d.get('locationName') or geo.get('formattedAddress') or '',
            'images': extract_image(gallery),
            'publishedAt': item.get('sortTimeStamp'),
            'category': (item.get('category') or {}).get('name') or '',
        })

    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
