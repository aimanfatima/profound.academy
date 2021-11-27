import Content from "./Content";
import React, {useState} from "react";
import Button from "@mui/material/Button";
import { Theme } from "@mui/material";
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import {Course, Exercise} from "../models/courses";
import SubmissionsTable from "./SubmissionsTable";
import Forum from "./forum/Forum";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        tabChooser: {
            textAlign: 'center',
            padding: '10px'
        },
        button: {
            margin: theme.spacing(1),
            borderRadius: 50,
            size: 'large',
        },
    }),
);



interface ExerciseProps {
    course: Course;
    exercise: Exercise;
}

function ExerciseView(props: ExerciseProps) {
    const classes = useStyles();

    const {course, exercise} = props;
    const [currentTab, setCurrentTab] = useState('description'); // {description / allSubmissions / bestSubmissions}
    console.log('ExerciseView:', exercise);

    return (
        <>
            <div className={classes.tabChooser}>
                <Button className={classes.button} variant={currentTab === 'description' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('description')}>Description</Button>
                <Button className={classes.button} variant={currentTab === 'bestSubmissions' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('bestSubmissions')}>Best Submissions</Button>
                <Button className={classes.button} variant={currentTab === 'allSubmissions' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('allSubmissions')}>All Submissions</Button>
            </div>


            {currentTab === 'description' && <>
                <Content notionPage={exercise.pageId}/>
                <Forum course={course} exercise={exercise} />
            </>}
            {currentTab === 'bestSubmissions' && <SubmissionsTable course={course} exercise={exercise} mode="best" />}
            {currentTab === 'allSubmissions' && <SubmissionsTable course={course} exercise={exercise} mode="all" />}

        </>
    );
}

export default ExerciseView;
