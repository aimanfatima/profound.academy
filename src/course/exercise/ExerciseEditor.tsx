import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {Course, Exercise, EXERCISE_TYPES} from '../../models/courses';
import {Alert, Autocomplete, Button, Collapse, IconButton, List, ListItem, Snackbar, Stack, TextField, Typography} from "@mui/material";
import LocalizedField, {FieldSchema, fieldSchema} from "./LocalizedField";
import Box from "@mui/material/Box";
import {LANGUAGES} from "../../models/language";
import AutocompleteSearch from "../../common/AutocompleteSearch";
import {getCourses, searchCourses, updateExercise} from "../../services/courses";

import {Controller, useForm, FormProvider, useFieldArray} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {infer as Infer, object, string, array, enum as zodEnum, number} from "zod";
import {TransitionGroup} from "react-transition-group";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import * as locales from "@mui/material/locale";


// @ts-ignore
const EXERCISE_TYPE_NAMES: readonly [string, ...string[]] = Object.keys(EXERCISE_TYPES);
// @ts-ignore
const LANGUAGE_NAMES: readonly [string, ...string[]] = Object.keys(LANGUAGES);
const schema = object({
    localizedFields: array(fieldSchema).nonempty(),
    order: number().nonnegative(),
    exerciseType: zodEnum(EXERCISE_TYPE_NAMES),
    unlockContent: array(string().min(20).max(35)),
    allowedLanguages: array(zodEnum(LANGUAGE_NAMES)).nonempty(),
    memoryLimit: number().min(10).max(1000),
    timeLimit: number().min(0.001).max(30),
});
type Schema = Infer<typeof schema>;


const getExerciseLocalizedFields = (exercise: Exercise | null, defaultLocale?: string) => {
    if( !exercise ) {
        if (defaultLocale)
            return [{locale: defaultLocale, title: '', notionId: ''}]
        return []
    }

    const fields: FieldSchema[] = [];
    if( typeof exercise.title === 'string' ) {
        if( typeof exercise.pageId !== 'string' )
            throw Error('Locale-dependent fields exercise title and pageId are not of the same type (string)');

        fields.push({locale: defaultLocale ?? 'enUS', title: exercise.title, notionId: exercise.pageId});
    }
    else if( typeof exercise.title === 'object' && typeof exercise.pageId === 'object' ) {
        for( const locale of Object.keys(exercise.title) )
            fields.push({locale: locale, title: exercise.title[locale], notionId: exercise.pageId[locale]});
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
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const handleCloseSnackbar = () => setOpenSnackbar(false);

    const getDefaultFieldValues = useCallback(() => {
        return {
            localizedFields: getExerciseLocalizedFields(exercise, 'enUS'),
            order: exercise?.order,
            exerciseType: exercise?.exerciseType ?? 'testCases',
            unlockContent: exercise?.unlockContent ?? [],
            allowedLanguages: exercise?.allowedLanguages ?? [],
            memoryLimit: exercise?.memoryLimit ?? 512,
            timeLimit: exercise?.timeLimit ?? 1,
        }
    }, [exercise]);

    const formMethods = useForm<Schema>({
        mode: 'onChange',
        resolver: zodResolver(schema),
        // @ts-ignore
        defaultValues: getDefaultFieldValues(),
    });
    const {control, watch, handleSubmit, formState: {errors, isValid}, reset, setValue} = formMethods;
    const { fields, append, remove } = useFieldArray({control, name: 'localizedFields'});
    const watchFieldArray = watch('localizedFields');
    const controlledFields = fields.map((field, index) => {
        return {...field, ...watchFieldArray[index]};
    });

    console.log('errors:', errors);
    console.log('fields:', controlledFields);
    // @ts-ignore
    const exerciseType: keyof typeof EXERCISE_TYPES = watch('exerciseType');
    const onExerciseTypeChanged = (newType: keyof typeof EXERCISE_TYPES) => {
        setValue('exerciseType', newType as string, {shouldTouch: true});
        exerciseTypeChanged(newType);
    }
    const nameToExerciseType = (name: string) => Object.keys(EXERCISE_TYPES).find(key => EXERCISE_TYPES[key].displayName === name);
    const nameToLanguageId = (name: string) => Object.keys(LANGUAGES).find(key => LANGUAGES[key].displayName === name);

    const getAllowedLocales = (index: number) => {
        const allLocales = new Set(Object.keys(locales));
        controlledFields.forEach(f => allLocales.delete(f.locale));
        console.log('getAllowedLocales:', index, controlledFields.map(f => f.locale), '=>', allLocales);
        return 0 <= index && index < fields.length ? [controlledFields[index].locale, ...allLocales] : [...allLocales];
    }
    const addLanguage = (locale?: string) => {
        if( !locale )
            locale = getAllowedLocales(-1)[0];
        // For some weird reason, append duplicates the values if we do not remove the items explicitly once again
        // remove(fields.length);
        append({locale: locale, title: '', notionId: ''});
        // remove(fields.length + 1);
    }
    const removeLanguage = (index: number) => {
        remove(index);
        remove(fields.length);
    }

    // @ts-ignore
    useEffect(() => reset(getDefaultFieldValues()),
        [exercise, getDefaultFieldValues, reset]);
    const onCancel = () => cancelEditing();
    const onSubmit = async (data: Schema) => {
        if( !course || !exercise )
            return;
        console.log('submit!', data)

        await updateExercise(
            course.id, exercise.id,
            data.localizedFields.reduce((map, field) => {map[field.locale] = field.title; return map;}, {} as {[key: string]: string}),
            data.localizedFields.reduce((map, field) => {map[field.locale] = field.notionId; return map;}, {} as {[key: string]: string}),
            data.order,
            data.exerciseType,
            data.unlockContent,
            data.allowedLanguages,
            data.memoryLimit, data.timeLimit,
        );
        setOpenSnackbar(true);
    };

    if( !exercise )
        return <></>
    return <>
        <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box m={1}>
            <Stack direction="row" spacing={1} marginTop={4} justifyContent="center" alignItems="center" alignContent="center">
                <TextField label="ID" variant="outlined" value={exercise.id} size="small" sx={{flex: 1, marginRight: 3}} inputProps={{readOnly: true}}/>
                <Button size="large" variant="outlined" type="submit" disabled={!isValid && false}>Save</Button>
                <Button size="large" variant="outlined" onClick={onCancel}>Cancel</Button>
            </Stack>

            <List>
                <TransitionGroup>
                    {controlledFields.map((item, index) => (
                    <Collapse key={item.id}>
                        <ListItem secondaryAction={<IconButton edge="end" title="Delete" onClick={() => removeLanguage(index)}><CloseIcon /></IconButton>}>
                            <LocalizedField allowedLocales={getAllowedLocales(index)} namePrefix={`localizedFields.${index}.`} />
                        </ListItem>
                    </Collapse>
                    ))}
                </TransitionGroup>
                <Button sx={{textTransform: 'none', marginLeft: 2}} startIcon={<AddIcon/>} onClick={() => addLanguage()}>Add</Button>
            </List>

            <br/><br/>
            <Controller name="order" control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField required variant="outlined" placeholder="1.01" type="number" fullWidth
                           label="Order (0 = invisible) (level = number before decimal dot, the rest is the order within level)"
                           onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                           error={Boolean(errors.order)} helperText={errors.order?.message}
                           inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
            )}/>
            <br/><br/>

            <Stack direction="row" spacing={1}>
                <Controller name="exerciseType" control={control} render={({field}) => (
                    <Autocomplete sx={{ width: 200 }} autoHighlight autoSelect disableClearable ref={field.ref}
                                  value={EXERCISE_TYPES[field.value].displayName}
                                  options={Object.keys(EXERCISE_TYPES).map(key => EXERCISE_TYPES[key].displayName)}
                                  onChange={(event, value: string | null) => value && onExerciseTypeChanged(nameToExerciseType(value)!)}
                                  renderInput={(params) => <TextField {...params} label="Exercise type"/>}/>
                )} />

                <Controller name="unlockContent" control={control} render={({field}) => <>
                    {/* @ts-ignore */}
                    <AutocompleteSearch<Course>
                        label="Unlock Content" placeholder="Courses..."
                        search={searchCourses} idsToValues={getCourses}
                        optionToId={option => option.id}
                        optionToLabel={option => option.title ?? ''}
                        optionToImageUrl={option => option.img}
                        initialIds={exercise?.unlockContent}
                        onChange={content => field.onChange(content.map(c => c.id))}
                        sx={{flex: 1}} />
                </>} />
            </Stack>

            {(exerciseType === 'testCases' || exerciseType === 'code') && <>
                <Stack marginTop={4} spacing={4} marginBottom={10} direction="column">
                    <Controller name="allowedLanguages" control={control} render={({field}) => (
                        <Autocomplete
                            sx={{ width: 200 }} ref={field.ref} multiple autoHighlight autoSelect disableCloseOnSelect disableClearable
                            value={field.value.map(l => LANGUAGES[l].displayName)}
                            onChange={(event, values: string[] | null) => values && field.onChange(values.map(v => nameToLanguageId(v)!))}
                            options={Object.keys(LANGUAGES).map(key => LANGUAGES[key].displayName)}
                            renderInput={(params) => (
                                <TextField {...params} label="Allowed languages"
                                           error={Boolean(errors.allowedLanguages)}
                                           // @ts-ignore
                                           helperText={errors.allowedLanguages?.message}/>
                            )} />
                    )} />

                    <Typography variant="h6" marginBottom={2}>Execution Parameters (per test-case)</Typography>
                    <Stack direction="row" spacing={1}>
                        <Controller name="memoryLimit" control={control} render={({ field: { ref, onChange, ...field } }) => (
                            <TextField
                                required variant="outlined" placeholder="512" type="number" label="Memory limit (MB)"
                                onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                                error={Boolean(errors.memoryLimit)} helperText={errors.memoryLimit?.message}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}} />
                        )}/>

                        <Controller name="timeLimit" control={control} render={({ field: { ref, onChange, ...field } }) => (
                            <TextField
                                required variant="outlined" placeholder="2" type="number" label="Time limit (s)"
                                onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                                error={Boolean(errors.timeLimit)} helperText={errors.timeLimit?.message}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}} />
                        )}/>
                    </Stack>
                </Stack>
            </>}
        </Box>
        </form>
        </FormProvider>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                Successfully saved the changes!
            </Alert>
        </Snackbar>
    </>
}

export default memo(ExerciseEditor);
