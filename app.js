import express from "express";
import mysql from "mysql"
import bcrypt from "bcrypt"
import session from "express-session";
import multer from "multer"

const app = express()
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'posty'
})

const upload = multer({dest: 'public/images/profile_pictures'})

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
        res.locals.isLoggedIn = false
        res.locals.username = 'Guest'
    } else {
        res.locals.isLoggedIn = true
        res.locals.userID = req.session.userID
        res.locals.username = req.session.username.toString().split(' ')[0]
    }
    // prompts what to do after
    next()
}) 

//homepage
app.get('/', (req, res) => {
    //get all posts
    let sql = 'SELECT p_id, post, posts.created_at, u_id, username, picture FROM posts JOIN users ON posts.u_id_fk = u_id ORDER BY posts.created_at DESC'
    connection.query(
        sql, (error, posts) => {
            //get likes by this user (one who is logged in)
            connection.query(
                'SELECT * FROM likes WHERE u_id_fk = ?',
                [ req.session.userID ],
                (error, likes) => {
                    res.render('index', { posts: posts, userID: req.session.userID, likes: likes })
                }
            )
        }
    )
 
})

//homepage: create a post
app.post('/create-a-post', (req, res) => {
    let sql = 'INSERT INTO posts (post, u_id_fk) VALUES (?,?)'
    connection.query(
        sql,
        [req.body.post, req.session.userID],
        (error, results) => {
            res.redirect('/')
        }
    )
})

//homepage: delete a post
app.post('/delete-post/:id', (req,res) => {
    let sql = 'DELETE FROM posts WHERE p_id_fk= ? AND u_id_fk = ?'
    connection.query(
        sql,
        [req.params.id, req.session.userID],
        (error, results) => {
            res.redirect('/')
        }
    )
})

//homepage: like a post 
app.post('/like-post/:id', (req, res) => {
    let sql = 'INSERT INTO likes (p_id_fk, u_id_fk) VALUES (?,?)'
    connection.query(
        sql,
        [req.params.id, req.session.userID],
        (error, results) => {
            res.redirect('/')
        }
    )
})

//homepage: unlike a post
app.post('/unlike-post/:id', (req, res) => {
    let sql = 'DELETE FROM likes WHERE p_id_fk = ? AND u_id_fk = ?'
    connection.query(
        sql,
        [req.params.id, req.session.userID],
        (error, results) => {
            res.redirect('/')
        }
    )
})

//submit login form
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }
    // check if user exists
    let sql = 'SELECT * FROM users WHERE email = ?'
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
                    req.session.username = results[0].username

                    console.log('User successfully logged in');
                    res.redirect('/')

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
        let sql = 'SELECT * FROM users WHERE email = ?'
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
                        let sql = 'INSERT INTO users (username, email, password) VALUES (?,?,?)'
                        connection.query(
                            sql,
                            [user.fullname, user.email, hash],
                            (errors, results) => {
                               res.redirect('/login')
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

// logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
})

//likes: view likes
app.get('/likes', (req, res) => {
    if (res.locals.isLoggedIn) {
        let sql = 'SELECT p_id, post, posts.created_at, u_id, username, picture FROM posts, users, likes WHERE posts.p_id = likes.p_id_fk AND posts.u_id_fk = users.u_id AND likes.u_id_fk = ?'

        connection.query(
            sql,
            [req.session.userID],
            (error, results) => {
                res.render('likes', {posts: results})
            }
        )
        
    } else {
        res.redirect('/login')
    }
})
  
//likes: unlike a post
app.post('/likes/unlike-post/:id', (req, res) => {
    let sql = 'DELETE FROM likes WHERE p_id_fk = ? AND u_id_fk = ?'
    connection.query(
        sql,
        [req.params.id, req.session.userID],
        (error, results) => {
            res.redirect('/likes')
        }
    )
})

//posts: view own posts
app.get('/posts', (req, res) => {
    if (res.locals.isLoggedIn) {
        let sql = 'SELECT p_id, post, posts.created_at, u_id, username, picture FROM posts JOIN users ON posts.u_id_fk = u_id WHERE posts.u_id_fk = ? ORDER BY posts.created_at DESC'
        connection.query(
            sql,
            [req.session.userID],
            (error, results) => {
                res.render('posts', {posts: results, userID: req.session.userID})
            }
        )
    } else {
        res.redirect('/login')
    }
})

//posts: delete a post
app.post('/posts/delete-post/:id', (req,res) => {
    let sql = 'DELETE FROM posts WHERE p_id = ?'
    connection.query(
        sql,
        [req.params.id],
        (error, results) => {
            res.redirect('/posts')
        }
    )
})

// profile
app.get('/profile/:id', (req, res) => {
    if (res.locals.isLoggedIn) {
        let sql = 'SELECT * FROM users WHERE u_id = ?'
    connection.query(
        sql,
        [req.params.id],
        (error, results) => {
            res.render('profile', {user: results[0], userID: req.session.userID, error: false})
        }
    )
    } else {
        res.redirect('/login')
    }
})

//get edit profile form
app.get('/edit-profile', (req, res) => {
    if (res.locals.isLoggedIn) {
        let sql = 'SELECT * FROM users WHERE u_id = ?'
        connection.query(
            sql,
            [req.session.userID],
            (error, results) => {
                res.render('edit-profile', {user: results[0], error: false, password: false})
            }
        )
    } else {
        res.redirect('/login')
    }
})

//edit profile 
app.post('/edit-profile/:id', upload.single('picture'), (req, res) => {
    let sql = 'SELECT password FROM users WHERE u_id = ?'
    connection.query(
        sql,
        [req.params.id],
        (error, results) => {
            bcrypt.compare(req.body.password, results[0].password, (error, isEqual) => {
                if (isEqual) {
                    //update the profile with new details from the form
                    let sql 

                    // check if file was uploaded
                    if (req.file) {
                        let sql = 'UPDATE users SET username = ?, email = ?, phonenumber = ?, gender = ?, location = ?, picture = ? WHERE u_id = ?'
                        connection.query(
                            sql,
                            [
                                req.body.fullname,
                                req.body.email,
                                req.body.phonenumber,
                                req.body.gender,
                                req.body.location,
                                req.file.filename,
                                Number(req.params.id)
                            ],
                            (error, results) => {
      
                                res.redirect(`/profile/${req.params.id}`)
                            }
                        )
                    } else {
                        let sql = 'UPDATE users SET username = ?, email = ?, phonenumber = ?, gender = ?, location = ? WHERE u_id = ?'
                        connection.query(
                            sql,
                            [
                                req.body.fullname,
                                req.body.email,
                                req.body.phonenumber,
                                req.body.gender,
                                req.body.location,
                                Number(req.params.id)
                            ],
                            (error, results) => {
      
                                res.redirect(`/profile/${req.params.id}`)
                            }
                        )
                    }

                
                } else {
                    //return the profile form with proper input validation (incorect password: error message)
                    
                    const user = {
                        u_id: req.session.userID,
                        username: req.body.fullname,
                        email: req.body.email,
                        phonenumber: req.body.phonenumber,
                        gender: req.body.gender,
                        location: req.body.location,
                        
                    }
                    res.render('edit-profile', {user: user, error: true, password: req.body.password})
                }
            })
        }
    )
})

app.listen(4000, () => {
    console.log('app is running...');
})