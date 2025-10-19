document.addEventListener('DOMContentLoaded', async () => {
        // --- STATE ---

const expenseRes=await fetch('http://localhost:3000/dashboard/get-expanses',{
    method:'GET',
    headers:{
        'Content-Type': 'application/json',
        'token': localStorage.getItem('token')
    }
})
const incomeRes = await fetch('http://localhost:3000/dashboard/get-incomes', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'token': localStorage.getItem('token')
    }
});
// let incomes = await incomeRes.json();
// // let transactions = await res.json();
// let expenses = await res.json();
// let transactions = [...expenses, ...incomes];

const incomes = (await incomeRes.json()).map(i => ({ ...i, type: 'income' }));
const expenses = (await expenseRes.json()).map(e => ({ ...e, type: 'expense' }));
const transactions = [...expenses, ...incomes];


        let categoryChart;


        // --- DOM ELEMENTS ---
        const balanceEl = document.getElementById('current-balance');
        const incomeEl = document.getElementById('monthly-income');
        const expensesEl = document.getElementById('monthly-expenses');
        const transactionListEl = document.getElementById('transaction-list');
        const searchInput = document.getElementById('search-input');
        const noTransactionsEl = document.getElementById('no-transactions');
        const noChartDataEl = document.getElementById('no-chart-data');
        
        // Modal
        const incomeModal = document.getElementById('add-income-modal');
        const expenseModal = document.getElementById('add-expense-modal');
        // const modalForm = document.getElementById('add-transaction-form');
        const incomeForm = document.getElementById('add-income-form');
        const expenseForm = document.getElementById('add-expense-form');

        const incomeModalTitle = document.getElementById('income-modal-title');
        const expenseModalTitle = document.getElementById('expense-modal-title');

        const incomeModalSubmitBtn = document.getElementById('income-modal-submit-btn');
        const expenseModalSubmitBtn = document.getElementById('expense-modal-submit-btn');
        
        const closeIncomeModalBtn = document.getElementById('close-income-modal-btn');
        const closeExpenseModalBtn = document.getElementById('close-expense-modal-btn');

        // Buttons
        const addIncomeBtnHeader = document.getElementById('add-income-btn-header');
        const addExpenseBtnHeader = document.getElementById('add-expense-btn-header');
        const addIncomeFab = document.getElementById('add-income-fab');
        const addExpenseFab = document.getElementById('add-expense-fab');
        const mainFab = document.getElementById('main-fab');
        const fabContainer = document.getElementById('fab-container');

        // Theme Toggle
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle.querySelector('i');

        // --- HELPERS ---
        const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
        const getCategoryIcon = (category) => ({
            'Food': 'fas fa-utensils', 'Transport': 'fas fa-car', 'Shopping': 'fas fa-shopping-bag',
            'Bills': 'fas fa-file-invoice-dollar', 'Salary': 'fas fa-briefcase', 'Health': 'fas fa-heartbeat',
            'Entertainment': 'fas fa-film', 'Other': 'fas fa-tag'
        }[category] || 'fas fa-tag');
        
        // Date picker initialization
        flatpickr("#expense-date, #income-date", {
            dateFormat: "Y-m-d",
            defaultDate: "today"
        });

        // --- RENDER FUNCTIONS ---
        const renderTransactions = (filteredTransactions) => {

        filteredTransactions.forEach(t => {
            t.date = new Date(t.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        });

            transactionListEl.innerHTML = '';
            const transactionsToRender = filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (transactionsToRender.length === 0) {
                noTransactionsEl.classList.remove('hidden');
            } else {
                noTransactionsEl.classList.add('hidden');
                transactionsToRender.forEach(t => {
                    const isExpense = t.type === 'expense';
                    const sign = isExpense ? '-' : '+';
                    const colorClass = isExpense ? 'text-accent-red' : 'text-accent-green';
                    const iconBgClass = isExpense ? 'bg-accent-red-light' : 'bg-accent-green-light';
                    const iconColorClass = isExpense ? 'text-accent-red' : 'text-accent-green';

                    const listItem = document.createElement('li');
                    listItem.className = 'flex justify-between items-center py-4';
                    listItem.innerHTML = `
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg ${iconBgClass} ${iconColorClass}">
                                <i class="${getCategoryIcon(t.category)}"></i>
                            </div>
                            <div>
                                <p class="font-medium text-sm md:text-base">${t.comment ? t.comment : t.category}</p>
                                <p class="text-xs" style="color: var(--text-muted);">${t.category} &bull; ${t.date}</p>
                            </div>
                        </div>
                        <span class="font-semibold ${colorClass} text-sm md:text-base">${sign}${formatter.format(t.amount)}</span>
                    `;
                    transactionListEl.appendChild(listItem);
                });
            }
        };

        const updateSummary = () => {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthlyIncome = transactions
                .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
                .reduce((acc, t) => acc + t.amount, 0);

            const monthlyExpenses = transactions
                .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
                .reduce((acc, t) => acc + t.amount, 0);
            
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
            const balance = totalIncome - totalExpenses;

            balanceEl.textContent = formatter.format(balance);
            incomeEl.textContent = formatter.format(monthlyIncome);
            expensesEl.textContent = formatter.format(monthlyExpenses);
        };

        const renderCategoryChart = () => {
            const expenseData = transactions.filter(t => t.type === 'expense')
                .reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                }, {});

            const labels = Object.keys(expenseData);
            const data = Object.values(expenseData);

            if (categoryChart) {
                categoryChart.destroy();
            }

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
                        label: 'Spending',
                        data: data,
                        backgroundColor: [
                            '#f4a261', '#e76f51', '#2a9d8f', '#264653',
                            '#e9c46a', '#f4a261', '#8ab17d', '#f77f00'
                        ],
                        borderColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                        borderWidth: 4,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: isDarkMode ? '#ecf0f1' : '#2c3e50',
                                font: { family: "'Inter', sans-serif" },
                                padding: 15,
                                usePointStyle: true,
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        };

    const updateUI = () => {
            renderTransactions(transactions);
            updateSummary();
            renderCategoryChart();
        };
        


        // --- EVENT HANDLERS ---

        const handleSearch = (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = transactions.filter(t =>
                t.comment.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query)
            );
            renderTransactions(filtered);
        };

        const handleExpenseForm = async (e) => {
            e.preventDefault();
            const expenseFormData = new FormData(expenseForm);

            const id = Date.now();
            const comment = expenseFormData.get('expense-comment'); //! description--> comment
            const amount = parseFloat(expenseFormData.get('expense-amount'));
            const type = 'expense';
            const category = expenseFormData.get('expense-category');
            const date = expenseFormData.get('expense-date');

            console.log(comment,amount,category,date)

            try {
        const res = await fetch('http://localhost:3000/dashboard/expense', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': localStorage.getItem('token')
            },
            body: JSON.stringify({
                amount,
                category,
                comment: comment || category,
                date
            })
        })

        if (!res.ok) throw new Error(`Server responded with ${res.status}`);

        const data = await res.json();
        console.log('Expense added:', data);

        // // Optionally update UI with the new expense
       transactions.push({ ...data.expense, type: 'expense' });
        updateUI();
        updateSummary();
        renderCategoryChart();

        expenseForm.reset();
        flatpickr("#expense-date", { defaultDate: "today" });
        closeExpenseModal();

    } catch (err) {
        console.error(' Error adding expense:', err);
        alert('Failed to add expense. Please try again.');
    }
            updateUI();
            expenseForm.reset();
            flatpickr("#expense-date", { defaultDate: "today" }); // Reset date picker
            closeExpenseModal();
        };
        const  handleIncomeForm = async (e) => {
            e.preventDefault();
            const incomeFormData = new FormData(incomeForm);
            const id = Date.now();
            const comment = incomeFormData.get('income-comment'); //! description--> comment
            const amount = parseFloat(incomeFormData.get('income-amount'));
            const type = 'income';
            const category = incomeFormData.get('income-category');
            const date = incomeFormData.get('income-date');

            const res = await fetch('http://localhost:3000/dashboard/income', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': localStorage.getItem('token')
            },
            body: JSON.stringify({
                amount,
                category,
                comment: comment || category,
                date
            })
        });

        if (!res.ok) throw new Error(`Server responded with ${res.status}`);

        const data = await res.json();
        console.log('Income added:', data);

        transactions.push({ ...data.income, type: 'income' });
        updateUI();
        incomeForm.reset();
        flatpickr("#date", { defaultDate: "today" }); // Reset date picker
        closeIncomeModal();
        };

        const openIncomeModal = () => {
            incomeModalTitle.textContent = 'New Income';
            incomeModalSubmitBtn.className = 'btn btn-income w-full py-4 text-lg';
            incomeModalSubmitBtn.textContent = 'Add Income';
            incomeModal.classList.remove('hidden');
        };

        const openExpenseModal = () => {
            expenseModalTitle.textContent = 'New Expense';
            expenseModalSubmitBtn.className = 'btn btn-expense w-full py-4 text-lg';
            expenseModalSubmitBtn.textContent = 'Add Expense';
            expenseModal.classList.remove('hidden');
        };

        const closeIncomeModal = () => {
            incomeModal.classList.add('hidden');
        };

        const closeExpenseModal = () => {
            expenseModal.classList.add('hidden');
        };

        // --- THEME ---
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            if(categoryChart) renderCategoryChart(); // Redraw chart for new theme colors
        };
        
        themeToggle.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
        
        // --- EVENT LISTENERS ---
        expenseForm.addEventListener('submit', handleExpenseForm);
        incomeForm.addEventListener('submit', handleIncomeForm);
        searchInput.addEventListener('input', handleSearch);
        
        // Modal toggles
        addIncomeBtnHeader.addEventListener('click', () => openIncomeModal());
        addExpenseBtnHeader.addEventListener('click', () => openExpenseModal());
        addIncomeFab.addEventListener('click', () => openIncomeModal());
        addExpenseFab.addEventListener('click', () => openExpenseModal());
        closeIncomeModalBtn.addEventListener('click', closeIncomeModal);
        closeExpenseModalBtn.addEventListener('click', closeExpenseModal);

        incomeModal.addEventListener('click', (e) => { if(e.target === incomeModal) closeIncomeModal(); }); // Close on overlay click
        expenseModal.addEventListener('click', (e) => { if(e.target === expenseModal) closeExpenseModal(); }); // Close on overlay click
        // Mobile FAB toggle
        mainFab.addEventListener('click', () => fabContainer.classList.toggle('open'));

        // --- INITIALIZATION ---
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        updateUI();
    });
