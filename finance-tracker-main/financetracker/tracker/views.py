from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import calendar

from .models import Transaction
from .forms import RegisterForm, LoginForm, TransactionForm, TransactionFilterForm


def register_view(request):
    """Handle new user registration."""
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Welcome, {user.username}! Your account has been created.')
            return redirect('dashboard')
    else:
        form = RegisterForm()

    return render(request, 'tracker/register.html', {'form': form})


def login_view(request):
    """Handle user login."""
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f'Welcome back, {user.username}!')
            return redirect('dashboard')
    else:
        form = LoginForm(request)

    return render(request, 'tracker/login.html', {'form': form})


def logout_view(request):
    """Log the user out."""
    logout(request)
    messages.info(request, 'You have been logged out.')
    return redirect('login')


@login_required
def dashboard_view(request):
    """
    Dashboard showing totals (income, expense, balance) and recent transactions.
    """
    user_transactions = Transaction.objects.filter(user=request.user)

    total_income = user_transactions.filter(type='income').aggregate(
        total=Sum('amount'))['total'] or Decimal('0')
    total_expense = user_transactions.filter(type='expense').aggregate(
        total=Sum('amount'))['total'] or Decimal('0')
    balance = total_income - total_expense

    recent_transactions = user_transactions.order_by('-date', '-created_at')[:5]

    context = {
        'total_income': total_income,
        'total_expense': total_expense,
        'balance': balance,
        'recent_transactions': recent_transactions,
    }
    return render(request, 'tracker/dashboard.html', context)


@login_required
def transaction_list_view(request):
    """
    List all transactions for the logged-in user.
    Supports filtering by category, type, and date range.
    """
    queryset = Transaction.objects.filter(user=request.user)
    form = TransactionFilterForm(request.GET or None)

    if form.is_valid():
        category = form.cleaned_data.get('category')
        tx_type = form.cleaned_data.get('type')
        date_from = form.cleaned_data.get('date_from')
        date_to = form.cleaned_data.get('date_to')

        if category:
            queryset = queryset.filter(category=category)
        if tx_type:
            queryset = queryset.filter(type=tx_type)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

    total_income = queryset.filter(type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0')
    total_expense = queryset.filter(type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0')

    context = {
        'transactions': queryset,
        'form': form,
        'total_income': total_income,
        'total_expense': total_expense,
        'count': queryset.count(),
    }
    return render(request, 'tracker/transaction_list.html', context)


@login_required
def transaction_add_view(request):
    """Add a new transaction."""
    if request.method == 'POST':
        form = TransactionForm(request.POST)
        if form.is_valid():
            transaction = form.save(commit=False)
            transaction.user = request.user
            transaction.save()
            messages.success(request, 'Transaction added successfully.')
            return redirect('transaction_list')
    else:
        form = TransactionForm(initial={'date': date.today()})

    return render(request, 'tracker/transaction_form.html', {'form': form, 'title': 'Add Transaction'})


@login_required
def transaction_edit_view(request, pk):
    """Edit an existing transaction."""
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)

    if request.method == 'POST':
        form = TransactionForm(request.POST, instance=transaction)
        if form.is_valid():
            form.save()
            messages.success(request, 'Transaction updated successfully.')
            return redirect('transaction_list')
    else:
        form = TransactionForm(instance=transaction)

    return render(request, 'tracker/transaction_form.html', {
        'form': form,
        'title': 'Edit Transaction',
        'transaction': transaction,
    })


@login_required
def transaction_delete_view(request, pk):
    """Delete a transaction (POST only for safety)."""
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)

    if request.method == 'POST':
        transaction.delete()
        messages.success(request, 'Transaction deleted.')
        return redirect('transaction_list')

    return render(request, 'tracker/transaction_confirm_delete.html', {'transaction': transaction})


@login_required
def monthly_summary_view(request):
    """
    Show a monthly breakdown of income, expenses, and balance
    for the last 12 months.
    """
    today = date.today()
    monthly_data = []

    for i in range(11, -1, -1):
        # Calculate year and month for each of the last 12 months
        month_offset = today.month - i - 1
        year = today.year + (month_offset // 12)
        month = month_offset % 12 + 1
        if month <= 0:
            month += 12
            year -= 1

        _, last_day = calendar.monthrange(year, month)
        month_start = date(year, month, 1)
        month_end = date(year, month, last_day)

        month_txns = Transaction.objects.filter(
            user=request.user,
            date__gte=month_start,
            date__lte=month_end,
        )

        income = month_txns.filter(type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        expense = month_txns.filter(type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        balance = income - expense

        monthly_data.append({
            'label': month_start.strftime('%B %Y'),
            'income': income,
            'expense': expense,
            'balance': balance,
            'month_start': month_start,
        })

    context = {'monthly_data': monthly_data}
    return render(request, 'tracker/monthly_summary.html', context)
