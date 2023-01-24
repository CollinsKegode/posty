import express from "express";

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))

//homepage
app.get('/', (req, res) => {
    res.render('index')
})

//display login form
app.get('/login', (req, res) => {
    res.render('login')
})

//display signup form
app.get('/signup', (req, res) => {
    res.render('signup')
})

app.listen(4000, () => {
    console.log('app is running...');
})