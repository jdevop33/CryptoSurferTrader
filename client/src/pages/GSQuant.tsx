import { GSQuantDashboard } from '@/components/GSQuantDashboard';
import { TradingHeader } from '@/components/TradingHeader';
import { TradingSidebar } from '@/components/TradingSidebar';

export default function GSQuant() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <TradingHeader />
      <div className="flex">
        <TradingSidebar />
        <main className="flex-1 p-6">
          <GSQuantDashboard />
        </main>
      </div>
    </div>
  );
}