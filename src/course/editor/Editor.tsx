import React, {useContext, useState} from "react";
import Code from "./Code";  // needs to be before getModeForPath so that Ace is loaded
import Console from "./Console";
import {getModeForPath} from 'ace-builds/src-noconflict/ext-modelist';
import {createStyles, IconButton, makeStyles, Theme} from "@material-ui/core";
import {Remove, Add} from "@material-ui/icons";
import {useStickyState} from "../../util";
import {Course, Exercise} from "../../models/courses";
import {onSubmissionResultChanged, submitSolution} from "../../services/submissions";
import {AuthContext} from "../../App";
import {SubmissionResult} from "../../models/submissions";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        code: {
            position: 'relative',
            height: '70%',
            width: '100%',
        },
        settings: {
            position: 'absolute',
            top: 0,
            right: 0,
        },
        console: {
            height: '30%',
            width: '100%',
            backgroundColor: '#d9d9d9',
            overflowY: 'auto',
            padding: '10px',
        },
    }),
);


interface EditorProps {
    course: Course;
    exercise: Exercise;
}

function Editor(props: EditorProps) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const [code, setCode] = useState('');
    const [theme, setTheme] = useStickyState('tomorrow', `editorTheme-${auth?.currentUser?.uid}`);
    const [language, setLanguage] = useStickyState(props.course.preferredLanguage, `${props.course.id}-language-${auth?.currentUser?.uid}`);
    const [fontSize, setFontSize] = useStickyState(14, `fontSize-${auth?.currentUser?.uid}`);

    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | undefined>(undefined);
    const [submitted, setSubmitted] = useState(false);

    const editorLanguage = getModeForPath(`main.${language.extension}`).name;
    const decreaseFontSize = () => setFontSize(Math.max(fontSize - 1, 5));
    const increaseFontSize = () => setFontSize(Math.min(fontSize + 1, 30));
    const onSubmitClicked = async (testRun: boolean) => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid )
            return;

        setSubmitted(true);
        const submissionId = await submitSolution(auth.currentUser.uid, auth.currentUser.displayName, props.course.id, props.exercise.id, code, language, testRun);
        const unsubscribe = onSubmissionResultChanged(submissionId, (result) => {
            setSubmissionResult(result);
            if(result)
                setSubmitted(false);
        });

        return () => unsubscribe();
    }

    return (
        <div style={{height: '100%'}}>
            <div className={classes.code}>
                <Code theme={theme} language={editorLanguage} fontSize={fontSize} setCode={setCode}/>
                <div className={classes.settings}>
                    <IconButton aria-label="decrease" onClick={decreaseFontSize}><Remove fontSize="small" /></IconButton>
                    <IconButton aria-label="increase" onClick={increaseFontSize}><Add fontSize="small" /></IconButton>
                </div>
            </div>

            <div className={classes.console}>
                <Console
                    exercise={props.exercise}
                    onSubmitClicked={() => onSubmitClicked(false)}
                    onRunClicked={() => onSubmitClicked(true)}
                    isProcessing={submitted}
                    submissionResult={submissionResult} />
            </div>
        </div>
    );
}

export default Editor;