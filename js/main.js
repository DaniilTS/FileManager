const strg = firebase.storage();
let path = 'Root';

let Folders = [];
let Files = [];
let FilteredFolders = [];
let FilteredFiles = [];

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

    updateElementsList();
    document.addEventListener('click', removeContextMenus);
    document.getElementById('logOutBtn').addEventListener('click', signOut);
    document.getElementById('previousFolderBtn').addEventListener('click', closeFolder);
    document.getElementById('searchBtn').addEventListener('click', search);
    document.getElementById('optionSelect').addEventListener('change', sortBy);
    document.getElementById('removeSortBtn').addEventListener('click', removeSort);

    function removeSort(){
        elementsList.innerHTML = '';
        updateElementsListByArray(createFolderElement, Folders);
        updateElementsListByArray(createFileElement, Files);

        document.getElementById('optionSelect').value = 'Sort by...';
        document.getElementById('searchInput').value = '';
    }

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

        let filesToLoad = [];
        const chooseFileBtn = createElement('input', ['upload-div__input'], 'files', 'choose files', 'file');
        chooseFileBtn.addEventListener('change', (e) => filesToLoad = e.target.files);

        const uploadFileBtn = createElement('button', ['upload-div__button'], null, 'upload files', 'button');
        uploadFileBtn.addEventListener('click', function () {
            if (filesToLoad.length !== 0) {
                for (let i = 0; i < filesToLoad.length; i++) {
                    const file = filesToLoad[i];
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

                            Files = [...appendArr];
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

                const folders = snapshot.val();
                if (folders == null) {
                    appendResult.push(folderName);
                    createFolderElement(folderName, elementsList);
                    updateFoldersRef(appendResult, removeFormFunc);
                } else {
                    if (folders.includes(folderName )) {
                        alert('error: folder alreadyExists');
                    } else {
                        appendResult.push(...folders, folderName);
                        createFolderElement(folderName, elementsList);
                        updateFoldersRef(appendResult, removeFormFunc);
                    }
                }
            })
        })

        return submitNewFileBtn;
    }

    function updateFoldersRef(appendResult, removeFormFunc){
        db.ref(`${usersRef}/${path}`).update({
            folders: appendResult
        })

        Folders = [...appendResult];

        removeFormFunc();
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
        Folders.remove(folderName);
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

        Files.remove(fileName);
    }

    function createFolderElement(folderName) {
        const li = createElement('li', ['list-item'], null, '', null, null, false);
        li.addEventListener('contextmenu', (ev) => createContextMenu(li, true, ev));

        const btn = createElement('button', ['list-item__button'], null, '', 'button');
        btn.addEventListener('dblclick', () => openFolder(btn))

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

        const span = createElement('button', ['oncontextmenu__span'], null, isFolder ? 'open' : 'load', 'button');
        span.addEventListener('click', () => isFolder ? openFolder(element) : loadFile(element));

        const deleteSpan = createElement('button', ['oncontextmenu__span'], null, 'delete', 'button');
        deleteSpan.addEventListener('click', () => deleteFirebaseObject(element, isFolder))

        div.append(span, deleteSpan);

        removeContextMenus();
        document.body.append(div);
    }

    function loadFile(element){
        const fileName = getNameFromSpan(element);
        strg.ref(`${usersRef}/${path}/${fileName}`).getDownloadURL()
            .then((url) => {
                const xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                xhr.onload = () => {
                    const blob = xhr.response;
                    const link = createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.click();
                };
                xhr.open('GET', url);
                xhr.send();
            })
            .catch((error) => {
                console.log(error);
            });
    }

    function openFolder(btn) {
        const folderName = getNameFromSpan(btn);
        path += `/${folderName}`;

        updateElementsList();
    }

    function closeFolder() {
        let result = path.split('/');
        if(result.length!==1) {
            result.pop();
        }
        path = result.join('/');

        updateElementsList();
    }

    function updateElementsList() {
        cleanArrays();

        foldersPathElement.innerText = path;

        elementsList.innerHTML = '';

        loadDocuments(createFolderElement, `${usersRef}/${path}/folders`, Folders);
        loadDocuments(createFileElement, `${usersRef}/${path}/files`, Files);
    }

    function cleanArrays() {
        Folders = [];
        Files = [];
        FilteredFolders = [];
        FilteredFiles = [];
    }

    function loadDocuments(creationFunc, path, arrToUpdate) {
        db.ref(path).get().then(function (snapshot) {
            let documents = snapshot.val();
            if(documents){
                arrToUpdate.push(...documents);
            }

            updateElementsListByArray(creationFunc, documents);
        })
    }

    function updateElementsListByArray(creationFunc, arr){
        if (arr !== null) {
            arr.forEach((doc) => {
                creationFunc(doc);
            })
        }
    }

    function search() {
        const pattern = document.getElementById('searchInput').value;
        FilteredFolders = Folders.filter(name => name.toLowerCase().includes(pattern.toLowerCase()));
        FilteredFiles = Files.filter(name => name.toLowerCase().includes(pattern.toLowerCase()));

        elementsList.innerHTML = '';
        updateElementsListByArray(createFolderElement, FilteredFolders);
        updateElementsListByArray(createFileElement, FilteredFiles);
    }

    function sortBy() {
        const markedFolders = rebuildDocs(FilteredFolders ? Folders : FilteredFolders, true);
        const markedFiles = rebuildDocs(FilteredFiles ? Files : FilteredFiles, false);
        const resultArr = [...markedFolders, ...markedFiles];

        elementsList.innerHTML = '';
        let sortedArr = resultArr.sort(dynamicSort(this.value === 'Sort by name desc' ? 'name' : '-name'));

        sortedArr.forEach((doc) => {
            doc.isFolder ? createFolderElement(doc.name) : createFileElement(doc.name);
        })
    }
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

function selectImageForNewElement(isFolder) {
    const imageSrc = isFolder ? folderImageSrc : fileImageSrc;
    return createElement('img', ['list-item__img'], null, '', null, imageSrc);
}

function getNameFromSpan(element){
    return [...element.getElementsByTagName('span')][0].innerText;
}

function dynamicSort(property) {
    let sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }

    return function (a,b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function rebuildDocs(array, isFolder) {
    return array.map(function (doc) {
        return {
            name: doc,
            isFolder: isFolder
        };
    });
}
