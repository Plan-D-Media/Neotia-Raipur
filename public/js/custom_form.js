// reCAPTCHA v3 site key, set by the server from RECAPTCHA_SITE_KEY (views/partials/header.ejs)
const RECAPTCHA_SITE_KEY = (window.NEOTIA_CONFIG && window.NEOTIA_CONFIG.recaptchaSiteKey) || '';


$(document).ready(function(){

  $('.select_department').change(function(){
    var deptId = $(this).val();
    var target = $(this).data('target'); // which doctor select to update

    
    if(deptId){
        $(target).html('<option>Loading...</option>');
      $.ajax({
        url: '/form-sub/get_doctors.php',
        type: 'POST',
        // data-doctors="matched" (speciality pages): "Any Doctor" + only that department's doctors
        data: $(this).data('doctors') === 'matched' ? {department_id: deptId, matched_only: 1} : {department_id: deptId},
        success: function(data){
          $(target).html(data); // update correct doctor select box
        }
      });
    } else {
      $(target).html('<option value="">Select Doctor</option>');
    }
  });
});


// Ensure jQuery and Bootstrap are loaded before this
  document.addEventListener("DOMContentLoaded", function () {

 /* book_appointment_form_step_1 form start */
const book_appointment_form_step_1 = document.getElementById("book-appointment-form-step-1");
if (book_appointment_form_step_1) {
book_appointment_form_step_1.addEventListener("submit", function (event) {
    event.preventDefault();

    document.getElementById("loading_appointment_img").style.display = "inline"; // equivalent to .show()
    document.getElementById("mess_appointment").innerHTML = "";
    document.getElementById("appointsubmitTriger").disabled = true;

    grecaptcha.ready(function () {
        grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' }).then(function (token) {
            var recaptchaResponse = document.getElementById('recaptchaResponse');
            recaptchaResponse.value = token;

            // Get form
            var form = document.getElementById("book-appointment-form-step-1");

            // Create a FormData object
            var data = new FormData(form);
            var URL = '/form-sub/book_appointment_submit_step.php';

            fetch(URL, {
                method: "POST",
                body: data,
                cache: "no-cache",
            })
            .then(response => response.json())
            .then(response => {
                document.getElementById("loading_appointment_img").style.display = "none";
                document.getElementById("appointsubmitTriger").disabled = false;

                if (response.rettype === 'error') {
                    document.getElementById("mess_appointment").innerHTML = "<div class='alert alert-danger'>" + response.retmessage + "</div>";
                }

                if (response.rettype === 'success') {
                    document.getElementById('booking-step-1').style.display = 'none';
                    document.getElementById('booking-step-2').style.display = 'block';

                    // Update progress indicator
                    var ind1 = document.getElementById('step-indicator-1');
                    var ind2 = document.getElementById('step-indicator-2');
                    ind1.classList.remove('active');
                    ind1.classList.add('done');
                    ind1.querySelector('.step-dot').innerHTML = '&#10003;';
                    ind2.classList.add('active');
                }
            })
            .catch(error => {
                console.error("ERROR :", error);
                document.getElementById("appointsubmitTriger").disabled = false;
            });
        });
     });
});
}
/* book_appointment_form_step_1 form end */   
/* book_appointment_form_step_2 form start */
const book_appointment_form_step_2 = document.getElementById("book-appointment-form-step-2");
if (book_appointment_form_step_2) {
book_appointment_form_step_2.addEventListener("submit", function (event) {
    event.preventDefault();

    document.getElementById("loading_appointment_img").style.display = "inline"; // equivalent to .show()
    document.getElementById("mess_appointment").innerHTML = "";
    document.getElementById("appointsubmitTriger_2").disabled = true;

    // Get form
            var form = document.getElementById("book-appointment-form-step-2");

            // Create a FormData object
            var data = new FormData(form);
            var URL = '/form-sub/book_appointment_submit_step.php';

            fetch(URL, {
                method: "POST",
                body: data,
                cache: "no-cache",
            })
            .then(response => response.json())
            .then(response => {
                document.getElementById("loading_appointment_img").style.display = "none";
                if (document.getElementById("appointsubmitTriger_2")) document.getElementById("appointsubmitTriger_2").disabled = false;
                if (document.getElementById("appointsubmitTriger")) document.getElementById("appointsubmitTriger").disabled = false;

                if (response.rettype === 'error') {
                    document.getElementById("mess_appointment").innerHTML = "<div class='alert alert-danger'>" + response.retmessage + "</div>";
                }

                if (response.rettype === 'success') {
                    window.location = '/thank-you-for-appointment';
                }
            })
            .catch(error => {
                console.error("ERROR :", error);
                if (document.getElementById("appointsubmitTriger_2")) document.getElementById("appointsubmitTriger_2").disabled = false;
                if (document.getElementById("appointsubmitTriger")) document.getElementById("appointsubmitTriger").disabled = false;
            });
});
}
/* book_appointment_form_step_2 form end */

/* pop book_appointment_form_step_1 form start */
// Global form submit handler using event delegation
    document.addEventListener("submit", function (event) {
  // Check if the submitted form is the one we want
  if (event.target && event.target.id === "book-appointment-form-pop-step-1") {
    event.preventDefault();

    const form = event.target;

    // Scope all selectors to the form itself
    const loadingImg = document.getElementById("loading_appointment_img_pop");
    const messageBox = document.getElementById("mess_appointment_pop");
    const submitBtn = form.querySelector("#getanappointment_pop");
    //const phoneField = form.querySelector("#phone");
    const recaptchaInput = form.querySelector("#recaptchaResponse_pop");

    // Show loading state
    loadingImg.style.display = "inline";
    messageBox.innerHTML = "";
    submitBtn.disabled = true;

    //Execute Google reCAPTCHA v3
    grecaptcha.ready(function () {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' }).then(function (token) {
        recaptchaInput.value = token;

        const formData = new FormData(form);

        fetch('/form-sub/book_appointment_submit_step.php', {
          method: "POST",
          body: formData,
          cache: "no-cache",
        })
        .then(response => response.json())
        .then(response => {
          loadingImg.style.display = "none";
          submitBtn.disabled = false;

          if (response.rettype === 'error') {
            messageBox.innerHTML = `<div class='alert alert-danger'>${response.retmessage}</div>`;
          }

          if (response.rettype === 'success') {
            document.getElementById('booking-step-1-pop').style.display = 'none';
                    document.getElementById('booking-step-2-pop').style.display = 'block';

                    // Update progress indicator
                    var ind1 = document.getElementById('step-indicator-1-pop');
                    var ind2 = document.getElementById('step-indicator-2-pop');
                    ind1.classList.remove('active');
                    ind1.classList.add('done');
                    ind1.querySelector('.step-dot').innerHTML = '&#10003;';
                    ind2.classList.add('active');
          }
        })
        .catch(error => {
          console.error("Submission Error:", error);
          loadingImg.style.display = "none";
          submitBtn.disabled = false;
          messageBox.innerHTML = "<div class='alert alert-danger'>An unexpected error occurred. Please try again.</div>";
        });
      });
    });
  }
});
 /* pop book_appointment_form_step_1 form end */

/* pop book_appointment_form_step_2 form start */
// Global form submit handler using event delegation
    document.addEventListener("submit", function (event) {
  // Check if the submitted form is the one we want
  if (event.target && event.target.id === "book-appointment-form-pop-step-2") {
    event.preventDefault();

    const form = event.target;

    // Scope all selectors to the form itself
    const loadingImg = document.getElementById("loading_appointment_img_pop");
    const messageBox = document.getElementById("mess_appointment_pop");
    const submitBtn = form.querySelector("#appointsubmitTriger_pop_2");
    //const phoneField = form.querySelector("#phone");
   // const recaptchaInput = form.querySelector("#recaptchaResponse_pop");

    // Show loading state
    loadingImg.style.display = "inline";
    messageBox.innerHTML = "";
    submitBtn.disabled = true;

   
        const formData = new FormData(form);

        fetch('/form-sub/book_appointment_submit_step.php', {
          method: "POST",
          body: formData,
          cache: "no-cache",
        })
        .then(response => response.json())
        .then(response => {
          loadingImg.style.display = "none";
          submitBtn.disabled = false;

          if (response.rettype === 'error') {
            messageBox.innerHTML = `<div class='alert alert-danger'>${response.retmessage}</div>`;
          }

          if (response.rettype === 'success') {
            form.reset();

            // Hide modal properly using Bootstrap API
            const modalEl = document.getElementById('enquiryModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }

            // Redirect to thank-you page
            window.location.href = '/thank-you-for-appointment';
          }
        })
        .catch(error => {
          console.error("Submission Error:", error);
          loadingImg.style.display = "none";
          submitBtn.disabled = false;
          messageBox.innerHTML = "<div class='alert alert-danger'>An unexpected error occurred. Please try again.</div>";
        });
    
      } 
});
 /* pop book_appointment_form_step_2 form end */


/* book_appointment_form form start */
const book_appointment_form = document.getElementById("book-appointment-form");
if (book_appointment_form) {
book_appointment_form.addEventListener("submit", function (event) {
    event.preventDefault();

    document.getElementById("loading_appointment_img").style.display = "inline"; // equivalent to .show()
    document.getElementById("mess_appointment").innerHTML = "";
    document.getElementById("appointsubmitTriger").disabled = true;

    //  Mobile number validation
    // const mobileInput = document.getElementById("phone").value.trim();
    // const mobileRegex = /^[6-9]\d{9}$/;

    // if (!mobileRegex.test(mobileInput)) {
    //     document.getElementById("mess_footer").innerHTML = "<span class='error'>Please enter a valid 10-digit mobile number.</span>";
    //     document.getElementById("loading_footer_img").style.display = "none";
    //     document.getElementById("submitBtn").disabled = false;
    //     return; //  Don't proceed if validation fails
    // }

    grecaptcha.ready(function () {
        grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' }).then(function (token) {
            var recaptchaResponse = document.getElementById('recaptchaResponse');
            recaptchaResponse.value = token;

            // Get form
            var form = document.getElementById("book-appointment-form");

            // Create a FormData object
            var data = new FormData(form);
            var URL = '/form-sub/book_appointment_submit.php';

            fetch(URL, {
                method: "POST",
                body: data,
                cache: "no-cache",
            })
            .then(response => response.json())
            .then(response => {
                document.getElementById("loading_appointment_img").style.display = "none";
                document.getElementById("appointsubmitTriger").disabled = false;

                if (response.rettype === 'error') {
                    document.getElementById("mess_appointment").innerHTML = "<div class='alert alert-danger'>" + response.retmessage + "</div>";
                }

                if (response.rettype === 'success') {
                    form.reset();
                    //document.getElementById("mess_footer").innerHTML = "<span class='success'>" + response.retmessage + "</span>";
                  //$('#myModal').modal('hide'); // Close the modal
                  // Close the modal
                    
                    window.location = '/thank-you-for-appointment';
                }
            })
            .catch(error => {
                console.error("ERROR :", error);
                document.getElementById("appointsubmitTriger").disabled = false;
            });
        });
    });
});
}
/* book_appointment_form form end */
/* pop book_appointment_form form start */
// Global form submit handler using event delegation
    document.addEventListener("submit", function (event) {
  // Check if the submitted form is the one we want
  if (event.target && event.target.id === "book-appointment-form-pop") {
    event.preventDefault();

    const form = event.target;

    // Scope all selectors to the form itself
    const loadingImg = form.querySelector("#loading_appointment_img_pop");
    const messageBox = form.querySelector("#mess_appointment_pop");
    const submitBtn = form.querySelector("#getanappointment_pop");
    //const phoneField = form.querySelector("#phone");
    const recaptchaInput = form.querySelector("#recaptchaResponse_pop");

    // Show loading state
    loadingImg.style.display = "inline";
    messageBox.innerHTML = "";
    submitBtn.disabled = true;

    // Validate mobile number
    // const mobileInput = phoneField.value.trim();
    // const mobileRegex = /^[6-9]\d{9}$/;

    // if (!mobileRegex.test(mobileInput)) {
    //   messageBox.innerHTML = "<span class='error'>Please enter a valid 10-digit mobile number.</span>";
    //   loadingImg.style.display = "none";
    //   submitBtn.disabled = false;
    //   return;
    // }

    //Execute Google reCAPTCHA v3
    grecaptcha.ready(function () {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' }).then(function (token) {
        recaptchaInput.value = token;

        const formData = new FormData(form);

        fetch('/form-sub/book_appointment_submit.php', {
          method: "POST",
          body: formData,
          cache: "no-cache",
        })
        .then(response => response.json())
        .then(response => {
          loadingImg.style.display = "none";
          submitBtn.disabled = false;

          if (response.rettype === 'error') {
            messageBox.innerHTML = `<div class='alert alert-danger'>${response.retmessage}</div>`;
          }

          if (response.rettype === 'success') {
            form.reset();

            // Hide modal properly using Bootstrap API
            const modalEl = document.getElementById('enquiryModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }

            // Redirect to thank-you page
            window.location.href = '/thank-you-for-appointment';
          }
        })
        .catch(error => {
          console.error("Submission Error:", error);
          loadingImg.style.display = "none";
          submitBtn.disabled = false;
          messageBox.innerHTML = "<div class='alert alert-danger'>An unexpected error occurred. Please try again.</div>";
        });
      });
    });
  }
});
 
/* pop book_appointment_form form end */



/* pop enquiry form start */
// Global form submit handler using event delegation
    document.addEventListener("submit", function (event) {
  // Check if the submitted form is the one we want
  if (event.target && event.target.id === "request-a-callback-pop") {
    event.preventDefault();

    const form = event.target;

    // Scope all selectors with safe fallbacks
    const loadingImg = form.querySelector("#loading_callback_img_pop") || document.getElementById("loading_callback_img_pop");
    const messageBox = form.querySelector("#mess_callback_pop") || document.getElementById("mess_callback_pop");
    const submitBtn = form.querySelector("#getancallback_pop") || document.getElementById("getancallback_pop");
    const phoneField = form.querySelector("#phone") || form.querySelector("input[name='phone']");
    const recaptchaInput = form.querySelector("#recaptchaResponse_callback") || form.querySelector("#recaptchaResponse_pop") || form.querySelector("input[name='recaptchaResponse']");

    // Show loading state safely
    if (loadingImg) loadingImg.style.display = "inline";
    if (messageBox) messageBox.innerHTML = "";
    if (submitBtn) submitBtn.disabled = true;

    // Validate mobile number (10 digits)
    const mobileInput = phoneField ? phoneField.value.trim() : "";
    const mobileRegex = /^[0-9]{10}$/;

    if (!mobileRegex.test(mobileInput)) {
      if (messageBox) messageBox.innerHTML = "<div class='alert alert-warning py-2 mb-2'><i class='fas fa-exclamation-triangle me-1'></i> Please enter a valid 10-digit mobile number.</div>";
      if (loadingImg) loadingImg.style.display = "none";
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    function doSubmit(token) {
      if (recaptchaInput) recaptchaInput.value = token || 'token_verified';

      const formData = new FormData(form);

      fetch('/form-sub/enquiry_submit.php', {
        method: "POST",
        body: formData,
        cache: "no-cache",
      })
      .then(response => response.json())
      .then(response => {
        loadingImg.style.display = "none";
        submitBtn.disabled = false;

          if (response.rettype === 'error') {
            messageBox.innerHTML = `<div class='alert alert-danger'>${response.retmessage}</div>`;
          }

          if (response.rettype === 'success') {
            form.reset();

            // Hide modal properly using Bootstrap API
            const modalEl = document.getElementById('requestcallback');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }

            // Redirect to thank-you page
            window.location.href = '/thank-you-for-enquiry';
          }
        })
        .catch(error => {
          console.error("Submission Error:", error);
          loadingImg.style.display = "none";
          submitBtn.disabled = false;
          messageBox.innerHTML = "<div class='alert alert-danger'>An unexpected error occurred. Please try again.</div>";
        });
    }

    if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
      grecaptcha.ready(function () {
        grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
          .then(doSubmit)
          .catch(function () { doSubmit('fallback_token'); });
      });
    } else {
      doSubmit('fallback_token');
    }
  }
});
 
/* pop enquiry form end */

});

