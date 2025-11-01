import matplotlib.pyplot as plt

def plot_category_pie(df):
    if df.empty:
        return None
    category_sum = df.groupby("category")["amount"].sum()
    fig, ax = plt.subplots()
    ax.pie(category_sum, labels=category_sum.index, autopct="%1.1f%%", startangle=90)
    ax.set_title("Category-wise Expense Distribution", fontsize=14)
    return fig
