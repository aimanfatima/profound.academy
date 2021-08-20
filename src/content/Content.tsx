import React, {useState} from 'react';
import firebase from 'firebase/app';
import 'firebase/functions';

import {ExtendedRecordMap} from "notion-types/src/maps";
import {NotionRenderer} from 'react-notion-x'
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'prismjs/themes/prism-tomorrow.css'; // used for code syntax highlighting (optional)
import 'rc-dropdown/assets/index.css';      // used for collection views (optional)
import 'katex/dist/katex.min.css';
import useAsyncEffect from "use-async-effect";
import {CircularProgress} from "@material-ui/core";          // used for rendering equations (optional)

import './Content.css';


interface ContentProps {
    notionPage: string;
}

function Content(props: ContentProps) {
    const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);

    useAsyncEffect(async () => {
        const getPage = firebase.functions().httpsCallable('getNotionPage');
        const map = await getPage({pageId: props.notionPage});
        console.log({map: map.data});
        // @ts-ignore
        setRecordMap(map.data);
    }, []);

    return (
        <>
            {recordMap ?
                <NotionRenderer recordMap={recordMap} fullPage={false} darkMode={false}/> :
                <div className='center'>
                    <CircularProgress/>
                </div>
            }
        </>
    );
}


export default Content;