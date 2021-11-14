import React, {memo, useContext, useEffect, useState} from 'react';
import {Avatar, IconButton, MenuItem, ListItemIcon, ListItemText} from "@mui/material";
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Menu from '@mui/material/Menu';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/app';
import 'firebase/auth';
import {AuthContext} from "../App";

// Configure FirebaseUI.
const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // We will display Google and Facebook as auth providers.
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        'microsoft.com',
    ],
    callbacks: {
        // Avoid redirects after sign-in.
        signInSuccessWithAuthResult: () => false,
    },
};


export const SignIn = memo(function SignIn() {
    const auth = useContext(AuthContext);

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
            auth?.setCurrentUser(user);
        });
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, [auth]);

    if (!auth?.isSignedIn) {
        return (
            <div style={{left: '50%', textAlign: 'center'}}>
                <h3>Sign in to continue</h3>
                <StyledFirebaseAuth uiCallback={ui => ui.disableAutoSignIn()} uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
            </div>
        );
    }

    return <></>;
});


export function AppBarProfile() {
    const auth = useContext(AuthContext);
    const user = auth?.currentUser;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const onSignOutClicked = async () => {
        handleClose();
        await firebase.auth().signOut();
    }

    return <>
        <IconButton
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            edge="end"
            size="large">
            { /*@ts-ignore*/ }
            {user ? <Avatar src={user.photoURL} alt={user.displayName} /> : <Avatar/>}
        </IconButton>

        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.24))',
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
        {user ?
            <MenuItem onClick={onSignOutClicked} key='sign-out'>
                <ListItemIcon><ExitToAppIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Logout</ListItemText>
            </MenuItem>
            :
            <></>
            // Rendering multiple StyledFirebaseAuth components result in https://github.com/firebase/firebaseui-web-react/issues/59
            // <MenuList autoFocusItem={open} id="menu-list-grow" style={{width: '20em'}}>
            //     <MenuItem key='sign-in'><SignIn /></MenuItem>
            // </MenuList>
        }
        </Menu>
    </>;
}
