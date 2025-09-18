import data from './timetable.json' with { type: 'json' }; 
import { header } from './header.js';
import { dashboard } from './dashboard.js';

const mainContainer = document.getElementById('main');
header.init(mainContainer, data);

const contentNode = document.createElement('div');
contentNode.id = 'content';
mainContainer.appendChild(contentNode);

const render = (hash) => {
    contentNode.innerHTML = '';
    if (hash == '') {
        dashboard.init(contentNode, data);
    } else {
        const userName = hash.substring(1);
        contentNode.innerHTML += `<h1>Welcome, ${userName}</h1>`;
    }
}

render(window.location.hash);

window.onhashchange = () => render(window.location.hash);
