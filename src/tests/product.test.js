const request = require('supertest');
const app = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');

describe('Product Endpoints', () => {
  let adminToken;
  let userToken;
  let testProduct;
  let productId;

  beforeAll(async () => {
    // Create admin user and get token
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });

    adminToken = adminRes.body.token;

    // Create regular user and get token
    const user = await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'user123',
      role: 'user'
    });

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'user123' });

    userToken = userRes.body.token;

    // Test product data
    testProduct = {
      name: 'Test Cigar',
      brand: 'Test Brand',
      price: 99.99,
      description: 'Test cigar description',
      category: 'Test Category',
      inStock: true,
      specifications: {
        origin: 'Test Country',
        size: '5" x 50',
        strength: 'Medium',
        wrapper: 'Test Wrapper',
        binder: 'Test Binder',
        filler: 'Test Filler'
      }
    };
  });

  afterAll(async () => {
    // Clean up
    await Product.deleteMany({ name: /Test/i });
    await User.deleteMany({ email: { $in: ['admin@test.com', 'user@test.com'] } });
  });

  describe('GET /api/products', () => {
    it('should get all products', async () => {
      const res = await request(app)
        .get('/api/products')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const res = await request(app)
        .get('/api/products?category=Cuban Cigars')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should filter products by inStock', async () => {
      const res = await request(app)
        .get('/api/products?inStock=true')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.every(p => p.inStock)).toBe(true);
    });

    it('should sort products by price', async () => {
      const res = await request(app)
        .get('/api/products?sort=price')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      const prices = res.body.data.map(p => p.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });
  });

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProduct)
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', testProduct.name);
      productId = res.body.data._id;
    });

    it('should not create product as regular user', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testProduct)
        .expect(403);

      expect(res.body.message).toContain('Admin');
    });

    it('should not create product without authentication', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(testProduct)
        .expect(401);

      expect(res.body.message).toContain('Not authorized');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete Product' })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by id', async () => {
      const res = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', productId);
      expect(res.body.data).toHaveProperty('name', testProduct.name);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('not found');
    });

    it('should handle invalid id format', async () => {
      const res = await request(app)
        .get('/api/products/invalid-id')
        .expect(500);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product as admin', async () => {
      const updates = {
        price: 149.99,
        description: 'Updated description'
      };

      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('price', updates.price);
      expect(res.body.data).toHaveProperty('description', updates.description);
    });

    it('should not update product as regular user', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: 199.99 })
        .expect(403);

      expect(res.body.message).toContain('Admin');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 99.99 })
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/products/featured', () => {
    it('should get featured products', async () => {
      const res = await request(app)
        .get('/api/products/featured')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.every(p => p.isFeatured && p.inStock)).toBe(true);
    });
  });

  describe('GET /api/products/new', () => {
    it('should get new products', async () => {
      const res = await request(app)
        .get('/api/products/new')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.every(p => p.isNew && p.inStock)).toBe(true);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product as admin', async () => {
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('deleted successfully');

      // Verify product is deleted
      await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);
    });

    it('should not delete product as regular user', async () => {
      // Create a new product first
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testProduct, name: 'Product to Delete' });

      const tempProductId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/products/${tempProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.message).toContain('Admin');

      // Clean up
      await request(app)
        .delete(`/api/products/${tempProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });
});

module.exports = {};