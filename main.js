// Smooth scroll and page navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    
    // Update active navigation link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    this.classList.add('active');
    
    // Hide all page sections
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show selected page section
    const targetId = this.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Smooth scroll
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Initialize home page as active
document.getElementById('home').classList.add('active');