/**
 * TransactionApp Module
 * Handles all logic for the transaction history page
 */
const TransactionApp = (() => {
    
    // ==========================================
    // 1. CONFIGURATION & STATE
    // ==========================================
    const CONFIG = {
        BASE_URL: 'http://localhost:3000',
        LIMIT: 10,
        CURRENCY_FORMATTER: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
    };

    const DOM = {
        // Summary
        balance: document.getElementById('current-balance'),
        income: document.getElementById('monthly-income'),
        expenses: document.getElementById('monthly-expenses'),
        
        // List & Pagination
        list: document.getElementById('transaction-list'),
        noData: document.getElementById('no-transactions'),
        prevBtn: document.getElementById('prev-page-btn'), // Corrected IDs based on your code
        nextBtn: document.getElementById('next-page-btn'), // Corrected IDs based on your code
        searchInput: document.getElementById('search-input'),

        // Charts
        chartCanvas: document.getElementById('category-chart'),
        noChartData: document.getElementById('no-chart-data'),
        // Modals
        incomeModal: document.getElementById('add-income-modal'),
        expenseModal: document.getElementById('add-expense-modal'),
        filterModal: document.getElementById('filter-modal'),
        
        // Forms
        incomeForm: document.getElementById('add-income-form'),
        expenseForm: document.getElementById('add-expense-form'),
        filterForm: document.getElementById('filter-form'),

        // Toggles
        themeToggle: document.getElementById('theme-toggle'),
        fabContainer: document.getElementById('fab-container'),
        mainFab: document.getElementById('main-fab')
    };

    const STATE = {
        currentPage: 1,
        totalPages: 1,
        isFiltering: false,
        filters: {},
        transactions: [],
        chartInstance: null,
        theme: localStorage.getItem('theme') || 'light'
    };

    // ==========================================
    // 2. API SERVICE LAYER
    // ==========================================
    const API = {
        async request(endpoint, options = {}) {
            const token = localStorage.getItem('token');
            const defaultHeaders = { 'token': token, 'Content-Type': 'application/json' };
            
            // Remove Content-Type if sending FormData (not used here yet, but good practice) or GET
            if (options.method === 'GET') delete defaultHeaders['Content-Type'];

            try {
                const res = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
                    ...options,
                    headers: { ...defaultHeaders, ...options.headers }
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`API Error ${res.status}: ${text}`);
                }
                
                // Return blob for downloads, json for rest
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    return await res.json();
                } else {
                    return await res.blob();
                }
            } catch (err) {
                console.error(`Request Failed: ${endpoint}`, err);
                throw err;
            }
        },

        async getTransactions(page) {
            let url = `/transaction/get-transactions?page=${page}&limit=${CONFIG.LIMIT}`;
            
            // If filtering, switch endpoint and append params
            if (STATE.isFiltering) {
                const params = new URLSearchParams({ page, limit: CONFIG.LIMIT });
                // Add search text
                if (STATE.filters.comment) params.append('comment', STATE.filters.comment);
                // Add specific filters
                Object.entries(STATE.filters).forEach(([k, v]) => {
                    if (v && k !== 'comment') params.append(k, v);
                });
                url = `/transaction/filter?${params.toString()}`;
            }

            return this.request(url);
        },

        async getSummary() {
            return this.request('/transaction/summary');
        },

        async getChartData() {
            const now = new Date();
            return this.request(`/dashboard/total-summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        },

        async addTransaction(endpoint, data) {
            return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
        },

        async deleteTransaction(id, type) {
            return this.request(`/transaction/delete?id=${id}&type=${type}`, { method: 'DELETE' });
        },

        async downloadFile(endpoint) {
            return this.request(endpoint); // Returns blob
        }
    };

    // ==========================================
    // 3. UI RENDERING
    // ==========================================
    const UI = {
        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            STATE.theme = theme;
            
            const icon = DOM.themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            
            // Re-render chart to update colors
            this.renderChart(); 
        },

        updateSummary(data) {
            if (!data) return;
            DOM.balance.textContent = CONFIG.CURRENCY_FORMATTER.format(data.totalBalance);
            DOM.income.textContent = CONFIG.CURRENCY_FORMATTER.format(data.monthlyIncome);
            DOM.expenses.textContent = CONFIG.CURRENCY_FORMATTER.format(data.monthlyExpenses);
        },

        renderList(transactions) {
            DOM.list.innerHTML = '';

            if (!transactions || transactions.length === 0) {
                DOM.noData.classList.remove('hidden');
                return;
            }
            DOM.noData.classList.add('hidden');

            // Sort and Group
            const formatted = transactions.map(t => ({
                ...t,
                dateObj: new Date(t.date),
                formattedDate: new Date(t.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            })).sort((a, b) => b.dateObj - a.dateObj);

            const grouped = {};
            formatted.forEach(t => {
                const key = t.dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(t);
            });

            // Render Groups
            Object.entries(grouped).forEach(([monthYear, items]) => {
                const divider = document.createElement('div');
                divider.className = `transaction-month-divider text-center text-sm font-semibold mb-2 mt-4 text-[var(--text-muted)]`;
                divider.innerHTML = `<span>${monthYear}</span>`;
                DOM.list.appendChild(divider);

                items.forEach(t => {
                    const isExpense = t.type === 'expense';
                    const config = {
                        sign: isExpense ? '-' : '+',
                        color: isExpense ? 'text-accent-red' : 'text-accent-green',
                        bg: isExpense ? 'bg-accent-red-light' : 'bg-accent-green-light',
                        icon: getCategoryIcon(t.category)
                    };

                    const li = document.createElement('li');
                    li.className = `flex justify-between items-center py-3 border-b last:border-none`;
                    li.style.borderColor = 'var(--list-border-color)';
                    li.innerHTML = `
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg ${config.bg} ${config.color}">
                                <i class="${config.icon}"></i>
                            </div>
                            <div>
                                <p class="font-medium text-sm md:text-base">${t.comment || t.category}</p>
                                <p class="text-xs text-[var(--text-muted)]">${t.category} • ${t.formattedDate}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="font-semibold ${config.color} text-sm md:text-base">${config.sign}${CONFIG.CURRENCY_FORMATTER.format(t.amount)}</span>
                            <span class="ml-1 deletetrans cursor-pointer hover:text-red-500 transition-colors" data-id="${t._id}" data-type="${t.type}">
                                <i class="fas fa-trash-alt pointer-events-none"></i>
                            </span>
                        </div>
                    `;
                    DOM.list.appendChild(li);
                });
            });
        },

        updatePagination() {
            DOM.prevBtn.disabled = STATE.currentPage <= 1;
            DOM.nextBtn.disabled = STATE.currentPage >= STATE.totalPages;
        },

        async renderChart(forcedData = null) {
            // Use cached data if available to avoid refetching on theme switch
            let expenseData = forcedData || STATE.cachedChartData; 

            if (!expenseData) {
                try {
                    const res = await API.getChartData();
                    if(res && res.ExpenseSummaryData) {
                        expenseData = res.ExpenseSummaryData;
                        STATE.cachedChartData = expenseData; // Cache it
                    }
                } catch (e) { console.error("Chart data error", e); }
            }

            if (STATE.chartInstance) STATE.chartInstance.destroy();

            if (!expenseData || expenseData.length === 0) {
                DOM.noChartData.classList.remove('hidden');
                return;
            }
            DOM.noChartData.classList.add('hidden');

            const isDark = STATE.theme === 'dark';
            const ctx = DOM.chartCanvas.getContext('2d');

            STATE.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: expenseData.map(i => i.category),
                    datasets: [{
                        data: expenseData.map(i => i.total),
                        backgroundColor: ['#f4a261', '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#8ab17d', '#f77f00', '#d62828'],
                        borderColor: isDark ? '#1e1e1e' : '#ffffff',
                        borderWidth: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom', labels: { color: isDark ? '#ecf0f1' : '#2c3e50', usePointStyle: true } }
                    }
                }
            });
        }
    };

    // ==========================================
    // 4. CONTROLLERS & LOGIC
    // ==========================================
    
    // Helpers
    const getCategoryIcon = (category) => ({
        'Food': 'fas fa-utensils', 'Transportation': 'fas fa-car', 'Shopping': 'fas fa-shopping-bag',
        'Housing': 'fas fa-home', 'Utilities': 'fas fa-file-invoice-dollar', 'Salary': 'fas fa-briefcase',
        'Healthcare': 'fas fa-heartbeat', 'Entertainment': 'fas fa-film', 'Investment': 'fas fa-chart-line'
    }[category] || 'fas fa-tag');

    // Data Loaders
    const refreshAllData = async () => {
        // Parallel fetching for speed
        try {
            const [listData, summaryData, chartRes] = await Promise.all([
                API.getTransactions(STATE.currentPage),
                API.getSummary(),
                API.getChartData()
            ]);

            // Update List State
            STATE.transactions = listData.transactions;
            STATE.totalPages = listData.totalPages;
            STATE.currentPage = listData.currentPage;

            // Render All
            UI.renderList(STATE.transactions);
            UI.updatePagination();
            UI.updateSummary(summaryData);
            UI.renderChart(chartRes.ExpenseSummaryData);

        } catch (err) {
            console.error("Failed to load dashboard data", err);
        }
    };

    const loadPage = async (page) => {
        try {
            const data = await API.getTransactions(page);
            STATE.transactions = data.transactions;
            STATE.totalPages = data.totalPages;
            STATE.currentPage = data.currentPage;
            UI.renderList(STATE.transactions);
            UI.updatePagination();
        } catch (err) { console.error(err); }
    };

    // Handlers
    const handleFormSubmit = async (e, type) => {
        e.preventDefault();
        const form = type === 'income' ? DOM.incomeForm : DOM.expenseForm;
        const formData = new FormData(form);
        
        const payload = {
            amount: parseFloat(formData.get(`${type}-amount`)),
            category: formData.get(`${type}-category`),
            comment: formData.get(`${type}-comment`) || formData.get(`${type}-category`),
            date: formData.get(`${type}-date`)
        };

        try {
            await API.addTransaction(`/transaction/${type}`, payload);
            form.reset();
            flatpickr(`#${type}-date`, { defaultDate: "today" });
            
            // Close Modals
            DOM.incomeModal.classList.add('hidden');
            DOM.expenseModal.classList.add('hidden');
            
            await refreshAllData();
        } catch (err) {
            alert(`Failed to add ${type}`);
        }
    };

    const handleDelete = async (e) => {
        const btn = e.target.closest('.deletetrans');
        if (!btn) return;

        if (!confirm("Delete this transaction?")) return;

        const { id, type } = btn.dataset;
        try {
            await API.deleteTransaction(id, type);
            await refreshAllData();
        } catch (err) {
            alert("Delete failed.");
        }
    };

    const handleFilterSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(DOM.filterForm);
        
        STATE.isFiltering = true;
        STATE.filters = {
            type: formData.get('filter-type'),
            category: formData.get('filter-category'),
            start: formData.get('filter-start-date'),
            end: formData.get('filter-end-date'),
            comment: DOM.searchInput.value
        };

        STATE.currentPage = 1;
        DOM.filterModal.classList.add('hidden');
        await loadPage(1);
    };

    const handleDownload = async (type) => {
        try {
            const blob = await API.downloadFile(`/download/${type}`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) { alert("Download failed"); }
    };

    // ==========================================
    // 5. INITIALIZATION
    // ==========================================
    const init = () => {
        // Theme
        UI.applyTheme(STATE.theme);
        DOM.themeToggle.addEventListener('click', () => {
            const newTheme = STATE.theme === 'dark' ? 'light' : 'dark';
            UI.applyTheme(newTheme);
        });

        // Initial Data
        refreshAllData();

        // Date Pickers
        flatpickr("#expense-date, #income-date", { dateFormat: "Y-m-d", defaultDate: "today", maxDate: "today" });
        flatpickr("#filter-start-date, #filter-end-date", { dateFormat: "Y-m-d" });

        // Event Listeners: Forms
        DOM.incomeForm.addEventListener('submit', (e) => handleFormSubmit(e, 'income'));
        DOM.expenseForm.addEventListener('submit', (e) => handleFormSubmit(e, 'expense'));
        DOM.filterForm.addEventListener('submit', handleFilterSubmit);

        // Event Listeners: Search & Filter
        DOM.searchInput.addEventListener('input', (e) => {
            STATE.isFiltering = true;
            STATE.filters.comment = e.target.value;
            STATE.currentPage = 1;
            loadPage(1);
        });
        document.getElementById('clear-filter-btn').addEventListener('click', () => {
            STATE.isFiltering = false;
            STATE.filters = {};
            DOM.filterForm.reset();
            DOM.searchInput.value = '';
            DOM.filterModal.classList.add('hidden');
            loadPage(1);
        });

        // Event Listeners: Pagination
        DOM.prevBtn.addEventListener('click', () => { if(STATE.currentPage > 1) loadPage(STATE.currentPage - 1); });
        DOM.nextBtn.addEventListener('click', () => { if(STATE.currentPage < STATE.totalPages) loadPage(STATE.currentPage + 1); });

        // Event Listeners: List Actions (Delete)
        DOM.list.addEventListener('click', handleDelete);

        // Event Listeners: Downloads
        document.getElementById('pdf-download-btn').addEventListener('click', () => handleDownload('pdf'));
        document.getElementById('excel-download-btn').addEventListener('click', () => handleDownload('excel'));

        // Event Listeners: Modals (Open/Close)
        const toggleModal = (modal, show) => modal.classList.toggle('hidden', !show);
        
        document.getElementById('add-income-btn-header').addEventListener('click', () => toggleModal(DOM.incomeModal, true));
        document.getElementById('add-expense-btn-header').addEventListener('click', () => toggleModal(DOM.expenseModal, true));
        document.getElementById('add-income-fab').addEventListener('click', () => toggleModal(DOM.incomeModal, true));
        document.getElementById('add-expense-fab').addEventListener('click', () => toggleModal(DOM.expenseModal, true));
        document.getElementById('open-filter-modal-btn').addEventListener('click', () => toggleModal(DOM.filterModal, true));

        // Close buttons
        document.getElementById('close-income-modal-btn').addEventListener('click', () => toggleModal(DOM.incomeModal, false));
        document.getElementById('close-expense-modal-btn').addEventListener('click', () => toggleModal(DOM.expenseModal, false));
        document.getElementById('close-filter-modal-btn').addEventListener('click', () => toggleModal(DOM.filterModal, false));

        // Click outside to close
        [DOM.incomeModal, DOM.expenseModal, DOM.filterModal].forEach(m => {
            m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
        });

        // FAB
        DOM.mainFab.addEventListener('click', () => DOM.fabContainer.classList.toggle('open'));
    };

    return { init };
})();

// Start App
document.addEventListener('DOMContentLoaded', TransactionApp.init);