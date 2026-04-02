// Vercel 배포 시 Firebase 연결을 위한 수동 설정입니다.
// Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱(웹)에서 확인 가능한 값을 입력하세요.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase Initialized for Vercel");
}
const db = firebase.firestore();
