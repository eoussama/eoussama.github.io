var
    headerEle = null,
    navbar = null;

window.addEventListener('load', () => {
    headerEle = document.getElementsByTagName('header')[0];
    navbar = document.querySelector('nav.navbar');
});

window.addEventListener('scroll', () => {
    if (window.scrollY === 0 && navbar.classList.contains('below')) {
        navbar.classList.remove('fadeOut');
        navbar.classList.remove('below');
        navbar.classList.add('above');
        navbar.classList.remove('dark');
        navbar.classList.add('gray');
    } else if (headerEle.offsetHeight < window.scrollY && navbar.classList.contains('above')) {
        navbar.classList.remove('above');
        navbar.classList.add('below');
        navbar.classList.remove('gray');
        navbar.classList.add('dark');
    } else if (headerEle.offsetHeight >= window.scrollY && navbar.classList.contains('below')) {
        console.log('fadeOut');
        navbar.classList.add('fadeOut');
        setTimeout(() => {
            navbar.classList.remove('fadeOut');
            navbar.classList.remove('below');
            navbar.classList.add('above');
            navbar.classList.remove('dark');
            navbar.classList.add('gray');
        }, 200);
    }
});