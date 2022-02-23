import React, {memo, useRef, useState} from 'react';
import useAsyncEffect from "use-async-effect";

import {ExtendedRecordMap} from "notion-types/src/maps";
import {Code, Collection, CollectionRow, Equation, Modal, NotionRenderer} from 'react-notion-x'
import { highlightAll } from "prismjs";
import 'prismjs/themes/prism.min.css';      // used for code syntax highlighting (optional)
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'rc-dropdown/assets/index.css';      // used for collection views (optional)
import 'katex/dist/katex.min.css';          // used for rendering equations (optional)
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import {getNotionPageMap} from "../services/courses";
import {getAllDependencies} from "./prismutil";
import {Decoration} from "notion-types/src/core";


function Content({notionPage}: {notionPage: string}) {
    const isMounted = useRef(false)
    const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);
    const [errors, setErrors] = useState<string | null>(null);

    useAsyncEffect(async () => {
        isMounted.current = true;
        setRecordMap(null);
        setErrors(null);
        let map: ExtendedRecordMap;
        try {
            map = await getNotionPageMap(notionPage);

            const allLanguages: string[] = [];
            Object.keys(map.block).map(hash => {
                const b = map.block[hash];
                if( b.value?.type === 'code' ) {
                    const deps = b.value.properties.language.map(l => getAllDependencies(l as string[]));
                    allLanguages.push(...deps.reduce((prev, cur) => [...prev, ...cur], []));
                    b.value.properties.language = deps as Decoration[];
                }
                return b;
            });

            console.log('loading all languages:', allLanguages);
            await Promise.all(allLanguages.map(l => import(`prismjs/components/prism-${l}`)));

            // @ts-ignore
            isMounted.current && setRecordMap(map);
            highlightAll();
        }
        catch(e) {
            console.error(e);
            setRecordMap(null);
            setErrors(`Could not get Notion page with id: ${notionPage}`);
        }
    }, () => isMounted.current = false, [notionPage]);

    return <>
        {/*Fix issue where the user is prevented from selecting text: https://github.com/NotionX/react-notion-x/issues/81*/}
        <style>{`
            .notion-viewport {
                z-index: -1;
            }
        `}</style>

        {recordMap ?
        <NotionRenderer
            recordMap={recordMap}
            fullPage={false}
            darkMode={false}
            components={{
                code: Code,
                collection: Collection,
                collectionRow: CollectionRow,
                modal: Modal,
                equation: Equation,
            }}/>
            : errors
                ? <Typography textAlign="center" color="error" marginBottom={4}>{errors}</Typography>
                : <Box width="80%" margin="10%" textAlign="center"><CircularProgress/></Box>
        }
    </>
}


export default memo(Content);
