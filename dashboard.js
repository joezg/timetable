import { pluralizeHours, pluralizeMinutes } from "./utils.js";

export const dashboard = {
    getToday: function() {
        return new Date();
    },
    renderCurrentDate: function() {
        // Add today's date as a header with just day name and date
        const today = this.getToday();
        const dayNames = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
        const dayName = dayNames[today.getDay()];
        const dateElement = document.createElement('h1');
        dateElement.className = 'dashboard-date';
        const formattedTime = today.toLocaleTimeString('hr-hr', { hour: '2-digit', minute: '2-digit' });
        dateElement.textContent = `${dayName}, ${today.toLocaleDateString("hr-hr")} ${formattedTime}`;
        this.dashboardElement.appendChild(dateElement);
    },
    getCurrentShift: function(user) {
        const today = this.getToday();
        let currentShift = null
        if (user.start && user.startingShift) {
            const startDate = new Date(user.start);
            const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            const weekNumber = Math.floor(daysPassed / 7);
            currentShift = user.startingShift;
            if (weekNumber % 2 === 1) {
                currentShift = user.startingShift === 'morning' ? 'afternoon' : 'morning';
            }
        }

        return currentShift;
    },
    renderUser: function(user) {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        const today = this.getToday();

        const userName = document.createElement('h2');
        userName.textContent = user.name;
        userCard.appendChild(userName);

        // Add current shift to user card
        const currentShift = this.getCurrentShift(user);
        const shiftElement = document.createElement('div');
        shiftElement.className = 'user-shift';
        shiftElement.textContent = `Trenutna smjena: ${currentShift === 'morning' ? 'jutarnja' : 'poslijepodnevna'}`;
        userCard.appendChild(shiftElement);

        //tametable can be in chunks (i.e. there is a gap between classes)
        //find the current chunk, if any
        //find the previous chunk, if any
        //find the next chunk if any
        let currentChunk = null;
        let previousChunk = null;
        let nextChunk = null;
        let currentClass = null;
        let shiftData = null;
        const futureChunks = [];

        if (currentShift && user.shifts && user.hours) {
            const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const todayEn = dayNamesEn[today.getDay()];
            shiftData = user.shifts[currentShift]?.[todayEn];

            if (shiftData) {
                const now = today.getHours() + today.getMinutes() / 60;
                let chunks = [];
                let chunk = [];
                let lastEnd = null;

                // Build chunks (continuous blocks of hours, skip optional and notAttending)
                for (const hourKey of Object.keys(shiftData)) {
                    const hourInfo = user.hours[hourKey];
                    const hourStatus = shiftData[hourKey]?.status;
                    if (hourInfo && hourStatus !== 'optional' && hourStatus !== 'notAttending') {
                        const [startH, startM] = hourInfo.start.split(':').map(Number);
                        const [endH, endM] = hourInfo.end.split(':').map(Number);
                        const startTime = startH + startM / 60;
                        const endTime = endH + endM / 60;

                        if (lastEnd !== null && startTime - lastEnd > 0.6) {
                            // Gap detected, push previous chunk
                            if (chunk.length) chunks.push(chunk);
                            chunk = [];
                        }
                        chunk.push({ hourKey, startTime, endTime, hourInfo });
                        lastEnd = endTime;
                    }
                }
                if (chunk.length) chunks.push(chunk);

                // Find current, previous, next chunk
                for (let i = 0; i < chunks.length; i++) {
                    const c = chunks[i];
                    const chunkStart = c[0].startTime;
                    const chunkEnd = c[c.length - 1].endTime;
                    if (now >= chunkStart && now <= chunkEnd) {
                        currentChunk = c;
                        previousChunk = i > 0 ? chunks[i - 1] : null;
                    } else if (now < chunkStart) {
                        futureChunks.push(c);
                    } else {
                        previousChunk = c;
                    }
                }

                nextChunk = futureChunks.length > 0 ? futureChunks[0] : null;

                // Find currentClass (even if optional)
                for (const hourKey of Object.keys(shiftData)) {
                    const hourInfo = user.hours[hourKey];
                    if (hourInfo) {
                        const [startH, startM] = hourInfo.start.split(':').map(Number);
                        const [endH, endM] = hourInfo.end.split(':').map(Number);
                        const startTime = startH + startM / 60;
                        const endTime = endH + endM / 60;
                        if (now >= startTime && now <= endTime) {
                            currentClass = { hourKey, startTime, endTime, hourInfo, status: shiftData[hourKey]?.status };
                            break;
                        }
                    }
                }
            }
        }

        let userStatusText = 'N/A';
        let userStatus = "atHome";
        if (currentChunk) {
            userStatusText = 'U školi';
            userStatus = "atSchool";
        } else if (previousChunk) {
            const lastHour = previousChunk[previousChunk.length - 1];
            const schoolEnd = lastHour.hourInfo.end;
            userStatusText = `Škola gotova od ${schoolEnd}`;
        } else {
            userStatusText = 'Kod kuće';
        }
        // If at home and currentClass exists and is optional, write it down
        if (userStatus == "atHome" && currentClass && currentClass.status === 'optional') {
            const className = shiftData[currentClass.hourKey].subjects.map(subject => subject.name).join(', ');
            userStatusText += ` (opcionalno: ${className} ${currentClass.hourInfo.start}-${currentClass.hourInfo.end})`;
        }
        const statusElement = document.createElement('div');
        statusElement.className = 'user-status';
        statusElement.textContent = `Status: ${userStatusText}`;
        userCard.appendChild(statusElement);

        let schoolTimeText = null;
        if (currentChunk) {
            const chunkEnd = currentChunk[currentChunk.length - 1].hourInfo.end;
            schoolTimeText = `Škola završava u: ${chunkEnd}`;
        } else if (nextChunk) {
            const schoolStart = nextChunk[0].hourInfo.start;

            let label = "Škola počinje"
            if (previousChunk) {
                label = "Sljedeći sat počinje";
            }

            // If school starts within 2 hours, show countdown
            const [startH, startM] = schoolStart.split(':').map(Number);
            const schoolStartTime = startH + startM / 60;
            const now = today.getHours() + today.getMinutes() / 60;
            const diff = schoolStartTime - now;
            if (diff > 0 && diff <= 2) {
                const totalMinutes = Math.round(diff * 60);
                if (totalMinutes >= 60) {
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    if (minutes === 0) {
                        schoolTimeText = `${label} za ${hours} ${pluralizeHours(hours)}`;
                    } else {
                        schoolTimeText = `${label} za ${hours} ${pluralizeHours(hours)} i ${minutes} ${pluralizeMinutes(minutes)}`;
                    }
                } else {
                    schoolTimeText = `${label} za ${totalMinutes} ${pluralizeMinutes(totalMinutes)}`;
                }
            } else {
                schoolTimeText = `${label} u: ${schoolStart}`;
            }
        }
        const schoolTimeElement = document.createElement('div');
        schoolTimeElement.id = 'school-time';
        schoolTimeElement.textContent = schoolTimeText;
        userCard.appendChild(schoolTimeElement);

        //add gaps
        let current = currentChunk ? currentChunk : nextChunk;
        futureChunks.forEach(chunk => {
            if (chunk !== current) {
                const gapElement = document.createElement('div');
                gapElement.className = 'school-gap';
                const gapStart = current ? current[current.length - 1].hourInfo.end : null;
                const gapEnd = chunk[0].hourInfo.start;
                if (gapStart !== null && gapEnd !== null) {
                    gapElement.textContent = `Pauza: ${gapStart} - ${gapEnd}`;
                    userCard.appendChild(gapElement);
                }
                current = chunk;
            }
        });

        this.dashboardElement.appendChild(userCard);
    },

    init: function(container, data) {
        this.dashboardElement = document.createElement('div');
        this.dashboardElement.id = 'dashboard';

        this.renderCurrentDate();

        data.forEach(user => {
            this.renderUser(user);
        });

        container.appendChild(this.dashboardElement);
    }
}