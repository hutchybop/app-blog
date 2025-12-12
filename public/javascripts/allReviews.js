/* global confirm */
document.addEventListener("DOMContentLoaded", function () {
  // Handle approve button confirmations
  const approveButtons = document.querySelectorAll(".approve-btn");
  approveButtons.forEach(function (button) {
    button.addEventListener("click", function (e) {
      if (!confirm("Approve this review?")) {
        e.preventDefault();
        return false;
      }
    });
  });

  // Fix aria-hidden focus issue with modals
  const modals = document.querySelectorAll(".modal");
  modals.forEach(function (modal) {
    modal.addEventListener("hide.bs.modal", function () {
      // Clear focus from any focused element within modal before hiding
      const activeElement = document.activeElement;
      if (activeElement && modal.contains(activeElement)) {
        activeElement.blur();
      }
    });

    modal.addEventListener("hidden.bs.modal", function () {
      // Ensure no element within modal has focus after it's hidden
      const modalElements = modal.querySelectorAll(
        "button, input, textarea, select, a",
      );
      modalElements.forEach(function (element) {
        if (element === document.activeElement) {
          element.blur();
        }
      });
    });
  });
});
