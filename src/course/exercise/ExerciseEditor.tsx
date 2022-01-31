import React, {memo, useContext, useEffect, useState} from "react";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {Course, Exercise, EXERCISE_TYPES} from '../../models/courses';
import {Alert, Autocomplete, Button, Snackbar, Stack, TextField, Typography} from "@mui/material";
import LocalizedFields, {Field} from "./LocalizedFields";
import Box from "@mui/material/Box";
import {LANGUAGES} from "../../models/language";
import AutocompleteSearch from "../../common/AutocompleteSearch";
import {getCourses, searchCourses, updateExercise} from "../../services/courses";


const getExerciseLocalizedFields = (exercise: Exercise | null) => {
    if( !exercise )
        return []

    const fields: Field[] = [];
    if( typeof exercise.title === 'string' ) {
        if( typeof exercise.pageId !== 'string' )
            throw Error('Locale-dependent fields exercise title and pageId are not of the same type (string)');

        fields.push({dirty: false, locale: 'enUS', title: exercise.title, notionId: exercise.pageId});
    }
    else if( typeof exercise.title === 'object' && typeof exercise.pageId === 'object' ) {
        for( const locale of Object.keys(exercise.title) )
            fields.push({dirty: false, locale: locale, title: exercise.title[locale], notionId: exercise.pageId[locale]});
    }
    else throw Error('Unsupported exercise title/pageId types');

    return fields;
}


function ExerciseEditor({cancelEditing, exerciseTypeChanged}: {
    cancelEditing: () => void,
    exerciseTypeChanged: (exerciseType: keyof typeof EXERCISE_TYPES) => void,
}) {
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const [localizedFields, setLocalizedFields] = useState<Field[]>([]);
    const [order, setOrder] = useState<number>(exercise?.order ?? 0);
    const [exerciseType, setExerciseType] = useState<keyof typeof EXERCISE_TYPES>(exercise?.exerciseType ?? EXERCISE_TYPES.testCases.id);
    const [unlockContent, setUnlockContent] = useState<string[]>(exercise?.unlockContent ?? []);
    const [allowedLanguages, setAllowedLanguages] = useState<(keyof typeof LANGUAGES)[]>(exercise?.allowedLanguages ?? []);
    const [memoryLimit, setMemoryLimit] = useState<{ value: number, error?: string }>({value: 512, error: undefined});
    const [timeLimit, setTimeLimit] = useState<{ value: number, error?: string }>({value: 2, error: undefined});

    const [exerciseFields, setExerciseFields] = useState<Field[]>([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const handleCloseSnackbar = () => setOpenSnackbar(false);

    const isFormReady = () => {
        return localizedFields.length > 0 && localizedFields.every(f => !f.dirty) &&
            allowedLanguages.length > 0 &&
            !memoryLimit.error && !timeLimit.error;
    };
    const onSubmit = async () => {
        if( !isFormReady() || !course || !exercise )
            return;

        await updateExercise(
            course.id, exercise.id,
            localizedFields.reduce((map, field) => {map[field.locale] = field.title; return map;}, {} as {[key: string]: string}),
            localizedFields.reduce((map, field) => {map[field.locale] = field.notionId; return map;}, {} as {[key: string]: string}),
            order,
            exerciseType,
            unlockContent,
            allowedLanguages,
            memoryLimit.value, timeLimit.value,
        );
        setOpenSnackbar(true);
    };
    const onCancel = () => cancelEditing();
    const onExerciseTypeChanged = (newType: keyof typeof EXERCISE_TYPES) => {
        setExerciseType(newType);
        exerciseTypeChanged(newType);
    }
    const onUnlockContentChanged = (unlockContent: Course[]) => setUnlockContent(unlockContent.map(c => c.id));
    const onMemoryLimitChanged = (value?: number) => setMemoryLimit({value: value ?? 512, error: value && 10 <= value && value <= 1000 ? undefined : 'value should be between 10 and 1000'});
    const onTimeLimitChanged = (value?: number) => setTimeLimit({value: value ?? 2, error: value && 0.001 <= value && value <= 30 ? undefined : 'value should be positive and less than 30'});

    useEffect(() => {
        setExerciseFields(getExerciseLocalizedFields(exercise));
        setLocalizedFields(getExerciseLocalizedFields(exercise));
        setOrder(exercise?.order ?? 0);
        setExerciseType(exercise?.exerciseType ?? EXERCISE_TYPES.testCases.id);
        setUnlockContent(exercise?.unlockContent ?? []);
        setAllowedLanguages(exercise?.allowedLanguages ?? []);
        onMemoryLimitChanged(exercise?.memoryLimit ?? 512);
        onTimeLimitChanged(exercise?.timeLimit ?? 2);
    }, [exercise]);


    const [nameToExerciseType, setNameToExerciseType] = useState<{ [key: string]: string }>({});
    useEffect(() => {
        const nameToId = {};
        for( const [id, name] of Object.entries(EXERCISE_TYPES) ) {
            // @ts-ignore
            nameToId[name.displayName] = id;
        }
        setNameToExerciseType(nameToId);
    }, []);
    const [nameToLanguageId, setNameToLanguageId] = useState<{ [key: string]: keyof typeof LANGUAGES }>({});
    useEffect(() => {
        const nameToLanguageId = {};
        for( const [id, language] of Object.entries(LANGUAGES) ) {
            // @ts-ignore
            nameToLanguageId[language.displayName] = id;
        }
        setNameToLanguageId(nameToLanguageId);
    }, []);


    if( !exercise )
        return <></>
    return <Box m={1}>
        <Stack direction="row" spacing={1} marginTop={4} justifyContent="center" alignItems="center" alignContent="center">
            <TextField required label="ID" variant="outlined" value={exercise.id} size="small" sx={{flex: 1, marginRight: 3}} inputProps={{readOnly: true}}/>
            <Button onClick={onSubmit} size="large" variant="outlined" disabled={!isFormReady()}>Save</Button>
            <Button onClick={onCancel} size="large" variant="outlined">Cancel</Button>
        </Stack>

        <LocalizedFields initialFields={exerciseFields} onFieldsChanged={setLocalizedFields} />
        <br/><br/>
        <TextField required variant="outlined" placeholder="1.01" type="number" fullWidth
                   label="Order (level is the number before decimal dot, the rest is the order withing level)"
                   value={order} onChange={e => setOrder(Number(e.target.value))}
                   helperText="Exercise is not visible to students until the order is defined"
                   inputProps={{ 'aria-label': 'controlled', inputMode: 'numeric', pattern: '[0-9.]*' }} sx={{flex: 1}}/>
        <br/><br/>

        <Stack direction="row" spacing={1}>
            <Autocomplete sx={{ width: 200 }} autoHighlight autoSelect disableClearable
                value={EXERCISE_TYPES[exerciseType].displayName}
                options={Object.keys(nameToExerciseType)}
                onChange={(event, value: string | null) => value && onExerciseTypeChanged(nameToExerciseType[value])}
                renderInput={(params) => <TextField {...params} label="Exercise type"/>}
            />

            { /* @ts-ignore */}
            <AutocompleteSearch<Course>
                label="Unlock Content" placeholder="Courses..."
                search={searchCourses} idsToValues={getCourses}
                optionToId={option => option.id}
                optionToLabel={option => option.title ?? ''}
                optionToImageUrl={option => option.img}
                initialIds={exercise?.unlockContent}
                onChange={onUnlockContentChanged}
                sx={{flex: 1}} />
        </Stack>

        {(exerciseType === 'testCases' || exerciseType === 'code') && <>
            <Stack marginTop={4} spacing={4} marginBottom={10} direction="column">
                <Autocomplete sx={{ width: 200 }} multiple autoHighlight autoSelect disableCloseOnSelect disableClearable
                    value={allowedLanguages.map(l => LANGUAGES[l].displayName)}
                    onChange={(event, values: string[] | null) => values && setAllowedLanguages(values.map(v => nameToLanguageId[v]))}
                    options={Object.keys(nameToLanguageId)}
                    renderInput={(params) => <TextField {...params} label="Allowed languages" />}
                />

                <Typography variant="h6" marginBottom={2}>Execution Parameters (per test-case)</Typography>
                <Stack direction="row" spacing={1}>
                    <TextField required variant="outlined" placeholder="512" type="number" label="Memory limit (MB)"
                               value={memoryLimit.value} onChange={e => onMemoryLimitChanged(Number(e.target.value))}
                               inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} sx={{flex: 1}}
                               error={!!memoryLimit.error} helperText={memoryLimit.error}/>

                    <TextField required variant="outlined" placeholder="2" type="number" label="Time limit (s)"
                               value={timeLimit.value} onChange={e => onTimeLimitChanged(Number(e.target.value))}
                               inputProps={{inputMode: 'numeric', pattern: '[0-9.]*' }} sx={{flex: 1}}
                               error={!!timeLimit.error} helperText={timeLimit.error}/>
                </Stack>
            </Stack>
        </>}

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                Successfully saved the changes!
            </Alert>
        </Snackbar>
    </Box>;
}

export default memo(ExerciseEditor);