// 本地歌单配置（放在 public/music 下的音频文件）
// src: 以 /music/ 开头，对应 public/music 里的文件，文件名含空格请写成 %20
// cover: 留空会自动使用站点默认唱片封面
// lrc: 可选，填 /music/xxx.lrc 即可显示滚动歌词

export interface LocalSong {
  title: string;
  artist?: string;
  src: string;
  cover?: string;
  lrc?: string;
}

export const localMusic: LocalSong[] = [
  {
    title: "赐我",
    artist: "一只白羊",
    src: "/music/赐我.mp3",
    cover: "/music/赐我.png",
    lrc: "",
  },
  {
    title: "STYX HELIX",
    artist: "MYTH & ROID",
    src: "/music/STYX%20HELIX.mp3",
    cover: "/music/STYX%20HELIX.png",
    lrc: "",
  },
  {
    title: "日落坠入海",
    artist: "鱼儿七",
    src: "/music/日落坠入海.mp3",
    cover: "/music/日落坠入海.png",
    lrc: "",
  },
];
