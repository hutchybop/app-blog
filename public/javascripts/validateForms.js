(function () {
  "use strict";
  window.addEventListener(
    "load",
    function () {
      // Fetch all the forms we want to apply custom Bootstrap validation styles to
      const forms = document.getElementsByClassName("validated-form");
      // Loop over them and prevent submission
      Array.prototype.filter.call(forms, function (form) {
        // Check for password fields within this form
        const passwordInput = form.querySelector('input[name="password"]');
        const confirmInput = form.querySelector(
          'input[name="confirm_password"]',
        );

        function checkPasswordMatch() {
          const mismatchFeedback = document.getElementById("password-mismatch");
          const defaultFeedback = confirmInput.nextElementSibling;

          if (!confirmInput.value) {
            // Empty field - show default message
            confirmInput.setCustomValidity("");
            if (defaultFeedback) defaultFeedback.style.display = "block";
            if (mismatchFeedback) mismatchFeedback.style.display = "none";
          } else if (passwordInput.value !== confirmInput.value) {
            // Passwords don't match - show custom message
            confirmInput.setCustomValidity("Passwords do not match");
            if (defaultFeedback) defaultFeedback.style.display = "none";
            if (mismatchFeedback) mismatchFeedback.style.display = "block";
          } else {
            // Passwords match - clear all errors
            confirmInput.setCustomValidity("");
            if (defaultFeedback) defaultFeedback.style.display = "none";
            if (mismatchFeedback) mismatchFeedback.style.display = "none";
          }
        }

        // Add real-time validation if password fields exist (only after first submit attempt)
        let hasBeenSubmitted = false;
        if (passwordInput && confirmInput) {
          passwordInput.addEventListener("input", function () {
            if (hasBeenSubmitted) {
              checkPasswordMatch();
            }
          });
          confirmInput.addEventListener("input", function () {
            if (hasBeenSubmitted) {
              checkPasswordMatch();
            }
          });
        }

        form.addEventListener(
          "submit",
          function (event) {
            // Set hasBeenSubmitted to true after first attempt
            hasBeenSubmitted = true;

            // Check password match before form validation
            if (passwordInput && confirmInput) {
              checkPasswordMatch();
            }
            if (form.checkValidity() === false) {
              event.preventDefault();
              event.stopPropagation();
            }
            form.classList.add("was-validated");
          },
          false,
        );
      });
    },
    false,
  );
})();
