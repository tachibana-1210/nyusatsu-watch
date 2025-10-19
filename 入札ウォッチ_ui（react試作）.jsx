import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---- 型定義 ----
type SearchForm = {
  prefecture: string;
  agency: string;
  title: string;
  titleMatch: "partial" | "exact";
  includeMode: "all" | "any" | "excludeOnly"; // 画像の「すべてを含む」に相当（拡張）
  includeKeywords: string; // スペース区切り
  excludeKeywords: string; // スペース区切り
  division: string; // 区分
  grades: { A: boolean; B: boolean; C: boolean; D: boolean };
  year: string; // 公示年
  status: "all" | "open" | "closed"; // すべて/入札受付中/入札終了分
  monthFrom: string; // 公示月 From
  monthTo: string;   // 公示月 To
};

// ---- ダミー案件 ----
const DUMMY = [
  {
    id: "EX-001",
    title: "データ入力業務 一式",
    agency: "総務省",
    prefecture: "東京都",
    division: "役務",
    grades: ["A","B","C","D"],
    publishedAt: "2025-10-18",
    deadline: "2025-10-25 17:00",
    status: "open" as const,
    budget: "200万〜800万円",
    url: "https://example.gov/ex-001"
  },
  {
    id: "EX-002",
    title: "スキャン・電子化（公文書）",
    agency: "広島市",
    prefecture: "広島県",
    division: "役務",
    grades: ["B","C","D"],
    publishedAt: "2025-10-16",
    deadline: "2025-10-30 17:00",
    status: "open" as const,
    budget: "150万〜300万円",
    url: "https://example.gov/ex-002"
  },
  {
    id: "EX-003",
    title: "Web更新業務・運用保守",
    agency: "某独法",
    prefecture: "全国",
    division: "役務",
    grades: ["A","B"],
    publishedAt: "2025-08-02",
    deadline: "2025-08-20 12:00",
    status: "closed" as const,
    budget: "400万〜600万円",
    url: "https://example.gov/ex-003"
  }
];

const PREFS = [
  "",
  "全国",
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const YEARS = ["", "2023", "2024", "2025", "2026"]; // 拡張可
const MONTHS = ["", ...Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))];
const DIVISIONS = ["", "工事", "物品", "役務", "委託", "その他"]; // ざっくり

export default function BiddingUI() {
  const [f, setF] = useState<SearchForm>({
    prefecture: "",
    agency: "",
    title: "",
    titleMatch: "partial",
    includeMode: "all",
    includeKeywords: "",
    excludeKeywords: "",
    division: "",
    grades: { A: true, B: true, C: true, D: true },
    year: "2025",
    status: "all",
    monthFrom: "",
    monthTo: "",
  });

  const [results, setResults] = useState(DUMMY);

  const gradeList = useMemo(() =>
    Object.entries(f.grades).filter(([_, v]) => v).map(([k]) => k), [f.grades]
  );

  const onSearch = () => {
    // 本番ではバックエンドAPIに f をそのまま渡す。ここではフロント側で簡易フィルタ。
    const inc = (f.includeKeywords || "").trim();
    const exc = (f.excludeKeywords || "").trim();
    const incWords = inc ? inc.split(/\s+/) : [];
    const excWords = exc ? exc.split(/\s+/) : [];

    const filtered = DUMMY.filter((x) => {
      // 都道府県
      if (f.prefecture && x.prefecture !== f.prefecture && x.prefecture !== "全国") return false;

      // 発注機関名
      if (f.agency && !x.agency.includes(f.agency)) return false;

      // 区分
      if (f.division && x.division !== f.division) return false;

      // 等級
      if (gradeList.length && !gradeList.some((g) => x.grades.includes(g))) return false;

      // 公示年・月
      if (f.year) {
        if (!x.publishedAt.startsWith(f.year)) return false;
      }
      const mm = x.publishedAt.split("-")[1];
      if (f.monthFrom && mm < f.monthFrom) return false;
      if (f.monthTo && mm > f.monthTo && f.monthTo !== "") return false;

      // 状態
      if (f.status !== "all" && x.status !== f.status) return false;

      // 案件名（部分一致／完全一致）
      if (f.title) {
        if (f.titleMatch === "partial") {
          if (!x.title.includes(f.title)) return false;
        } else {
          if (x.title !== f.title) return false;
        }
      }

      // キーワード（含む／除く）
      const hay = `${x.title} ${x.agency}`;
      if (incWords.length) {
        if (f.includeMode === "all" && !incWords.every((w) => hay.includes(w))) return false;
        if (f.includeMode === "any" && !incWords.some((w) => hay.includes(w))) return false;
      }
      if (excWords.length && excWords.some((w) => hay.includes(w))) return false;

      return true;
    });

    setResults(filtered);
  };

  const onClear = () => {
    setF({
      prefecture: "",
      agency: "",
      title: "",
      titleMatch: "partial",
      includeMode: "all",
      includeKeywords: "",
      excludeKeywords: "",
      division: "",
      grades: { A: true, B: true, C: true, D: true },
      year: "2025",
      status: "all",
      monthFrom: "",
      monthTo: "",
    });
    setResults(DUMMY);
  };

  return (
    <div className="min-h-screen p-6 grid gap-6 bg-gray-50">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">案件検索</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* 1段目：都道府県／発注機関名 ／ 一致モード */}
          <div className="grid md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <Label>都道府県</Label>
              <Select value={f.prefecture} onValueChange={(v) => setF({ ...f, prefecture: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {PREFS.map((p) => (
                    <SelectItem key={p} value={p}>{p || "指定なし"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6">
              <Label>発注機関名</Label>
              <Input value={f.agency} onChange={(e) => setF({ ...f, agency: e.target.value })} placeholder="例：総務省／広島市 など" />
            </div>
            <div className="md:col-span-3">
              <Label className="mb-1 block">案件名一致</Label>
              <RadioGroup value={f.titleMatch} onValueChange={(v) => setF({ ...f, titleMatch: v as any })} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="partial" value="partial" />
                  <Label htmlFor="partial">部分一致</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="exact" value="exact" />
                  <Label htmlFor="exact">完全一致</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* 2段目：案件名・キーワード含む・除く */}
          <div className="grid md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <Label>案件名</Label>
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="例：データ入力" />
            </div>
            <div className="md:col-span-5">
              <Label>キーワード（含む・空白区切り）</Label>
              <Input value={f.includeKeywords} onChange={(e) => setF({ ...f, includeKeywords: e.target.value })} placeholder="例：データ 電子化" />
              <div className="mt-2 flex items-center gap-4">
                <Label className="text-sm">一致条件</Label>
                <Select value={f.includeMode} onValueChange={(v) => setF({ ...f, includeMode: v as any })}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてを含む</SelectItem>
                    <SelectItem value="any">いずれかを含む</SelectItem>
                    <SelectItem value="excludeOnly">（除外のみ使う）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="md:col-span-3">
              <Label>このキーワードを除く</Label>
              <Input value={f.excludeKeywords} onChange={(e) => setF({ ...f, excludeKeywords: e.target.value })} placeholder="例：建設 工事" />
            </div>
          </div>

          {/* 3段目：区分／等級 */}
          <div className="grid md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <Label>区分</Label>
              <Select value={f.division} onValueChange={(v) => setF({ ...f, division: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d || "指定なし"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-9">
              <Label>等級</Label>
              <div className="flex items-center gap-6 py-2">
                {(["A","B","C","D"] as const).map((g) => (
                  <div key={g} className="flex items-center space-x-2">
                    <Checkbox id={`g-${g}`} checked={(f.grades as any)[g]} onCheckedChange={(v) => setF({ ...f, grades: { ...f.grades, [g]: Boolean(v) } })} />
                    <Label htmlFor={`g-${g}`}>{g}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4段目：公示（年／月）＆ 状態 */}
          <div className="grid md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <Label>公示（年）</Label>
              <Select value={f.year} onValueChange={(v) => setF({ ...f, year: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y || "全て"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5">
              <Label>公示（月）</Label>
              <div className="flex items-center gap-2">
                <Select value={f.monthFrom} onValueChange={(v) => setF({ ...f, monthFrom: v })}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="全て" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>{m || "全て"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="opacity-60">〜</span>
                <Select value={f.monthTo} onValueChange={(v) => setF({ ...f, monthTo: v })}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="全て" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>{m || "全て"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="md:col-span-4">
              <Label className="mb-1 block">状態</Label>
              <RadioGroup value={f.status} onValueChange={(v) => setF({ ...f, status: v as any })} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="st-all" value="all" />
                  <Label htmlFor="st-all">すべて</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="st-open" value="open" />
                  <Label htmlFor="st-open">入札受付中</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="st-closed" value="closed" />
                  <Label htmlFor="st-closed">入札終了分</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-3">
            <Button className="px-6" onClick={onSearch}>案件検索</Button>
            <Button variant="secondary" onClick={onClear}>クリア</Button>
          </div>
        </CardContent>
      </Card>

      {/* 結果一覧 */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">検索結果 <span className="text-sm opacity-60">{results.length}件</span></CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {results.length === 0 && (
            <div className="text-center text-sm opacity-70 py-8">条件に一致する案件はありませんでした。</div>
          )}
          {results.map((r) => (
            <div key={r.id} className="rounded-2xl border p-4 bg-white shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid gap-1 flex-1">
                  <div className="font-semibold text-base leading-tight">{r.title}</div>
                  <div className="text-sm opacity-80">{r.agency}｜{r.prefecture}｜{r.division}</div>
                  <div className="text-sm opacity-80">公示：{r.publishedAt}　締切：{r.deadline}</div>
                  <div className="text-sm opacity-80">想定規模：{r.budget}</div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {r.grades.map((g: string) => (
                      <Badge key={g} variant="secondary">等級 {g}</Badge>
                    ))}
                    <Badge variant={r.status === "open" ? "default" : "secondary"}>
                      {r.status === "open" ? "入札受付中" : "入札終了"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <Button className="">原文を開く</Button>
                  </a>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex gap-2">
                <Button variant="secondary">お気に入り</Button>
                <Button variant="secondary">除外</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="max-w-5xl mx-auto text-xs opacity-70">
        ※ 現在はダミーデータで動作しています。バックエンドAPI（全省庁統一資格の案件収集）に接続すると本番化できます。
      </div>
    </div>
  );
}
