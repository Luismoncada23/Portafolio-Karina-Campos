// Configuración de Tailwind CSS para el portafolio
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "tertiary": "#d0bcff",
        "tertiary-fixed-dim": "#d0bcff",
        "on-primary": "#003640",
        "surface-container": "#1c1f29",
        "on-primary-fixed": "#001f26",
        "on-secondary-fixed-variant": "#005236",
        "outline": "#869397",
        "secondary-container": "#00a572",
        "on-primary-container": "#00424f",
        "tertiary-fixed": "#e9ddff",
        "outline-variant": "#3d494c",
        "surface-container-highest": "#31353f",
        "on-background": "#dfe2ef",
        "background": "#0f131c",
        "on-secondary-fixed": "#002113",
        "surface-dim": "#0f131c",
        "on-tertiary": "#3c0091",
        "surface-tint": "#4cd7f6",
        "primary-fixed-dim": "#4cd7f6",
        "error-container": "#93000a",
        "on-tertiary-fixed-variant": "#5516be",
        "on-tertiary-container": "#4900ae",
        "on-tertiary-fixed": "#23005c",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary-container": "#00311f",
        "surface-container-low": "#181b25",
        "inverse-surface": "#dfe2ef",
        "secondary-fixed": "#6ffbbe",
        "surface-container-high": "#262a34",
        "on-secondary": "#003824",
        "on-primary-fixed-variant": "#004e5c",
        "on-error": "#690005",
        "primary": "#4cd7f6",
        "on-error-container": "#ffdad6",
        "surface-variant": "#31353f",
        "primary-container": "#06b6d4",
        "tertiary-container": "#b395ff",
        "inverse-on-surface": "#2c303a",
        "primary-fixed": "#acedff",
        "secondary": "#4edea3",
        "error": "#ffb4ab",
        "inverse-primary": "#00687a",
        "surface-bright": "#353943",
        "on-surface-variant": "#bcc9cd",
        "surface": "#0f131c",
        "on-surface": "#dfe2ef",
        "surface-container-lowest": "#0a0e17"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "gutter": "1.5rem",
        "space-sm": "0.5rem",
        "margin-mobile": "1.25rem",
        "space-xl": "2.5rem",
        "gutter-mobile": "1rem",
        "space-lg": "1.5rem",
        "margin": "3rem",
        "space-xs": "0.25rem",
        "space-md": "1rem"
      },
      "fontFamily": {
        "label-md": ["Inter"],
        "headline-xl": ["Plus Jakarta Sans"],
        "body-lg": ["Inter"],
        "headline-lg": ["Plus Jakarta Sans"],
        "body-sm": ["Inter"],
        "label-sm": ["Inter"],
        "headline-lg-mobile": ["Plus Jakarta Sans"],
        "headline-md": ["Plus Jakarta Sans"],
        "headline-xl-mobile": ["Plus Jakarta Sans"],
        "headline-sm": ["Plus Jakarta Sans"],
        "title-lg": ["Plus Jakarta Sans"],
        "body-md": ["Inter"]
      },
      "fontSize": {
        "label-md": ["13px", { "lineHeight": "18px", "letterSpacing": "0.04em", "fontWeight": "600" }],
        "headline-xl": ["56px", { "lineHeight": "68px", "letterSpacing": "-0.03em", "fontWeight": "800" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "headline-lg": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-sm": ["13px", { "lineHeight": "20px", "fontWeight": "400" }],
        "label-sm": ["11px", { "lineHeight": "16px", "letterSpacing": "0.06em", "fontWeight": "600" }],
        "headline-lg-mobile": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "headline-xl-mobile": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "title-lg": ["18px", { "lineHeight": "26px", "fontWeight": "600" }],
        "body-md": ["15px", { "lineHeight": "24px", "fontWeight": "400" }]
      }
    }
  }
};

// Función para asegurar que Tailwind esté cargado correctamente
(function() {
  // Verificar si Tailwind está disponible
  if (typeof tailwind !== 'undefined') {
    console.log('Tailwind CSS configurado correctamente para el portafolio de Karina Campos');
    
    // Aplicar el tema oscuro por defecto
    document.documentElement.classList.add('dark');
  } else {
    console.warn('Tailwind CSS no se ha cargado correctamente. Verifica la conexión con CDN.');
  }
})();

// Funcionalidades adicionales para interactividad
document.addEventListener('DOMContentLoaded', function() {
  // Suavizar scroll a anclas
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  // Añadir clase activa a enlaces de navegación según scroll - FUNCIÓN MEJORADA
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('nav .nav-item');
    
    let currentActive = null;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionId = section.getAttribute('id');
      
      if (rect.top <= 120 && rect.bottom >= 120) {
        currentActive = sectionId;
      }
    });
    
    navItems.forEach(item => {
      const span = item.querySelector('span');
      const dataTarget = item.getAttribute('data-target');
      
      // Remover clases activas
      item.classList.remove('text-primary', 'border-primary');
      span.classList.remove('text-primary');
      
      // Agregar clase de texto normal para hover
      span.classList.add('text-on-surface-variant');
      
      if (dataTarget === currentActive) {
        // Sección activa - aplicar estilos
        item.classList.add('text-primary', 'border-primary');
        span.classList.remove('text-on-surface-variant');
        span.classList.add('text-primary');
      }
    });
  }

  // Llamar a la función al cargar y al hacer scroll
  updateActiveNavLink();
  window.addEventListener('scroll', updateActiveNavLink);
  window.portfolioUtils.updateActiveNavLink = updateActiveNavLink;

  // Mejorar accesibilidad para navegación por teclado
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', function() {
    document.documentElement.classList.remove('keyboard-navigation');
  });
});

// Funciones de utilidad
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    function() {
      console.log('Texto copiado al portapapeles:', text);
    },
    function(err) {
      console.error('Error al copiar texto:', err);
    }
  );
}

// Exportar funciones globales si es necesario
window.portfolioUtils = {
  copyToClipboard
};