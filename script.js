// Utility functions for interacting with user data in localStorage
function getCurrentUser() {
  return sessionStorage.getItem('currentUser');
}

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Returns the current user's data object
function getUserData() {
  const user = getCurrentUser();
  const users = getUsers();
  return users[user];
}

function updateUserData(data) {
  const user = getCurrentUser();
  const users = getUsers();
  users[user] = data;
  setUsers(users);
}

// Logout function
function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Charts initialisation
function updateCharts() {
  const data = getUserData();
  if (!data) return;
  // Prepare budgets vs expenses chart
  const totalBudget = data.budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalExpense = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const ctx = document.getElementById('overviewChart');
  if (ctx) {
    // Destroy previous chart if exists
    if (window.overviewChartInstance) {
      window.overviewChartInstance.destroy();
    }
    window.overviewChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Budgets', 'Expenses'],
        datasets: [
          {
            data: [totalBudget, totalExpense],
            backgroundColor: ['#49a64e', '#d63c3c'],
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Budgets vs. Expenses'
          }
        }
      }
    });
  }
  // Goals progress chart
  const goalCtx = document.getElementById('goalsChart');
  if (goalCtx) {
    if (window.goalsChartInstance) {
      window.goalsChartInstance.destroy();
    }
    const labels = data.goals.map((goal) => goal.name);
    const progress = data.goals.map((goal) => {
      const saved = data.expenses.filter(e => e.category === goal.name).reduce((sum, e) => sum + Number(e.amount), 0);
      return Math.min((saved / goal.target) * 100, 100);
    });
    window.goalsChartInstance = new Chart(goalCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '% Progress',
            data: progress,
            backgroundColor: '#49a64e'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Progress (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Goal Progress'
          }
        }
      }
    });
  }
}

// Add new budget
function addBudget(name, amount) {
  const data = getUserData();
  data.budgets.push({ name, amount: Number(amount) });
  updateUserData(data);
  populateBudgets();
  updateCharts();
}

// Populate budgets table
function populateBudgets() {
  const data = getUserData();
  const tableBody = document.getElementById('budgetsTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  data.budgets.forEach((budget, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${budget.name}</td>
      <td>${budget.amount.toFixed(2)}</td>
      <td><button onclick="deleteBudget(${index})" class="btn-secondary">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function deleteBudget(index) {
  const data = getUserData();
  data.budgets.splice(index, 1);
  updateUserData(data);
  populateBudgets();
  updateCharts();
}

// Add new expense
function addExpense(name, category, amount) {
  const data = getUserData();
  data.expenses.push({ name, category, amount: Number(amount), date: new Date().toISOString() });
  updateUserData(data);
  populateExpenses();
  updateCharts();
}

// Populate expenses table
function populateExpenses() {
  const data = getUserData();
  const tableBody = document.getElementById('expensesTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  data.expenses.forEach((expense, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${expense.name}</td>
      <td>${expense.category}</td>
      <td>${expense.amount.toFixed(2)}</td>
      <td>${new Date(expense.date).toLocaleDateString()}</td>
      <td><button onclick="deleteExpense(${index})" class="btn-secondary">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function deleteExpense(index) {
  const data = getUserData();
  data.expenses.splice(index, 1);
  updateUserData(data);
  populateExpenses();
  updateCharts();
}

// Add new goal
function addGoal(name, target) {
  const data = getUserData();
  data.goals.push({ name, target: Number(target) });
  updateUserData(data);
  populateGoals();
  updateCharts();
}

// Populate goals table
function populateGoals() {
  const data = getUserData();
  const tableBody = document.getElementById('goalsTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  data.goals.forEach((goal, index) => {
    const saved = data.expenses.filter(e => e.category === goal.name).reduce((sum, e) => sum + Number(e.amount), 0);
    const progress = Math.min((saved / goal.target) * 100, 100).toFixed(1);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${goal.name}</td>
      <td>${goal.target.toFixed(2)}</td>
      <td>${progress}%</td>
      <td><button onclick="deleteGoal(${index})" class="btn-secondary">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function deleteGoal(index) {
  const data = getUserData();
  data.goals.splice(index, 1);
  updateUserData(data);
  populateGoals();
  updateCharts();
}

// Savings calculator
function calculateSavings() {
  const principal = parseFloat(document.getElementById('calc-principal').value);
  const monthly = parseFloat(document.getElementById('calc-monthly').value);
  const rate = parseFloat(document.getElementById('calc-rate').value) / 100;
  const years = parseFloat(document.getElementById('calc-years').value);
  // Compound interest monthly
  const months = years * 12;
  let balance = principal;
  for (let i = 0; i < months; i++) {
    balance += monthly;
    balance *= 1 + rate / 12;
  }
  document.getElementById('calc-result').textContent =
    'Estimated Savings: $' + balance.toFixed(2);
}

// Income vs Expense calculator
function calculateBudget() {
  const income = parseFloat(document.getElementById('budget-income').value);
  const expense = parseFloat(document.getElementById('budget-expense').value);
  const difference = income - expense;
  const resultEl = document.getElementById('budget-result');
  resultEl.textContent =
    'Monthly Savings: $' + difference.toFixed(2) + (difference < 0 ? ' (Deficit)' : '');
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only run if on dashboard
  if (document.getElementById('dashboard-page')) {
    // verify user logged in
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    // Populate initial data
    populateBudgets();
    populateExpenses();
    populateGoals();
    updateCharts();
    // Setup navigation
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href').substring(1);
        sections.forEach((s) => s.classList.remove('active'));
        document.getElementById(target).classList.add('active');
      });
    });
    // Show overview by default
    document.getElementById('overview').classList.add('active');
    // Event listeners for forms
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('budget-name').value;
        const amount = document.getElementById('budget-amount').value;
        addBudget(name, amount);
        budgetForm.reset();
      });
    }
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('expense-name').value;
        const category = document.getElementById('expense-category').value;
        const amount = document.getElementById('expense-amount').value;
        addExpense(name, category, amount);
        expenseForm.reset();
      });
    }
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('goal-name').value;
        const target = document.getElementById('goal-target').value;
        addGoal(name, target);
        goalForm.reset();
      });
    }
    const savingsBtn = document.getElementById('calc-btn');
    if (savingsBtn) {
      savingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        calculateSavings();
      });
    }
    const budgetBtn = document.getElementById('budget-btn');
    if (budgetBtn) {
      budgetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        calculateBudget();
      });
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }
});