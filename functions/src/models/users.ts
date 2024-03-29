import {Course} from './courses';
import firebase from 'firebase';

export interface Activity {
    // @ts-ignore
    id: string;             // year (2021 or 2022, etc)
    [key: string]: number;  // {2021-11-20: 10}
}

export interface Badge {
    id: string;
    title: string;
    imageUrl: string;
    description: string;
}

export interface User {
    id: string;
    imageUrl?: string;
    displayName?: string;
    badges?: Badge;
    courses?: Course[];
    completed?: Course[];
}

export interface UserInfoUpdate {
    id: string;
    imageUrl?: string;
    displayName?: string;
}

export interface UserRole {
    grantedBy: string,
    updatedAt: firebase.firestore.Timestamp,
}
