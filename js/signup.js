document.getElementById('signUpBtn').addEventListener('click', function (){
    let email = document.getElementById('email').value;
    let userName = document.getElementById('name').value;
    let password = document.getElementById('password').value;

    if(email && userName && password){
        auth.createUserWithEmailAndPassword(email, password)
            .then((data) => {
                const uid = data.user.uid;
                db.ref(`users/${uid}`).set({
                    username: userName,
                    email: email
                }).then(() => redirectTo('Main'))
            })
            .catch((error) => console.log(error))
    }
});

document.getElementById('logInBtn').addEventListener('click', () => redirectTo('LogIn'));

