import { header } from './header.js';
import { dashboard } from './dashboard.js';
import { timetable } from './timetable.js';
import { appConfig } from './config.js';

const mainContainer = document.getElementById('main');

const normalizePath = (pathname) => pathname.replace(/^\/+|\/+$/g, '');

const getDefaultTimetable = () => appConfig.timetables.find((item) => !item.route) || appConfig.timetables[0];

const getTimetableFromPath = (pathname) => {
    const defaultTimetable = getDefaultTimetable();
    const normalizedPath = normalizePath(pathname);

    if (!normalizedPath) {
        return defaultTimetable;
    }

    const routeSegment = normalizedPath.split('/')[0];
    const matched = appConfig.timetables.find((item) => item.route === routeSegment);
    return matched || defaultTimetable;
};

const getBasePath = (timetableConfig) => {
    if (!timetableConfig.route) {
        return '/';
    }
    return `/${timetableConfig.route}/`;
};

const loadTimetableData = async (timetableConfig) => {
    const jsonUrl = new URL(timetableConfig.json, import.meta.url);
    const response = await fetch(jsonUrl);

    if (!response.ok) {
        throw new Error(`Failed to load timetable JSON from ${timetableConfig.json}`);
    }

    return response.json();
};

const parseHashUserName = (hash) => {
    if (!hash || hash === '#') {
        return '';
    }

    try {
        return decodeURIComponent(hash.substring(1));
    } catch (_error) {
        return hash.substring(1);
    }
};

const timetableConfig = getTimetableFromPath(window.location.pathname);
const data = await loadTimetableData(timetableConfig);

header.init(mainContainer, data, {
    basePath: getBasePath(timetableConfig)
});

const contentNode = document.createElement('div');
contentNode.id = 'content';
mainContainer.appendChild(contentNode);

const render = (hash) => {
    contentNode.innerHTML = '';

    if (!hash || hash === '#') {
        dashboard.init(contentNode, data);
        header.changeHeaderColor('#525252');
        header.updateSelectedNav('', data);
    } else {
        const userName = parseHashUserName(hash);
        const userData = data.find(u => u.name === userName);

        if (!userData) {
            dashboard.init(contentNode, data);
            header.changeHeaderColor('#525252');
            header.updateSelectedNav('', data);
            return;
        }

        timetable.init(contentNode, userData);
        header.changeHeaderColor(userData.color);
        header.updateSelectedNav(hash, data);
    }
}

render(window.location.hash);

window.onhashchange = () => render(window.location.hash);
