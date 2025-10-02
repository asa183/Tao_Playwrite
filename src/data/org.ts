export type Faculty = {
  name: string;        // 学部・研究科の名称
};

export type Department = {
  name: string;        // 学科・専攻の名称
  facultyName: string; // 親となる学部の名称
};

// 千葉大学 理学部（親）
export const faculties: Faculty[] = [
  { name: '理学部' }
];

// 理学部 配下の学科
export const departments: Department[] = [
  { name: '物理学科',   facultyName: '理学部' },
  { name: '地球科学科', facultyName: '理学部' }
];

