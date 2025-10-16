const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  let testUser;

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({ email: 'test@example.com' });

    testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123',
      phone: '1234567890'
    };
  });

  afterEach(async () => {
    // Clean up after tests
    await User.deleteMany({ email: 'test@example.com' });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should not register user with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Attempt duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Register and get token
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      authToken = res.body.token;
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('email', testUser.email);
    });

    it('should not get user without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.message).toContain('Not authorized');
    });

    it('should not get user with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(res.body.message).toContain('Not authorized');
    });
  });

  describe('PUT /api/auth/updatepassword', () => {
    let authToken;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      authToken = res.body.token;
    });

    it('should update password with correct current password', async () => {
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.message).toContain('Password updated successfully');
    });

    it('should not update with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('incorrect');
    });

    it('should validate new password length', async () => {
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: '12345'
        })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('at least 6 characters');
    });
  });
});

module.exports = {};