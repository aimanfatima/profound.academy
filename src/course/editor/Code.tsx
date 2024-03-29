import React, {memo, useState, useEffect} from "react";
import {Ace, Range} from "ace-builds";
import {themesByName} from 'ace-builds/src-noconflict/ext-themelist';
import AceEditor from "react-ace";

import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import useAsyncEffect from "use-async-effect";
import {TextSelection} from "models/codeDrafts";



const Code = function Code({theme, language, fontSize, setCode, code, readOnly, selection, onSelectionChanged}: {
    theme: keyof typeof themesByName,
    language: string,
    fontSize: number,
    setCode?: (code: string) => void,
    code?: string,
    readOnly: boolean,
    selection?: TextSelection,
    onSelectionChanged?: (selection: TextSelection) => void,
}) {
    const [loadedTheme, setLoadedTheme] = useState('');
    const [loadedLanguage, setLoadedLanguage] = useState('');
    const [editorInstance, setEditorInstance] = useState<Ace.Editor | null>(null);

    // load the language styles
    useAsyncEffect(async () => {
        console.log('Loading modes for Ace:', language);
        await import(`ace-builds/src-noconflict/mode-${language}`);
        await import(`ace-builds/src-noconflict/snippets/${language}`);
        setLoadedLanguage(language);
    }, [language]);

    // load the theme styles
    useAsyncEffect(async () => {
        const themeName = String(theme);
        await import(`ace-builds/src-noconflict/theme-${themeName}`);
        setLoadedTheme(themeName);
    }, [theme]);

    // Handle ctrl/cmnd + s
    useEffect(() => {
        const onKeyDown = (e: any) => {
            if ((e.key === 's' || e.key === 'S' ) && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                // Process the event here (such as click on submit button)
            }
        }

        document.addEventListener('keydown', onKeyDown, false);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        }
    }, []);

    // set selection if possible
    useEffect(() => {
        editorInstance && selection && editorInstance.selection.setRange(new Range(
            selection.start.row, selection.start.column,
            selection.end.row, selection.end.column,
        ));
    }, [editorInstance, selection]);


    return <>
        <AceEditor
            placeholder="Start typing your code..."
            mode={loadedLanguage}
            theme={loadedTheme}
            readOnly={readOnly}
            value={code}
            width='100%'
            height='100%'
            fontSize={fontSize}
            onChange={value => {
                console.log(value);
                setCode && setCode(value);
            }}
            onSelectionChange={(value, _) => {
                onSelectionChanged && onSelectionChanged({
                    start: {row: value.lead.row, column: value.lead.column},
                    end: {row: value.anchor.row, column: value.anchor.column},
                });
            }}
            showPrintMargin
            showGutter
            highlightActiveLine

            name="editor_div"
            setOptions={{
                useWorker: false,
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: false,
                showLineNumbers: true,
                tabSize: 4,
            }}
            editorProps={{ $blockScrolling: true }}
            onLoad={editorInstance => {
                setEditorInstance(editorInstance);
                editorInstance.container.style.resize = "both";
                // mouseup = css resize end
                document.addEventListener('mouseup', _e => editorInstance.resize());
            }}
        />
    </>
};

export default memo(Code);
