# BH Luxury Cigar - Backend API

A modern RESTful API built with Node.js, Express, and MongoDB for a luxury cigar e-commerce platform.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt

- **Core Functionality**
  - Product management with specifications
  - Category management with hierarchical structure
  - Blog/Content management system
  - Order processing and tracking
  - User profile management

- **Security & Performance**
  - Input validation with express-validator
  - Rate limiting
  - File upload with Multer
  - CORS enabled
  - Helmet.js for security headers

## 📋 Prerequisites

- Node.js v18+
- MongoDB v5+
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Backend_BH_Luxury_Cigar
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bh_luxury_cigar
 JWT_SECRET=your_jwt_secret_key_here
```

5. Start MongoDB:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or with Docker
docker run -d -p 27017:27017 mongo
```

6. Seed the database:
```bash
npm run seed
```

7. Configure email (required for password reset):
   - Enable 2-Step Verification on your Gmail account and create an app password.
   - Update the email settings in `.env` (see `.env.example` for reference) with the app password.

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📝 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "123-456-7890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Products

#### Get All Products
```http
GET /api/products
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Create Product (Admin Only)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Cohiba Behike 52",
  "brand": "Cohiba",
  "price": 150.00,
  "description": "Premium Cuban cigar",
  "category": "Cuban Cigars",
  "specifications": {
    "origin": "Cuba",
    "size": "4.5\" x 52",
    "strength": "Medium-Full",
    "wrapper": "Cuban",
    "binder": "Cuban",
    "filler": "Cuban"
  }
}
```

### Categories

#### Get All Categories
```http
GET /api/categories
```

#### Create Category (Admin Only)
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Cuban Cigars",
  "description": "Premium Cuban cigars"
}
```

### Blog Posts

#### Get All Blog Posts
```http
GET /api/blogs?page=1&limit=10&category=Education
```

#### Get Blog Post by Slug
```http
GET /api/blogs/slug/:slug
```

### Orders

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "phone": "123-456-7890"
  },
  "paymentMethod": "credit_card"
}
```

#### Get User Orders
```http
GET /api/orders/myorders
Authorization: Bearer <token>
```

### Customers (Admin)

#### Get Customer List with Metrics
```http
GET /api/users?includeStats=true&page=1&limit=10&status=active
Authorization: Bearer <admin-token>
```

#### Customer KPI Cards
```http
GET /api/users/stats
Authorization: Bearer <admin-token>
```

#### Update Customer Status
```http
PATCH /api/users/{id}/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "isActive": false
}
```

#### Update Customer Details
```http
PUT /api/users/{id}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "address": {
    "street": "123 Pasteur",
    "city": "HCMC",
    "country": "Vietnam"
  }
}
```

## 📂 Project Structure

```
Backend_BH_Luxury_Cigar/
├── src/
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   └── BlogPost.js
│   ├── routes/          # Express routes
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── orders.js
│   │   ├── blogs.js
│   │   ├── analytics.js
│   │   ├── profile.js
│   │   ├── cart.js
│   │   └── users.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── utils/           # Utility functions
│   │   └── seed.js
│   └── server.js        # Express app
├── uploads/             # File uploads directory
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔑 Default Test Accounts

After running the seed script, you can use these accounts:

**Admin Account:**
- Email: admin@bhcigar.com
- Password: admin123

**User Account:**
- Email: john@example.com
- Password: user123

## 🧪 Testing

Test the API using curl:

```bash
# Health check
curl http://localhost:3000/health

# Get products
curl http://localhost:3000/api/products

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bhcigar.com","password":"admin123"}'
```

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- Helmet.js for security headers
- CORS configuration
- File upload restrictions

## 📦 Main Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **express-validator** - Input validation
- **cors** - CORS middleware
- **helmet** - Security headers
- **dotenv** - Environment variables

## 🔧 Scripts

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "seed": "node src/utils/seed.js"
}
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development/production) | development |
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/bh_luxury_cigar |
| JWT_SECRET | Secret key for JWT | your_jwt_secret_key_here |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Xuan Anh**

## 🙏 Acknowledgments

- Node.js community
- Express.js team
- MongoDB team
