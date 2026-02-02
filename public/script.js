const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

const login=document.querySelector('.btn-login');
const signup=document.querySelector('.btn-signup')
const started = document.querySelector('.started-btn');


themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
});

const neonColors = [
    'rgba(0, 255, 255, 0.7)',   // Cyan
    'rgba(255, 99, 132, 0.7)',  // Pink
    'rgba(255, 206, 86, 0.7)',  // Yellow
    'rgba(54, 162, 235, 0.7)',  // Light Blue
    'rgba(153, 102, 255, 0.7)', // Purple
    'rgba(0, 255, 127, 0.7)'    // Spring Green
  ];  

  const mockData = {
  totalBalance: 15700,
  income: 8500,
  expense: 6222,
  totalSavings: 32913,
  moneyFlow: [
    3100, 3600, 3200, 3450, 3700, 3100, 2900
  ],
  budgetBreakdown: {
    'Coffee & Restaurants': 1200,
    Entertainment: 900,
    Investments: 2000,
    'Food & Groceries': 1000,
    'Health & Beauty': 450,
    Traveling: 400
  },
  Flow: [
    531, 36, 132, 34, 237, 31, 329
  ],
  savingsGoals: {
    'MacBook Pro': 3650,
    'New car': 60000,
    'New house': 150000,
    'New house': 150000,
    'New house': 110000,
    'New earehouse': 150000,
    'New house': 150000,
    'New house': 15000
}
};

document.querySelector('.balance').textContent = `$${mockData.totalBalance.toFixed(2)}`;
document.querySelector('.amount').textContent = `$${mockData.income.toFixed(2)}`;
document.querySelector('.amount2').textContent = `$${mockData.expense.toFixed(2)}`;
document.querySelector('.amount3').textContent = `$${mockData.totalSavings.toFixed(2)}`;

const ctx = document.getElementById('money-flow-chart');
 // line chart
          new Chart(ctx, {
          type: 'line', // 'line', 'bar', 'radar', 'doughnut', 'polarArea', 'bubble', 'scatter'
          data: {
              labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
              datasets: [{
                  data: mockData.moneyFlow,
                  backgroundColor: neonColors,
borderColor: neonColors.map(c => c.replace('0.7', '1')),
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
            filler: {
                propagate: true
                     }
                         },      
            }
        });

// Create the budget breakdown chart (pie chart)

const budgetCtx = document.getElementById('budget-Breakdown').getContext('2d');
new Chart(budgetCtx, {
  type: 'pie',
  data: {
    labels: Object.keys(mockData.budgetBreakdown),
    datasets: [{
      data: Object.values(mockData.budgetBreakdown),
    //   backgroundColor: [
    //     'rgba(255, 99, 132, 0.7)',
    //     'rgba(54, 162, 235, 0.7)',
    //     'rgba(255, 206, 86, 0.7)',
    //     'rgba(75, 192, 192, 0.7)',
    //     'rgba(153, 102, 255, 0.7)',
    //     'rgba(255, 159, 64, 0.7)'
    //   ],
    backgroundColor: neonColors,
borderColor: neonColors.map(c => c.replace('0.7', '1')),
      borderColor: 'rgba(255, 255, 255, 0.7)',
      borderWidth: 1
    }]
  },
   options: {
  scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
            filler: {
                propagate: true
                     }
                         },      
            }
});

// Create the savings goals chart (horizontal bar chart)
const savingsCtx = document.getElementById('savings-chart').getContext('2d');
new Chart(savingsCtx, {
  type: 'bar',
  data: {
    labels: Object.keys(mockData.savingsGoals),
    datasets: [{
      label: 'Savings Goals ($)',
      // data: Object.values(mockData.savingsGoals),
      data: mockData.savingsGoals,
      backgroundColor: neonColors,
borderColor: neonColors.map(c => c.replace('0.7', '1')),
      // backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  },
  options: {
    // indexAxis: 'y',
    responsive: true,
    scales: {
      x: {
        beginAtZero: true
      }
    }
  }
});


const spendingsCtx = document.getElementById('daily_spendings').getContext('2d');

    const data = {
      labels: Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
      datasets: [{
        label: 'Daily Spending ($)',
        data: [
          20, 30, 15, 25, 10, 5, 40, 35, 50, 30,
          25, 10, 15, 20, 35, 45, 10, 30, 25, 20,
          5, 15, 25, 30, 40, 35, 50, 45, 20, 25, 15
        ],
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
//         backgroundColor: neonColors,
// borderColor: neonColors.map(c => c.replace('0.1', '1')),
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };

    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Your Daily Spending - March 2025'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Day of Month'
            }
          }
        }
      }
    };

    new Chart(spendingsCtx, config);

    const msavingsCtx = document.getElementById('monthly_savings').getContext('2d');

    const mdata = {
      labels: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      datasets: [{
        label: ' monthly savings',
        data: [
          1200, 3000, 1335, 2255, 3510, 1505, 4000, 3205, 5000, 1320,2000, 1500 
        ],
        borderColor:'rgba(220, 12, 57, 0.7)',  // Pink',
        backgroundColor: 'rgba(255, 99, 132, 0.4)',  // Pink,
        tension: 0.3,
        fill: true,
        pointRadius: 7,
        pointHoverRadius: 8
      }]
    };
    const mconfig = {
      type: 'line',
      data: mdata,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Your monthly savings - March 2025'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Day of Month'
            }
          }
        }
      }
    }
    new Chart(msavingsCtx, mconfig);

{/* <stocks>*/}
    const sdata = {
        datasets: [
          {
            label: 'AAPL',
            data: [{ x: 15, y: 12, r: 25 }],
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
          },
          {
            label: 'TSLA',
            data: [{ x: 25, y: 18, r: 30 }],
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
          },
          {
            label: 'AMZN',
            data: [{ x: 20, y: 10, r: 20 }],
            backgroundColor: 'rgba(255, 206, 86, 0.6)'
          },
          {
            label: 'MSFT',
            data: [{ x: 10, y: 8, r: 15 }],
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          },
          {
            label: 'GOOGL',
            data: [{ x: 18, y: 14, r: 22 }],
            backgroundColor: 'rgba(153, 102, 255, 0.6)'
          }
        ]
      };
  
      const sconfig = {
        type: 'bubble',
        data: sdata,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const stock = context.dataset.label;
                  const x = context.raw.x;
                  const y = context.raw.y;
                  const r = context.raw.r;
                  return `${stock}: Risk ${x}%, Return ${y}%, Size $${r * 1000}`;
                }
              }
            },
            title: {
              display: true,
              text: 'Stock Portfolio Bubble Chart'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Risk (%)'
              },
              min: 0,
              max: 30
            },
            y: {
              title: {
                display: true,
                text: 'Return (%)'
              },
              min: 0,
              max: 25
            }
          }
        }
      };
  
      new Chart(document.getElementById('stock'), sconfig);
      
const salatyCtx = document.getElementById('salary_spent').getContext('2d');
new Chart(salatyCtx, {
                type:'radar',
                data: {
      labels: [
        'Eating',
        'Drinking',
        'Sleeping',
        'Designing',
        'Coding',
        'Cycling',
        'Running'
      ],
      datasets: [{
        label: 'My First Dataset',
        data: [65, 59, 90, 81, 56, 55, 40],
        fill: true,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
      }, {
        label: 'My Second Dataset',
        data: [28, 48, 40, 19, 96, 27, 100],
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(54, 162, 235)'
      }]
    },
                options: {
                    elements: {
                        line: {
                            tension: 0.5 // Adjust the tension value to control the curve
                        }
                    }
                }
            });

            function navigating(){
              if (!localStorage.getItem('token')){
                window.location.href = "public/login.html";
                console.log("not logged in")
              }
              else{
                window.location.href = "transaction.html";
              }
            }

            if(started){
              started.addEventListener('click', ()=>{
                console.log("started")
                window.location.href = "login.html";
              });
            }
    // DARK THEME

    function applyChartTheme(isDark) {
        if (isDark) {
          Chart.defaults.color = '#e0e0e0';
          Chart.defaults.plugins.legend.labels.color = '#e0e0e0';
          Chart.defaults.plugins.title.color = '#ffffff';
          Chart.defaults.scales.x.ticks.color = '#cccccc';
          Chart.defaults.scales.y.ticks.color = '#cccccc';
          Chart.defaults.plugins.tooltip.backgroundColor = '#222';
          Chart.defaults.plugins.tooltip.titleColor = '#0ff';
          Chart.defaults.plugins.tooltip.bodyColor = '#fff';
          Chart.defaults.plugins.tooltip.borderColor = '#0ff';
          Chart.defaults.plugins.tooltip.borderWidth = 1;
        } else {
          Chart.defaults.color = '#333';
          Chart.defaults.plugins.legend.labels.color = '#333';
          Chart.defaults.plugins.title.color = '#111';
          Chart.defaults.scales.x.ticks.color = '#444';
          Chart.defaults.scales.y.ticks.color = '#444';
          Chart.defaults.plugins.tooltip.backgroundColor = '#fff';
          Chart.defaults.plugins.tooltip.titleColor = '#000';
          Chart.defaults.plugins.tooltip.bodyColor = '#000';
          Chart.defaults.plugins.tooltip.borderColor = '#999';
          Chart.defaults.plugins.tooltip.borderWidth = 1;
        }
      
        // Re-render charts manually if needed (OPTIONAL):
        Chart.helpers.each(Chart.instances, function (chart) {
          chart.update();
        });
      }
      
      // Initial theme setup (in case user loads in dark mode)
      applyChartTheme(document.body.classList.contains('dark-mode'));
      
      // Listen to theme toggle button
      themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        applyChartTheme(isDark);
      });
      