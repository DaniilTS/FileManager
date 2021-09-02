document.getElementById('logInBtn').addEventListener('click', function (){
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(email && password){
        auth.signInWithEmailAndPassword(email, password)
            .then(() => redirectTo('Main'))
            .catch((error) => console.log(error))
    }
});

document.getElementById('signUpBtn').addEventListener('click', () => redirectTo('SignUp'));
