import React, {useContext, useState} from "react";
import useAsyncEffect from "use-async-effect";
import {Backdrop, CircularProgress, ClickAwayListener, IconButton, Paper, Stack, Typography} from "@mui/material";
import {styled} from "@mui/material/styles";
import {SubmissionResult} from "models/submissions";
import {getSubmissionCode} from "../services/submissions";
import {AuthContext} from "../App";
import Code from "./editor/Code";
import {LANGUAGES} from "models/language";
import {getModeForPath} from "ace-builds/src-noconflict/ext-modelist";
import {Close} from "@mui/icons-material";
import SmallAvatar from "../common/SmallAvatar";


const CodeBackdrop = styled(Backdrop)(({theme}) => ({
    zIndex: theme.zIndex.drawer + 1,
    color: 'white',
    padding: theme.spacing(4),
}));

function SubmissionBackdrop({submission, onClose}: {submission: SubmissionResult, onClose: () => void}) {
    const auth = useContext(AuthContext);

    const [open, setOpen] = useState(true);
    const [submissionCode, setSubmissionCode] = useState<string | null>(null);
    const handleClose = () => {
        setOpen(false);
        onClose();
    }

    useAsyncEffect(async () => {
        const userId = auth?.currentUser?.uid;
        if( !userId ) {
            handleClose();
            return;
        }
        try {
            const code = await getSubmissionCode(submission.userId, submission.id);
            console.log('Got submission code:', code);
            // TODO: support multi-file submissions (now just get the first value)
            setSubmissionCode(code[Object.keys(code)[0]]);
        }
        catch (e) {
            setSubmissionCode('# You are not allowed to view the submission');
        }

    }, [submission]);

    const language = LANGUAGES[submission.language];
    const editorLanguage = getModeForPath(`main.${language.extension}`).name;

    return (<>
        <CodeBackdrop open={open}>
            <ClickAwayListener onClickAway={handleClose}>
                <Paper sx={{position: 'relative', height: '100%', width: '70%', borderRadius: 4, overflowY: 'auto'}}>
                    <Stack direction="row" alignItems="center" alignContent="center" margin={1} marginLeft={4}>
                        <SmallAvatar src={submission.userImageUrl} />
                        {submission.userDisplayName}
                        <Typography variant="body2" color="text.secondary" noWrap>&nbsp; • &nbsp;</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{flex: 1}}>{submission.id}</Typography>
                        <IconButton onClick={handleClose} size="large"><Close /></IconButton>
                    </Stack>
                    {!submissionCode
                        ? <CircularProgress color="inherit"/>
                        : <Code readOnly theme="tomorrow" fontSize={14}
                              language={editorLanguage} code={submissionCode} />
                    }
                    <Typography variant="body2" color="text.secondary" noWrap textAlign="center">Instructors will see results per test case here</Typography>
                </Paper>
            </ClickAwayListener>
        </CodeBackdrop>
    </>);
}

export default SubmissionBackdrop;
