import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useCreateTransaction, 
  useUpdateTransaction, 
  useGetTransaction,
  getListTransactionsQueryKey,
  getGetDashboardQueryKey,
  getGetMonthlySummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const COMMON_CATEGORIES = {
  expense: ["Food & Dining", "Transportation", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"],
  income: ["Salary", "Freelance", "Investment", "Gift", "Refund", "Other"]
};

export default function TransactionForm() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : undefined;
  const isEdit = !!id;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingTx, isLoading: isLoadingExisting } = useGetTransaction(id as number, { query: { enabled: isEdit } });
  
  const createMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        invalidateCaches();
        toast({ title: "Success", description: "Transaction added successfully." });
        setLocation("/transactions");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to create transaction." });
      }
    }
  });

  const updateMutation = useUpdateTransaction({
    mutation: {
      onSuccess: () => {
        invalidateCaches();
        toast({ title: "Success", description: "Transaction updated successfully." });
        setLocation("/transactions");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to update transaction." });
      }
    }
  });

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
  };

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().split('T')[0],
      amount: undefined,
      category: "",
      notes: "",
    }
  });

  const txType = watch("type");

  useEffect(() => {
    if (isEdit && existingTx) {
      setValue("amount", existingTx.amount);
      setValue("type", existingTx.type);
      setValue("category", existingTx.category);
      setValue("date", existingTx.date);
      setValue("notes", existingTx.notes || "");
    }
  }, [isEdit, existingTx, setValue]);

  const onSubmit = (data: FormValues) => {
    if (isEdit && id) {
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  if (isEdit && isLoadingExisting) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Link href="/transactions" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to transactions
        </Link>
        
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="mb-8 border-b border-border pb-6">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {isEdit ? "Edit Transaction" : "New Transaction"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? "Update the details of your transaction below." : "Enter the details of your new income or expense."}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <label className={`
                relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                ${txType === 'expense' ? 'border-destructive bg-destructive/5 text-destructive' : 'border-border hover:border-border/80 text-muted-foreground'}
              `}>
                <input type="radio" value="expense" className="sr-only" {...register("type")} />
                <span className="font-semibold">Expense</span>
              </label>
              
              <label className={`
                relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                ${txType === 'income' ? 'border-success bg-success/5 text-success' : 'border-border hover:border-border/80 text-muted-foreground'}
              `}>
                <input type="radio" value="income" className="sr-only" {...register("type")} />
                <span className="font-semibold">Income</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  className={`w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 transition-all ${errors.amount ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-primary/10'}`}
                  placeholder="0.00"
                  {...register("amount")}
                />
              </div>
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <input 
                  type="text" 
                  list="categories"
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 transition-all ${errors.category ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-primary/10'}`}
                  placeholder="E.g., Groceries"
                  {...register("category")}
                />
                <datalist id="categories">
                  {COMMON_CATEGORIES[txType].map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <input 
                  type="date" 
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 transition-all ${errors.date ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-primary/10'}`}
                  {...register("date")}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                placeholder="Add any extra details here..."
                {...register("notes")}
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Link href="/transactions" className="px-6 py-3 rounded-xl font-medium text-foreground hover:bg-secondary transition-colors">
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={isPending}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Transaction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
