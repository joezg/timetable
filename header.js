export const header = {
    init: function(container, users, options = {}) {
        const basePath = options.basePath || '/';
        const headerElement = document.createElement('header');
        
        const navElement = document.createElement('nav');
        const dashboardLink = navElement.appendChild(document.createElement('a'));
        dashboardLink.href = `${basePath}#`;
        dashboardLink.textContent = 'Dashboard';
        dashboardLink.className = 'nav-dashboard';
        dashboardLink.dataset.navType = 'dashboard';

        users.forEach(user => {
            const userLink = document.createElement('a');
            userLink.href = `${basePath}#${encodeURIComponent(user.name)}`;
            userLink.textContent = user.name;
            userLink.className = 'nav-user';
            userLink.dataset.userName = user.name;
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
            let userName = hash.substring(1);
            try {
                userName = decodeURIComponent(userName);
            } catch (_error) {
                // Keep raw value if hash is not valid URI encoded data.
            }

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