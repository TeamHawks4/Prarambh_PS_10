import pandas as pd
import numpy as np

def forecast_next_two_days(data):
    if len(data) == 0:
        return None, None

    last_7 = data.tail(7)['amount']
    avg = last_7.mean()
    std = last_7.std()

    forecast_upper = avg + std
    forecast_lower = max(0, avg - std)

    return forecast_lower, forecast_upper


def generate_personalized_suggestions(data):
    if len(data) == 0:
        return ["No data yet to analyze."]

    avg_expense = data['amount'].mean()
    total = data['amount'].sum()
    top_category = data.groupby('category')['amount'].sum().idxmax()

    suggestions = [
        f"💡 Your average daily expense so far is ₹{avg_expense:,.2f}.",
        f"📊 You’ve spent the most on **{top_category}**.",
        f"📅 Your total tracked spending is ₹{total:,.2f}.",
    ]

    # --- Category-based personalized advice ---
    if "Food" in data["category"].values:
        suggestions.append("🍽 Try planning meals weekly to reduce frequent small food purchases.")
    if "Transport" in data["category"].values:
        suggestions.append("🚗 Consider using public transport or carpooling to save fuel costs.")
    if "Entertainment" in data["category"].values:
        suggestions.append("🎬 Set a monthly entertainment budget to avoid overspending on leisure.")
    if "Shopping" in data["category"].values:
        suggestions.append("🛍 Track your shopping habits; wait 24 hours before making non-essential purchases.")
    if "Bills" in data["category"].values:
        suggestions.append("💡 Review monthly bills and look for subscription plans you no longer use.")
    if "Other" in data["category"].values:
        suggestions.append("📂 Review 'Other' expenses to categorize them properly and find hidden costs.")

    # --- General Smart Tips ---
    suggestions.append("✅ Keep 20% of your monthly income as savings buffer.")
    suggestions.append("📈 Try reducing expenses in your highest-spending category by 10% next month.")

    return suggestions
