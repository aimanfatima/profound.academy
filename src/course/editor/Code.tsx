import React, {useEffect, useState} from "react";
import AceEditor from "react-ace";

import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import useAsyncEffect from "use-async-effect";


interface Props {
    theme: 'monokai' | 'github' | 'tomorrow' | 'kuroir' | 'twilight' | 'xcode' | 'textmate' | 'solarized_dark' | 'solarized_light' | 'terminal';
    language: string;
    fontSize: number;
    setCode?: (code: string) => void;
    readOnly: boolean;
    initialCode?: string;
}

function Code(props: Props) {
    const {theme, language, fontSize, setCode, readOnly, initialCode} = props;

    const [value, setValue] = useState('');
    const [loadedTheme, setLoadedTheme] = useState('');
    const [loadedLanguage, setLoadedLanguage] = useState('');

    // load the language styles
    useAsyncEffect(async () => {
        console.log('Loading modes for Ace:', language);
        await import(`ace-builds/src-noconflict/mode-${language}`);
        await import(`ace-builds/src-noconflict/snippets/${language}`);
        setLoadedLanguage(language);
    }, [language]);

    // load the theme styles
    useAsyncEffect(async () => {
        await import(`ace-builds/src-noconflict/theme-${theme}`);
        setLoadedTheme(theme);
    }, [theme]);

    useEffect(() => {
        setValue(initialCode ?? '');
    }, [initialCode]);


    return (
        <AceEditor
            placeholder="Start typing your code..."
            mode={loadedLanguage}
            theme={loadedTheme}
            readOnly={readOnly}
            value={value}
            width='100%'
            height='100%'
            fontSize={fontSize}
            onChange={(value) => {
                console.log(value);
                setValue(value);
                setCode && setCode(value);
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
        />
    )
}

export default Code;
