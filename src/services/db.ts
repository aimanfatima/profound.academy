import firebase from 'firebase/app';
import 'firebase/firestore';
import _ from "lodash";

import {Progress, User} from "../models/users";
import {Course, Exercise} from "../models/courses";
import {Submission, SubmissionResult} from "../models/submissions";

// Add ids when getting the data and removing when sending it
const converter = <T>() => ({
    // @ts-ignore
    toFirestore: (data: T) => _.omit(data, 'id'),
    fromFirestore: (snap: firebase.firestore.QueryDocumentSnapshot) => Object.assign(snap.data(), {id: snap.id}) as unknown as T
});
const dataPoint = <T>(collectionPath: string) => firebase.firestore()
    .collection(collectionPath)
    .withConverter(converter<T>());


const db = {
    users: dataPoint<User>('users'),
    user: (userId: string) => dataPoint<User>('users').doc(userId),
    progress: (userId: string, courseId: string) => dataPoint<Progress>(`users/${userId}/progress/${courseId}/private`),

    courses: dataPoint<Course>('courses'),
    course: (courseId: string) => dataPoint<Course>('courses').doc(courseId),
    exercises: (courseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`),

    submissions: (userId: string) => dataPoint<Submission>(`submissionQueue/${userId}/private`),
    submissionResult: (submissionId: string) => dataPoint<SubmissionResult>('submissions').doc(submissionId),
};

export {db}
