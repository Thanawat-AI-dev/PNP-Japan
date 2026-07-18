import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function Reconciliation() {
  return (
    <MobileShell title="กระทบยอด" hideFab>
      <Card>
        <CardLabel>ยอดจริงในบัญชี ณ สิ้นเดือน</CardLabel>
        <Input className="mt-2" inputMode="decimal" placeholder="0.00" />
        <Button className="mt-3 w-full">บันทึกและเทียบยอด</Button>
      </Card>
    </MobileShell>
  );
}
