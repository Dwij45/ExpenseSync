// ==========================================
// 1. GLOBAL CONFIGURATION & STATE
// ==========================================
const BASE_URL = 'http://localhost:3000/dashboard';
const charts = {}; // Store Chart.js instances
const token = localStorage.getItem('token');

// --- INDEPENDENT STATE MANAGEMENT ---
const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();

let categoryState = { month: currentMonth, year: currentYear };
let weeklyState = { month: currentMonth, year: currentYear };
let monthlyBarState = { month: currentMonth, year: currentYear };
let savingsState = { year: currentYear };

// Initial Style Fetch
let rootStyles = getComputedStyle(document.documentElement);
const themeColors = {
    primary: '', accent: '', gray: '', purpleDark: '', purpleLight: '', expenseRed: '', textColor: '', gridColor: '',
    rgba: (hex, alpha) => {
        if (!hex) return 'rgba(0,0,0,0)';
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function updateThemeColors() {
    rootStyles = getComputedStyle(document.documentElement);
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

    themeColors.primary = rootStyles.getPropertyValue('--primary').trim();
    themeColors.accent = rootStyles.getPropertyValue('--accent').trim();
    themeColors.gray = rootStyles.getPropertyValue('--gray').trim();
    themeColors.purpleDark = rootStyles.getPropertyValue('--purple-dark').trim();
    themeColors.purpleLight = rootStyles.getPropertyValue('--purple-light').trim();
    themeColors.expenseRed = rootStyles.getPropertyValue('--expense-red').trim();
    
    // Adjust Text and Grid colors based on mode
    themeColors.textColor = isDarkMode ? '#E0E0E0' : '#575757';
    themeColors.gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    Chart.defaults.font.family = "'Segoe UI', sans-serif";
    Chart.defaults.color = themeColors.textColor;
}

// ==========================================
// 3. INITIAL DATA FETCHING
// ==========================================
async function fetchtimeData() {
    const token = localStorage.getItem('token');
    updateThemeColors(); // Ensure colors are set before rendering

    try {
        const [daysRes, monthsRes, yearRes] = await Promise.all([
            fetch(`${BASE_URL}/time-category-summary?time=day`, { headers: { 'token': token } }),
            fetch(`${BASE_URL}/time-category-summary?time=month`, { headers: { 'token': token } }),
            fetch(`${BASE_URL}/time-category-summary?time=year`, { headers: { 'token': token } })
        ]);

        const days = await daysRes.json();
        const months = await monthsRes.json();
        const yearData = await yearRes.json();

        const dayexp = days.ExpenseSummaryData || [];
        const Mexp = months.ExpenseSummaryData || [];
        const Minc = months.IncomeSummaryData || [];
        const yearExpenses = yearData.ExpenseSummaryData || [];

        // Render Static Charts
        mainChart(Mexp, Minc);
        CategoryTrendChart(yearExpenses);
        yearlyExpensesPolarChart(Mexp);
        monthlyIncomeExpenseChart(Mexp, Minc);

        // Render Dynamic Widgets
        updateCategoryData(categoryState.month, categoryState.year);
        updateWeeklySpendingData(weeklyState.month, weeklyState.year);
        updateMonthlySpendingData(monthlyBarState.month, monthlyBarState.year);
        updateSavingsData(savingsState.year);

        // Update Top Cards
        updateDashboardCards(Mexp, Minc);

    } catch (error) {
        console.error("Error fetching initial data:", error);
    }
}

function updateDashboardCards(expenses, income) {
    const totalExp = expenses.reduce((sum, item) => sum + item.total, 0);
    const totalInc = income.reduce((sum, item) => sum + item.total, 0);
    const balance = totalInc - totalExp;
    const rate = totalInc > 0 ? ((balance / totalInc) * 100).toFixed(1) : 0;

    if(document.getElementById('totalIncome')) document.getElementById('totalIncome').innerText = `₹${totalInc.toLocaleString()}`;
    if(document.getElementById('totalExpenses')) document.getElementById('totalExpenses').innerText = `₹${totalExp.toLocaleString()}`;
    if(document.getElementById('netBalance')) document.getElementById('netBalance').innerText = `₹${balance.toLocaleString()}`;
    if(document.getElementById('savingsRate')) document.getElementById('savingsRate').innerText = `${rate}%`;
}

// ==========================================
// 4. WIDGET UPDATERS (Data Fetchers)
// ==========================================

async function updateCategoryData(month, year) {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    document.getElementById('cat-title').textContent = `Breakdown: ${monthName} ${year}`;
    try {
        const response = await fetch(`${BASE_URL}/total-summary?month=${month}&year=${year}`, { headers: { 'token': token } });
        const data = await response.json();
        sourcesChart(data.ExpenseSummaryData || [], "expenseChart", "expense");
        sourcesChart(data.IncomeSummaryData || [], "incomeChart", "income");
    } catch (error) { console.error(error); }
}

async function updateWeeklySpendingData(month, year) {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    document.getElementById('week-title').textContent = `Weekly: ${monthName} ${year}`;
    try {
        const response = await fetch(`${BASE_URL}/time-category-summary?time=day&month=${month}&year=${year}`, { headers: { 'token': token } });
        const data = await response.json();
        weeklyExpensesChart(data.ExpenseSummaryData || [], month, year);
    } catch (error) { console.error(error); }
}

async function updateMonthlySpendingData(month, year) {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    document.getElementById('month-bar-title').textContent = `Monthly: ${monthName} ${year}`;
    try {
        const response = await fetch(`${BASE_URL}/time-category-summary?time=day&month=${month}&year=${year}`, { headers: { 'token': token } });
        const data = await response.json();
        monthlyExpensesChart(data.ExpenseSummaryData || [], month, year);
    } catch (error) { console.error(error); }
}

async function updateSavingsData(year) {
    document.getElementById('savings-title').textContent = `Savings: ${year}`;
    try {
        const response = await fetch(`${BASE_URL}/time-category-summary?time=month&year=${year}`, { headers: { 'token': token } });
        const data = await response.json();
        renderNewSavingsChart(data.ExpenseSummaryData || [], data.IncomeSummaryData || [], year);
    } catch (error) { console.error(error); }
}

// ==========================================
// 5. CHART RENDERERS
// ==========================================

function sourcesChart(data, id, type) {
    if (charts[id]) charts[id].destroy();
    let bgColor = (type === "income" || id === "incomeChart")
        ? [themeColors.primary, themeColors.purpleLight, themeColors.accent, themeColors.purpleDark]
        : [themeColors.expenseRed, themeColors.accent, themeColors.purpleLight, themeColors.primary, themeColors.purpleDark, themeColors.gray];

    charts[id] = new Chart(document.getElementById(id).getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.category),
            datasets: [{ data: data.map(item => item.total), backgroundColor: bgColor, borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } } } }
    });
}

function weeklyExpensesChart(expenseData, month, year) {
    if (charts.weeklyChart) charts.weeklyChart.destroy();
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels = [], values = [], colors = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        labels.push(day);
        const record = expenseData.find(d => d.time.day === day && d.time.month === month && d.time.year === year);
        values.push(record ? record.total : 0);
        
        const dayOfWeek = dateObj.getDay();
        // Sunday = Red, Saturday = Green, Weekday = Primary
        colors.push(dayOfWeek === 0 ? themeColors.expenseRed : (dayOfWeek === 6 ? '#4CAF50' : themeColors.primary));
    }

    charts.weeklyChart = new Chart(document.getElementById("dailyChart").getContext("2d"), {
        type: "bar",
        data: { labels: labels, datasets: [{ label: "Spending", data: values, backgroundColor: colors, borderRadius: 2 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { grid: { display: false }, ticks: { color: themeColors.textColor } }, y: { beginAtZero: true, grid: { color: themeColors.gridColor }, ticks: { color: themeColors.textColor } } },
            plugins: { legend: { display: false } }
        }
    });
}

function monthlyExpensesChart(expenseData, selectedMonth, selectedYear) {
    if (charts.monthlyChart) charts.monthlyChart.destroy();
    const weeklyTotals = [0, 0, 0, 0, 0];
    expenseData.forEach(item => {
        if (item.time.month === selectedMonth && item.time.year === selectedYear) {
            const weekNumber = Math.floor((new Date(selectedYear, selectedMonth - 1, item.time.day).getDate() - 1) / 7);
            if (weeklyTotals[weekNumber] !== undefined) weeklyTotals[weekNumber] += item.total;
        }
    });

    charts.monthlyChart = new Chart(document.getElementById("monthlyChart").getContext("2d"), {
        type: "bar",
        data: { labels: ["W1", "W2", "W3", "W4", "W5"], datasets: [{ label: `Cost`, data: weeklyTotals, backgroundColor: [themeColors.primary, themeColors.accent, themeColors.purpleLight, themeColors.expenseRed, themeColors.gray], borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: {color: themeColors.textColor} }, y: { beginAtZero: true, grid: { color: themeColors.gridColor }, ticks: {color: themeColors.textColor} } }, plugins: { legend: { display: false } } }
    });
}

function renderNewSavingsChart(expenseData, incomeData, year) {
    if (charts.savingsChart) charts.savingsChart.destroy();
    const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    const savingsData = [], colors = [];

    for (let m = 1; m <= 12; m++) {
        const exp = expenseData.find(d => d.time.month === m && d.time.year === year)?.total || 0;
        const inc = incomeData.find(d => d.time.month === m && d.time.year === year)?.total || 0;
        const saving = inc - exp;
        savingsData.push(saving);
        colors.push(saving >= 0 ? themeColors.primary : themeColors.expenseRed);
    }

    charts.savingsChart = new Chart(document.getElementById("savingsChart").getContext("2d"), {
        type: "bar",
        data: { labels: months, datasets: [{ label: 'Net Savings', data: savingsData, backgroundColor: colors, borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: {color: themeColors.textColor} }, y: { beginAtZero: true, grid: { color: themeColors.gridColor }, ticks: {color: themeColors.textColor} } }, plugins: { legend: { display: false } } }
    });
}

function mainChart(data1, data2) {
    if (charts.trendChart) charts.trendChart.destroy();
    const allMonths = [...new Set([...data1.map(d => d.time.month), ...data2.map(d => d.time.month)])].sort((a, b) => a - b);
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = allMonths.map(m => monthLabels[m - 1]);
    const exp = allMonths.map(m => data1.find(d => d.time.month === m)?.total || 0);
    const inc = allMonths.map(m => data2.find(d => d.time.month === m)?.total || 0);

    charts.trendChart = new Chart(document.getElementById('trendChart').getContext('2d'), {
        type: 'line', 
        data: { labels, datasets: [{ label: 'Income', data: inc, borderColor: themeColors.primary, backgroundColor: themeColors.rgba(themeColors.primary, 0.1), fill: true, tension: 0.4 }, { label: 'Expenses', data: exp, borderColor: themeColors.expenseRed, backgroundColor: themeColors.rgba(themeColors.expenseRed, 0.1), fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: themeColors.gridColor }, ticks: {color: themeColors.textColor} }, x: { grid: { display: false }, ticks: {color: themeColors.textColor} } } }
    });
}

function CategoryTrendChart(yearData) {
    const canvas = document.getElementById("bubbleChart");
    if (!canvas) return;
    if (charts.bubbleChart) charts.bubbleChart.destroy();

    const categoryTotals = {};
    yearData.forEach(i => { categoryTotals[i.category] = (categoryTotals[i.category] || 0) + i.total; });
    const topCategories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]).slice(0, 3);
    const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    const colors = [themeColors.primary, themeColors.expenseRed, themeColors.purpleLight];
    const datasets = topCategories.map((cat, idx) => ({
        label: cat,
        data: Array.from({length: 12}, (_, i) => yearData.find(d => d.category === cat && d.time.month === i+1)?.total || 0),
        borderColor: colors[idx % 3],
        tension: 0.4,
        fill: false
    }));

    charts.bubbleChart = new Chart(canvas.getContext("2d"), {
        type: 'line', data: { labels: months, datasets: datasets },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: themeColors.gridColor }, ticks: {color: themeColors.textColor} }, y: { grid: { color: themeColors.gridColor }, ticks: {color: themeColors.textColor} } } }
    });
}

function yearlyExpensesPolarChart(expenseData) {
    if (charts.yearlyPolarChart) charts.yearlyPolarChart.destroy();
    const labels = expenseData.map(item => `${new Date(2025, item.time.month - 1).toLocaleString("default", { month: "short" })}`);
    const totals = expenseData.map(item => item.total);
    charts.yearlyPolarChart = new Chart(document.getElementById("yearlyPolarChart").getContext("2d"), {
        type: "polarArea",
        data: { labels, datasets: [{ data: totals, backgroundColor: [themeColors.primary, themeColors.accent, themeColors.purpleLight, themeColors.expenseRed, themeColors.gray] }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: themeColors.gridColor }, ticks: { display: false, backdropColor: 'transparent' } } }, plugins: { legend: { position: 'right' } } }
    });
}

function monthlyIncomeExpenseChart(expenseData, incomeData) {
    if (charts.monthlyBarChart) charts.monthlyBarChart.destroy();
    const allKeys = [...new Set([...expenseData.map(d => d.time.month), ...incomeData.map(d => d.time.month)])].sort((a, b) => a - b);
    const labels = allKeys.map(m => new Date(2025, m - 1).toLocaleString('default', { month: 'short' }));
    
    charts.monthlyBarChart = new Chart(document.getElementById("incomeandExpensesChart").getContext("2d"), {
        type: "bar",
        data: { labels, datasets: [{ label: "Expenses", data: allKeys.map(m => expenseData.find(d => d.time.month === m)?.total || 0), backgroundColor: themeColors.expenseRed }, { label: "Income", data: allKeys.map(m => incomeData.find(d => d.time.month === m)?.total || 0), backgroundColor: themeColors.primary }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: {color: themeColors.textColor} }, y: { beginAtZero: true, grid: { color: themeColors.gridColor }, ticks: {color: themeColors.textColor} } } }
    });
}

// ==========================================
// 6. EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Navigation Listeners (Category, Weekly, Monthly, Savings)
    const addNavListener = (prevId, nextId, updateFn, stateObj, isMonth = true) => {
        const p = document.getElementById(prevId), n = document.getElementById(nextId);
        if (p && n) {
            p.addEventListener('click', () => {
                if(isMonth) {
                    stateObj.month = (stateObj.month - 1) || 12;
                    if (stateObj.month === 12) stateObj.year--;
                    updateFn(stateObj.month, stateObj.year);
                } else {
                    stateObj.year--;
                    updateFn(stateObj.year);
                }
            });
            n.addEventListener('click', () => {
                if(isMonth) {
                    stateObj.month = (stateObj.month % 12) + 1;
                    if (stateObj.month === 1) stateObj.year++;
                    updateFn(stateObj.month, stateObj.year);
                } else {
                    stateObj.year++;
                    updateFn(stateObj.year);
                }
            });
        }
    };

    addNavListener('cat-prev', 'cat-next', updateCategoryData, categoryState);
    addNavListener('week-prev', 'week-next', updateWeeklySpendingData, weeklyState);
    addNavListener('month-bar-prev', 'month-bar-next', updateMonthlySpendingData, monthlyBarState);
    addNavListener('savings-prev', 'savings-next', updateSavingsData, savingsState, false);

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Set initial icon
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Swap Icon
            themeToggle.innerHTML = newTheme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
            
            // Re-render charts with new theme colors
            fetchtimeData(); 
        });
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/public/index.html';
}

// 7. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    fetchtimeData();
    setupEventListeners();
});