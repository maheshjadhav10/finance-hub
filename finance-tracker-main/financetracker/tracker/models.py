from django.db import models
from django.contrib.auth.models import User


class Transaction(models.Model):
    """
    Represents a single financial transaction.

    Fields:
    - user: The owner of this transaction (linked to Django's built-in User model).
    - amount: The monetary value (always positive; type determines direction).
    - type: Either 'income' or 'expense'.
    - category: A label like 'Food', 'Salary', etc.
    - date: The date the transaction occurred.
    - notes: Optional free-text notes about the transaction.
    """

    INCOME = 'income'
    EXPENSE = 'expense'
    TYPE_CHOICES = [
        (INCOME, 'Income'),
        (EXPENSE, 'Expense'),
    ]

    CATEGORY_CHOICES = [
        ('Food', 'Food'),
        ('Transport', 'Transport'),
        ('Housing', 'Housing'),
        ('Entertainment', 'Entertainment'),
        ('Healthcare', 'Healthcare'),
        ('Salary', 'Salary'),
        ('Freelance', 'Freelance'),
        ('Investment', 'Investment'),
        ('Education', 'Education'),
        ('Shopping', 'Shopping'),
        ('Utilities', 'Utilities'),
        ('Other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='Other')
    date = models.DateField()
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.type.capitalize()} | {self.category} | ${self.amount} on {self.date}"
