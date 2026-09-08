import { header } from './header.js';
import { dashboard } from './dashboard.js';
import { timetable } from './timetable.js';
import { appConfig } from './config.js';

const mainContainer = document.getElementById('main');
const contentNode = document.createElement('div');
contentNode.id = 'content';
mainContainer.appendChild(contentNode);

const normalizeHash = (hash) => hash.replace(/^#/, '').replace(/^\/+|\/+$/g, '');

const getDefaultTimetable = () => appConfig.timetables.find((item) => !item.route) || appConfig.timetables[0];

const getTimetableByRoute = (route) => {
    if (!route) {
        return null;
    }
    return appConfig.timetables.find((item) => (item.route || '').toLowerCase() === route.toLowerCase()) || null;
};

const decodeHashPart = (value) => {
    try {
        return decodeURIComponent(value);
    } catch (_error) {
        return value;
    }
};

const parseHashRoute = (hash) => {
    const defaultTimetable = getDefaultTimetable();
    const normalizedHash = normalizeHash(hash);

    if (!normalizedHash) {
        return {
            timetableConfig: defaultTimetable,
            userName: ''
        };
    }

    const hashParts = normalizedHash.split('/');
    const firstSegment = decodeHashPart(hashParts[0]);
    const matchedTimetable = getTimetableByRoute(firstSegment);

    if (!matchedTimetable) {
        return {
            timetableConfig: defaultTimetable,
            userName: decodeHashPart(normalizedHash)
        };
    }

    const userPart = hashParts.length > 1 ? hashParts.slice(1).join('/') : '';
    return {
        timetableConfig: matchedTimetable,
        userName: decodeHashPart(userPart)
    };
};

const loadTimetableData = async (timetableConfig) => {
    const jsonUrl = new URL(timetableConfig.json, import.meta.url);
    const response = await fetch(jsonUrl);

    if (!response.ok) {
        throw new Error(`Failed to load timetable JSON from ${timetableConfig.json}`);
    }

    return response.json();
};

let activeTimetableRoute = null;
let activeData = [];
let renderToken = 0;

const render = (userName) => {
    contentNode.innerHTML = '';

    const normalizedUserName = userName.toLowerCase();

    if (!userName) {
        dashboard.init(contentNode, activeData);
        header.changeHeaderColor('#525252');
        header.updateSelectedNav('', activeData);
    } else {
        const userData = activeData.find(u => u.name.toLowerCase() === normalizedUserName);

        if (!userData) {
            dashboard.init(contentNode, activeData);
            header.changeHeaderColor('#525252');
            header.updateSelectedNav('', activeData);
            return;
        }

        timetable.init(contentNode, userData);
        header.changeHeaderColor(userData.color);
        header.updateSelectedNav(userData.name, activeData);
    }
};

const renderFromHash = async (hash) => {
    const token = ++renderToken;
    const routeState = parseHashRoute(hash);

    if (activeTimetableRoute !== routeState.timetableConfig.route) {
        const loadedData = await loadTimetableData(routeState.timetableConfig);
        if (token !== renderToken) {
            return;
        }

        activeData = loadedData;
        activeTimetableRoute = routeState.timetableConfig.route;

        header.init(mainContainer, activeData, {
            route: activeTimetableRoute
        });
    }

    render(routeState.userName);
};

await renderFromHash(window.location.hash);

window.onhashchange = () => {
    renderFromHash(window.location.hash);
};
