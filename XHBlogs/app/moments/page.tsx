import { redirect } from 'next/navigation';

// 朋友圈已整体迁移至 /timeline（足迹）模块；
// 原 /moments 路由保留作 301 重定向，避免老链接失效。
export default function MomentsPage() {
  redirect('/timeline');
}
