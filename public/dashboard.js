// const { pl } = require("zod/locales");

document.addEventListener('DOMContentLoaded', () => {
destroyCharts() 
})
let charts = {}; // Object to hold chart instances
        const themeToggle = document.getElementById('themeToggle');

        function destroyCharts() {
            Object.values(charts).forEach(chart => chart.destroy());
        }

        const rootStyles = getComputedStyle(document.documentElement);
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

        const themeColors = {
            primary: rootStyles.getPropertyValue('--primary').trim(),
            accent: rootStyles.getPropertyValue('--accent').trim(),
            gray: rootStyles.getPropertyValue('--gray').trim(),
            purpleDark: rootStyles.getPropertyValue('--purple-dark').trim(),
            purpleLight: rootStyles.getPropertyValue('--purple-light').trim(),
            expenseRed: rootStyles.getPropertyValue('--expense-red').trim(),
            textColor: isDarkMode ? rootStyles.getPropertyValue('--dark-text').trim() : rootStyles.getPropertyValue('--gray').trim(),
            gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            rgba: (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
        };


async function fetchtimeData(){
    const token = localStorage.getItem('token');

        const [days, months,year]= await Promise.allSettled([
            fetch('http://localhost:3000/dashboard/time-category-summary?time=day', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
                'token': token
            }
        }).then((res) => res.json()
    ),
        fetch('http://localhost:3000/dashboard/time-category-summary?time=month', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
                'token': token
            }
        }).then((res) => res.json()),
        fetch('http://localhost:3000/dashboard/time-category-summary?time=year',{
            method: 'GET',
        headers: {
            'Content-Type': 'application/json',
                'token': token
            }
        }).then((res) => res.json())
        ]);
        // console.log("days",Object.keys(days));
        // console.log("months",months.value); 
        console.log("data",days.value.ExpenseSummaryData);
        const Mexp=months.value.ExpenseSummaryData;
        const Minc=months.value.IncomeSummaryData;

        const yearexp=year.value.ExpenseSummaryData;
        const yeainc=year.value.IncomeSummaryData;

        const dayinc=days.value.IncomeSummaryData;
        const dayexp=days.value.ExpenseSummaryData;
        
        mainChart(Mexp, Minc);
        BubbleChart(Mexp);
        yearlyExpensesPolarChart(Mexp);
        weeklyExpensesChart(dayexp);
        monthlyIncomeExpenseChart(Mexp, Minc);
        renderNewSavingsChart(Mexp, Minc);
        monthlyExpensesChart(dayexp);
        // categoryrender(days.value.categorySummary.value);
}
async function categorydata(){
    const token = localStorage.getItem('token');
    const data = await fetch('http://localhost:3000/dashboard/total-summary', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
                'token': token
            }
        }).then((res) => res.json())
        .catch((error) => {
            console.error('Error fetching category data:', error);
        });
        console.log("data",data);
        console.log("data",data.expenseData);
        console.log("data",data.incomeData);
        // categoryrender(data.expenseData);
        sourcesChart(data.expenseData,"expenseChart");
        sourcesChart(data.incomeData,"incomeChart");
}
async function getalldata(){
    const token = localStorage.getItem('token');
    const [allInfo, totalSummary]= await Promise.all([
        fetch('http://localhost:3000/dashboard/all-info',{
        method:'GET',
        headers:{
            'Content-Type': 'application/json',
            'token': token
        }
    }).then((res)=>res.json()),
    fetch('http://localhost:3000/dashboard/total-summary', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
                'token': token
            }
        }).then((res) => res.json())
    ])
    console.log("allInfo",allInfo);
    console.log("totalSummary",totalSummary);
}
 async function getallbubbledata(){
    const token = localStorage.getItem('token');
    const data= await fetch('http://localhost:3000/dashboard/all-info',{
        method:'GET',
        headers:{
            'Content-Type': 'application/json',
            'token': token
        }
    }).then((res)=>res.json())

    BubbleChart(data);
}
function mainChart(data1, data2){
        if (charts.trendChart) {
            charts.trendChart.destroy(); 
        }
        const monthLabels = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        
        // Collect months from both datasets
        const allMonths = [...new Set([...data1.map(d => d.time.month), ...data2.map(d => d.time.month)])].sort((a,b) => a-b);
        console.log("allMonths:", allMonths);//[8,9,10]
        // For each month in allMonths, find total or 0
        const expensesByMonth = allMonths.map(m => {
                const found = data1.find(d => d.time.month === m);
                return found ? found.total : 0;
        });
        
        const incomeByMonth = allMonths.map(m => {
                const found = data2.find(d => d.time.month === m);
                return found ? found.total : 0;
        });
        console.log("expensesByMonth:", expensesByMonth);
        console.log("incomeByMonth:", incomeByMonth);
        // Convert month numbers → names
        const labels = allMonths.map(m => monthLabels[m-1]);
        console.log("labels:", labels);//['August', 'September', 'October']

        charts.trendChart = new Chart(document.getElementById('trendChart').getContext('2d'), {
                        type: 'line', 
                        data: 
                        { labels: labels, 
                            datasets: 
                            [{ label: 'Income', 
                            data: incomeByMonth, 
                            borderColor: themeColors.primary, 
                            backgroundColor: themeColors.rgba(themeColors.primary, 0.1),
                             fill: true, 
                             tension: 0.4, 
                             borderWidth: 3 
                            }, { 
                                        label: 'Expenses', 
                                        data: expensesByMonth, 
                                        borderColor: themeColors.expenseRed, 
                                        backgroundColor: themeColors.rgba(themeColors.expenseRed, 0.1), fill: true, 
                                        tension: 0.4, 
                                        borderWidth: 3 
                                    }] 
                                },
                                options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: themeColors.gridColor } }, y: { beginAtZero: true, grid: { color: themeColors.gridColor }, ticks: { callback: (v) => '₹' + v.toLocaleString() } } }, plugins: { legend: { labels: { usePointStyle: true, padding: 20 } } } }
                            });
};

function sourcesChart(data,id){
        if (charts[id]) {
            charts[id].destroy(); 
        }
        let bgColor=[];
        if (id==="incomeChart"){
            bgColor=[themeColors.primary, themeColors.purpleLight, themeColors.accent, themeColors.purpleDark]
        }
        else{
            bgColor=[themeColors.expenseRed, themeColors.accent, themeColors.purpleLight, themeColors.primary, themeColors.purpleDark, themeColors.gray]
        }

        const categories = data.map(item => item.category);
            const totals = data.map(item => item.total);

                charts[id] = new Chart(document.getElementById(id).getContext('2d'), {
                    type: 'doughnut', 
                    data: {
                        labels: categories,
                        datasets: 
                        [{ 
                            // label:`${label}`,
                            data: totals,
                            backgroundColor: bgColor,
                        borderWidth: 0, 
                        hoverBorderWidth: 4, 
                        hoverBorderColor: isDarkMode ? themeColors.darkCard : '#fff' }] },
                    options:{
                        responsive:
                        true, maintainAspectRatio: false, cutout: '60%',
                            plugins: 
                    { legend: 
                        {
                        position: 'bottom', 
                        labels: { padding: 15, usePointStyle: true } 
                    } 
                } }
                });
}

function BubbleChart(expenses) {
  if (charts.bubbleChart) {
    charts.bubbleChart.destroy();
  }

  console.log("expenses for bubble chart:", expenses);

  // 🔹 Unique categories
  const categories = [...new Set(expenses.map(e => e.category))];

  // 🔹 Assign a fixed color to each category
  const colorPalette = [
    "rgba(54, 162, 235, 0.6)",   // Blue
    "rgba(255, 99, 132, 0.6)",   // Red
    "rgba(255, 206, 86, 0.6)",   // Yellow
    "rgba(75, 192, 192, 0.6)",   // Green
    "rgba(153, 102, 255, 0.6)",  // Purple
    "rgba(255, 159, 64, 0.6)"    // Orange
  ];
  const getColor = category => colorPalette[categories.indexOf(category) % colorPalette.length];

  // 🔹 Prepare data
  const data = expenses.map(e => {
    const dateStr = `${e.year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;
    return {
      x: new Date(dateStr),                  // X → Date
      y: categories.indexOf(e.category) + 1, // Y → Category index
      r: Math.sqrt(e.amount) / 5,            // Bubble size
      category: e.category,
      amount: e.amount,
      color: getColor(e.category)
    };
  });

  charts.bubbleChart = new Chart(document.getElementById("bubbleChart"), {
    type: "bubble",
    data: {
      datasets: [{
        label: "Expenses",
        data: data,
        backgroundColor: data.map(d => d.color) // Same category = same color
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: { unit: "day" },
          title: { display: true, text: "Date" },
          grid: { color: themeColors.gridColor }
        },
        y: {
          ticks: {
            callback: function(value) {
              return categories[value - 1] || "";
            }
          },
          title: { display: true, text: "Category" },
          grid: { color: themeColors.gridColor }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const d = context.raw;
              return `${d.category}: ₹${d.amount} (${d.x.toLocaleDateString()})`;
            }
          }
        }
      }
    }
  });
}

async function monthlyExpensesChart(expenseData) {
  const token = localStorage.getItem("token");
  try {
    if (charts.monthlyChart) {
      charts.monthlyChart.destroy();
    }
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentYear = today.getFullYear();

    // Helper: format local date (fix timezone issue)
    function formatDateLocal(date) {
      return date.toLocaleDateString("en-CA"); // yyyy-mm-dd
    }

    // Group expenses into weeks
    const weeklyTotals = [0, 0, 0, 0, 0]; // max 5 weeks in a month

    expenseData.forEach(item => {
      const { day, month, year } = item.time;
      if (month - 1 === currentMonth && year === currentYear) {
        const d = new Date(year, month - 1, day);

        // Week number within month
        const weekNumber = Math.floor((d.getDate() - 1) / 7); // 0 → Week1, 1 → Week2...
        weeklyTotals[weekNumber] += item.total;
      }
    });

    // Labels
    const labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

    // Colors (different color for each week)
    const colors = [
      themeColors.primary,
      themeColors.accent,
      themeColors.purpleLight,
      themeColors.expenseRed,
      themeColors.gray
    ];

    // Destroy previous chart if exists
    if (charts.monthlyChart) charts.monthlyChart.destroy();

    // Render chart
    charts.monthlyChart = new Chart(
      document.getElementById("monthlyChart").getContext("2d"),
      {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: `Weekly Spending (${today.toLocaleString("default", { month: "long" })})`,
              data: weeklyTotals,
              backgroundColor: colors,
              borderRadius: 8,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: themeColors.gridColor },
              ticks: { callback: v => "₹" + v }
            }
          },
          plugins: { legend: { display: false } }
        }
      }
    );
  } catch (err) {
    console.error("Error rendering monthly expenses:", err);
  }
}

async function weeklyExpensesChart(expenseData) {
  try {
    if(charts.weeklyChart) {
      charts.weeklyChart.destroy();
    }
    const today = new Date();
    const last7Days = [];
    const expenseMap = {};

function formatDateLocal(date) {
  return date.toLocaleDateString("en-CA"); // gives YYYY-MM-DD in local tz
}
// Prepare last 7 days in local time
for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(today.getDate() - i);
  last7Days.push(formatDateLocal(d));
}

// Map expenses into dictionary
expenseData.forEach(item => {
  const { day, month, year } = item.time;
  const d = new Date(year, month - 1, day);
  const dateStr = formatDateLocal(d);
  expenseMap[dateStr] = (expenseMap[dateStr] || 0) + item.total;
});
    // Day name mapping
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Assign a fixed color for each day of the week
    const dayColors = {
      Sun: themeColors.expenseRed,
      Mon: themeColors.primary,
      Tue: themeColors.accent,
      Wed: themeColors.purpleLight,
      Thu: themeColors.gray,
      Fri: themeColors.purpleDark,
      Sat: themeColors.green || "#4CAF50" // fallback green if not in theme
    };


    // Prepare labels + data + colors
    const labels = last7Days.map(dateStr => {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1} (${dayNames[d.getDay()]})`;
    });

    const totals = last7Days.map(dateStr => expenseMap[dateStr] || 0);

    const colors = last7Days.map(dateStr => {
      const d = new Date(dateStr);
      return dayColors[dayNames[d.getDay()]];
    });

    // Destroy previous chart if exists
    if (charts.weeklyChart) charts.weeklyChart.destroy();

    // Render chart
    charts.weeklyChart = new Chart(
      document.getElementById("dailyChart").getContext("2d"),
      {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Last 7 Days Spending",
              data: totals,
              backgroundColor: colors, // different color per day
              borderRadius: 8,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: themeColors.gridColor },
              ticks: { callback: v => "₹" + v }
            }
          },
          plugins: { legend: { display: false } }
        }
      }
    );
  } catch (err) {
    console.error("Error rendering weekly expenses:", err);
  }
}

async function yearlyExpensesPolarChart(expenseData) { 
  try {
    if (charts.yearlyPolarChart) {
      charts.yearlyPolarChart.destroy();
    }
    // Labels → "Sep 2025"
    const labels = expenseData.map(item => {
      const { month, year } = item.time;
      return `${new Date(year, month - 1).toLocaleString("default", { month: "short" })} ${year}`;
    });

    // Data → totals
    const totals = expenseData.map(item => item.total);

    // Colors (pick different for each month)
    const colors = [
      themeColors.primary,
      themeColors.accent,
      themeColors.purpleLight,
      themeColors.expenseRed,
      themeColors.purpleDark,
      themeColors.gray,
      themeColors.green || "#4CAF50",
      "#FFB74D",
      "#64B5F6",
      "#BA68C8",
      "#81C784",
      "#E57373"
    ];

    // Destroy previous chart if exists
    if (charts.yearlyPolarChart) charts.yearlyPolarChart.destroy();

    // Render polar chart
    charts.yearlyPolarChart = new Chart(
      document.getElementById("yearlyPolarChart").getContext("2d"),
      {
        type: "polarArea",
        data: {
          labels,
          datasets: [
            {
              label: "Monthly Expenses",
              data: totals,
              backgroundColor: colors.slice(0, labels.length),
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              ticks: { callback: v => "₹" + v },
              grid: { color: themeColors.gridColor }
            }
          },
          plugins: {
            legend: { position: "right" },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.label}: ₹${context.formattedValue}`;
                }
              }
            }
          }
        }
      }
    );
  } catch (err) {
    console.error("Error rendering yearly polar chart:", err);
  }
}
async function monthlyIncomeExpenseChart(expenseData, incomeData) {
  const token = localStorage.getItem("token");
  try {
    if (charts.monthlyBarChart) {
      charts.monthlyBarChart.destroy();
    }
    const expenseMap = {};
    expenseData.forEach(item => {
      const { month, year } = item.time;
      const key = `${year}-${month}`;
      expenseMap[key] = item.total;
    });

    const incomeMap = {};
    incomeData.forEach(item => {
      const { month, year } = item.time;
      const key = `${year}-${month}`;
      incomeMap[key] = item.total;
    });

    // Collect all unique month-year keys
    const allKeys = [...new Set([...Object.keys(expenseMap), ...Object.keys(incomeMap)])];

    // Sort by year then month
    const sortedKeys = allKeys.sort((a, b) => {
      const [yearA, monthA] = a.split("-").map(Number);
      const [yearB, monthB] = b.split("-").map(Number);
      return yearA === yearB ? monthA - monthB : yearA - yearB;
    });

    // Labels like "Sep 2025"
    const labels = sortedKeys.map(key => {
      const [year, month] = key.split("-").map(Number);
      return `${new Date(year, month - 1).toLocaleString("default", { month: "short" })} ${year}`;
    });

    // Data arrays
    const expenses = sortedKeys.map(key => expenseMap[key] || 0);
    const incomes = sortedKeys.map(key => incomeMap[key] || 0);

    // Destroy previous chart if exists
    if (charts.monthlyBarChart) charts.monthlyBarChart.destroy();

    // Render chart
    charts.monthlyBarChart = new Chart(
      document.getElementById("incomeandExpensesChart").getContext("2d"),
      {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Expenses",
              data: expenses,
              backgroundColor: themeColors.expenseRed
            },
            {
              label: "Income",
              data: incomes,
              backgroundColor: themeColors.primary
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: themeColors.gridColor },
              ticks: { callback: v => "₹" + v }
            }
          },
          plugins: {
            legend: { position: "top" },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ₹${context.formattedValue}`;
                }
              }
            }
          }
        }
      }
    );
  } catch (err) {
    console.error("Error rendering monthly income-expense chart:", err);
  }
}
      async function renderNewSavingsChart(expenseData, incomeData) {
    try {
      if(charts.savingsChart) {
        charts.savingsChart.destroy();
      }
        // Convert to { "year-month": value }
        const expensesByMonth = {};
        expenseData.forEach(item => {
            const key = `${item.time.year}-${item.time.month}`;
            expensesByMonth[key] = item.total;
        });

        const incomeByMonth = {};
        incomeData.forEach(item => {
            const key = `${item.time.year}-${item.time.month}`;
            incomeByMonth[key] = item.total;
        });

        // Merge all months
        const allMonths = Array.from(new Set([
            ...Object.keys(expensesByMonth),
            ...Object.keys(incomeByMonth)
        ])).sort();

        // Labels
        const labels = allMonths.map(key => {
            const [year, month] = key.split("-");
            return `${month}-${year}`;
        });

        // Data arrays
        const savings = allMonths.map(key => (incomeByMonth[key] || 0) - (expensesByMonth[key] || 0));
        const incomes = allMonths.map(key => incomeByMonth[key] || 0);
        const expenses = allMonths.map(key => expensesByMonth[key] || 0);

        // Chart.js
        const ctx = document.getElementById("savingsChart").getContext("2d");
        new Chart(ctx, {
            data: {
                labels: labels,
                datasets: [
                    {
                        type: "bar",
                        label: "Savings",
                        data: savings,
                        backgroundColor: savings.map(val => val >= 0 ? "rgba(75, 192, 192, 0.6)" : "rgba(255, 99, 132, 0.6)"),
                        borderColor: savings.map(val => val >= 0 ? "rgba(75, 192, 192, 1)" : "rgba(255, 99, 132, 1)"),
                        borderWidth: 1,
                        yAxisID: "y"
                    },
                    {
                        type: "line",
                        label: "Income",
                        data: incomes,
                        borderColor: "rgba(54, 162, 235, 1)",
                        backgroundColor: "rgba(54, 162, 235, 0.2)",
                        fill: false,
                        tension: 0.3,
                        yAxisID: "y"
                    },
                    {
                        type: "line",
                        label: "Expense",
                        data: expenses,
                        borderColor: "rgba(255, 159, 64, 1)",
                        backgroundColor: "rgba(255, 159, 64, 0.2)",
                        fill: false,
                        tension: 0.3,
                        yAxisID: "y"
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { position: "top" },
                    tooltip: { enabled: true }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Amount (₹)" }
                    },
                    x: {
                        title: { display: true, text: "Month-Year" }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Error loading savings chart:", err);
    }
}

        
function safeCall(fn, name) {
  try {
    fn();
  } catch (err) {
    console.error(`Error in ${name}:`, err);
  }
}
 function renderAllCharts() {
  safeCall(destroyCharts, "destroyCharts");
  safeCall(fetchtimeData, "fetchtimeData");
  safeCall(categorydata, "categorydata");
  // safeCall(weeklyExpensesChart, "weeklyExpensesChart");
  safeCall(getallbubbledata, "getallbubbledata");
  safeCall(getalldata, "getalldata");
  safeCall(monthlyExpensesChart, "monthlyExpensesChart");
  // safeCall(yearlyExpensesPolarChart, "yearlyExpensesPolarChart");
  // safeCall(monthlyIncomeExpenseChart, "monthlyIncomeExpenseChart");
  // safeCall(renderNewSavingsChart, "renderNewSavingsChart");

                // Dynamically get colors from CSS variables
            Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            Chart.defaults.plugins.legend.position = 'bottom';
            Chart.defaults.color = themeColors.textColor;

        }

        // Theme Toggle Logic
        themeToggle.addEventListener('change', () => {
            if (charts) {
                destroyCharts();
            }
            if (themeToggle.checked) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
            renderAllCharts();
        });

        // Check for saved theme on page load
        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.body.setAttribute('data-theme', savedTheme);
            themeToggle.checked = savedTheme === 'dark';
            renderAllCharts();
        });

