import React, {memo, useState} from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {Collapse, Tooltip, Typography} from "@mui/material";
import moment from "moment/moment";
import useAsyncEffect from "use-async-effect";
import {getUserActivity} from "../services/users";
import {tomorrow, useStickyState} from "../util";
import Box from "@mui/material/Box";
import {TransitionGroup} from "react-transition-group";
import {UserDateSubmissionsTable} from "../course/SubmissionsTable";


function ActivityHeatmap({userId}: {userId: string}) {
    const [activity, setActivity] = useStickyState<{date: string, count: number}[] | null>(null, `daily-activity-${userId}`);
    const [totalActivity, setTotalActivity] = useStickyState<number>(0, `totalActivity-${userId}`);
    const [selectedDate, setSelectedDate] = useState<{ date: Date, formattedDate: string } | null>(null);

    useAsyncEffect(async () => {
        const activity = await getUserActivity(userId);
        const dailyActivity = Object.keys(activity).filter(key => key !== 'id').map(date => ({date: date, count: activity[date]}));
        setActivity(dailyActivity);
        setTotalActivity(dailyActivity.reduce((sum, a) => sum + a.count, 0));
    }, [userId]);

    const onDateClicked = (date: Date, formattedDate: string) => {
        console.log('date clicked:', date, formattedDate);
        if( !selectedDate || selectedDate.formattedDate !== formattedDate )
            setSelectedDate({date: date, formattedDate: formattedDate});
        else
            setSelectedDate(null);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);
    endDate.setHours(0);
    endDate.setMinutes(0);
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);

    return <>
        <style>{`
            .react-calendar-heatmap .color-scale-1 { fill: #d6e685; }
            .react-calendar-heatmap .color-scale-2 { fill: #8cc665; }
            .react-calendar-heatmap .color-scale-3 { fill: #44a340; }
            .react-calendar-heatmap .color-scale-4 { fill: #1e6823; }
        `}</style>
        <Box maxWidth="100%" width="50em" marginTop="4em" marginLeft="auto" marginRight="auto">
            <CalendarHeatmap
                showMonthLabels
                startDate={startDate}
                endDate={endDate}
                values={activity ?? []}
                classForValue={(value) => {
                    if (!value || !value.count) return 'color-empty';
                    if( value.count < 3 )       return 'color-scale-1';
                    if( value.count < 6 )       return 'color-scale-2';
                    if( value.count < 9 )       return 'color-scale-3';
                    return 'color-scale-4';
                }}
                transformDayElement={(element, value, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index - startDate.getDay());
                    const formattedDate = moment(currentDate).locale('en').format('MMM Do, YYYY');
                    return (
                        <Tooltip
                            key={formattedDate}
                            describeChild
                            onClickCapture={() => onDateClicked(currentDate, formattedDate)}
                            title={value && value.count
                                ? `${value.count} solutions on ${formattedDate}` + ( value.count >= 10 ? '!' : '')
                                : `No solutions on ${formattedDate}`
                            }>
                            {React.cloneElement(element)}
                        </Tooltip>
                    );
                }}
            />
            <Typography variant="subtitle1">{totalActivity ?? '...'} solutions in the last year</Typography>

            <TransitionGroup>
                {selectedDate &&
                <Collapse key={selectedDate.formattedDate}>
                    <UserDateSubmissionsTable
                        userId={userId} rowsPerPage={10}
                        startDate={new Date(selectedDate.date)}
                        endDate={tomorrow(new Date(selectedDate.date))} />
                </Collapse>}
            </TransitionGroup>
        </Box>
    </>
}

export default memo(ActivityHeatmap);
