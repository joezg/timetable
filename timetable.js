export const timetable = {
    init: function(container, data) {
        this.timetableElement = document.createElement('div');
        this.timetableElement.id = 'timetable';
        container.appendChild(this.timetableElement);

        this.renderTimeTable(data);
    },
    renderShift: function(data, shift) {
        // Render a single shift timetable in a grid
        const timetableGrid = document.createElement('div');
        timetableGrid.className = 'timetable-grid';

        // Header row
        const days = ['Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak'];
        timetableGrid.appendChild(document.createElement('div')); // Empty top-left cell
        days.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.textContent = day;
            dayCell.className = 'timetable-day-header';
            timetableGrid.appendChild(dayCell);
        });

        // Find all hour keys
        let hourKeys = [];
        if (data && data.hours) {
            hourKeys = Object.keys(data.hours);
        }

        // filter hourKeys to trim hours from the beginning before any class in a shift
        if (data.shifts && data.shifts[shift]) {
            const usedHours = [];
            const dayMap = {
                'Ponedjeljak': 'monday',
                'Utorak': 'tuesday',
                'Srijeda': 'wednesday',
                'Četvrtak': 'thursday',
                'Petak': 'friday'
            };
            days.forEach(day => {
            const dayEn = dayMap[day];
            if (data.shifts[shift][dayEn]) {
                Object.keys(data.shifts[shift][dayEn]).forEach(hourKey => {
                    if (!usedHours.includes(hourKey)) {
                        usedHours.push(hourKey);
                    }
                });
            }
            });
            // Find min and max index in hourKeys
            const indices = usedHours.map(h => hourKeys.indexOf(h)).filter(i => i !== -1);
            if (indices.length > 0) {
                const minIdx = Math.min(...indices);
                const maxIdx = Math.max(...indices);
                hourKeys = hourKeys.slice(minIdx, maxIdx + 1);
            }

            hourKeys = hourKeys.filter(h => data.hours[h].shift === shift || !data.hours[h].shift);
        }

        // For each hour, render a row
        hourKeys.forEach(hourKey => {
            const hourInfo = data.hours[hourKey];

            const hourRow = document.createElement('div');
            hourRow.textContent = `${hourInfo.start} - ${hourInfo.end}`;
            hourRow.className = 'timetable-hour-row';
            timetableGrid.appendChild(hourRow);

            days.forEach(day => {
                // Map Croatian day to English
                const dayMap = {
                    'Ponedjeljak': 'monday',
                    'Utorak': 'tuesday',
                    'Srijeda': 'wednesday',
                    'Četvrtak': 'thursday',
                    'Petak': 'friday'
                };
                const dayEn = dayMap[day];
                let cell = document.createElement('div');
                cell.className = 'timetable-cell';
                let subjects = [];
                let isMandatory = false;
                let doesNotAttend = false;
                if (data.shifts && data.shifts[shift] && data.shifts[shift][dayEn] && data.shifts[shift][dayEn][hourKey]) {
                    subjects = data.shifts[shift][dayEn][hourKey].subjects || [];
                    if (data.shifts[shift][dayEn][hourKey].status === 'mandatory') {
                        isMandatory = true;
                    }

                    if (data.shifts[shift][dayEn][hourKey].status === 'notAttending') {
                        doesNotAttend = true;
                    }
                }
                if (subjects.length > 0) {
                    // Check if any subject is mandatory
                    if (isMandatory) {
                        cell.classList.add('mandatory-hour');
                    } else if (doesNotAttend) {
                        cell.classList.add('not-attending-hour');
                    }
                    cell.innerHTML = subjects.map(sub => `<div>${sub.name}${sub.room ? ' (' + sub.room + ')' : ''}</div>`).join('');
                } else {
                    cell.innerHTML = '';
                }
                timetableGrid.appendChild(cell);
            });
        });
        return timetableGrid;
    },

    renderTimeTable: function(data) {
        // Render both shifts
        const morningTitle = document.createElement('h2');
        morningTitle.textContent = 'Jutarnja smjena';
        this.timetableElement.appendChild(morningTitle);
        this.timetableElement.appendChild(this.renderShift(data, 'morning'));

        const afternoonTitle = document.createElement('h2');
        afternoonTitle.textContent = 'Poslijepodnevna smjena';
        this.timetableElement.appendChild(afternoonTitle);
        this.timetableElement.appendChild(this.renderShift(data, 'afternoon'));

        //set css variable --color to data.color
        if (data && data.color) {
            this.timetableElement.style.setProperty('--color', data.color);
        }
    }
}
