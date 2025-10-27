const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Order = require('../models/Order');

describe('User management endpoints', () => {
  let adminToken;
  let customers;

  const registerAndPromoteAdmin = async () => {
    const adminCredentials = {
      name: 'Dashboard Admin',
      email: 'admin-users@example.com',
      password: 'Password123',
      phone: '0900000000'
    };

    await request(app)
      .post('/api/auth/register')
      .send(adminCredentials);

    await User.findOneAndUpdate(
      { email: adminCredentials.email },
      { role: 'admin' }
    );

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminCredentials.email,
        password: adminCredentials.password
      });

    return loginRes.body.token;
  };

  beforeEach(async () => {
    await Promise.all([Order.deleteMany({}), User.deleteMany({})]);
    adminToken = await registerAndPromoteAdmin();

    customers = await User.insertMany([
      {
        name: 'Customer One',
        email: 'customer1@example.com',
        password: 'Customer@123',
        phone: '0900000001',
        role: 'user'
      },
      {
        name: 'Customer Two',
        email: 'customer2@example.com',
        password: 'Customer@123',
        phone: '0900000002',
        role: 'user'
      }
    ]);

    await Order.create({
      user: customers[0]._id,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Test Product',
          price: 450000,
          quantity: 1
        }
      ],
      shippingAddress: {
        name: 'Customer One',
        street: '123 Street',
        city: 'Ho Chi Minh',
        state: '',
        zipCode: '700000',
        country: 'Vietnam',
        phone: '0900000001'
      },
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      itemsPrice: 450000,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 450000,
      isPaid: true
    });
  });

  it('should return paginated customers with stats', async () => {
    const res = await request(app)
      .get('/api/users?includeStats=true')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body).toHaveProperty('stats');

    const customer = res.body.data.find((item) => item.email === 'customer1@example.com');
    expect(customer).toBeDefined();
    expect(customer.orderCount).toBe(1);
    expect(Number(customer.totalSpent)).toBeGreaterThan(0);
  });

  it('should include unpaid orders in totals', async () => {
    const unpaidOrderValue = 320000;

    await Order.create({
      user: customers[1]._id,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Pending Product',
          price: unpaidOrderValue,
          quantity: 1
        }
      ],
      shippingAddress: {
        name: 'Customer Two',
        street: '456 Street',
        city: 'Da Nang',
        state: '',
        zipCode: '500000',
        country: 'Vietnam',
        phone: '0900000002'
      },
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      itemsPrice: unpaidOrderValue,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: unpaidOrderValue
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const customer = res.body.data.find((item) => item.email === 'customer2@example.com');
    expect(customer).toBeDefined();
    expect(customer.orderCount).toBe(1);
    expect(customer.paidOrders).toBe(0);
    expect(customer.totalSpent).toBe(unpaidOrderValue);
    expect(customer.paidTotalSpent).toBe(0);
  });

  it('should return detailed customer profile with metrics', async () => {
    const targetId = customers[0]._id.toString();
    const res = await request(app)
      .get(`/api/users/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.user.email).toBe('customer1@example.com');
    expect(res.body.data.metrics.orderCount).toBe(1);
    expect(Array.isArray(res.body.data.recentOrders)).toBe(true);
    expect(res.body.data.recentOrders.length).toBeGreaterThan(0);
  });

  it('should return order summary for a specific user', async () => {
    const targetId = customers[0]._id.toString();
    const res = await request(app)
      .get(`/api/users/${targetId}/orders/summary`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.orderCount).toBe(1);
    expect(res.body.data.totalSpent).toBe(450000);
  });

  it('should update user status', async () => {
    const targetId = customers[1]._id.toString();

    const res = await request(app)
      .patch(`/api/users/${targetId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    expect(res.body.data.isActive).toBe(false);

    const updatedUser = await User.findById(targetId);
    expect(updatedUser.isActive).toBe(false);
  });
});
