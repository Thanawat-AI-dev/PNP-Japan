import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatBaht, formatThaiDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { computeBalance } from "@/lib/transactions";

interface ReconciliationRow {
  id: string;
  as_of_date: string;
  bank_balance: number;
  system_balance: number;
  difference: number;
}

export function Reconciliation() {
  const { account } = useAccount();
  const { transactions } = useTransactions(account?.id);
  const systemBalance = computeBalance(transactions);

  const [bankBalance, setBankBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ReconciliationRow | null>(null);

  async function handleSubmit() {
    if (!account || !bankBalance) return;
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("reconciliations")
      .insert({
        account_id: account.id,
        as_of_date: new Date().toISOString().slice(0, 10),
        bank_balance: Number(bankBalance),
        system_balance: systemBalance,
      })
      .select("id, as_of_date, bank_balance, system_balance, difference")
      .single();

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setLastResult(data);
    setBankBalance("");
  }

  return (
    <MobileShell title="กระทบยอด" hideFab>
      <div className="flex flex-col gap-4">
        <Card>
          <CardLabel>ยอดจริงในบัญชี ณ วันนี้</CardLabel>
          <p className="mt-1 text-xs text-ink-muted">
            ระบบมียอด ฿{formatBaht(systemBalance)} — กรอกยอดจริงจากแอปธนาคารเพื่อเทียบ
          </p>
          <Input
            className="mt-2"
            inputMode="decimal"
            placeholder="0.00"
            value={bankBalance}
            onChange={(e) => setBankBalance(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-alert-600">{error}</p>}
          <Button className="mt-3 w-full" disabled={!bankBalance || saving} onClick={handleSubmit}>
            {saving ? "กำลังบันทึก..." : "บันทึกและเทียบยอด"}
          </Button>
        </Card>

        {lastResult && (
          <Card>
            <div className="flex items-center justify-between">
              <CardLabel>{formatThaiDate(new Date(lastResult.as_of_date))}</CardLabel>
              {Math.abs(lastResult.difference) < 0.01 ? (
                <Badge tone="growth">ตรง</Badge>
              ) : (
                <Badge tone="alert">ต่าง ฿{formatBaht(Math.abs(lastResult.difference))}</Badge>
              )}
            </div>
            <div className="tabular mt-2 flex items-center justify-between text-sm">
              <span className="text-ink-muted">ยอดจริง</span>
              <span className="font-semibold text-ink">฿{formatBaht(lastResult.bank_balance)}</span>
            </div>
            <div className="tabular mt-1 flex items-center justify-between text-sm">
              <span className="text-ink-muted">ยอดในระบบ</span>
              <span className="font-semibold text-ink">฿{formatBaht(lastResult.system_balance)}</span>
            </div>
          </Card>
        )}
      </div>
    </MobileShell>
  );
}
