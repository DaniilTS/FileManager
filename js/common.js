const firebaseConfig = {
    apiKey: "AIzaSyD5Ci1RWxUGDVu1nLXZGbLrgdfvrWOI2JU",
    authDomain: "filemanager-acd2e.firebaseapp.com",
    databaseURL: "https://filemanager-acd2e-default-rtdb.firebaseio.com",
    projectId: "filemanager-acd2e",
    storageBucket: "filemanager-acd2e.appspot.com",
    messagingSenderId: "210329969133",
    appId: "1:210329969133:web:33509c35f162c5444e07e4"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

function redirectTo(path) {
    window.location.href = path + '.html';
}

function signOut() {
    auth.signOut().then(() => redirectTo('Login'));
}

function createElement(tagName, classNames = null, id = null, innerHtml = '', type = null, src = null, oncontextmenuValue = true) {
    let tag = document.createElement(tagName);
    if (classNames != null) { classNames.map((className) => tag.classList.add(className)); }
    if (id != null) { tag.id = id; }
    if (type != null) { tag.type = type; }
    if (src != null) { tag.src = src; }
    tag.innerHTML = innerHtml;
    tag.oncontextmenu = function (){ return oncontextmenuValue; }
    return tag;
}

Array.prototype.remove = function() {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

const folderImageSrc = 'media/Folder.png';
const fileImageSrc = 'media/File.png';

