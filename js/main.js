const strg = firebase.storage();
let path = 'Root';

auth.onAuthStateChanged((user) => {
    if (user) {
        setUserNameOnHeader(user);
        mainFunction(user);
    } else {
        redirectTo('Login');
    }
});

function mainFunction(user) {
    const foldersPathElement = document.getElementById('folders-path');
    const elementsList = document.getElementById('elementsList');
    const usersRef = `users/${user.uid}`;

    let creationFormIsExists = false;
    document.getElementById('createNewBtn').addEventListener('click', function () {
        if (creationFormIsExists) return;
        creationFormIsExists = true;

        const form = createElement('form', ['create-new-form'], 'newElementForm');

        function removeForm() {
            form.remove();
            creationFormIsExists = false;
        }

        const headerDiv = createElement('div', ['create-new-form__header']);

        const div = createElement('div', ['create-new-form__header-div']);
        const headerDivCheckBox = createIsFolderCheckBox(removeForm);
        const headerDivSpan = createElement('span', ['create-new-form__span'], null, 'Is Folder');
        div.append(headerDivCheckBox, headerDivSpan);

        const headerDivButton = createElement('button', ['create-new-form__close-button'], null, '&#10006;', 'button');
        headerDivButton.addEventListener('click', removeForm);

        const contentDiv = createElement('div', ['create-new-form__content'], 'createNewFormContentDiv');

        headerDiv.append(div, headerDivButton);
        contentDiv.append(createUploadDiv());
        form.append(headerDiv, contentDiv);

        document.getElementById('main').append(form);
    });

    function createIsFolderCheckBox(removeFormFunc) {
        const checkBox = createElement('input', ['create-new-form__checkbox'], 'isFolderCheckBox', null, 'checkbox');
        checkBox.addEventListener('change', function () {
            const createNewFormContentDiv = document.getElementById('createNewFormContentDiv');
            createNewFormContentDiv.innerHTML = '';
            const appendElements = this.checked
                ? [createContentDivInput(), createSubmitNewFolderBtn(removeFormFunc)]
                : [createUploadDiv()];

            createNewFormContentDiv.append(...appendElements);
        })

        return checkBox;
    }

    function createUploadDiv() {
        const uploadDiv = createElement('div', ['upload-div']);

        let files = [];
        const chooseFileBtn = createElement('input', ['upload-div__input'], 'files', 'choose files', 'file');
        chooseFileBtn.addEventListener('change', (e) => files = e.target.files);

        const uploadFileBtn = createElement('button', ['upload-div__button'], null, 'upload files', 'button');
        uploadFileBtn.addEventListener('click', function () {
            if (files.length !== 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileName = file.name;

                    let storage = strg.ref(`${usersRef}/${path}/${fileName}`);
                    storage.put(file).then(function () {
                        let ref = db.ref(`${usersRef}/${path}/files`);
                        ref.get().then((snapshot) => {
                            let appendArr = [];

                            let filesNames = snapshot.val();

                            if (filesNames == null) {
                                appendArr.push(fileName);
                            } else {
                                if (filesNames.includes(fileName)) {
                                    alert('error: FILE already exists');
                                    return null;
                                } else {
                                    appendArr.push(...filesNames, fileName);
                                }
                            }

                            ref = db.ref(`${usersRef}/${path}`);
                            ref.update({
                                files: appendArr
                            }).then(() => createFileElement(fileName))
                                .then(function () {
                                    const form = document.getElementById('newElementForm');
                                    if (form != null) {
                                        form.remove();
                                        creationFormIsExists = false;
                                    }
                                })
                        });
                    });
                }
            }
        })

        uploadDiv.append(chooseFileBtn, uploadFileBtn);
        return uploadDiv;
    }

    function createSubmitNewFolderBtn(removeFormFunc) {
        const submitNewFileBtn = createElement('button', ['create-new-form__button'], null, 'Confirm', 'button');
        submitNewFileBtn.addEventListener('click', function () {
            const folderName = document.getElementById('fileNameInput').value;

            if (!folderName) return;

            const foldersRef = db.ref(`${usersRef}/${path}/folders`);
            foldersRef.get().then((snapshot) => {
                let appendResult = [];

                let foldersNames = snapshot.val();
                if (foldersNames == null) {
                    appendResult.push(folderName);
                    createFolderElement(folderName);
                } else {
                    if (foldersNames.includes(folderName)) {
                        alert('error: folder alreadyExists');
                    } else {
                        appendResult.push(...foldersNames, folderName);
                        createFolderElement(folderName);
                    }
                }

                const userRef = db.ref(`${usersRef}/${path}`);
                userRef.update({
                    folders: appendResult
                })

                removeFormFunc();
            })
        })

        return submitNewFileBtn;
    }

    function loadDocuments(creationFunc, path) {
        db.ref(path).get().then(function (snapshot) {
            let documents = snapshot.val();
            if (documents !== null) {
                documents.forEach((doc) => {
                    creationFunc(doc);
                })
            }
        })
    }

    function createFolderElement(folderName) {
        const li = createElement('li', ['list-item'], null, '', null, null, false);
        li.addEventListener('contextmenu', (ev) => createContextMenu(li, true, ev));

        const btn = createElement('button', ['list-item__button'], null, '', 'button');
        btn.addEventListener('dblclick', () => openFolder(folderName, btn))

        const img = selectImageForNewElement(true);
        const span = createElement('span', ['list-item__span'], null, folderName, null, 'FolderName');
        btn.append(img, span);
        li.appendChild(btn);
        elementsList.appendChild(li);
    }
    function createFileElement(fileName) {
        const li = createElement('li', ['list-item'], null, '', null, null, false);
        const btn = createElement('button', ['list-item__button'], null, '', 'button');
        const img = selectImageForNewElement(false);
        const span = createElement('span', ['list-item__span'], null, fileName, null, 'FileName');
        btn.append(img, span);
        li.append(btn);
        li.addEventListener('contextmenu', (ev) => createContextMenu(li, false, ev));
        elementsList.appendChild(li);
    }
    function createContextMenu(element, isFolder, ev) {
        const div = createElement('div', ['oncontextmenu__div']);
        div.style.position = 'absolute';

        div.style.left = `${ev.clientX}px`;
        div.style.top = `${ev.clientY}px`;

        const openSpan = createElement('button', ['oncontextmenu__span'], null, 'open', 'button');
        const deleteSpan = createElement('button', ['oncontextmenu__span'], null, 'delete', 'button');
        deleteSpan.addEventListener('click', () => deleteFirebaseObject(element, isFolder))

        div.append(openSpan, deleteSpan);

        removeContextMenus();
        document.body.append(div);
    }
    function openFolder(foldersName, btn) {
        const folderName = getNameFromSpan(btn);
        path += `/${folderName}`;

        foldersPathElement.innerText = path;

        elementsList.innerHTML = '';

        loadDocuments(createFolderElement, `${usersRef}/${path}/folders`);
        loadDocuments(createFileElement, `${usersRef}/${path}/files`);
    }
    function createContentDivInput() {
        const contentDivInput = createElement('input', ['create-new-form__input'], 'fileNameInput');
        contentDivInput.placeholder = 'folder name';

        return contentDivInput;
    }

    function deleteFirebaseObject(element, isFolder) {
        const objectName = getNameFromSpan(element);

        if(isFolder){
            deleteFolderContents(`${usersRef}/${path}/${objectName}`);
            deleteFolder(objectName, element);
        } else {
            deleteFile(`${usersRef}/${path}`, objectName, element);
        }

    }

    function deleteFolderContents(path) {
        const ref = strg.ref(path);
        ref.listAll()
            .then(dir => {
                dir.items.forEach(fileRef => {
                    deleteFile(ref.fullPath, fileRef.name);
                });
                dir.prefixes.forEach(folderRef => {
                    deleteFolderContents(folderRef.fullPath);
                })
            })
            .catch(error => {
                console.log(error);
            });
    }

    function deleteFile(pathToFile, fileName, element) {
        const strgRef = strg.ref(pathToFile);
        let childRef = strgRef.child(fileName);

        childRef.delete().then(() => {
            const dbRef = db.ref(`${pathToFile}/files`);
            dbRef.get().then((snapshot) => {
                let dbArray = snapshot.val();
                dbArray.remove(fileName);

                db.ref(pathToFile).update({
                    files: dbArray
                }).then(() => {
                    if(element){
                        element.remove();
                    }
                });
            })
        })
    }

    function deleteFolder (folderName, element) {
        const pathToFolder = `${usersRef}/${path}`;
        const dbRef = db.ref(`${pathToFolder}/folders`);

        dbRef.get().then((snapshot) => {
            let dbArray = snapshot.val();
            dbArray.remove(folderName);

            db.ref(pathToFolder).update({
                folders: dbArray
            }).then(() => {
                if(element){
                    element.remove();
                }
            });
        })

        db.ref(`${pathToFolder}/${folderName}`).remove();
    }

    function selectImageForNewElement(isFolder) {
        const imageSrc = isFolder ? folderImageSrc : fileImageSrc;
        return createElement('img', ['list-item__img'], null, '', null, imageSrc);
    }

    function getNameFromSpan(element){
        return [...element.getElementsByTagName('span')][0].innerText;
    }

    loadDocuments(createFolderElement, `${usersRef}/${path}/folders`);
    loadDocuments(createFileElement, `${usersRef}/${path}/files`);

    document.addEventListener('click', removeContextMenus);
    document.getElementById('logOutBtn').addEventListener('click', signOut);
    // document.getElementById('previousFolderBtn').addEventListener('click', );
}

function setUserNameOnHeader(user) {
    const userRef = db.ref(`users/${user.uid}`);
    userRef.on('value', (snapshot) => {
        const userNameSpan = document.getElementById('userName');
        if (userNameSpan !== null) {
            userNameSpan.innerText = snapshot.val().username;
        }
    });
}

function removeContextMenus(){
    let contextMenus = document.getElementsByClassName('oncontextmenu__div');
    let arr = [...contextMenus];
    arr.forEach((contextMenu) => {
        contextMenu.remove();
    })
}

// function goToPreviousFolder(){
//     const folderName = getNameFromSpan(btn);
//     path += `/${folderName}`;
//
//     foldersPathElement.innerText = path;
//
//     elementsList.innerHTML = '';
//
//     loadDocuments(createFolderElement, `${usersRef}/${path}/folders`);
//     loadDocuments(createFileElement, `${usersRef}/${path}/files`);
// }





