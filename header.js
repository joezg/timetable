export const header = {
    init: function(container, users, options = {}) {
        const route = options.route || '';
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const existingHeader = container.querySelector('header');
        if (existingHeader) {
            existingHeader.remove();
        }

        const buildHash = (userName = '') => {
            const hashValue = (() => {
                if (!route) {
                    return userName ? `#${encodeURIComponent(userName)}` : '#';
                }
                return userName
                    ? `#${encodeURIComponent(route)}/${encodeURIComponent(userName)}`
                    : `#${encodeURIComponent(route)}`;
            })();

            // Keep links anchored to current page path (e.g. /timetable/) on GitHub Pages.
            return `${currentPath}${hashValue}`;
        };

        const headerElement = document.createElement('header');
        
        const navElement = document.createElement('nav');
        const dashboardLink = navElement.appendChild(document.createElement('a'));
        dashboardLink.href = buildHash();
        dashboardLink.textContent = 'Dashboard';
        dashboardLink.className = 'nav-dashboard';
        dashboardLink.dataset.navType = 'dashboard';

        users.forEach(user => {
            const userLink = document.createElement('a');
            userLink.href = buildHash(user.name);
            userLink.textContent = user.name;
            userLink.className = 'nav-user';
            userLink.dataset.userName = user.name;
            navElement.appendChild(userLink);
        });

        headerElement.appendChild(navElement);

        container.prepend(headerElement);
        this.updateSelectedNav('', users);
        this.changeHeaderColor('#525252'); // Change to desired color
    },
    updateSelectedNav: function(userName, users) {
        const navLinks = document.querySelectorAll('header nav a');
        navLinks.forEach(link => {
            link.classList.remove('selected');
        });
        if (!userName) {
            const dashboardLink = document.querySelector('header nav a.nav-dashboard');
            if (dashboardLink) dashboardLink.classList.add('selected');
        } else {
            users.forEach(user => {
                if (user.name === userName) {
                    const userLink = document.querySelectorAll('header nav a.nav-user');
                    userLink.forEach((link) => {
                        if (link.dataset.userName === user.name) {
                            link.classList.add('selected');
                        }
                    });
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