"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { siteConfig } from '../../siteConfig';
import { xindianEntries, xindianCategories } from '../../data/xindian';
import { XindianEntry } from '../../data/xindian';

type Chatter = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  content: string;
};

// 心典分类配一个表情，让卡片更生动
const categoryEmoji: Record<string, string> = {
  '全部': '🌐',
  '思辨': '💭',
  '历史': '📜',
  '二次元': '🎮',
  '文学': '✒️',
  '情感': '💗',
};

export default function ChatterBoard({ chatters }: { chatters: Chatter[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");

  // 统一标签：随笔 tags ∪ 心典 categories，去重保序
  const allTags = useMemo(() => {
    const set = new Set<string>();
    chatters.forEach(c => c.tags?.forEach(t => set.add(t)));
    xindianCategories.forEach(c => c !== '全部' && set.add(c));
    return ["全部", ...Array.from(set)];
  }, [chatters]);

  const query = searchQuery.trim().toLowerCase();

  // 随笔过滤（搜索匹配标题/正文；标签匹配 tags）
  const filteredChatters = useMemo(() => {
    return chatters.filter(chatter => {
      const matchSearch = !query ||
        chatter.title.toLowerCase().includes(query) ||
        chatter.content.toLowerCase().includes(query);
      const matchTag = activeTag === "全部" || chatter.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [chatters, query, activeTag]);

  // 心典过滤（搜索匹配正文/出处；标签匹配 category）
  const filteredXindian = useMemo(() => {
    return xindianEntries.filter(entry => {
      const matchSearch = !query ||
        entry.content.toLowerCase().includes(query) ||
        entry.source.toLowerCase().includes(query);
      const matchTag = activeTag === "全部" || entry.category === activeTag;
      return matchSearch && matchTag;
    });
  }, [query, activeTag]);

  // 每个标签下的总条目数（随笔 + 心典）
  const tagCount = (tag: string) => {
    if (tag === '全部') return chatters.length + xindianEntries.length;
    const ec = chatters.filter(c => c.tags?.includes(tag)).length;
    const xc = xindianEntries.filter(e => e.category === tag).length;
    return ec + xc;
  };

  const essayCount = filteredChatters.length;
  const xindianCount = filteredXindian.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-10 py-6 md:py-10 pt-24 md:pt-28 relative z-10">

      <div className="mb-8 md:mb-14 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tighter">
          {siteConfig.chatterTitle || "源石研究笔记"}
        </h1>
        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium italic opacity-80">
          " {siteConfig.chatterDescription || "日常碎片与灵感记录"} "
        </p>
      </div>

      {/* 🔍 搜索 + 标签筛选（同时作用于随笔与心典） */}
      <div className="mb-8 md:mb-12 flex flex-col items-center gap-5 md:gap-8">
        <div className="relative w-full max-w-lg group px-2 md:px-0">
          <input
            type="text"
            placeholder="搜寻思绪与语录..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 pl-10 md:pl-14 text-sm md:text-base text-slate-800 dark:text-white shadow-lg md:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium"
          />
          <Search className="w-4 h-4 md:w-6 md:h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 px-2 md:px-0">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-500 border ${
                activeTag === tag
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-md md:shadow-lg md:shadow-indigo-500/30 scale-105'
                : 'bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {categoryEmoji[tag] || '🏷️'} {tag}
              <span className="ml-1 opacity-50 font-normal">·{tagCount(tag)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ✍️ 随笔区（瀑布流） */}
      {essayCount > 0 && (
        <motion.section layout className="mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-5 md:mb-7 px-1">
            <span className="text-2xl md:text-3xl">✍️</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">随笔</h2>
            <span className="text-xs text-slate-500 font-bold">· {essayCount} 篇</span>
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent ml-3"></div>
          </div>
          <motion.div layout className="columns-2 lg:columns-3 gap-3 md:gap-6 space-y-3 md:space-y-6">
            <AnimatePresence mode='popLayout'>
              {filteredChatters.map((chatter) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={chatter.slug}
                  className="break-inside-avoid"
                >
                  <Link
                    href={`/chatter/${chatter.slug}`}
                    className="block rounded-2xl md:rounded-[32px] bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-md md:shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                  >
                    {chatter.cover && (
                      <div className="w-full h-28 md:h-52 overflow-hidden relative">
                        <img src={chatter.cover} alt="cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                        {chatter.mood && (
                          <span className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/20 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm border border-white/20 uppercase tracking-widest">
                            ✨ {chatter.mood}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-3 md:p-7">
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="text-[8px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider md:tracking-[0.2em] bg-indigo-500/5 dark:bg-indigo-400/10 px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg border border-indigo-500/10">
                          {chatter.date}
                        </div>
                        {!chatter.cover && chatter.mood && (
                          <div className="text-[8px] md:text-[10px] font-black text-pink-600 dark:text-pink-400 bg-pink-500/5 dark:bg-pink-400/10 px-1.5 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg border border-pink-500/10">
                            {chatter.mood}
                          </div>
                        )}
                      </div>

                      {chatter.title && (
                        <h3 className="text-sm md:text-xl font-bold text-slate-800 dark:text-white mb-1.5 md:mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 md:line-clamp-none">{chatter.title}</h3>
                      )}

                      <div className="text-[10px] md:text-sm text-slate-600 dark:text-slate-300 leading-snug md:leading-relaxed line-clamp-4 md:line-clamp-5 opacity-90 font-medium italic">
                        {chatter.content}
                      </div>

                      {chatter.tags && chatter.tags.length > 0 && (
                        <div className="mt-3 md:mt-6 flex flex-wrap gap-1 md:gap-2">
                          {chatter.tags.map(t => (
                            <span key={t} className="text-[8px] md:text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-500/5 dark:bg-white/5 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md border border-slate-500/10 dark:border-white/5 transition-all group-hover:bg-indigo-500/10 group-hover:text-indigo-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.section>
      )}

      {/* 🏛️ 心典区（分类卡片网格） */}
      {xindianCount > 0 && (
        <motion.section layout className="mb-6">
          <div className="flex items-center gap-3 mb-5 md:mb-7 px-1">
            <span className="text-2xl md:text-3xl">🏛️</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">心典</h2>
            <span className="text-xs text-slate-500 font-bold">· {xindianCount} 条</span>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent ml-3"></div>
          </div>

          {activeTag === '全部' ? (
            // 全部分类：按分类分组展示
            <div className="space-y-10">
              {xindianCategories.filter(c => c !== '全部').map(cat => {
                const items = filteredXindian.filter(e => e.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-3 mb-4 px-1">
                      <span className="text-xl md:text-2xl">{categoryEmoji[cat]}</span>
                      <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">{cat}</h3>
                      <span className="text-xs text-slate-500 font-bold">· {items.length} 条</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/20 to-transparent ml-3"></div>
                    </div>
                    <XindianCardGrid items={items} />
                  </div>
                );
              })}
            </div>
          ) : (
            // 单一分类：直接展示该分类卡片网格
            <XindianCardGrid items={filteredXindian} />
          )}
        </motion.section>
      )}

      {essayCount === 0 && xindianCount === 0 && (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold">
          没有找到匹配的内容 ✨
        </div>
      )}
    </div>
  );
}

// 🆕 心典卡片网格：1/2/3 列响应式，分类内下标编号 + 出处署名 + 长文点击展开
function XindianCardGrid({ items }: { items: XindianEntry[] }) {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5"
    >
      <AnimatePresence mode='popLayout'>
        {items.map((entry) => (
          <XindianCard key={entry.id} entry={entry} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

// 单张心典卡片：下标号（分类 · 01）+ 正文 + 出处，长文可点击展开/收起
function XindianCard({ entry }: { entry: XindianEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = entry.content.length > 140 || entry.content.includes('\n');
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      onClick={() => isLong && setExpanded(v => !v)}
      className={`rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all p-4 md:p-6 relative overflow-hidden group ${isLong ? 'cursor-pointer' : ''}`}
    >
      {/* 顶部：分类标签 + 分类内下标号 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[10px] md:text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1">
          {categoryEmoji[entry.category] || '🏷️'} {entry.category}
        </span>
        <span className="text-[9px] md:text-[10px] text-slate-400 font-mono tracking-wider">
          {entry.category} · {String(entry.no).padStart(2, '0')}
        </span>
      </div>
      {/* 正文（完整语录，长文默认折叠） */}
      <p className={`text-[13px] md:text-[14px] text-slate-700 dark:text-slate-200 leading-relaxed italic whitespace-pre-line group-hover:text-slate-900 dark:group-hover:text-white transition-colors ${expanded ? '' : 'line-clamp-6 md:line-clamp-7'}`}>
        {entry.content}
      </p>
      {/* 出处署名 */}
      {entry.source && (
        <div className="mt-3 md:mt-4 text-right text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold italic">
          ——{entry.source}
        </div>
      )}
      {/* 长文展开提示 */}
      {isLong && (
        <div className="mt-2 text-[10px] md:text-[11px] font-black text-indigo-500/70 dark:text-indigo-400/70 text-center select-none">
          {expanded ? '▲ 收起' : '▼ 展开全文'}
        </div>
      )}
      {/* hover 时显现的渐变装饰条 */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
    </motion.div>
  );
}
