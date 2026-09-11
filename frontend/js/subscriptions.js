let selectedType = 'monthly';

document.addEventListener('DOMContentLoaded', () => {
  renderSubscriptionStatus();
});

function renderSubscriptionStatus() {
  const user = Auth.getUser();
  const bannerTitle = document.getElementById('currentSubTitle');
  const bannerExpiry = document.getElementById('currentSubExpiry');

  if (user && bannerTitle && bannerExpiry) {
    if (user.subscriptionStatus === 'active') {
      bannerTitle.innerText = `${user.subscriptionType.toUpperCase()} CARE PLAN ACTIVE 🎉`;
      const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : 'Active';
      bannerExpiry.innerText = `Your care membership is active until ${expiry}. Enjoy doctor consultations & chat.`;
    } else {
      bannerTitle.innerText = 'NO ACTIVE SUBSCRIPTION';
      bannerExpiry.innerText = 'Subscribe to a weekly, monthly, or yearly plan to unlock doctor consultations & chat.';
    }
  }
}

async function initiateCheckout(type) {
  if (!Auth.isAuthenticated()) {
    Toast.show('Please log in to purchase a subscription', 'warning');
    setTimeout(() => window.location.href = '/login.html', 1000);
    return;
  }

  selectedType = type;
  const submitBtn = document.getElementById('paySubmitBtn');
  if (submitBtn) submitBtn.disabled = false;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/subscriptions/create-order`, {
      method: 'POST',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ subscriptionType: type })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('summaryPlanName').innerText = data.order.planName;
      document.getElementById('summaryBasePrice').innerText = `₹${data.order.basePrice.toFixed(2)}`;
      document.getElementById('summaryTax').innerText = `₹${data.order.tax.toFixed(2)}`;
      document.getElementById('summaryTotalAmount').innerText = `₹${data.order.totalAmount.toFixed(2)}`;

      document.getElementById('checkoutModal').style.display = 'flex';
    } else {
      Toast.show(data.message || 'Error initializing order', 'error');
    }
  } catch (err) {
    Toast.show('Server connection error', 'error');
  }
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').style.display = 'none';
}

async function processSubscriptionPayment() {
  const paymentMethod = document.getElementById('payMethodSelect').value;
  const submitBtn = document.getElementById('paySubmitBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying Payment...`;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/subscriptions/process-payment`, {
      method: 'POST',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ subscriptionType: selectedType, paymentMethod })
    });

    const data = await res.json();

    if (data.success) {
      // Update local storage user state
      const user = Auth.getUser();
      if (user) {
        user.subscriptionStatus = 'active';
        user.subscriptionType = selectedType;
        user.subscriptionExpiry = data.user.subscriptionExpiry;
        Auth.setUser(user);
      }

      Toast.show('Payment Verified! Subscription Activated 🎉', 'success');
      closeCheckoutModal();
      renderSubscriptionStatus();

      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1200);
    } else {
      Toast.show(data.message || 'Payment verification failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Pay Securely Now';
    }
  } catch (err) {
    Toast.show('Server connection error during payment', 'error');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Pay Securely Now';
  }
}
