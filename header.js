export const header = {
    init: function(container, users) {
        const headerElement = document.createElement('header');
        
        const navElement = document.createElement('nav');
        const dashboardLink = navElement.appendChild(document.createElement('a'));
        dashboardLink.href = '#';
        dashboardLink.textContent = 'Dashboard';

        users.forEach(user => {
            const userLink = document.createElement('a');
            userLink.href = `#${user.name}`;
            userLink.textContent = user.name;
            navElement.appendChild(userLink);
        });

        headerElement.appendChild(navElement);

        container.appendChild(headerElement);
    }
}