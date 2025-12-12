/* global regAlert */
/* global regMsg */
const tncCheck = document.querySelector("#tncCheck");
const reg = document.querySelector("#reg");

reg.addEventListener("submit", function (e) {
  // BootStap client side form validation
  if (reg.checkValidity() === false) {
    e.preventDefault();
    e.stopPropagation();
  } else {
    // removes any alerts not closed
    regAlert.classList.add("regAlert");

    if (!tncCheck.checked) {
      e.preventDefault();
      regMsg.innerText = "You must accept the Terms and Conditions";
      regAlert.classList.remove("alert-warning", "alert-success", "regAlert");
      return regAlert.classList.add("alert-warning");
    }
  }
  // BootStap client side form validation
  reg.classList.add("was-validated");
});

// event listerner to remove alert if clicked once shown
regAlert.addEventListener("click", function () {
  regAlert.classList.add("regAlert");
});
