const express = require('express')
const app = express()

app.use(express.json())

//adding swagger yaml
const swaggerUi= require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDoc = YAML.load('./swagger.yaml')

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))

//authentication with JWT
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const SECRET = 'your-secret-key-change-this-in-production'

// Fake user for now (later this comes from a database)
const users = [
  { id: 'usr_1', email: 'test@test.com', password: bcrypt.hashSync('password123', 10) }
]

// Login route — returns a token
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body

  const user = users.find(u => u.email === email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' })
  res.json({ token })
})

//create a middleware function that protects routes
function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'No token provided' })

  const token = header.split(' ')[1] // "Bearer eyJ..." → "eyJ..."
  try {
    const decoded = jwt.verify(token, SECRET)
    req.user = decoded // now every protected route knows who the user is
    next() // move on to the actual route handler
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Add authenticate as a second argument — it runs before your handler

app.get('/books', authenticate, (req,res) => {
    res.json({
        "data": [
            {
            "id": "bk_9f2a",
            "title": "The Pragmatic Programmer",
            "author": "David Thomas",
            "genre": "technology",
            "price": 39.99,
            "rating": 4.8
            }
        ],
        "meta": {
            "page": 1,
            "total": 248
        }
        })
    
})
app.post('/books', (req,res) => {
    const { title, author, genre, price } = req.body
    
    if(!title || !author || !price){
        return res.status(400).json({
            error: "title, author and price are required"
        })
    }
            res.status(201).json({
        "id": "bk_7c1e",
        "title": title,
        "author": author,
        "genre": genre,
        "price": price,
        "stock": 0,
        "created_at": new Date().toISOString()
        })
})

app.listen(3000, () => {
    console.log('Bookstore API is running on http://localhost:3000')
})