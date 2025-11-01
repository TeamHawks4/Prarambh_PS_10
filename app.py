import streamlit as st
import pandas as pd
from db_handler import init_db, insert_expense, fetch_expenses
from visualization import plot_category_pie
from insights import forecast_next_two_days, generate_personalized_suggestions

# Initialize DB
init_db()

# Streamlit page config
st.set_page_config(page_title="SplitiFy Expense Manager", layout="wide")
st.session_state["theme"] = "Light"

# Sidebar layout
st.sidebar.title("💸 SplitiFy Expense Tracker")
st.sidebar.markdown("Manage your daily expenses smartly!")

# Sidebar form for adding expense
st.sidebar.subheader("➕ Add New Expense")
date = st.sidebar.date_input("Date")
category = st.sidebar.selectbox("Category", ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Other"])
amount = st.sidebar.number_input("Amount (₹)", min_value=0.0, step=100.0)

col1, col2 = st.sidebar.columns(2)
add_btn = col1.button("Add Expense")
analytics_btn = col2.button("Analytics")

# Main panel
st.title("📊 Expense Dashboard")
st.markdown("---")

# Box styling
box_style = """
    background-color: white;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 12px;
    box-shadow: 2px 2px 8px rgba(0,0,0,0.05);
"""

# When Add Expense button is clicked
if add_btn:
    insert_expense(date, category, amount)
    st.success("✅ Expense added successfully!")

# Fetch data
df = fetch_expenses()

# --- Expense Overview Section ---
if not df.empty:
    st.markdown(f"<div style='{box_style}'>", unsafe_allow_html=True)
    st.subheader("📅 Expense Overview")

    # Create two columns for layout
    col_table, col_plot = st.columns([3, 1.5])  # wider table, smaller chart

    with col_table:
        st.markdown("#### Expense History")
        st.dataframe(df, use_container_width=True, height=300)

    with col_plot:
        st.markdown("#### Category Distribution")
        fig = plot_category_pie(df)
        if fig:
            st.pyplot(fig, use_container_width=True, clear_figure=True)
    st.markdown("</div>", unsafe_allow_html=True)

# --- Analytics Section ---
if analytics_btn:
    if df.empty:
        st.warning("Please add expenses before viewing analytics.")
    else:
        lower, upper = forecast_next_two_days(df)
        suggestions = generate_personalized_suggestions(df)

        # Horizontal layout for forecast and suggestions
        st.markdown("<div style='display:flex; gap:20px;'>", unsafe_allow_html=True)

        # Forecast Box
        st.markdown(f"<div style='{box_style}; flex:1;'>", unsafe_allow_html=True)
        st.subheader("📈 Forecast for Next 2 Days")
        if lower is not None and upper is not None:
            st.json({
                "Lower Limit (₹)": round(lower, 2),
                "Upper Limit (₹)": round(upper, 2)
            })
        else:
            st.warning("Not enough data to forecast yet.")
        st.markdown("</div>", unsafe_allow_html=True)

        # Suggestions Box
        st.markdown(f"<div style='{box_style}; flex:1;'>", unsafe_allow_html=True)
        st.subheader("🧭 Personalized Suggestions")
        for s in suggestions:
            st.markdown(f"- {s}")
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("</div>", unsafe_allow_html=True)
