export const header = {
    init: function(container, users) {
        const headerElement = document.createElement('header');
        
        const navElement = document.createElement('nav');
        const dashboardLink = navElement.appendChild(document.createElement('a'));
        dashboardLink.href = '#';
        dashboardLink.textContent = 'Dashboard';
        dashboardLink.className = 'nav-dashboard';

        users.forEach(user => {
            const userLink = document.createElement('a');
            userLink.href = `#${user.name}`;
            userLink.textContent = user.name;
            userLink.className = 'nav-user';
            navElement.appendChild(userLink);
        });

        headerElement.appendChild(navElement);

        container.appendChild(headerElement);
        this.updateSelectedNav(window.location.hash, users);
        this.changeHeaderColor('#525252'); // Change to desired color
    },
    updateSelectedNav: function(hash, users) {
        const navLinks = document.querySelectorAll('header nav a');
        navLinks.forEach(link => {
            link.classList.remove('selected');
        });
        if (!hash || hash === '#') {
            const dashboardLink = document.querySelector('header nav a.nav-dashboard');
            if (dashboardLink) dashboardLink.classList.add('selected');
        } else {
            const userName = hash.substring(1);
            users.forEach(user => {
                if (user.name === userName) {
                    const userLink = document.querySelector(`header nav a[href="#${user.name}"]`);
                    if (userLink) userLink.classList.add('selected');
                }
            });
        }
    },
    changeHeaderColor: function(color) {
        const nav = document.querySelector('header nav');
        if (nav) {
            nav.style.setProperty('--color', color);
        }
    }
}