class ForbrukslanKalkulator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.calculateLoan();
    }

    initializeElements() {
        // Input elements
        this.loanAmount = document.getElementById('loan-amount');
        this.loanAmountSlider = document.getElementById('loan-amount-slider');
        this.interestRate = document.getElementById('interest-rate');
        this.interestRateSlider = document.getElementById('interest-rate-slider');
        this.loanTerm = document.getElementById('loan-term');
        this.loanTermSlider = document.getElementById('loan-term-slider');
        this.feeType = document.getElementById('fee-type');
        this.feeAmountGroup = document.getElementById('fee-amount-group');
        this.feeAmount = document.getElementById('fee-amount');
        this.feeHint = document.getElementById('fee-hint');

        // Result elements
        this.monthlyPayment = document.getElementById('monthly-payment');
        this.totalCost = document.getElementById('total-cost');
        this.effectiveRate = document.getElementById('effective-rate');
        this.totalInterest = document.getElementById('total-interest');
        this.amortizationChart = document.getElementById('amortization-chart');
        this.amortizationTable = document.getElementById('amortization-table');
    }

    attachEventListeners() {
        // Sync number inputs with sliders
        this.loanAmount.addEventListener('input', () => {
            this.loanAmountSlider.value = this.loanAmount.value;
            this.calculateLoan();
        });

        this.loanAmountSlider.addEventListener('input', () => {
            this.loanAmount.value = this.loanAmountSlider.value;
            this.calculateLoan();
        });

        this.interestRate.addEventListener('input', () => {
            this.interestRateSlider.value = this.interestRate.value;
            this.calculateLoan();
        });

        this.interestRateSlider.addEventListener('input', () => {
            this.interestRate.value = this.interestRateSlider.value;
            this.calculateLoan();
        });

        this.loanTerm.addEventListener('input', () => {
            this.loanTermSlider.value = this.loanTerm.value;
            this.calculateLoan();
        });

        this.loanTermSlider.addEventListener('input', () => {
            this.loanTerm.value = this.loanTermSlider.value;
            this.calculateLoan();
        });

        // Fee type change
        this.feeType.addEventListener('change', () => {
            this.toggleFeeInput();
            this.calculateLoan();
        });

        this.feeAmount.addEventListener('input', () => {
            this.calculateLoan();
        });

        // Initial calculation
        this.calculateLoan();
    }

    toggleFeeInput() {
        const feeType = this.feeType.value;
        
        if (feeType === 'none') {
            this.feeAmountGroup.style.display = 'none';
        } else {
            this.feeAmountGroup.style.display = 'block';
            
            if (feeType === 'fixed') {
                this.feeAmount.placeholder = '1000';
                this.feeHint.textContent = 'Fast gebyr i NOK';
                this.feeAmount.step = '100';
            } else {
                this.feeAmount.placeholder = '1.5';
                this.feeHint.textContent = 'Prosent av lånebeløp';
                this.feeAmount.step = '0.1';
            }
        }
    }

    calculateLoan() {
        const loanAmount = parseFloat(this.loanAmount.value);
        const annualInterestRate = parseFloat(this.interestRate.value) / 100;
        const loanTermYears = parseFloat(this.loanTerm.value);
        
        // Calculate fee
        const fee = this.calculateFee(loanAmount);
        
        // Calculate monthly payment
        const monthlyPayment = this.calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermYears);
        
        // Calculate total costs
        const totalPayment = monthlyPayment * loanTermYears * 12;
        const totalInterest = totalPayment - loanAmount;
        const totalCost = totalPayment + fee;
        
        // Calculate effective interest rate
        const effectiveRate = this.calculateEffectiveRate(loanAmount, monthlyPayment, loanTermYears, fee);
        
        // Update results
        this.updateResults(monthlyPayment, totalCost, effectiveRate, totalInterest);
        
        // Generate amortization schedule
        this.generateAmortizationSchedule(loanAmount, annualInterestRate, loanTermYears, monthlyPayment);
    }

    calculateFee(loanAmount) {
        const feeType = this.feeType.value;
        const feeValue = parseFloat(this.feeAmount.value) || 0;
        
        switch (feeType) {
            case 'fixed':
                return feeValue;
            case 'percentage':
                return loanAmount * (feeValue / 100);
            default:
                return 0;
        }
    }

    calculateMonthlyPayment(principal, annualRate, years) {
        const monthlyRate = annualRate / 12;
        const numberOfPayments = years * 12;
        
        if (monthlyRate === 0) {
            return principal / numberOfPayments;
        }
        
        return principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / 
               (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    calculateEffectiveRate(principal, monthlyPayment, years, fee) {
        const numberOfPayments = years * 12;
        const totalPayment = monthlyPayment * numberOfPayments + fee;
        
        // Simple approximation for effective rate
        const totalInterest = totalPayment - principal;
        const averageBalance = principal / 2;
        const effectiveRate = (totalInterest / averageBalance) / years * 100;
        
        return Math.min(effectiveRate, 50); // Cap at 50% for display
    }

    updateResults(monthlyPayment, totalCost, effectiveRate, totalInterest) {
        this.monthlyPayment.textContent = this.formatCurrency(monthlyPayment);
        this.totalCost.textContent = this.formatCurrency(totalCost);
        this.effectiveRate.textContent = effectiveRate.toFixed(2) + ' %';
        this.totalInterest.textContent = this.formatCurrency(totalInterest);
    }

    generateAmortizationSchedule(principal, annualRate, years, monthlyPayment) {
        const monthlyRate = annualRate / 12;
        const numberOfPayments = years * 12;
        let remainingBalance = principal;
        
        // Clear previous content
        this.amortizationChart.querySelector('.chart-bars').innerHTML = '';
        this.amortizationTable.querySelector('tbody').innerHTML = '';
        
        const chartBars = [];
        const tableRows = [];
        
        for (let year = 1; year <= years; year++) {
            let yearlyInterest = 0;
            let yearlyPrincipal = 0;
            
            // Calculate yearly totals
            for (let month = 1; month <= 12; month++) {
                if (remainingBalance <= 0) break;
                
                const interestPayment = remainingBalance * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                
                yearlyInterest += interestPayment;
                yearlyPrincipal += principalPayment;
                remainingBalance -= principalPayment;
            }
            
            // Add to chart data
            const totalPayment = yearlyInterest + yearlyPrincipal;
            chartBars.push({
                year: year,
                interest: yearlyInterest,
                principal: yearlyPrincipal,
                total: totalPayment
            });
            
            // Add to table data
            tableRows.push({
                year: year,
                remainingBalance: Math.max(0, remainingBalance),
                interest: yearlyInterest,
                principal: yearlyPrincipal
            });
        }
        
        this.renderAmortizationChart(chartBars);
        this.renderAmortizationTable(tableRows);
    }

    renderAmortizationChart(data) {
        const maxTotal = Math.max(...data.map(d => d.total));
        const chartContainer = this.amortizationChart.querySelector('.chart-bars');
        
        data.forEach(item => {
            const barHeight = (item.total / maxTotal) * 100;
            const interestHeight = (item.interest / item.total) * 100;
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = barHeight + '%';
            bar.title = `År ${item.year}: ${this.formatCurrency(item.total)} totalt`;
            
            // Create gradient effect for interest vs principal
            bar.style.background = `linear-gradient(
                to top, 
                var(--primary-color) 0%, 
                var(--primary-color) ${interestHeight}%, 
                var(--secondary-color) ${interestHeight}%, 
                var(--secondary-color) 100%
            )`;
            
            const label = document.createElement('div');
            label.className = 'chart-bar-label';
            label.textContent = `År ${item.year}`;
            
            bar.appendChild(label);
            chartContainer.appendChild(bar);
        });
    }

    renderAmortizationTable(data) {
        const tbody = this.amortizationTable.querySelector('tbody');
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.year}</td>
                <td>${this.formatCurrency(item.remainingBalance)}</td>
                <td>${this.formatCurrency(item.interest)}</td>
                <td>${this.formatCurrency(item.principal)}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('no-NO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' kr';
    }

    formatPercentage(amount) {
        return new Intl.NumberFormat('no-NO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + '%';
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ForbrukslanKalkulator();
});

// Add service worker for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
