importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyBrjW0sfTym4VbLYVi2jwCMmSDrIjyQAvk",
    authDomain: "crz-studio.firebaseapp.com",
    projectId: "crz-studio",
    storageBucket: "crz-studio.firebasestorage.app",
    messagingSenderId: "343318259349",
    appId: "1:343318259349:web:9d9240be08f7a79a66dd9c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[CRZ] Background notification:",
        payload
    );

    const notificationTitle =
        payload.notification?.title || "CRZ";

    const notificationOptions = {
        body:
            payload.notification?.body ||
            "New notification from CRZ.",
        icon: "/favicon.png",
        badge: "/favicon.png"
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );

});
