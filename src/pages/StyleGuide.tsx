import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";

const swatches = [
  { name: "paper", var: "--color-paper", label: "พื้นหลัง" },
  { name: "surface", var: "--color-surface", label: "การ์ด" },
  { name: "ink", var: "--color-ink", label: "ตัวอักษร" },
  { name: "growth-600", var: "--color-growth-600", label: "โต/หลัก (ปุ่ม, ยอดบวก)" },
  { name: "trust-500", var: "--color-trust-500", label: "มั่นคง/รอง (ข้อมูล)" },
  { name: "caution-400", var: "--color-caution-400", label: "ระวัง (needs review)" },
  { name: "alert-400", var: "--color-alert-400", label: "แจ้งเตือนจริง (ไม่ตรง)" },
];

export function StyleGuide() {
  return (
    <MobileShell title="Style Guide" hideFab>
      <div className="flex flex-col gap-5">
        <Card>
          <CardLabel>แนวคิด</CardLabel>
          <p className="mt-1 text-sm text-ink">
            พื้นผิวโทนอุ่น เงียบ เหมือนกระดาษ (แนว Claude) — ตัวเลขยอดเงินคือพระเอกของหน้าจอ
            สีเขียว/น้ำเงินสื่อการเติบโตและความมั่นคง สีแดงสงวนไว้เฉพาะตอนยอดไม่ตรงจริง ๆ
            (ตามหลักการในสเปกข้อ 8 และ 15)
          </p>
        </Card>

        <Card>
          <CardLabel>สี</CardLabel>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {swatches.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div
                  className="h-9 w-9 shrink-0 rounded-lg border border-line"
                  style={{ background: `var(${s.var})` }}
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{s.name}</p>
                  <p className="text-xs text-ink-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardLabel>ตัวอักษร</CardLabel>
          <p className="tabular mt-2 text-[40px] font-extrabold leading-tight text-ink">
            ฿152,000.00
          </p>
          <p className="mt-1 text-[19px] font-bold text-ink">หัวข้อหน้า (h1, 19px/bold)</p>
          <p className="mt-1 text-[15px] text-ink">เนื้อความปกติ (15px)</p>
          <p className="mt-1 text-[13px] font-medium text-ink-muted">label ประกอบ (13px)</p>
        </Card>

        <Card>
          <CardLabel>ปุ่ม</CardLabel>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button variant="primary">หลัก</Button>
            <Button variant="secondary">รอง</Button>
            <Button variant="outline">ขอบ</Button>
            <Button variant="ghost">โปร่ง</Button>
          </div>
        </Card>

        <Card>
          <CardLabel>Badge</CardLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="growth">ตรง</Badge>
            <Badge tone="trust">ข้อมูล</Badge>
            <Badge tone="caution">รอตรวจสอบ</Badge>
            <Badge tone="alert">ไม่ตรง</Badge>
            <Badge tone="neutral">เป็นกลาง</Badge>
          </div>
        </Card>

        <Card>
          <CardLabel>Progress + ghost bar</CardLabel>
          <ProgressBar value={30} ghostValue={45} className="mt-3" />
        </Card>

        <Card>
          <CardLabel>Input</CardLabel>
          <Input className="mt-2" placeholder="จำนวนเงิน" />
        </Card>

        <Card>
          <CardLabel>ระยะและมุมโค้ง</CardLabel>
          <p className="mt-1 text-sm text-ink-muted">
            รัศมีการ์ด 1.25rem (20px), รัศมีปุ่ม/ช่องกรอก 0.875rem (14px) — ปุ่มสูงอย่างน้อย 48px
            (h-12) เพื่อให้กดง่ายด้วยนิ้วหัวแม่มือบนมือถือ
          </p>
        </Card>
      </div>
    </MobileShell>
  );
}
