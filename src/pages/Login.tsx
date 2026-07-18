import { useState } from "react";
import { Sprout } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to supabase.auth.signInWithOtp({ email }) once Supabase is connected.
    setSent(true);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-growth-600 text-white">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">SaveTogether</h1>
          <p className="mt-1 text-sm text-ink-muted">ติดตามเงินออมที่ฝากไว้ด้วยกัน</p>
        </div>

        <Card>
          {sent ? (
            <div className="py-2 text-center">
              <p className="font-semibold text-ink">ส่งลิงก์เข้าสู่ระบบแล้ว</p>
              <p className="mt-1 text-sm text-ink-muted">
                เช็คอีเมล {email} แล้วกดลิงก์เพื่อเข้าใช้งาน
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-ink" htmlFor="email">
                อีเมล
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" className="mt-2">
                ส่งลิงก์เข้าสู่ระบบ
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
