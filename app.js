const reveals = document.querySelectorAll('.hero, .stripe, .modes, .waitlist');

reveals.forEach((el) => {
  el.classList.add('reveal');
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.2 }
);

reveals.forEach((el) => observer.observe(el));

const form = document.getElementById('waitlist-form');
const msg = document.getElementById('form-message');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!email) return;
  msg.textContent = `Locked in. We’ll ping ${email} with your access window.`;
  form.reset();
});

document.querySelectorAll('[data-scroll]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.querySelector(btn.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
