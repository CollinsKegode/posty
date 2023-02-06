import express from "express";
import mysql from "mysql"
import bcrypt from "bcrypt"
import session from "express-session";

const app = express()
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'posty'
})

// prepare to use seesion
app.use(session({
    secret: 'siri ya watatu',
    resave: true,
    saveUninitialize: false
}))
app.set('view engine', 'ejs')
app.use(express.static('public'))

//config to access form information
app.use(express.urlencoded({extended: false}))

// constantly check if user loggen in. the function will be excecuted with every request mode
app.use((req, res, next) => {
    if (req.session.userID === undefined) {
        console.log('user not logged in');
    } else {
        console.log('user logged in');
    }
    // prompts what to do after
    next()
}) 

//homepage
app.get('/', (req, res) => {
    res.render('index')
})

//submit login form
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }
    // check if user exists
    let sql = 'SELECT * FROM user WHERE email = ?'
    connection.query(
        sql,
        [ user.email ],
        (error, results) => {
            if (results.length > 0) {
                // compare password submitted with hashed password in the db
            bcrypt.compare(user.password, results[0].password, (error, isEqual) => {
                if (isEqual) {
                    // grand access
                    req.session.userID = results[0].u_id
                    req.session.userName = results[0].username

                    console.log('User successfully logged in');
                } else {
                    // incorect password stored in the db
                    let error = true
                    let message = 'Incorect password'
                    res.render('login', {user, error, message})
                }
            })

                
            } else {
                // user does not exist
                let error = true
                let message = 'Account does not exist'
                res.render('login', {user, error, message})
            }
        }
    )
})

//display login form
app.get('/login', (req, res) => {
    const user = {
        email: '',
        password: ''
    }
    res.render('login', {user, error: false, message: ''})
})

//display signup form
app.get('/signup', (req, res) => {
    const user = {
        fullname: '',
        email: '',
        password: '',
        confirmPassword: ''
    } 
    res.render('signup', {user, error: false, message: ''})
})

//submit signup form
app.post('/signup', (req, res) => {
    const user = {
        fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }

    if (user.password === user.confirmPassword) {
        // check if user exists
        let sql = 'SELECT * FROM user WHERE email = ?'
        connection.query(
            sql,
            [user.email],
            (error, results) => {
                if (results.length > 0) {
                    // user exists
                    let error = true
                    let message = 'Account already exists with the email provided.'
                    res.render('signup', {user, error, message})
                } else {
                    // hash password and create user

                    bcrypt.hash(user.password, 10, (error, hash) => {
                        let sql = 'INSERT INTO user (username, email, password) VALUES (?,?,?)'
                        connection.query(
                            sql,
                            [user.fullname, user.email, hash],
                            (errors, results) => {
                                console.log('user successfully created');
                            }
                        )
                    })
                    
                }
                
            }
        )
       
    } else {
        // passwords do not match
        let error = true
        let message = 'PasswordS Mismarch!'
        res.render('signup', {user, error, message})
    }
})

app.listen(4000, () => {
    console.log('app is running...');
})