document.addEventListener('DOMContentLoaded', async () => {

    // --- GLOBAL STATE ---
    let currentPage = 1;
    const limit = 10;
    let transactions = []; // This will only hold the *current page* of transactions
    let totalPages = 1;
    let categoryChart;
    let isFiltering = false; // NEW: Tracks if we are in filter mode
    let currentFilters = {};   // NEW: Stores the active filters
    
    // --- DOM ELEMENTS ---
    const balanceEl = document.getElementById('current-balance');
    const incomeEl = document.getElementById('monthly-income');
    const expensesEl = document.getElementById('monthly-expenses');
    const transactionListEl = document.getElementById('transaction-list');
    const searchInput = document.getElementById('search-input');
    const noTransactionsEl = document.getElementById('no-transactions');
    const noChartDataEl = document.getElementById('no-chart-data');

    // Modals
    const incomeModal = document.getElementById('add-income-modal');
    const expenseModal = document.getElementById('add-expense-modal');
    const incomeForm = document.getElementById('add-income-form');
    const expenseForm = document.getElementById('add-expense-form');
    const incomeModalTitle = document.getElementById('income-modal-title');
    const expenseModalTitle = document.getElementById('expense-modal-title');
    const incomeModalSubmitBtn = document.getElementById('income-modal-submit-btn');
    const expenseModalSubmitBtn = document.getElementById('expense-modal-submit-btn');
    const closeIncomeModalBtn = document.getElementById('close-income-modal-btn');
    const closeExpenseModalBtn = document.getElementById('close-expense-modal-btn');

    // NEW: Filter Modal Elements
    const filterModal = document.getElementById('filter-modal');
    const openFilterModalBtn = document.getElementById('open-filter-modal-btn');
    const closeFilterModalBtn = document.getElementById('close-filter-modal-btn');
    const filterForm = document.getElementById('filter-form');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');

    // Buttons
    const addIncomeBtnHeader = document.getElementById('add-income-btn-header');
    const addExpenseBtnHeader = document.getElementById('add-expense-btn-header');
    const addIncomeFab = document.getElementById('add-income-fab');
    const addExpenseFab = document.getElementById('add-expense-fab');
    const mainFab = document.getElementById('main-fab');
    const fabContainer = document.getElementById('fab-container');
    
    // Pagination Buttons (Corrected IDs)
    const prevPageBtn = document.getElementById('next-page-btn');
    const nextPageBtn = document.getElementById('prev-page-btn');

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');

    // --- HELPERS ---
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    const getCategoryIcon = (category) => ({
        'Food': 'fas fa-utensils', 'Transportation': 'fas fa-car', 'Shopping': 'fas fa-shopping-bag',
        'Housing': 'fas fa-home', 'Utilities': 'fas fa-file-invoice-dollar', 'Salary': 'fas fa-briefcase', 'Healthcare': 'fas fa-heartbeat',
        'Entertainment': 'fas fa-film', 'Other': 'fas fa-tag', 'Investment': 'fas fa-chart-line',
        'Gift': 'fas fa-gift', 'Business': 'fas fa-briefcase'
    }[category] || 'fas fa-tag');
    
    // Date picker initialization
    flatpickr("#expense-date, #income-date", {
        dateFormat: "Y-m-d",
        defaultDate: "today",
        maxDate: "today"
    });
    // NEW: Initialize flatpickr for filter modal
    flatpickr("#filter-start-date, #filter-end-date", {
        dateFormat: "Y-m-d",
        defaultDate: null,
    });

    // --- DATA FETCHING ---

    /**
     * Fetches a single page of combined *recent* transactions.
     */
    async function fetchRecentData(page) {
        try {
            const res = await fetch(`http://localhost:3000/dashboard/get-transactions?page=${page}&limit=${limit}`, {
                headers: { 'token': localStorage.getItem('token') }
            });
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            const data = await res.json();
            
            transactions = data.transactions;
            totalPages = data.totalPages;
            currentPage = data.currentPage;

            updateUI();
            updatePaginationButtons();
        } catch (err) {
            console.error('Error fetching recent data:', err);
            transactions = [];
            updateUI();
        }
    }

    /**
     * NEW: Fetches a single page of *filtered* transactions.
     */
    async function fetchFilteredData(page) {
        // Build the query URL
        const url = new URL('http://localhost:3000/dashboard/filter');
        url.searchParams.append('page', page);
        url.searchParams.append('limit', limit);

        // Add search query from search bar
        const searchQuery = searchInput.value;
        if (searchQuery) {
            currentFilters.comment = searchQuery;
        }

        // Add filters from the global filter object
        for (const [key, value] of Object.entries(currentFilters)) {
            if (value) { // Only add if the filter has a value
                url.searchParams.append(key, value);
            }
        }

        try {
            const res = await fetch(url, {
                headers: { 'token': localStorage.getItem('token') }
            });
            if (!res.ok) throw new Error(`Failed to fetch filtered data: ${res.status}`);
            const data = await res.json();
            
            transactions = data.transactions;
            totalPages = data.totalPages;
            currentPage = data.currentPage;

            updateUI();
            updatePaginationButtons();
        } catch (err) {
            console.error('Error fetching filtered data:', err);
            transactions = [];
            updateUI();
        }
    }

    /**
     * NEW: Decides which fetch function to call based on state.
     */
    function fetchData(page) {
        if (isFiltering) {
            return fetchFilteredData(page);
        } else {
            return fetchRecentData(page);
        }
    }

    // --- RENDER FUNCTIONS ---

    const renderTransactions = (transactionsToRender) => {
        // ... (This function remains IDENTICAL to your previous version)
        const formatted = transactionsToRender.map(t => ({
            ...t,
            dateObj: new Date(t.date),
            formattedDate: new Date(t.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }),
        })).sort((a, b) => b.dateObj - a.dateObj);

        transactionListEl.innerHTML = '';

        if (formatted.length === 0) {
            noTransactionsEl.classList.remove('hidden');
            return;
        } else {
            noTransactionsEl.classList.add('hidden');
        }

        const grouped = {};
        formatted.forEach(t => {
            const monthYear = t.dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            if (!grouped[monthYear]) grouped[monthYear] = [];
            grouped[monthYear].push(t);
        });

        Object.entries(grouped).forEach(([monthYear, trans]) => {
            const divider = document.createElement('div');
            divider.className = `transaction-month-divider text-center text-sm font-semibold mb-2 mt-4 text-[var(--text-muted)]`;
            divider.innerHTML = `<span>${monthYear}</span>`;
            transactionListEl.appendChild(divider);

            trans.forEach(t => {
                const isExpense = t.type === 'expense';
                const sign = isExpense ? '-' : '+';
                const colorClass = isExpense ? 'text-accent-red' : 'text-accent-green';
                const iconBgClass = isExpense ? 'bg-accent-red-light' : 'bg-accent-green-light';
                const iconColorClass = isExpense ? 'text-accent-red' : 'text-accent-green';

                const listItem = document.createElement('li');
                listItem.className = `flex justify-between items-center py-3 border-b last:border-none`;
                listItem.style.borderColor = 'var(--list-border-color)';
                listItem.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg ${iconBgClass} ${iconColorClass}">
                            <i class="${getCategoryIcon(t.category)}"></i>
                        </div>
                        <div>
                            <p class="font-medium text-sm md:text-base">${t.comment || t.category}</p>
                            <p class="text-xs text-[var(--text-muted)]">${t.category} • ${t.formattedDate}</p>
                        </div>
                    </div>
                    <span class="font-semibold ${colorClass} text-sm md:text-base">${sign}${formatter.format(t.amount)}</span>
                `;
                transactionListEl.appendChild(listItem);
            });
        });
    };
    
    /**
     * Fetches and updates the summary cards.
     * This is unaffected by client-side filters.
     */
    const updateSummary = async () => {
        try {
            const res = await fetch('http://localhost:3000/dashboard/summary', {
                headers: { 'token': localStorage.getItem('token') }
            });
            if (!res.ok) throw new Error('Failed to fetch summary');
            const summary = await res.json(); 
            
            balanceEl.textContent = formatter.format(summary.totalBalance);
            incomeEl.textContent = formatter.format(summary.monthlyIncome);
            expensesEl.textContent = formatter.format(summary.monthlyExpenses);

        } catch (err) {
            console.error(err);
        }
    };

    /**
     * Fetches and renders the category chart.
     * This is unaffected by client-side filters.
     */
    const renderCategoryChart = async () => {
        // ... (This function remains IDENTICAL to your previous version)
        let expenseData = {};
        try {
            const res = await fetch('http://localhost:3000/dashboard/category-summary', {
                headers: { 'token': localStorage.getItem('token') }
            });
            if (!res.ok) throw new Error('Failed to fetch chart data');
            expenseData = await res.json(); 
        } catch (err) {
            console.error(err);
        }

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);

        if (categoryChart) categoryChart.destroy();
        if (labels.length === 0) {
            noChartDataEl.classList.remove('hidden');
            return;
        }
        noChartDataEl.classList.add('hidden');
        
        const ctx = document.getElementById('category-chart').getContext('2d');
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Spending', data: data,
                    backgroundColor: ['#f4a261', '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#f4a261', '#8ab17d', '#f77f00'],
                    borderColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    borderWidth: 4, hoverOffset: 10
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDarkMode ? '#ecf0f1' : '#2c3e50',
                            font: { family: "'Inter', sans-serif" },
                            padding: 15, usePointStyle: true,
                        }
                    }
                }
            }
        });
    };

    const updateUI = () => {
        renderTransactions(transactions);
    };

    const updatePaginationButtons = () => {
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    };
    
    // --- EVENT HANDLERS ---

    const handleSearch = (e) => {
        // NEW: This now triggers a filter-search
        currentFilters.comment = e.target.value;
        isFiltering = true;
        currentPage = 1;
        fetchFilteredData(currentPage);
    };

    // --- FORM SUBMISSION HANDLERS (for adding new data) ---
    // These now refetch all dashboard data to ensure consistency.

    const handleExpenseForm = async (e) => {
        e.preventDefault();
        const expenseFormData = new FormData(expenseForm);
        // ... (Rest of your form data logic) ...
        const comment = expenseFormData.get('expense-comment');
        const amount = parseFloat(expenseFormData.get('expense-amount'));
        const category = expenseFormData.get('expense-category');
        const date = expenseFormData.get('expense-date');

        try {
            const res = await fetch('http://localhost:3000/dashboard/expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'token': localStorage.getItem('token') },
                body: JSON.stringify({ amount, category, comment: comment || category, date })
            });
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            
            // On success, refetch all data and close modal
            await fetchData(currentPage);    // Refreshes the transaction list
            await updateSummary();         // Refreshes the summary cards
            await renderCategoryChart();   // Refreshes the pie chart

            expenseForm.reset();
            flatpickr("#expense-date", { defaultDate: "today" });
            closeExpenseModal();
        } catch (err) {
            console.error(' Error adding expense:', err);
            alert('Failed to add expense. Please try again.');
        }
    };

    const handleIncomeForm = async (e) => {
        e.preventDefault();
        const incomeFormData = new FormData(incomeForm);
        // ... (Rest of your form data logic) ...
        const comment = incomeFormData.get('income-comment');
        const amount = parseFloat(incomeFormData.get('income-amount'));
        const category = incomeFormData.get('income-category');
        const date = incomeFormData.get('income-date');

        try {
            const res = await fetch('http://localhost:3000/dashboard/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'token': localStorage.getItem('token') },
                body: JSON.stringify({ amount, category, comment: comment || category, date })
            });
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            
            // On success, refetch all data and close modal
            await fetchData(currentPage);    // Refreshes the transaction list
            await updateSummary();         // Refreshes the summary cards
            await renderCategoryChart();   // Refreshes the pie chart

            incomeForm.reset();
            flatpickr("#income-date", { defaultDate: "today" });
            closeIncomeModal();
        } catch (err) {
            console.error(' Error adding income:', err);
            alert('Failed to add income. Please try again.');
        }
    };

    // --- Modal Handlers (Add/Expense) ---
    const openIncomeModal = () => incomeModal.classList.remove('hidden');
    const openExpenseModal = () => expenseModal.classList.remove('hidden');
    const closeIncomeModal = () => incomeModal.classList.add('hidden');
    const closeExpenseModal = () => expenseModal.classList.add('hidden');
    
    // --- NEW: Filter Modal Handlers ---
    const openFilterModal = () => filterModal.classList.remove('hidden');
    const closeFilterModal = () => filterModal.classList.add('hidden');

    const handleApplyFilter = async (e) => {
        e.preventDefault();
        const formData = new FormData(filterForm);
        currentFilters = {
            type: formData.get('filter-type'),
            category: formData.get('filter-category'),
            start: formData.get('filter-start-date'),
            end: formData.get('filter-end-date'),
        };
        
        // Also grab search bar value, as it's part of the filter
        currentFilters.comment = searchInput.value;

        isFiltering = true;
        currentPage = 1;
        await fetchFilteredData(currentPage);
        closeFilterModal();
    };

    const handleClearFilter = async () => {
        isFiltering = false;
        currentFilters = {};
        currentPage = 1;
        filterForm.reset();
        searchInput.value = ""; // Also clear the search bar
        await fetchRecentData(currentPage);
        closeFilterModal();
    };

    // --- Pagination Handlers (MODIFIED) ---
    const goToNextPage = async () => {
        if (currentPage < totalPages) {
            await fetchData(currentPage + 1);
        }
    };

    const goToPrevPage = async () => {
        if (currentPage > 1) {
            await fetchData(currentPage - 1);
        }
    };

    // --- Theme ---
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        renderCategoryChart(); // Redraw chart for new theme colors
    };
    
    // --- EVENT LISTENERS ---
    expenseForm.addEventListener('submit', handleExpenseForm);
    incomeForm.addEventListener('submit', handleIncomeForm);
    searchInput.addEventListener('input', handleSearch);
    
    // Add/Expense Modal toggles
    addIncomeBtnHeader.addEventListener('click', openIncomeModal);
    addExpenseBtnHeader.addEventListener('click', openExpenseModal);
    addIncomeFab.addEventListener('click', openIncomeModal);
    addExpenseFab.addEventListener('click', openExpenseModal);
    closeIncomeModalBtn.addEventListener('click', closeIncomeModal);
    closeExpenseModalBtn.addEventListener('click', closeExpenseModal);
    incomeModal.addEventListener('click', (e) => { if(e.target === incomeModal) closeIncomeModal(); });
    expenseModal.addEventListener('click', (e) => { if(e.target === expenseModal) closeExpenseModal(); });
    mainFab.addEventListener('click', () => fabContainer.classList.toggle('open'));

    // NEW: Filter Modal Listeners
    openFilterModalBtn.addEventListener('click', openFilterModal);
    closeFilterModalBtn.addEventListener('click', closeFilterModal);
    filterModal.addEventListener('click', (e) => { if(e.target === filterModal) closeFilterModal(); });
    filterForm.addEventListener('submit', handleApplyFilter);
    clearFilterBtn.addEventListener('click', handleClearFilter);

    // Pagination Listeners
    nextPageBtn.addEventListener('click', goToNextPage);
    prevPageBtn.addEventListener('click', goToPrevPage);

    // Theme
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
    
    // --- INITIALIZATION ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Load all data on startup
    await fetchRecentData(currentPage); // Fetches page 1 of recent transactions
    await updateSummary();              // Fetches summary card data
    await renderCategoryChart();        // Fetches data for the pie chart
});