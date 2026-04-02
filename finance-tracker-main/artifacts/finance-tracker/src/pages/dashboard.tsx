import { useGetDashboard } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, Wallet, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading || !dashboard) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-muted rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
          </div>
          <div className="h-64 bg-muted rounded-2xl"></div>
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    {
      title: "Total Balance",
      amount: dashboard.balance,
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20"
    },
    {
      title: "Total Income",
      amount: dashboard.totalIncome,
      icon: ArrowUpRight,
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20"
    },
    {
      title: "Total Expenses",
      amount: dashboard.totalExpense,
      icon: ArrowDownRight,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20"
    }
  ];

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here is your financial overview.</p>
        </div>
        <Link href="/transactions/new" className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Plus className="w-5 h-5" />
          <span>Add Transaction</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statCards.map((stat, i) => (
          <div key={i} className={`bg-card rounded-2xl p-6 shadow-sm border ${stat.border} flex items-center space-x-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-3xl font-display font-bold text-foreground tracking-tight">
                {formatCurrency(stat.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-display font-semibold">Recent Transactions</h2>
          <Link href="/transactions" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center group">
            View All <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {dashboard.recentTransactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No transactions yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
              Start tracking your spending by adding your first transaction.
            </p>
            <Link href="/transactions/new" className="inline-flex items-center space-x-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl font-medium hover:bg-secondary/80 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {dashboard.recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.category}</p>
                    <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-0.5">
                      <span>{formatDate(tx.date)}</span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px] sm:max-w-xs">{tx.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`font-display font-semibold text-lg ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
