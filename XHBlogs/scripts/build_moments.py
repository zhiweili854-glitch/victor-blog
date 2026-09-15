#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
辅助脚本：从 moments_posts.ts + moments/*.md 生成统一的 moments.ts
- 自动从 content 提取 title/excerpt
- 给空内容、纯图条目生成"图片集"占位 title
- 合并去重
"""

import re
from pathlib import Path

ROOT = Path(r"D:/IDE/victorBlogs-main/XHBlogs")
SRC_TS = ROOT / "data" / "moments_posts.ts"
MD_DIR = ROOT / "moments"
OUT_TS = ROOT / "data" / "moments.ts"

DEFAULT_COVER = "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg"


def decode_unicode_escapes(s: str) -> str:
    """还原 \\uXXXX 转义为真实字符（保留其他字符不动）。"""
    def repl(m):
        try:
            return chr(int(m.group(1), 16))
        except Exception:
            return m.group(0)
    return re.sub(r"\\u([0-9a-fA-F]{4})", repl, s)


def clean_text(s: str) -> str:
    s = re.sub(r"<img[^>]*>", "", s or "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def make_excerpt(content: str, n: int = 110) -> str:
    c = clean_text(content)
    if not c:
        return ""
    if len(c) <= n:
        return c
    head = c[:n]
    for sep in ["。", "！", "？", "，", ";", "；", "."]:
        idx = head.rfind(sep)
        if idx > 40:
            return head[: idx + 1]
    return head + "…"


def make_title(content: str, max_len: int = 28) -> str:
    c = clean_text(content)
    if not c:
        return "📷 图片分享"
    for sep in ["。", "！", "？", "\n", "."]:
        idx = c.find(sep)
        if 0 < idx <= max_len:
            return c[:idx]
    head = c[:max_len]
    for sep in ["，", "、", " ", ";", "；", ",", ":", "："]:
        idx = head.rfind(sep)
        if idx > 8:
            return head[:idx] + "…"
    return head + "…"


def parse_moments_posts():
    """逐条扫描 ts 文件内容，对每条 { id: N, ... } 做有限状态机解析。"""
    text = SRC_TS.read_text(encoding="utf-8")

    heads = list(re.finditer(r"\{\s*id:\s*(\d+)\s*,", text))
    objs = []
    for idx, m in enumerate(heads):
        obj_start = m.start()
        obj_id = m.group(1)
        depth = 0
        i = obj_start
        in_str = False
        esc = False
        while i < len(text):
            ch = text[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
            else:
                if ch == '"':
                    in_str = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        break
            i += 1
        body = text[obj_start: i + 1]

        item = {"_src_id": f"ts-{obj_id}"}
        time_m = re.search(r'time:\s*"([^"]+)"', body)
        if time_m:
            item["time"] = time_m.group(1)
        cat_m = re.search(r'category:\s*"([^"]+)"', body)
        if cat_m:
            item["category"] = cat_m.group(1)
        media_m = re.search(r"hasMedia:\s*(true|false)", body)
        if media_m:
            item["hasMedia"] = (media_m.group(1) == "true")
        cnt_m = re.search(r"mediaCount:\s*(\d+)", body)
        if cnt_m:
            item["mediaCount"] = int(cnt_m.group(1))
        types_m = re.search(r"mediaTypes:\s*\[([^\]]*)\]", body)
        if types_m:
            raw = types_m.group(1)
            item["mediaTypes"] = [t.strip().strip('"').strip("'") for t in raw.split(",") if t.strip()]
        else:
            item["mediaTypes"] = []

        cm = re.search(r'content:\s*"', body)
        if cm:
            j = cm.end()
            in_str = True
            esc2 = False
            content_chars = []
            while j < len(body):
                ch = body[j]
                if in_str:
                    if esc2:
                        content_chars.append(ch)
                        esc2 = False
                    elif ch == "\\":
                        esc2 = True
                    elif ch == '"':
                        break
                    else:
                        content_chars.append(ch)
                j += 1
            content_raw = "".join(content_chars)
            # \uXXXX 转义还原（关键：不能 encode/decode，要直接 replace）
            content = decode_unicode_escapes(content_raw)
            content = content.replace("\\n", "\n").replace("\\r", "\r").replace("\\t", "\t")
            content = re.sub(r'<img[^>]*base64[^>]*>', '[图片]', content)
            content = re.sub(r'<img[^>]*>', '', content)
            item["content"] = content.strip()
        objs.append(item)
    return objs


def parse_moments_md():
    items = []
    if not MD_DIR.exists():
        return items
    for md in sorted(MD_DIR.glob("*.md")):
        text = md.read_text(encoding="utf-8")
        m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.DOTALL)
        if not m:
            continue
        fm, body = m.group(1), m.group(2).strip()
        item = {"_src_id": f"md-{md.stem}"}
        id_m = re.search(r'^id:\s*"([^"]+)"', fm, re.M)
        if id_m:
            item["md_id"] = id_m.group(1)
        date_m = re.search(r'^date:\s*"([^"]+)"', fm, re.M)
        if date_m:
            item["date_iso"] = date_m.group(1)
        loc_m = re.search(r'^location:\s*"([^"]+)"', fm, re.M)
        if loc_m:
            item["location"] = loc_m.group(1)
        img_block_m = re.search(r"^images:\s*\n((?:\s*-\s*.+\n)+)", fm, re.M)
        if img_block_m:
            imgs = []
            for line in img_block_m.group(1).splitlines():
                mm = re.search(r"-\s*['\"]?([^'\"]+)['\"]?", line)
                if mm:
                    imgs.append(mm.group(1).strip())
            item["images"] = imgs
        else:
            item["images"] = []
        item["content"] = body.strip()
        items.append(item)
    return items


def ts_to_iso(date_str: str) -> str:
    m = re.match(r"(\d{4})/(\d{2})/(\d{2})\s+(\d{2}):(\d{2})", date_str)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}T{m.group(4)}:{m.group(5)}:00"
    return date_str


def derive_tags(category: str) -> list:
    cat_to_tag = {
        "感悟": ["感悟"],
        "纯图": ["图文"],
        "日常": ["日常"],
        "竞赛": ["竞赛"],
        "实习": ["实习"],
        "技术": ["技术"],
        "旅行": ["旅行"],
    }
    return cat_to_tag.get(category, [category] if category else [])


def build_moments():
    moments = []
    for it in parse_moments_posts():
        content = it.get("content", "")
        title = make_title(content)
        excerpt = make_excerpt(content)
        moments.append({
            "id": it["_src_id"],
            "source": "ts",
            "date_iso": ts_to_iso(it.get("time", "")),
            "date_display": it.get("time", ""),
            "title": title,
            "excerpt": excerpt,
            "content": content,
            "category": it.get("category", "其他"),
            "tags": derive_tags(it.get("category", "其他")),
            "hasMedia": it.get("hasMedia", False),
            "mediaCount": it.get("mediaCount", 0),
            "mediaTypes": it.get("mediaTypes", []),
            "images": [],
            "cover": DEFAULT_COVER,
            "location": "",
        })

    for it in parse_moments_md():
        content = it.get("content", "")
        title = make_title(content)
        excerpt = make_excerpt(content)
        images = it.get("images", [])
        moments.append({
            "id": it["_src_id"],
            "source": "md",
            "date_iso": it.get("date_iso", ""),
            "date_display": it.get("date_iso", ""),
            "title": title,
            "excerpt": excerpt,
            "content": content,
            "category": "md-记录",
            "tags": ["图文"] if images else ["纯文"],
            "hasMedia": len(images) > 0,
            "mediaCount": len(images),
            "mediaTypes": ["image"] if images else [],
            "images": images,
            "cover": images[0] if images else DEFAULT_COVER,
            "location": it.get("location", ""),
        })

    seen = set()
    unique = []
    for m in moments:
        key = (m["date_iso"], m["content"][:30])
        if key in seen:
            continue
        seen.add(key)
        unique.append(m)
    unique.sort(key=lambda x: x["date_iso"], reverse=True)
    return unique


def jsstr(s):
    if s is None:
        return '""'
    s = str(s).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
    return f'"{s}"'


def render_ts(moments):
    out = []
    out.append('// 🛡️ 本文件由 scripts/build_moments.py 自动生成')
    out.append('// 来源：data/moments_posts.ts + moments/*.md，去重后按时间倒序')
    out.append('')
    out.append('export interface Moment {')
    out.append('  id: string;')
    out.append('  source: "ts" | "md";')
    out.append('  date_iso: string;')
    out.append('  date_display: string;')
    out.append('  title: string;')
    out.append('  excerpt: string;')
    out.append('  content: string;')
    out.append('  category: string;')
    out.append('  tags: string[];')
    out.append('  hasMedia: boolean;')
    out.append('  mediaCount: number;')
    out.append('  mediaTypes: string[];')
    out.append('  images: string[];')
    out.append('  cover: string;')
    out.append('  location: string;')
    out.append('}')
    out.append('')
    out.append('export const momentCategories = ["全部", "感悟", "实习", "技术", "竞赛", "日常", "旅行", "图文", "md-记录"];')
    out.append('')
    out.append('export const moments: Moment[] = [')
    for m in moments:
        out.append('  {')
        out.append(f'    id: {jsstr(m["id"])},')
        out.append(f'    source: {jsstr(m["source"])},')
        out.append(f'    date_iso: {jsstr(m["date_iso"])},')
        out.append(f'    date_display: {jsstr(m["date_display"])},')
        out.append(f'    title: {jsstr(m["title"])},')
        out.append(f'    excerpt: {jsstr(m["excerpt"])},')
        out.append(f'    content: {jsstr(m["content"])},')
        out.append(f'    category: {jsstr(m["category"])},')
        out.append(f'    tags: [{", ".join(jsstr(t) for t in m["tags"])}],')
        out.append(f'    hasMedia: {str(m["hasMedia"]).lower()},')
        out.append(f'    mediaCount: {m["mediaCount"]},')
        out.append(f'    mediaTypes: [{", ".join(jsstr(t) for t in m["mediaTypes"])}],')
        out.append(f'    images: [{", ".join(jsstr(i) for i in m["images"])}],')
        out.append(f'    cover: {jsstr(m["cover"])},')
        out.append(f'    location: {jsstr(m["location"])},')
        out.append('  },')
    out.append('];')
    out.append('')
    out.append(f'// 共 {len(moments)} 条')
    return "\n".join(out)


if __name__ == "__main__":
    moments = build_moments()
    OUT_TS.write_text(render_ts(moments), encoding="utf-8")
    print(f"生成 {len(moments)} 条 -> {OUT_TS}")
