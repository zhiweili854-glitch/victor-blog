"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Moment } from '../data/moments';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Search, Sparkles, LayoutGrid, ListTree, Calendar, Hash,
  ArrowUp, Clock, MapPin, MessageSquare, X, ImageIcon, ChevronLeft, ChevronRight,
  Ghost
} from 'lucide-react';

type ViewMode = 'timeline' | 'card';

interface Props {
  moments: Moment[];
  categories: string[];
}

const categoryEmoji: Record<string, string> = {
  '感悟': '💭',
  '日常': '☀️',
  '实习': '💼',
  '技术': '⚙️',
  '竞赛': '🏆',
  '旅行': '✈️',
  '图文': '🖼️',
  'md-记录': '📁',
};

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(d: string) {
  if (!d) return '';
  const m = d.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
  return d.split('T').join(' ').slice(0, 16);
}

export default function TimelineClient({ moments, categories }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openMoment, setOpenMoment] = useState<Moment | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // 移动端强制矩阵视图
  useEffect(() => {
    const enforce = () => {
      if (window.innerWidth < 768) setViewMode('card');
    };
    enforce();
    window.addEventListener('resize', enforce);
    return () => window.removeEventListener('resize', enforce);
  }, []);

  const filtered = useMemo(() => {
    let result = moments;
    if (selectedCategory !== '全部') {
      result = result.filter(m => m.category === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.excerpt.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [moments, selectedCategory, searchQuery]);

  const handleGridScroll = () => {
    if (gridScrollRef.current) {
      setShowScrollTop(gridScrollRef.current.scrollTop > 200);
    }
  };

  const scrollToTop = () => {
    if (gridScrollRef.current) {
      try {
        gridScrollRef.current.scroll({ top: 0, left: 0, behavior: 'smooth' });
      } catch {
        gridScrollRef.current.scrollTo(0, 0);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-20 md:mt-28 px-3 sm:px-6 relative z-10">

      {/* ========== 头部 ========== */}
      <div className="text-center mb-8 md:mb-12 relative z-20">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 md:mb-3">
          足迹 · Moments
        </h1>
        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium italic opacity-80 flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-indigo-500" />
          朋友圈迁移至此 · 共 {moments.length} 条动态
        </p>
      </div>

      {/* ========== 控件区：搜索 + 分类 chips + 视图切换 ========== */}
      <div className="flex flex-col items-center gap-5 md:gap-7 mb-10 md:mb-14 relative z-[99]">

        {/* 搜索框 */}
        <div className="relative w-full max-w-lg group px-2 md:px-0">
          <input
            type="text"
            placeholder="在 29 条记忆中搜寻..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 pl-10 md:pl-14 text-sm md:text-base text-slate-800 dark:text-white shadow-lg md:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium"
          />
          <Search className="w-4 h-4 md:w-6 md:h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>

        {/* 分类 chips */}
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 px-2 md:px-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-xs font-black transition-all duration-300 border ${
                selectedCategory === cat
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-md md:shadow-lg md:shadow-indigo-500/30 scale-105'
                  : 'bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {cat !== '全部' && categoryEmoji[cat] ? `${categoryEmoji[cat]} ` : ''}{cat}
            </button>
          ))}
        </div>

        {/* 视图切换（PC 才显示，移动端强制 card） */}
        <div className="hidden md:flex bg-white/50 dark:bg-slate-900/50 p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <ListTree size={16} />
            <span>中枢链路</span>
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <LayoutGrid size={16} />
            <span>矩阵网格</span>
          </button>
        </div>
      </div>

      {/* ========== 视图渲染 ========== */}
      <AnimatePresence mode="wait">
        {viewMode === 'card' ? (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full"
          >
            <style dangerouslySetInnerHTML={{ __html: `
              .cyber-scrollbar::-webkit-scrollbar { width: 8px; }
              .cyber-scrollbar::-webkit-scrollbar-track { background: rgba(99, 102, 241, 0.05); border-radius: 12px; }
              .cyber-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #818cf8 0%, #c084fc 100%); border-radius: 12px; }
              .fade-edges { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); }
            `}} />
            <div
              ref={gridScrollRef}
              onScroll={handleGridScroll}
              className="h-[75vh] overflow-y-auto cyber-scrollbar pr-2 sm:pr-5 pb-10 fade-edges"
            >
              {filtered.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 pt-4 pb-10">
                  {filtered.map((m, idx) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                    >
                      <MomentCardGridItem moment={m} onOpen={() => setOpenMoment(m)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 火箭回到顶部按钮 */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={scrollToTop}
                  className="absolute bottom-4 right-2 md:-right-3 w-9 h-9 md:w-12 md:h-12 flex items-center justify-center bg-gradient-to-t from-purple-500 to-indigo-500 text-white rounded-full shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-1 transition-all z-50"
                  title="回到顶部"
                >
                  <ArrowUp size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="timeline-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative p-2 md:p-6 min-h-[400px]"
          >
            {/* 时间轴竖线 */}
            <div className="absolute border-2 border-indigo-500/30 dark:border-indigo-400/20 h-full left-4 md:left-1/2 md:transform md:-translate-x-1/2 rounded-full transition-colors duration-1000"></div>

            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="relative z-10">
                <AnimatePresence mode='popLayout'>
                  {filtered.map((m, idx) => (
                    <TimelineItem
                      key={m.id}
                      moment={m}
                      isLeft={idx % 2 === 0}
                      onOpen={() => setOpenMoment(m)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 详情 Modal ========== */}
      <AnimatePresence>
        {openMoment && (
          <MomentDetailModal
            moment={openMoment}
            onClose={() => setOpenMoment(null)}
            onImage={(url) => setLightboxImg(url)}
          />
        )}
      </AnimatePresence>

      {/* ========== 大图 Lightbox ========== */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center cursor-pointer p-4 md:p-12"
          >
            <img
              src={lightboxImg}
              alt="full"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <button className="absolute top-4 md:top-8 right-4 md:right-8 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/10">
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ============ 时间轴节点（中枢链路 模式） ============
function TimelineItem({ moment, isLeft, onOpen }: { moment: Moment; isLeft: boolean; onOpen: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`mb-12 md:mb-16 flex items-stretch w-full ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      {/* PC 端对侧留白 */}
      <div className="hidden md:block md:w-5/12"></div>

      {/* 时间线圆点 */}
      <div className="z-20 flex items-center justify-center md:w-[60px] relative ml-4 md:ml-0">
        <div className="absolute left-2 md:left-auto md:right-auto md:relative w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-200/50 dark:ring-indigo-900/40 shadow-lg shadow-indigo-500/30"></div>
      </div>

      {/* 卡片实体 */}
      <div className="md:w-5/12 pl-4 md:pl-0 pr-2 md:pr-0 flex-1">
        <MomentTimelineCard moment={moment} onOpen={onOpen} alignLeft={isLeft} />
      </div>
    </motion.div>
  );
}

// 时间轴卡片样式（PC 端：右对齐）—— 复用截图的"图片+日期+标题+标签+摘要"
function MomentTimelineCard({ moment, onOpen, alignLeft }: { moment: Moment; onOpen: () => void; alignLeft?: boolean }) {
  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="block w-full text-left bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-2xl md:rounded-[28px] shadow-lg md:shadow-xl border border-white/50 dark:border-white/5 overflow-hidden hover:shadow-2xl hover:border-indigo-400/40 transition-all group"
    >
      {/* 封面图 */}
      <div className="relative h-32 md:h-44 overflow-hidden bg-slate-200/30 dark:bg-slate-700/30">
        <img
          src={moment.cover}
          alt={moment.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
        {/* 日期（带时钟图标） */}
        <span className="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-white text-[10px] md:text-xs font-bold bg-black/50 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg flex items-center gap-1.5 border border-white/10">
          <Clock size={11} className="md:w-3 md:h-3" />
          {moment.date_display || timeAgo(moment.date_iso)}
        </span>
        {/* 媒体角标 */}
        {moment.hasMedia && (
          <span className="absolute top-2 right-2 md:top-3 md:right-3 text-white text-[10px] md:text-xs font-bold bg-indigo-500/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
            <ImageIcon size={11} className="md:w-3 md:h-3" />
            {moment.mediaCount}
          </span>
        )}
      </div>

      {/* 内容 */}
      <div className="p-4 md:p-6">
        {/* 分类 + 位置 */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] md:text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-indigo-500/20 flex items-center gap-1">
            {categoryEmoji[moment.category] || '📌'} {moment.category}
          </span>
          {moment.location && (
            <span className="text-[10px] md:text-xs text-slate-500 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-slate-600">
              <MapPin size={10} /> {moment.location}
            </span>
          )}
        </div>

        {/* 标题 */}
        <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {moment.title}
        </h3>

        {/* 标签 */}
        {moment.tags && moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {moment.tags.map(t => (
              <span key={t} className="text-[9px] md:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 摘要 */}
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-medium opacity-90">
          {moment.excerpt || moment.content.slice(0, 90)}
        </p>

        {/* 暗示点击 */}
        <div className="mt-3 flex items-center justify-end text-[10px] md:text-xs text-indigo-500 dark:text-indigo-400 font-black opacity-0 group-hover:opacity-100 transition-opacity">
          展开完整内容 →
        </div>
      </div>
    </motion.button>
  );
}

// ============ 矩阵卡片（card 模式） ============
function MomentCardGridItem({ moment, onOpen }: { moment: Moment; onOpen: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white/60 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg flex flex-col h-full group relative hover:border-indigo-400/40"
    >
      <button onClick={onOpen} className="block flex-1 flex flex-col cursor-pointer text-left w-full">
        <div className="relative h-28 sm:h-36 md:h-40 overflow-hidden bg-slate-200/30 dark:bg-slate-700/30">
          <img
            src={moment.cover}
            alt={moment.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <span className="absolute bottom-2 left-2 md:bottom-3 md:left-4 text-white/90 text-[9px] md:text-xs font-mono font-bold bg-black/40 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded flex items-center gap-1">
            <Calendar size={10} className="md:w-3 md:h-3" />
            {moment.date_display.split(' ')[0] || formatDisplayDate(moment.date_display)}
          </span>
          {moment.hasMedia && (
            <span className="absolute top-2 right-2 md:top-3 md:right-4 text-white text-[9px] md:text-[10px] font-mono bg-indigo-500/70 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded flex items-center gap-1">
              <Hash size={10} className="md:w-3 md:h-3" /> {moment.mediaCount}
            </span>
          )}
        </div>

        <div className="p-3 md:p-5 flex-1 flex flex-col">
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-white mb-1 md:mb-2 line-clamp-2 group-hover:text-indigo-500 transition-colors">
            {moment.title}
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-2 md:mb-3 line-clamp-2 flex-1 leading-snug">
            {moment.excerpt || moment.content.slice(0, 80)}
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-2 mt-auto">
            <span className="text-[8px] md:text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
              {categoryEmoji[moment.category] || '📌'} {moment.category}
            </span>
            {moment.tags?.slice(0, 2).map(t => (
              <span key={t} className="text-[8px] md:text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ============ 详情 Modal ============
function MomentDetailModal({ moment, onClose, onImage }: { moment: Moment; onClose: () => void; onImage: (url: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-2 md:p-6 cursor-pointer overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-2xl border border-white/30 dark:border-white/10 cursor-default"
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center shadow-lg border border-white/40"
        >
          <X size={18} />
        </button>

        {/* 封面图 */}
        <div className="relative w-full aspect-video md:aspect-[16/9] overflow-hidden bg-slate-200 dark:bg-slate-700">
          <img
            src={moment.cover}
            alt={moment.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
        </div>

        {/* 内容 */}
        <div className="p-5 md:p-8">
          {/* 头部信息：分类 + 日期 + 位置 */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1">
              {categoryEmoji[moment.category] || '📌'} {moment.category}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
              <Clock size={12} /> {moment.date_display || formatDisplayDate(moment.date_iso)}
            </span>
            {moment.location && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <MapPin size={12} /> {moment.location}
              </span>
            )}
            {moment.hasMedia && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <ImageIcon size={12} /> {moment.mediaCount} 张
              </span>
            )}
          </div>

          {/* 标题 */}
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
            {moment.title}
          </h2>

          {/* 标签 */}
          {moment.tags && moment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {moment.tags.map(t => (
                <span key={t} className="text-[10px] md:text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/10">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* 摘要 */}
          {moment.excerpt && (
            <div className="mb-4 p-3 md:p-4 bg-indigo-500/5 border-l-4 border-indigo-500 rounded-r-lg text-sm md:text-base text-slate-700 dark:text-slate-200 italic font-medium">
              {moment.excerpt}
            </div>
          )}

          {/* 完整正文 */}
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
            {moment.content || '（仅图片分享）'}
          </div>

          {/* 图片列表（如果是 md 来源有 images[]） */}
          {moment.images && moment.images.length > 1 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {moment.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => onImage(src)}
                  className="aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 group cursor-zoom-in"
                >
                  <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          )}

          {/* 来源标签 */}
          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              ID: {moment.id} · 来源: {moment.source === 'md' ? '📝 Markdown' : '📊 导出'}
            </span>
            <button
              onClick={onClose}
              className="text-xs font-black text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
            >
              ← 返回时间轴
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ 空状态 ============
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 md:py-24 min-h-[300px] md:min-h-[450px]"
    >
      <div className="flex flex-col items-center text-center px-6 md:px-10 py-12 md:py-20 bg-white/40 dark:bg-slate-800/30 backdrop-blur-3xl rounded-[32px] md:rounded-[50px] border border-white/30 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] max-w-lg w-full mx-auto">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
          <Ghost size={32} className="md:w-12 md:h-12 text-indigo-500 relative z-10" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tight">
          这个时间段没有动态
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base leading-relaxed px-2 md:px-4">
          试试调整上方分类筛选，或者换个搜索词 ✨
        </p>
      </div>
    </motion.div>
  );
}
