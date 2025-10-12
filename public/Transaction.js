    document.addEventListener('DOMContentLoaded', async () => {
        // --- STATE ---

const res=await fetch('http://localhost:3000/dashboard/get-expanses',{
    method:'GET',
    headers:{
        'Content-Type': 'application/json',
        'token': localStorage.getItem('token')
    }
})
let transactions = await res.json();
        //  transactions = JSON.parse(localStorage.getItem('transactions')) || [
        //     { id: 1, description: 'Grocery Shopping', amount: 2550.75, type: 'expense', category: 'Food', date: '2025-09-01' },
        //     { id: 2, description: 'September Salary', amount: 85000.00, type: 'income', category: 'Salary', date: '2025-09-01' },
        //     { id: 3, description: 'Electric Bill', amount: 1200.00, type: 'expense', category: 'Bills', date: '2025-09-02' },
        //     { id: 4, description: 'Uber to work', amount: 250.50, type: 'expense', category: 'Transport', date: '2025-09-02' },
        // ];
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
        const modal = document.getElementById('add-transaction-modal');
        const modalForm = document.getElementById('add-transaction-form');
        const modalTitle = document.getElementById('modal-title');
        const modalSubmitBtn = document.getElementById('modal-submit-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        
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
        flatpickr("#date", {
            dateFormat: "Y-m-d",
            defaultDate: "today"
        });

        // --- RENDER FUNCTIONS ---
        const renderTransactions = (filteredTransactions) => {
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
                                <p class="font-medium text-sm md:text-base">${t.description}</p>
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
            const expenseData = transactions
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
            localStorage.setItem('transactions', JSON.stringify(transactions));
        };
        
        // --- EVENT HANDLERS ---
        const handleFormSubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(modalForm);
            const newTransaction = {
                id: Date.now(),
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount')),
                type: formData.get('type'),
                category: formData.get('category'),
                date: formData.get('date')
            };

            transactions.push(newTransaction);
            updateUI();
            modalForm.reset();
            flatpickr("#date", { defaultDate: "today" }); // Reset date picker
            closeModal();
        };

        const handleSearch = (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = transactions.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query)
            );
            renderTransactions(filtered);
        };
        
        const openModal = (type = 'expense') => {
            modalForm.elements.type.value = type;
            if (type === 'income') {
                modalTitle.textContent = 'New Income';
                modalSubmitBtn.className = 'btn btn-income w-full py-4 text-lg';
                modalSubmitBtn.textContent = 'Add Income';
            } else {
                modalTitle.textContent = 'New Expense';
                modalSubmitBtn.className = 'btn btn-expense w-full py-4 text-lg';
                modalSubmitBtn.textContent = 'Add Expense';
            }
            modal.classList.remove('hidden');
        };
        
        const closeModal = () => modal.classList.add('hidden');
        
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
        modalForm.addEventListener('submit', handleFormSubmit);
        searchInput.addEventListener('input', handleSearch);
        
        // Modal toggles
        addIncomeBtnHeader.addEventListener('click', () => openModal('income'));
        addExpenseBtnHeader.addEventListener('click', () => openModal('expense'));
        addIncomeFab.addEventListener('click', () => openModal('income'));
        addExpenseFab.addEventListener('click', () => openModal('expense'));
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); }); // Close on overlay click
        
        // Mobile FAB toggle
        mainFab.addEventListener('click', () => fabContainer.classList.toggle('open'));

        // --- INITIALIZATION ---
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        updateUI();
    });
