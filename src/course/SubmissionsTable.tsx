import React, {Component, useEffect, useState} from "react";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {Course} from "models/courses";
import {Exercise} from "models/exercise";
import {onCourseSubmissionsChanged, onSubmissionsChanged, onUserExerciseSubmissionsChanged, onUserSubmissionsChanged} from "../services/submissions";
import {SubmissionResult} from "models/submissions";
import moment from "moment/moment";
import SubmissionBackdrop from "./SubmissionBackdrop";
import {statusToColor} from "./colors";
import {lastExerciseId} from "./Course";
import {BottomLoading} from "../common/loading";
import {Stack, Typography} from "@mui/material";
import SmallAvatar from "../common/SmallAvatar";
import ClickableTableCell from "../common/ClickableTableCell";
import {LANGUAGES} from "models/language";
import {getLocalizedParam} from "../util";
import Box from "@mui/material/Box";
import {useNavigate} from "react-router-dom";
import {NavigateFunction} from "react-router";


interface Column {
    id: '#' | 'userDisplayName' | 'createdAt' | 'courseTitle' | 'exerciseTitle' | 'status' | 'time' | 'memory' | 'language';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: any) => string;
}

const columns: Column[] = [
    { id: '#', label: '#', minWidth: 20 },
    { id: 'userDisplayName', label: 'User', minWidth: 100 },
    { id: 'courseTitle', label: 'Course', minWidth: 100 },
    { id: 'exerciseTitle', label: 'Exercise', minWidth: 100 },
    { id: 'status', label: 'Status', minWidth: 50 },
    { id: 'time', label: 'Time (s)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(2) : '' },
    { id: 'memory', label: 'Memory (MB)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(1): '' },
    { id: 'language', label: 'Language', minWidth: 50 },
    { id: 'createdAt', label: 'Date', minWidth: 100, format: (value) => moment(value.toDate()).locale('en').format('YYYY MMM Do, HH:mm:ss') },
];


interface Props {
    navigate: NavigateFunction,
    reset: number;
    onLoadNext: (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) => Promise<() => void>;
    columns: Column[];
}

interface State {
    page: number;
    hasMore: boolean;
    displayedSubmission?: SubmissionResult;
    pageSubmissions: SubmissionResult[][];
    updateSubscriptions: (() => void)[],
}

class SubmissionsTable extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {page: 0, hasMore: true, pageSubmissions: [], updateSubscriptions: []};
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
        if( prevProps.reset !== this.props.reset ) {
            this.setState({page: 0, hasMore: true, pageSubmissions: [], updateSubscriptions: []});
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    onSubmissionClicked = (submission: SubmissionResult) => this.setState({displayedSubmission: submission});
    onCloseSubmission = () => this.setState({displayedSubmission: undefined});
    onUserClicked = (userId: string) => this.props.navigate(`/users/${userId}`);
    onExerciseClicked = (courseId: string, exerciseId: string) => this.props.navigate(`/${courseId}/${exerciseId}`);
    onCourseClicked = (courseId: string) => {
        const lastEx = lastExerciseId(this.context.auth?.currentUserId, courseId);
        if( lastEx )    this.props.navigate(`/${courseId}/${lastEx}`);
        else            this.props.navigate(`/${courseId}`);
    };
    unsubscribeAll = () => {
        console.log('unsubscribing from all the submission listeners');
        for( const unsubscribe of this.state.updateSubscriptions )
            unsubscribe();
    }


    loadNextPage = async () => {
        const page = this.state.page;
        const startAfterId = page === 0 || !this.state.pageSubmissions[page - 1]
            ? null
            : this.state.pageSubmissions[page - 1].at(-1)?.id;

        // do not load if we already have a listener and set dummy listener right after check
        if( this.state.updateSubscriptions[page] )
            return;
        this.setState({updateSubscriptions: [...this.state.updateSubscriptions, () => {}]});

        console.log('startAfter:', startAfterId, 'for page:', this.state.page);

        const onChanged = (submissions: SubmissionResult[], more: boolean) => {
            console.log('onChanged:', submissions, page, `(now ${this.state.page})`, more);
            const currentSubscriptions = [...this.state.pageSubmissions];
            currentSubscriptions[page] = submissions;
            this.setState({pageSubmissions: currentSubscriptions});

            if( page === this.state.page )
                this.setState({hasMore: more, page: page + 1});
        };

        const unsubscribe = await this.props.onLoadNext(startAfterId ?? null, onChanged);
        const subscriptions = [...this.state.updateSubscriptions];
        subscriptions[page] = unsubscribe;
        this.setState({updateSubscriptions: subscriptions});
    };


    render() {
        const {hasMore, displayedSubmission, pageSubmissions} = this.state;
        let orderNumber = 1;
        console.log(pageSubmissions.length, hasMore);
        if( (pageSubmissions.length === 0 || (pageSubmissions.length === 1 && pageSubmissions[0].length === 0)) && !hasMore )
            return <Box alignItems="center" alignContent="center" textAlign="center">
                <Typography>No submissions yet to display</Typography>
            </Box>

        return (
            <Paper sx={{width: '100%'}}>
                {displayedSubmission && <SubmissionBackdrop submission={displayedSubmission} onClose={this.onCloseSubmission} />}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {this.props.columns.map((column) => (
                                    <TableCell key={column.id} align={column.align} sx={{ minWidth: column.minWidth }}>
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pageSubmissions.map((submissions, _page) => submissions.map((row, _index) =>
                                <TableRow hover role="checkbox" tabIndex={-1} key={row.id} onClick={() => this.onSubmissionClicked(row)}>
                                    {this.props.columns.map((column) => {
                                        if( column.id === '#' )
                                            return <TableCell key={column.id} align={column.align}>{orderNumber++}</TableCell>;

                                        const value = row[column.id];
                                        if( column.id === 'userDisplayName' )
                                            return <ClickableTableCell key={column.id} align={column.align} onClick={() => this.onUserClicked(row.userId)}>
                                                <Stack direction="row" alignItems="center" alignContent="center">
                                                    <SmallAvatar src={row.userImageUrl} />
                                                    {value}
                                                </Stack>
                                            </ClickableTableCell>
                                        if( column.id === 'courseTitle' )
                                            return <ClickableTableCell key={column.id} align={column.align} onClick={() => this.onCourseClicked(row.course.id)}>{value}</ClickableTableCell>
                                        if( column.id === 'exerciseTitle' )
                                            return <ClickableTableCell key={column.id} align={column.align} onClick={() => this.onExerciseClicked(row.course.id, row.exercise.id)}>
                                                { /* @ts-ignore */}
                                                {getLocalizedParam(value)}
                                            </ClickableTableCell>

                                        if( column.id === 'language' && typeof value === 'string' )
                                            return <TableCell key={column.id} align={column.align}>{LANGUAGES[value].displayName}</TableCell>
                                        // @ts-ignore
                                        const style = column.id === 'status' ? {color: statusToColor(value)} : {};
                                        return (
                                            <TableCell key={column.id} align={column.align} style={style}>
                                                {column.format ? column.format(value) : value}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <BottomLoading hasMore={hasMore} loadMore={this.loadNextPage} />
            </Paper>
        );
    }
}


export function UserSubmissionsTable({rowsPerPage, userId}: {rowsPerPage: number, userId: string}) {
    const onLoadNext = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onUserSubmissionsChanged(userId, startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    const navigate = useNavigate();
    useEffect(() => setReset(r => r + 1), [userId]);
    return <SubmissionsTable reset={reset} navigate={navigate} onLoadNext={onLoadNext} columns={columns.filter(c => c.id !== 'userDisplayName')}/>
}

export function UserExerciseSubmissionsTable({rowsPerPage, userId, courseId, exerciseId}: {
    rowsPerPage: number, userId: string, courseId: string, exerciseId: string
}) {
    const onLoadNext = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onUserExerciseSubmissionsChanged(userId, courseId, exerciseId, 'desc', startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    const navigate = useNavigate();
    useEffect(() => setReset(r => r + 1), [userId]);
    return <SubmissionsTable reset={reset} navigate={navigate} onLoadNext={onLoadNext} columns={columns.filter(c => c.id !== 'userDisplayName' && c.id !== 'courseTitle' && c.id !== 'exerciseTitle')}/>
}

export function UserDateSubmissionsTable({rowsPerPage, userId, startDate, endDate}: {rowsPerPage: number, userId: string, startDate: Date, endDate: Date}) {
    const onLoadNext = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onUserSubmissionsChanged(userId, startAfterId ?? null, rowsPerPage, onChange, startDate, endDate, 'asc');

    const [reset, setReset] = useState(0);
    const navigate = useNavigate();
    useEffect(() => setReset(r => r + 1), [userId]);
    return <SubmissionsTable reset={reset} navigate={navigate} onLoadNext={onLoadNext} columns={columns.filter(c => c.id !== 'userDisplayName')}/>
}


export function CourseSubmissionsTable({rowsPerPage, course}: {rowsPerPage: number, course: Course}) {
    const onLoadNext = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onCourseSubmissionsChanged(course.id, startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    const navigate = useNavigate();
    useEffect(() => setReset(r => r + 1), [course.id]);
    return <SubmissionsTable reset={reset} navigate={navigate} onLoadNext={onLoadNext} columns={columns.filter(c => c.id !== 'courseTitle')}/>
}

export function ExerciseSubmissionsTable({rowsPerPage, course, exercise, mode}: {rowsPerPage: number, course: Course, exercise: Exercise, mode: 'all' | 'best'}) {
    const onLoadNext = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onSubmissionsChanged(course.id, exercise.id, mode, startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    const navigate = useNavigate();
    useEffect(() => setReset(r => r + 1), [course.id, exercise.id, mode]);
    return <SubmissionsTable reset={reset} navigate={navigate} onLoadNext={onLoadNext} columns={columns.filter(c => c.id !== 'courseTitle' && c.id !== 'exerciseTitle')}/>
}
