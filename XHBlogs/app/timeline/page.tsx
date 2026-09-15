import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import { ToastProvider } from '../../components/ToastProvider';
import { moments, momentCategories } from '../../data/moments';

export const metadata = {
  title: "足迹 | " + siteConfig.title,
  description: "朋友圈迁移至此——中枢链路 / 矩阵网格时间轴呈现。",
};

export default function Timeline() {
  // 朋友圈数据已统一在 data/moments.ts（含 ts + md，去重后排序）
  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-32">
        <Navbar />
        <PageTransition>
          <TimelineClient moments={moments} categories={momentCategories} />
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
