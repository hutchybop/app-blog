// Cookie alert - for first time visits
// User has to clear the alert for it not to show on every page
const cookieAlert = document.getElementById("cookieAlert");
const cookieAlertBtn = document.getElementById("cookieAlertBtn");

// Check if user has already accepted cookies
let cookieAlertCheck = localStorage.getItem("hasVisited");
if (!cookieAlertCheck) {
  cookieAlert.style.display = "block";
} else {
  cookieAlert.style.display = "none";
}

// Handle cookie acceptance
cookieAlertBtn.addEventListener("click", () => {
  localStorage.setItem("hasVisited", "true");
  // Manually hide the alert with Bootstrap's alert dismissal
  // eslint-disable-next-line no-undef
  const bsAlert = new bootstrap.Alert(cookieAlert);
  bsAlert.close();
});
