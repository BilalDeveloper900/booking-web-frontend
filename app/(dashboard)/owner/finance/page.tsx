import { FinanceScreen } from "@/components/screens/finance-screen";
import { UpgradeGate } from "@/components/upgrade-gate";

export default function FinancePage() {
  return (
    <UpgradeGate feature="finance">
      <FinanceScreen />
    </UpgradeGate>
  );
}
