# 💸 SplitiFy Expense Insight App

SplitiFy is a smart **personal expense tracking and analysis application** built using **Streamlit** and **SQLite**.  
It helps users manage daily expenses, visualize spending patterns, and get **personalized insights** along with simple **rule-based forecasting**.

---

## 🌟 Features

- 🧾 **Add and Track Expenses**
  - Add date, category, and amount of expenses.
  - Stores all data in a lightweight local **SQLite database**.
  
- 📊 **Expense Overview**
  - Displays expenses in an interactive table.
  - Shows a **pie chart** for category-wise spending distribution.

- 🔍 **Analytics Mode**
  - Provides **forecasted spending range** for the next two days using a rule-based algorithm.
  - Delivers **personalized suggestions** based on spending habits.

- ⚙️ **User-Friendly Interface**
  - Sidebar for adding and analyzing expenses.
  - Clean light theme with bordered sections for better visual separation.
  - Forecast and suggestions shown side-by-side for quick insights.

---

## 🧠 Future Model Integration

A machine learning model (Random Forest / ARIMA) is already implemented and will be activated automatically **once sufficient data points (above a threshold)** are collected.  
This will help:
- Fine-tune spending predictions over time.
- Provide **adaptive insights** based on historical trends.
- Improve **forecast accuracy** and personalization.

Currently, the app uses a **rule-based system** for efficient predictions on smaller datasets.

---
## 🧭 Usage Workflow

Open the sidebar.

Add expense with date, category, and amount.

Click “Add Expense” → Entry saved.

View:

- Expense table and category distribution.

- Click “Analytics” → Forecast range and personalized suggestions appears.





