// Terms and Conditions page specific JavaScript

// reCAPTCHA callback function - enables submit button when reCAPTCHA is verified
// eslint-disable-next-line no-unused-vars
function cb(token) {
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Initially disable submit button until reCAPTCHA is verified
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
  }
});
