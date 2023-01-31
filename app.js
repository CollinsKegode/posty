import express from "express";
import mysql from "mysql"

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))

//config to access form information
app.use(express.urlencoded({extended: false}))

//homepage
app.get('/', (req, res) => {
    res.render('index')
})

//submit login form
app.post('/login', (req, res) => {

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

    console.log(user)
})

app.listen(4000, () => {
    console.log('app is running...');
})