



const header = document.getElementById("mainHeader");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("fixed");
  } else {
    header.classList.remove("fixed");
  }
});





// content tabs 
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
let activeId = 'tab1'; // current open panel id
const DURATION = 350;  // keep in sync with CSS (.35s)

function showTab(targetId) {
  if (targetId === activeId) return;

  // Buttons ARIA state
  tabs.forEach(btn => btn.setAttribute('aria-selected', btn.getAttribute('aria-controls') === targetId ? 'true' : 'false'));

  const oldPanel = document.getElementById(activeId);
  const newPanel = document.getElementById(targetId);

  // Prepare the incoming panel (make it participate in the flow, but start transparent)
  newPanel.classList.add('active');
  newPanel.classList.remove('fade-in');

  // Force next paint so the opacity transition runs reliably
  requestAnimationFrame(() => {
    // Start transitions
    oldPanel.classList.remove('fade-in'); // fades OUT (opacity -> 0)
    newPanel.classList.add('fade-in');    // fades IN  (opacity -> 1)
  });

  // After fade completes, fully hide the old panel
  setTimeout(() => {
    oldPanel.classList.remove('active');
  }, DURATION);

  activeId = targetId;
}

tabs.forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.getAttribute('aria-controls')));
  btn.addEventListener('keydown', e => {        // arrow-key navigation (optional)
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = [...tabs].indexOf(document.activeElement);
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    showTab(tabs[next].getAttribute('aria-controls'));
  });
});



$(".clientoo1").owlCarousel({
  dots: false,
  nav: false,
  navText: [
    '<i class="fas fa-angle-left"></i>',
    '<i class="fas fa-angle-right"></i>'
  ],
  margin: 20,
  responsiveClass: true,
  autoplay: true,
  autoplaySpeed: 1000,
  smartSpeed: 1500,
  slideSpeed: 4000,
  loop: true,
  items: 4,
  responsive: {
    0: {
      items: 2,
      stagePadding: 0,
      margin: 10,
    },
    300: {
      items: 2,
      stagePadding: 0,
      margin: 10,
    },
    480: {
      items: 2,
      stagePadding: 0,
      margin: 10,
    },
    600: {
      items: 2,
      stagePadding: 0,
      margin: 10,
    },
    900: {
      items: 4
    }
  }
});

$(document).ready(function () {

    var total = $(".doctors-area .doctors-item").length;
    var showItems = total < 4 ? total : 4;

    $(".doctors-area").owlCarousel({
        dots: false,
        nav: false,
        margin: 20,
        autoplay: true,
        autoplaySpeed: 900,
        smartSpeed: 1200,
        loop: total > 4,

        responsive: {
            0:   { items: 1 },
            480: { items: 1 },
            600: { items: 2 },
            768: { items: 3 },
            992: { items: showItems }
        }
    });

});


$(".sec00-doctor").owlCarousel({
  dots: true,
  nav: false,
  navText: [
    '<i class="fas fa-angle-left"></i>',
    '<i class="fas fa-angle-right"></i>'
  ],
  margin: 0,
  responsiveClass: true,
  autoplay: true,
  autoplaySpeed: 1000,
  smartSpeed: 1500,
  slideSpeed: 4000,
  loop: true,
  items: 4,
  responsive: {
    0: {
      items: 1,
      stagePadding: 0,
      margin: 5,
    },
    300: {
      items: 1,
      stagePadding: 0,
      margin: 5,
    },
    480: {
      items: 1,
      stagePadding: 0,
      margin: 5,
    },
    600: {
      items: 2,
      stagePadding: 0,
       margin: 5
    },
    900: {
      items: 3,
      margin: 10
    },
    1000: {
      items: 3
    }
  }
});


var $doctorCarousel = $(".sec00-doctorwp");
var doctorCount = $doctorCarousel.find(".item").length;
var maxItems = 3;

$doctorCarousel.owlCarousel({
  items: Math.min(doctorCount, maxItems),
  margin: 30,
  autoplay: true,
  autoplayTimeout: 3000,
  autoplayHoverPause: true,
  autoplaySpeed: 1000,
  smartSpeed: 1500,
  loop: doctorCount > maxItems,
  dots: doctorCount > maxItems,
  nav: false,
  autoWidth: false,
  center: false, // default

  responsive: {
    0: { items: Math.min(doctorCount, 1) },
    600: { items: Math.min(doctorCount, 2) },
    900: { items: Math.min(doctorCount, 3) }
  }
});

// FORCE LEFT ALIGNMENT
$doctorCarousel.on('initialized.owl.carousel resized.owl.carousel', function(event) {
  var stage = $(this).find('.owl-stage');
  stage.css('justify-content', 'flex-start'); // always align left
});







$(".testimonial-section").owlCarousel({
  items: 1,
  loop: true,
  margin: 20,
  nav: true,
  dots: false,
  autoplay: false,
  autoHeight: true,
  autoplayTimeout: 5000,
  autoplayHoverPause: true,
    responsive: {
    0: {
      items: 1,
      stagePadding: 0,
      autoHeight: false
    },
    300: {
      items: 1,
      stagePadding: 0,
      autoHeight: false
    },
    480: {
      items: 1,
      stagePadding: 0,
      autoHeight: false
    }
  }
});

$(".client-video-area").owlCarousel({
  items: 1,
  loop: true,
  margin: 20,
  nav: false,
  dots: true,
  autoplay: false,
  autoplayTimeout: 5000,
  autoplayHoverPause: true,
});

$(".whats-new-area").owlCarousel({
  loop: true,
  margin: 20,
  nav: false,
  dots: false,
  autoplay: true,
  autoplayTimeout: 4000,
  responsive: {
    0: {
      items: 1,
      dots: true
    },
    768: {
      items: 2
    },
    992: {
      items: 3
    }
  }
});

$(".area-card-about").owlCarousel({
  loop: true,
  margin: 20,
  nav: false,
  dots: true,
  autoplay: false,
  autoplayTimeout: 4000,
  responsive: {
    0: {
      items: 2,
      margin: 10
    },
    768: {
      items: 2
    },
    992: {
      items: 4
    }
  }
});


$(".research-area").owlCarousel({
  loop: true,
  margin: 10,
  nav: false,
  dots: true,
  autoplay: true,
  autoplayTimeout: 4000,
  responsive: {
    0: {
      items: 2,
      margin: 0,
      dots: false,
    },
    768: {
      items: 2
    },
    992: {
      items: 4
    }
  }
});


$(document).ready(function () {
  $(".media-carousel").owlCarousel({
    loop: true,
    margin: 30,
    nav: false,
    dots: false,
    autoplay: true,
    autoplayTimeout: 4000,
    autoplayHoverPause: true,
    smartSpeed: 800,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 1
      },
      992: {
        items: 2
      }
    }
  });
});



// about tabs
// function openAboutTab(evt, tabName) {
//   let i, panels, tablinks;

//   panels = document.getElementsByClassName("about-panel");
//   for (i = 0; i < panels.length; i++) {
//     panels[i].style.display = "none";
//   }

//   tablinks = document.getElementsByClassName("tab-link");
//   for (i = 0; i < tablinks.length; i++) {
//     tablinks[i].classList.remove("active");
//   }

//   document.getElementById(tabName).style.display = "block";
//   evt.currentTarget.classList.add("active");
// }


document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab-link");
  const panels = document.querySelectorAll(".about-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", function () {
      const targetId = tab.getAttribute("data-tab");

      if (!targetId) {
        console.warn("This tab has no data-tab attribute:", tab);
        return;
      }

      // Remove active class and hide all panels
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => (p.style.display = "none"));

      // Activate clicked tab
      tab.classList.add("active");

      // Show target panel
      const panel = document.getElementById(targetId);
      if (panel) {
        panel.style.display = "block";
      } else {
        console.error("No panel found with ID:", targetId);
      }
    });
  });
});


jQuery(function ($) {

  // Function which adds the 'animated' class to any '.animatable' in view
  var doAnimations = function () {

    var offset = $(window).scrollTop() + $(window).height(),
      $animatables = $('.animatable');

    // Unbind scroll handler if we have no animatables
    if ($animatables.length == 0) {
      $(window).off('scroll', doAnimations);
    }

    // Check all animatables and animate them if necessary
    $animatables.each(function (i) {
      var $animatable = $(this);
      if ($animatable.offset().top < offset - 10) {
        $animatable.removeClass('animatable').addClass('animated');
      }
    });

  };

  // Hook doAnimations on scroll, and trigger a scroll
  $(window).on('scroll', doAnimations);
  $(window).trigger('scroll');

});


// JavaScript
const menuBar = document.querySelector(".menu-bar");
const closeMenu = document.querySelector(".close-menu");
const nav = document.querySelector(".navbar-nav-mobile");

menuBar.addEventListener("click", function () {
  nav.classList.add("navbar-nav-open");
  closeMenu.style.display = "block";
});

closeMenu.addEventListener("click", function () {
  nav.classList.remove("navbar-nav-open");
  closeMenu.style.display = "none";
});


document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".dropdown-toggle");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();

      const parentLi = this.closest(".nav-item");
      const dropdown = parentLi.querySelector(".dropdown");

      // Close other dropdowns at the same level
      const siblings = parentLi.parentElement.querySelectorAll(".dropdown.show");
      siblings.forEach(sib => {
        if (sib !== dropdown) {
          sib.classList.remove("show");
          sib.closest(".nav-item")?.querySelector(".dropdown-toggle")
             ?.classList.remove("rotate");
        }
      });

      // Toggle current dropdown
      dropdown.classList.toggle("show");
      this.classList.toggle("rotate");
    });
  });
});


// ===== SMOOTH FAQ ACCORDION =====
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.closest('.faq-item');
    const content = item.querySelector('.collapse');
    const isOpen = content.classList.contains('show');

    // Close others
    document.querySelectorAll('.faq-item').forEach(faq => {
      const c = faq.querySelector('.collapse');
      const q = faq.querySelector('.faq-question');
      if (faq !== item) {
        c.style.height = 0;
        c.classList.remove('show');
        q.classList.remove('active');
      }
    });

    // Toggle current
    if (!isOpen) {
      content.classList.add('show');
      question.classList.add('active');
      const contentHeight = content.scrollHeight + 'px';
      content.style.height = contentHeight;
    } else {
      content.style.height = 0;
      content.classList.remove('show');
      question.classList.remove('active');
    }

    // Remove inline height after transition for clean behavior
    content.addEventListener(
      'transitionend',
      () => {
        if (content.classList.contains('show')) {
          content.style.height = 'auto';
        }
      },
      { once: true }
    );
  });
});

