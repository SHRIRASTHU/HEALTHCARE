document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  loadTransactions();
});

async function loadTransactions() {
  const tbody = document.getElementById('transactionsTableBody');

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/transactions/my`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      renderTransactionsTable(data.transactions);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load transactions.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Server connection error.</td></tr>`;
  }
}

function renderTransactionsTable(transactions) {
  const tbody = document.getElementById('transactionsTableBody');

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="fas fa-receipt" style="font-size: 2.5rem; color: #CBD5E1; margin-bottom: 0.5rem; display: block;"></i>
          No transaction history recorded yet. <a href="/subscriptions.html" style="color: var(--primary); font-weight: 600;">Subscribe now</a>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(item => `
    <tr>
      <td><strong style="font-family: var(--font-heading);">${item.transactionId}</strong></td>
      <td>
        <span style="font-weight: 600; text-transform: uppercase; font-size: 0.85rem;">${item.subscription} Plan</span>
      </td>
      <td>
        <strong style="color: var(--primary);">₹${item.amount.toFixed(2)}</strong>
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">+ GST ₹${(item.tax || 0).toFixed(2)}</span>
      </td>
      <td>${item.paymentMethod || 'UPI / Card'}</td>
      <td>${new Date(item.date).toLocaleDateString()}</td>
      <td>
        <span class="badge ${item.paymentStatus === 'successful' ? 'badge-success' : item.paymentStatus === 'pending' ? 'badge-warning' : 'badge-danger'}">
          ${item.paymentStatus.toUpperCase()}
        </span>
      </td>
      <td>
        <button onclick="viewInvoice('${item.transactionId}', '${item.invoiceNumber}', ${item.amount}, '${item.subscription}')" class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
          <i class="fas fa-file-invoice"></i> Receipt
        </button>
      </td>
    </tr>
  `).join('');
}

function viewInvoice(txId, invNum, amount, plan) {
  Toast.show(`Viewing Receipt ${invNum} for ${plan.toUpperCase()} Plan (₹${amount})`, 'info');
}
