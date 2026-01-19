// Add light interactivity using JavaScript
// Reveal the hero section on scroll or click event
const hero = document.querySelector('.hero');
hero.addEventListener('scroll', () => {
  if (window.scrollY > window.innerHeight / 2) {
    hero.classList.add('reveal');
  }
});
