import React from "react";
import Content from "./content/Content";
import Button from "@material-ui/core/Button";
import {makeStyles} from "@material-ui/core";

interface Props {
    introPageId: string;
    onStartCourseClicked: () => void;
}

const useStyles = makeStyles({
    startCourseSection: {
        textAlign: 'center',
        paddingBottom: '3em',
    },
});

function LandingPage(props: Props) {
    const classes = useStyles();
    const { introPageId, onStartCourseClicked } = props;

    return (
        <>
            {introPageId && <Content notionPage={introPageId} />}
            <div className={classes.startCourseSection}>
                <Button color="primary" variant="contained" onClick={onStartCourseClicked}>
                    START THE COURSE
                </Button>
            </div>
        </>
    )
}

export default LandingPage;
