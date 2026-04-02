import { AppLayout } from "@/components/layout/AppLayout";
import { useGetMonthlySummary } from "@workspace/api-client-react";
import { formatCurrency, formatMonth } from "@/lib/format";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

export default function MonthlySummary() {
  const { data, isLoading } = useGetMonthlySummary();

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Monthly Summary</h1>
        <p className="text-muted-foreground mt-1">A high-level view of your performance over the last 12 months.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-slate-50/50">
          <h2 className="text-xl font-display font-semibold">Cash Flow Analysis</h2>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data || data.summary.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            No data available for the past 12 months.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.summary.map((entry) => {
              const maxVal = Math.max(entry.income, entry.expense, 1);
              const incomePct = (entry.income / maxVal) * 100;
              const expensePct = (entry.expense / maxVal) * 100;
              const isPositive = entry.balance >= 0;

              return (
                <div key={entry.month} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-40 shrink-0">
                      <h3 className="font-semibold text-foreground">{formatMonth(entry.month)}</h3>
                      <div className={`mt-1 flex items-center text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {isPositive ? '+' : ''}{formatCurrency(entry.balance)} Net
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Income Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-muted-foreground">Income</span>
                          <span className="font-semibold text-success">{formatCurrency(entry.income)}</span>
                        </div>
                        <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${incomePct}%` }}
                          />
                        </div>
                      </div>

                      {/* Expense Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-muted-foreground">Expenses</span>
                          <span className="font-semibold text-destructive">{formatCurrency(entry.expense)}</span>
                        </div>
                        <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-destructive rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${expensePct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
