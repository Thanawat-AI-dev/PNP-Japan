# SaveTogether

เว็บแอปติดตามเงินฝากที่รับฝากจากเพื่อน — สเปกเต็มอยู่ที่ [`savings-tracker-spec.md`](./savings-tracker-spec.md)

## สถานะปัจจุบัน

Phase 1 UI shell เสร็จแล้ว (ดูสเปกข้อ 12 สำหรับแผนทั้งหมด):

- Design system มือถือ-ก่อน โทนอุ่นแบบกระดาษ (ดูที่ `/style-guide` ในแอป) — สีเขียว/น้ำเงินสื่อการเติบโตและความมั่นคง
  ตามที่สเปกข้อ 8 กำหนด สีแดงสงวนไว้เฉพาะตอนยอดไม่ตรงจริง
- หน้าจอ: Dashboard, แนบสลิป, ประวัติ, เป้าหมาย, ความสำเร็จ, ดอกเบี้ย, กระทบยอด, Audit Log, ตั้งค่า, เข้าสู่ระบบ
- ทุกหน้าใช้ **mock data** จาก `src/lib/mockData.ts` ยังไม่เชื่อม Supabase จริง

## เริ่มพัฒนา

```bash
npm install
npm run dev
```

## เชื่อม Supabase (ทำตามสเปกข้อ 13)

1. สร้างโปรเจกต์ที่ supabase.com (region Southeast Asia)
2. ไปที่ SQL Editor แล้ววาง `supabase/schema.sql` ทั้งไฟล์ (มีทั้งตารางและ RLS พื้นฐาน)
3. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ของโปรเจกต์จริง
4. `src/lib/supabase.ts` คือจุดเดียวที่สร้าง Supabase client — import จากตรงนี้ในทุกหน้าที่ต้องอ่าน/เขียนข้อมูลจริง

## สิ่งที่ยังไม่ได้ทำ (ดูสเปกข้อ 12 เฟส 2-5)

- อ่าน QR + OCR สลิปจริง (ตอนนี้หน้า "แนบสลิป" ใช้ค่าจำลอง)
- Auth ด้วย Magic Link จริง (`supabase.auth.signInWithOtp`)
- เครื่องคำนวณดอกเบี้ยสะสมรายวัน + unit test
- PWA / offline shell / dark mode toggle (ตอนนี้ dark mode ตาม `prefers-color-scheme` ของเครื่องอย่างเดียว)
- RLS ให้ครบทุกตาราง (ตอนนี้มีแค่ `transactions`)
