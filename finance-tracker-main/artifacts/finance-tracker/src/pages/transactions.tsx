import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListTransactions, useDeleteTransaction, getListTransactionsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, Search, Filter, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const [type, setType] = useState<"income" | "expense" | "">("");
  const [category, setCategory] = useState("");
  
  const { data, isLoading } = useListTransactions({
    type: type || undefined,
    category: category || undefined,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        toast({ title: "Transaction deleted", description: "The transaction has been removed." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete transaction." });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and manage all your income and expenses.</p>
        </div>
        <Link href="/transactions/new" className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Plus className="w-5 h-5" />
          <span>Add Transaction</span>
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm mb-8">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none font-medium"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search category..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data || data.transactions.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            No transactions found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-muted-foreground text-sm font-medium border-b border-border">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">
                        {tx.type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5 text-success" /> : <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />}
                        <span>{tx.category}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {tx.notes || "-"}
                    </td>
                    <td className={`px-6 py-4 text-right whitespace-nowrap font-display font-semibold ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/transactions/${tx.id}/edit`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data && data.transactions.length > 0 && (
          <div className="p-4 border-t border-border bg-slate-50/50 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Showing {data.transactions.length} transactions</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
