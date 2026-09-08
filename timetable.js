import { dashboard } from "./dashboard.js";

export const timetable = {
    init: function(container, data) {
        this.timetableElement = document.createElement('div');
        this.timetableElement.id = 'timetable';
        container.appendChild(this.timetableElement);

        //set highlight tomorrow if today is after 21
        //or if today is weekend
        this.highlightTomorrow = false;
        const currentShift = dashboard.getCurrentShift(data);
        const now = dashboard.getToday();
        const cutoffTime = currentShift === 'morning' ? 18 : 21;
        if (now.getHours() >= cutoffTime || now.getDay() === 0 || now.getDay() === 6) {
            this.highlightTomorrow = true;
        }

        this.renderTimeTable(data);
    },
    renderShift: function(data, shift) {
        // Render a single shift timetable in a grid
        const timetableGrid = document.createElement('div');
        timetableGrid.className = 'timetable-grid';

        // Header row
        const days = ['Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak'];
        const dayMap = {
            'Ponedjeljak': 'monday',
            'Utorak': 'tuesday',
            'Srijeda': 'wednesday',
            'Četvrtak': 'thursday',
            'Petak': 'friday'
        };

        const topLeftCell = document.createElement('div'); // Empty top-left cell
        topLeftCell.style.gridColumn = '1';
        topLeftCell.style.gridRow = '1';
        timetableGrid.appendChild(topLeftCell);

        // Get current day index (0=Monday, 4=Friday)
        const today = dashboard.getToday();
        let jsDay = today.getDay(); // 0=Sunday, 1=Monday, ...
        if (this.highlightTomorrow) {
            //coincidentally, this works correctly even if today is Saturday (6) or Sunday (0),
            //but Friday (5) will wrap to Sunday (0) which is fine since there is no class on weekend
            jsDay = (jsDay + 1) % 6;
        }
        // Map JS day to timetable day index
        const dayIdx = jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : -1;
        
        days.forEach((day, idx) => {
            const dayCell = document.createElement('div');
            dayCell.textContent = day;
            dayCell.className = 'timetable-day-header';
            dayCell.style.gridColumn = String(idx + 2);
            dayCell.style.gridRow = '1';
            if (idx === dayIdx) {
                dayCell.classList.add('current-day');
                dayCell.appendChild(document.createElement('br'));

                let label = '(danas)';
                if (this.highlightTomorrow) {
                    label = '(sljedeći radni dan)';
                }
                dayCell.appendChild(document.createTextNode(label));
            }
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
        hourKeys.forEach((hourKey, rowIdx) => {
            const hourInfo = data.hours[hourKey];

            const hourRow = document.createElement('div');
            hourRow.textContent = `${hourInfo.start} - ${hourInfo.end}`;
            hourRow.className = 'timetable-hour-row';
            hourRow.style.gridColumn = '1';
            hourRow.style.gridRow = String(rowIdx + 2);
            timetableGrid.appendChild(hourRow);
        });

        const getHourData = (dayEn, hourKey) => {
            if (!data.shifts || !data.shifts[shift] || !data.shifts[shift][dayEn] || !data.shifts[shift][dayEn][hourKey]) {
                return null;
            }
            return data.shifts[shift][dayEn][hourKey];
        };

        const getCellState = (hourData) => {
            const subjects = hourData?.subjects || [];
            const options = hourData?.options || [];
            const isMandatory = hourData?.status === 'mandatory';
            const doesNotAttend = hourData?.status === 'notAttending';
            return { subjects, options, isMandatory, doesNotAttend };
        };

        const getMergeKey = (hourData) => {
            if (!hourData) {
                return null;
            }
            const { subjects, options } = getCellState(hourData);
            if (subjects.length === 0 && options.length === 0) {
                return null;
            }
            return JSON.stringify(hourData);
        };

        days.forEach((day, idx) => {
            const dayEn = dayMap[day];
            let rowIdx = 0;

            while (rowIdx < hourKeys.length) {
                const hourKey = hourKeys[rowIdx];
                const hourData = getHourData(dayEn, hourKey);
                const currentMergeKey = getMergeKey(hourData);

                let rowSpan = 1;
                if (currentMergeKey) {
                    let nextRowIdx = rowIdx + 1;
                    while (nextRowIdx < hourKeys.length) {
                        const nextHourKey = hourKeys[nextRowIdx];
                        const nextHourData = getHourData(dayEn, nextHourKey);
                        if (getMergeKey(nextHourData) !== currentMergeKey) {
                            break;
                        }
                        rowSpan += 1;
                        nextRowIdx += 1;
                    }
                }

                let cell = document.createElement('div');
                cell.className = 'timetable-cell';
                cell.style.gridColumn = String(idx + 2);
                cell.style.gridRow = `${rowIdx + 2} / span ${rowSpan}`;
                if (idx === dayIdx) {
                    cell.classList.add('current-day');
                }

                const { subjects, options, isMandatory, doesNotAttend } = getCellState(hourData);
                if (subjects.length > 0 || options.length > 0) {
                    // Check if any subject is mandatory
                    if (isMandatory) {
                        cell.classList.add('mandatory-hour');
                    } else if (doesNotAttend) {
                        cell.classList.add('not-attending-hour');
                    }
                    if (options.length > 0) {
                        cell.innerHTML = options
                            .map(option => {
                                const isNotAttendingOption = (option.status || '').toLowerCase() === 'notattending';
                                const optionClass = isNotAttendingOption ? 'subject-option-box not-attending-option' : 'subject-option-box';
                                return `<div class="${optionClass}"><span class="subject-name">${option.name}</span>${option.room ? `<span class="subject-room">${option.room}</span>` : ''}</div>`;
                            })
                            .join('');
                        cell.classList.add('has-options');
                    } else {
                        cell.innerHTML = subjects
                            .map(sub => `<div class="subject-entry"><span class="subject-name">${sub.name}</span>${sub.room ? `<span class="subject-room">${sub.room}</span>` : ''}</div>`)
                            .join('');
                    }
                } else {
                    cell.innerHTML = '';
                }
                timetableGrid.appendChild(cell);
                rowIdx += rowSpan;
            }
        });

        return timetableGrid;
    },

    renderTimeTable: function(data) {
        const currentShift = dashboard.getCurrentShift(data);

        // Create shift toggle
        const shiftToggle = document.createElement('div');
        shiftToggle.className = 'shift-toggle';
        const shifts = [
            { value: 'morning', label: 'Jutarnja smjena' },
            { value: 'afternoon', label: 'Poslijepodnevna smjena' }
        ];
        shifts.forEach(shift => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = shift.label;
            btn.className = 'shift-btn';
            if (shift.value === currentShift) btn.classList.add('selected');
            btn.dataset.shift = shift.value;
            shiftToggle.appendChild(btn);
        });
        this.timetableElement.appendChild(shiftToggle);

        // Render both shifts
        const morningShift = document.createElement('div');
        morningShift.className = 'timetable-shift';
        morningShift.appendChild(this.renderShift(data, 'morning'));
        if (currentShift === 'morning') {
            morningShift.classList.add('current-shift');
        }
        this.timetableElement.appendChild(morningShift);

        const afternoonShift = document.createElement('div');
        afternoonShift.className = 'timetable-shift';
        afternoonShift.appendChild(this.renderShift(data, 'afternoon'));
        if (currentShift === 'afternoon') {
            afternoonShift.classList.add('current-shift');
        }
        this.timetableElement.appendChild(afternoonShift);

        // Toggle logic
        shiftToggle.addEventListener('click', (e) => {
            if (e.target.classList.contains('shift-btn')) {
                const selectedShift = e.target.dataset.shift;
                shiftToggle.querySelectorAll('.shift-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                if (selectedShift === 'morning') {
                    morningShift.classList.add('current-shift');
                    afternoonShift.classList.remove('current-shift');
                } else {
                    afternoonShift.classList.add('current-shift');
                    morningShift.classList.remove('current-shift');
                }
            }
        });
        //set css variable --color to data.color
        if (data && data.color) {
            this.timetableElement.style.setProperty('--color', data.color);
        }
    }
}
