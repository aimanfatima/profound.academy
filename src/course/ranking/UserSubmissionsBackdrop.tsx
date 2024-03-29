import React, {memo} from "react";
import {Backdrop, ClickAwayListener, IconButton, Paper, Stack, Typography} from "@mui/material";
import SmallAvatar from "../../common/SmallAvatar";
import {getLocalizedParam} from "../../util";
import {Close} from "@mui/icons-material";
import {UserExerciseSubmissionsTable} from "../SubmissionsTable";
import {styled} from "@mui/material/styles";
import {Exercise} from "models/exercise";


const SubmissionsBackdrop = styled(Backdrop)(({theme}) => ({
    zIndex: theme.zIndex.drawer + 1,
    color: 'white',
    padding: theme.spacing(4),
}));

export interface SubmissionsInfo {
    userId: string;
    userImageUrl?: string;
    userDisplayName: string;
    courseId: string,
    exercise: Exercise;
}


function UserSubmissionsBackdrop({submissionsInfo, handleClose}: {
    submissionsInfo: SubmissionsInfo, handleClose: () => void,
}) {
    return <>
        <SubmissionsBackdrop open={!!submissionsInfo}>
            <ClickAwayListener onClickAway={handleClose}>
                <Paper sx={{position: 'relative', height: '100%', width: '70%', borderRadius: 4, overflowY: 'auto'}}>
                    <Stack direction="row" alignItems="center" alignContent="center" margin={1} marginLeft={4}>
                        <SmallAvatar src={submissionsInfo.userImageUrl} />
                        {submissionsInfo.userDisplayName}
                        <Typography variant="body2" color="text.secondary" noWrap>&nbsp; • &nbsp;</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{flex: 1}}>{getLocalizedParam(submissionsInfo.exercise.title)}</Typography>
                        <IconButton onClick={handleClose} size="large"><Close /></IconButton>
                    </Stack>

                    <UserExerciseSubmissionsTable
                        rowsPerPage={10}
                        userId={submissionsInfo.userId}
                        courseId={submissionsInfo.courseId}
                        exerciseId={submissionsInfo.exercise.id} />
                </Paper>
            </ClickAwayListener>
        </SubmissionsBackdrop>
    </>
}

export default memo(UserSubmissionsBackdrop);
