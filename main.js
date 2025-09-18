import data from './timetable.json' with { type: 'json' }; 
import { header } from './header.js';
import { dashboard } from './dashboard.js';
import { timetable } from './timetable.js';

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
        timetable.init(contentNode, data.find(u => u.name === userName));
    }
}

render(window.location.hash);

window.onhashchange = () => render(window.location.hash);
