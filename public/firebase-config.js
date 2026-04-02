// Vercel 배포 시 Firebase 연결을 위한 수동 설정입니다.
// Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱(웹)에서 확인 가능한 값을 입력하세요.
const firebaseConfig = {
    apiKey: "AIzaSyCCYS80Xzbnz7g574ekf2pnBHAx0VwRzEY",
    authDomain: "petmind-10422.firebaseapp.com",
    projectId: "petmind-10422",
    storageBucket: "petmind-10422.firebasestorage.app",
    messagingSenderId: "1005408642596",
    appId: "1:1005408642596:web:5a085a65b84a94dee19ab1",
    measurementId: "G-M34B09XZ54"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase Initialized for Vercel");
}
const db = firebase.firestore();
